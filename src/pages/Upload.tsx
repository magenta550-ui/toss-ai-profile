import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, X, Camera, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TopNavigation from '../components/TopNavigation';
import { AI_STYLES } from '../constants/aiStyles';
import type { AIStyle } from '../constants/aiStyles';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<AIStyle>(AI_STYLES[0]);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Result 페이지에서 넘겨준 기존 사진(Blob URL)이 있다면 파일로 복원
  React.useEffect(() => {
    const prefilledImage = location.state?.prefilledImage;
    if (prefilledImage) {
      fetch(prefilledImage)
        .then(res => res.blob())
        .then(blob => {
          const newFile = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
          setFile(newFile);
        })
        .catch(err => console.error("Failed to load prefilled image", err));
    }
  }, [location.state]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleStart = () => {
    if (file && agreed) {
      const imageUrl = URL.createObjectURL(file);
      navigate('/loading', { 
        state: { 
          imageUrl,
          stylePrompt: selectedStyle.prompt,
          styleName: selectedStyle.name,
          styleId: selectedStyle.id
        } 
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-toss-gray-50 pb-20">
      <TopNavigation title="사진 선택 및 스타일" />
      
      <main className="flex-1 p-6 max-w-md mx-auto w-full">
        <h2 className="text-2xl font-bold text-toss-gray-900 mb-2">어떤 사진을 바꿀까요?</h2>
        <p className="text-toss-gray-600 mb-6 font-medium">정면이 잘 나온 선명한 사진이 고품질로 나와요.</p>

        {/* 사진 업로드/촬영 영역 */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div 
            {...getRootProps()} 
            className={`
              relative aspect-video rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4
              ${isDragActive ? 'border-toss-blue bg-toss-blue-light' : 'border-toss-gray-300 bg-white hover:border-toss-gray-400'}
              ${file ? 'border-none ring-2 ring-toss-blue' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 w-full h-full"
                >
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-full text-white backdrop-blur-md"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-12 h-12 bg-toss-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-toss-gray-400">
                    <UploadIcon className="w-6 h-6" />
                  </div>
                  <p className="text-toss-gray-800 font-bold">앨범에서 선택</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!file && (
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-3 bg-white border border-toss-gray-200 py-5 rounded-3xl font-bold text-toss-gray-800 shadow-sm active:scale-95 transition-transform"
            >
              <Camera className="w-6 h-6 text-toss-blue" />
              지금 촬영하기
            </button>
          )}
          <input 
            type="file" 
            accept="image/*" 
            capture="user" 
            ref={cameraInputRef} 
            onChange={handleCameraCapture} 
            className="hidden" 
          />
        </div>

        {/* 스타일 선택 영역 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-toss-gray-900 mb-4 flex items-center gap-2">
            원하는 스타일을 골라보세요
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {AI_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                className={`
                  relative p-4 rounded-2xl border-2 text-left transition-all
                  ${selectedStyle.id === style.id 
                    ? 'border-toss-blue bg-toss-blue-light/30 ring-1 ring-toss-blue' 
                    : 'border-white bg-white hover:border-toss-gray-200 shadow-sm'}
                `}
              >
                <div className="text-2xl mb-2">{style.emoji}</div>
                <div className="font-bold text-toss-gray-900 text-sm mb-1">{style.name}</div>
                <div className="text-[11px] text-toss-gray-500 leading-tight line-clamp-2">{style.description}</div>
                
                {selectedStyle.id === style.id && (
                  <div className="absolute top-3 right-3 bg-toss-blue text-white rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 동의 및 시작 영역 */}
        <section className="space-y-4 mb-6">
          <label className="flex items-start gap-4 cursor-pointer p-4 bg-white rounded-2xl border border-toss-gray-100 shadow-sm">
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={() => setAgreed(!agreed)}
              className="mt-1 w-5 h-5 rounded-md border-toss-gray-300 text-toss-blue focus:ring-toss-blue"
            />
            <div className="text-sm">
              <p className="text-toss-gray-800 font-bold">개인정보 수집 및 처리 동의</p>
              <p className="text-toss-gray-500 text-xs mt-1 leading-relaxed">
                멋진 결과물을 위해 사진 데이터를 일시적으로 서버에서 처리합니다. 
                처리 완료 즉시 데이터는 안전하게 파기됩니다.
              </p>
            </div>
          </label>
        </section>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-toss-gray-100 z-40">
          <button 
            disabled={!file || !agreed}
            onClick={handleStart}
            className="toss-button-primary w-full py-5 text-lg font-bold rounded-[20px] transition-all disabled:bg-toss-gray-200"
          >
            {selectedStyle.name} 만들기
          </button>
        </div>
      </main>
    </div>
  );
};

export default Upload;
