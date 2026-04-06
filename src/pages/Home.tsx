import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-toss-gray-50 pb-32 overflow-x-hidden">
      <main className="flex-1 flex flex-col items-center px-6 pt-16 text-center">
        
        {/* 상단 타이포그래피 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e8f3ff] text-[#0064ff] rounded-full text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            AI 프로필 인생사진 만들기
          </div>
          <h1 className="text-[40px] font-bold text-[#191f28] leading-tight mb-4 tracking-tight">
            내 생에 최고의<br />
            <span className="text-[#0064ff]">프로필 사진</span>
          </h1>
          <p className="text-lg text-[#6b7684] font-medium">
            AI가 3초 만에 가장 멋진 모습을 찾아드릴게요.
          </p>
        </motion.div>

        {/* AI 예시 카드 섹션 - 4가지 스타일 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="grid grid-cols-2 gap-3 w-full max-w-sm mb-12"
        >
          {[
            { src: '/src/assets/example1.png', label: '🎬 시네마틱', alt: 'Cinematic example' },
            { src: '/src/assets/example2.png', label: '💼 비즈니스', alt: 'Business example' },
            { src: '/src/assets/example3.png', label: '🆔 증명사진', alt: 'ID photo example' },
            { src: '/src/assets/example4.png', label: '🎓 Y2K 하이틴', alt: 'Y2K example' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.6 }}
              className="aspect-[3/4] bg-white rounded-[24px] overflow-hidden shadow-md border border-[#f2f4f6] relative group"
            >
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              {/* 하단 스타일 라벨 */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-3 pt-8">
                <span className="text-white text-[12px] font-bold">{item.label}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 하단 고정 버튼 Area */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-toss-gray-100 z-50">
          <button 
            onClick={() => navigate('/upload')}
            className="toss-button-primary w-full max-w-md mx-auto flex items-center justify-center gap-2 text-[17px] font-bold py-5 rounded-[20px]"
          >
            시작하기
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Home;
