import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Loading: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const imageUrl = location.state?.imageUrl;
  const stylePrompt = location.state?.stylePrompt;
  const styleName = location.state?.styleName || '프로필';
  const styleId = location.state?.styleId;
  
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('서버에 연결하고 있어요...');
  const jobIdRef = useRef<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!imageUrl || !stylePrompt) {
      navigate('/upload');
      return;
    }

    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval>;

    // UI 프로그레스바는 항상 시작
    const timer = setInterval(() => {
      setProgress(p => {
        if (p < 30) return p + 2;
        if (p < 60) return p + 1;
        if (p < 95) return p + 0.2;
        return p;
      });
    }, 500);

    const checkJobStatus = async (jobId: string) => {
      try {
        const BACKEND_URL = `http://${window.location.hostname}:3001`;
        console.log(`[Polling] Checking status for ${jobId}...`);
        const response = await fetch(`${BACKEND_URL}/api/status/${jobId}`);
        if (!response.ok) throw new Error('상태 확인 실패');
        
        const data = await response.json();
        if (!isMounted) return;

        if (data.status === 'queued') {
          setMessage(`대기열에 등록되었어요. (내 순서: ${data.position}번째)`);
        } else if (data.status === 'processing') {
          setMessage(`${styleName} 스타일로 바꾸는 중... (약 10~20초 소요)`);
          setProgress(p => Math.max(p, 65)); 
        } else if (data.status === 'done' && data.imageUrl) {
          console.log('[Polling] Job Done! Navigating to result...');
          if (pollInterval) clearInterval(pollInterval);
          clearInterval(timer);
          setProgress(100);
          setMessage('완성되었습니다!');
          
          // 약간의 여유를 두어 100% 게이지를 보여준 뒤 이동
          setTimeout(() => {
            if (isMounted) {
              const finalImageUrl = data.imageUrl.startsWith('http') 
                ? data.imageUrl 
                : `${BACKEND_URL}${data.imageUrl}`;
                
              navigate('/crop', { 
                state: { 
                  originalImage: imageUrl, 
                  processedImage: finalImageUrl,
                  styleId,
                  styleName 
                } 
              });
            }
          }, 1000);
        } else if (data.status === 'error') {
          if (pollInterval) clearInterval(pollInterval);
          clearInterval(timer);
          setMessage(`오류: ${data.error?.substring(0, 40)}`);
          setTimeout(() => navigate('/upload'), 3000);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const generateProfile = async () => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
      
      try {
        // 1차적으로 원본 Blob을 무조건 가져옴 (새로고침 등 URL 유실 상태 제외)
        const response = await fetch(imageUrl);
        const originalBlob = await response.blob();
        
        let fileToUpload = new File([originalBlob], 'photo.jpg', { type: originalBlob.type });

        try {
          // 2차적으로 이미지 압축 시도 (실패 시 무시하고 원본 사용)
          fileToUpload = await new Promise<File>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const MAX_SIZE = 1024;
              
              if (width > height && width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              } else if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              canvas.toBlob((newBlob) => {
                if (newBlob) {
                  resolve(new File([newBlob], 'photo.jpg', { type: 'image/jpeg' }));
                } else {
                  reject(new Error('압축 실패'));
                }
              }, 'image/jpeg', 0.8);
            };
            img.onerror = () => reject(new Error('이미지 로드 실패'));
            
            // 안전하게 새로 생성한 Blob 주소로 시도
            img.src = URL.createObjectURL(originalBlob);
          });
        } catch (e) {
          console.warn('이미지 압축 건너뜀 (원본 전송):', e);
        }

        const formData = new FormData();
        formData.append('image', fileToUpload);
        formData.append('prompt', stylePrompt); 

        const BACKEND_URL = `http://${window.location.hostname}:3001`;
        
        // 프록시 버그 회피를 위해 직접 통신
        const apiResponse = await fetch(`${BACKEND_URL}/api/generate`, {
          method: 'POST',
          body: formData,
        });

        if (!apiResponse.ok) {
          const errData = await apiResponse.json();
          throw new Error(errData.error || `서버 에러 (${apiResponse.status})`);
        }

        const data = await apiResponse.json();
        if (isMounted) {
          jobIdRef.current = data.jobId;
          // Job ID를 받았으니 3초마다 폴링 시작
          pollInterval = setInterval(() => checkJobStatus(data.jobId), 2000); // 사용자 경험을 위해 조금 더 빠르게 폴링
          // 즉시 한 번 확인
          checkJobStatus(data.jobId);
        }
      } catch (err: any) {
        console.error("Error creating job:", err);
        if (isMounted) {
          clearInterval(timer);
          setMessage(`접속 오류: ${err.message?.substring(0, 60)}`);
          setTimeout(() => navigate('/upload'), 4000);
        }
      }
    };

    // 최초 1회 잡 등록 시작
    generateProfile();

    return () => {
      isMounted = false;
      clearInterval(timer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [imageUrl, stylePrompt, styleName, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-white items-center justify-center p-8 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="mb-8 text-toss-blue"
      >
        <Loader2 className="w-12 h-12" />
      </motion.div>

      <h2 className="text-2xl font-bold text-toss-gray-900 mb-2">{styleName} 만드는 중</h2>
      <p className="text-toss-gray-500 mb-12 h-6 max-w-sm">{message}</p>

      <div className="w-full max-w-xs bg-toss-gray-100 h-2 rounded-full overflow-hidden">
        <motion.div 
          className="bg-toss-blue h-full transition-all duration-500"
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-toss-blue">{Math.round(progress)}%</p>
    </div>
  );
};

export default Loading;
