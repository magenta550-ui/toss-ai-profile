const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(cors());
// uploads 폴더를 정적 파일로 제공 + CORS 헤더 강제 추가 (Canvas API 크롭 시 필수)
app.use('/uploads', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

const upload = multer({ storage: multer.memoryStorage() });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 인메모리 잡 큐 및 상태 관리
const jobs = {}; 
const jobQueue = [];
let isWorkerRunning = false;

// 429 시 구글이 알려주는 대기 시간을 파싱
function parseRetryDelay(errorMsg) {
  const match = (errorMsg || '').match(/retryDelay":"(\d+)s"/);
  return match ? parseInt(match[1]) + 2 : 15;
}

// 큐 워커: 순차적으로 하나씩 처리 (통신 최적화 버전)
async function processQueue() {
  if (isWorkerRunning || jobQueue.length === 0) return;
  isWorkerRunning = true;

  while (jobQueue.length > 0) {
    const jobId = jobQueue[0];
    const job = jobs[jobId];

    if (!job || job.status !== 'queued') {
      jobQueue.shift();
      continue;
    }

    job.status = 'processing';
    console.log(`\n[Job ${jobId}] 처리 시작... (대기열 남은 개수: ${jobQueue.length - 1}개)`);

    let maxRetries = 4;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`  [Job ${jobId}] API 호출 시도 ${attempt}/${maxRetries}...`);
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: [
            { text: job.prompt },
            { inlineData: { data: job.imageBase64, mimeType: job.mimeType } },
          ],
        });

        let outputImage = null;
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) { outputImage = part.inlineData; break; }
        }

        if (!outputImage) {
          const txt = response.candidates[0].content.parts.find(p => p.text);
          throw new Error('이미지 없음: ' + (txt?.text || '').substring(0, 100));
        }

        // 완성된 이미지를 파일로 저장 (Base64 통신 부하 해결)
        const fileName = `output-${jobId}.png`;
        const filePath = path.join(__dirname, 'uploads', fileName);
        const imageBuffer = Buffer.from(outputImage.data, 'base64');
        fs.writeFileSync(filePath, imageBuffer);

        job.status = 'done';
        // Base64 대신 서버 파일 URL 주소로 저장
        job.imageUrl = `/uploads/${fileName}`; 
        console.log(`  [Job ${jobId}] 합성 성공! 파일 저장 완료: ${job.imageUrl}`);
        
        // 메모리 절약을 위해 원본 이미지 보존 해제
        delete job.imageBase64;
        break; 
        
      } catch (error) {
        const errMsg = error.message || '';
        const is429 = errMsg.includes('429');
        if (is429 && attempt < maxRetries) {
          const waitSec = parseRetryDelay(errMsg);
          console.log(`  [Job ${jobId}] 429 Rate Limit → ${waitSec}초 대기 후 재시도...`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
        } else {
          job.status = 'error';
          job.error = error.message || 'Failed';
          console.error(`  [Job ${jobId}] 에러 발생:`, job.error.substring(0, 150));
          delete job.imageBase64;
          break;
        }
      }
    }
    
    jobQueue.shift();
  }

  isWorkerRunning = false;
  console.log('대기열 모든 작업 처리 완료.');
}

// 1. 잡 생성 엔드포인트
app.post('/api/generate', upload.single('image'), (req, res) => {
  try {
    const prompt = req.body.prompt;
    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    
    const jobId = crypto.randomUUID();
    const imageBase64 = imageBuffer.toString('base64');

    jobs[jobId] = {
      id: jobId,
      status: 'queued',
      prompt,
      imageBase64,
      mimeType,
      createdAt: Date.now()
    };

    jobQueue.push(jobId);
    console.log(`=== 생성 요청 추가 [Job ID: ${jobId.substring(0,6)}...], 현재 대기 인원: ${jobQueue.length}명 ===`);

    processQueue();
    res.json({ jobId });
  } catch (error) {
    console.error('잡 생성 실패:', error);
    res.status(500).json({ error: error.message || 'Failed to enqueue job' });
  }
});

// 2. 상태 확인 엔드포인트 (Polling 용도 - 통신 최적화 버전)
app.get('/api/status/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const job = jobs[jobId];

  if (!job) {
    return res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
  }

  let position = 0;
  if (job.status === 'queued') {
    position = jobQueue.indexOf(jobId) + 1;
  }

  console.log(`[Status Check] Job: ${jobId.substring(0,8)} Status: ${job.status}`);

  res.json({
    id: job.id,
    status: job.status,
    position: position,
    // 완료되었을 때만 이미지 URL을 보냄 (Base64 방식보다 수천 배 가볍움)
    imageUrl: job.status === 'done' ? job.imageUrl : null,
    error: job.error || null
  });
});

try {
  app.listen(port, () => {
    console.log(`Server: http://localhost:${port}`);
    console.log('Model: Nano Banana 2 (Async Queue Mode Enabled)');
  }).on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
  });
} catch (e) {
  console.error('Fatal crash during app.listen:', e);
  process.exit(1);
}

