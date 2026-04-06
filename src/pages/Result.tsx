import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import TopNavigation from '../components/TopNavigation';

const PASSPORT_STYLES = ['id-photo']; // 여권 계열 스타일 ID 목록

const Result: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const originalImage = location.state?.originalImage;
  const processedImage = location.state?.processedImage;
  const cropMode = location.state?.cropMode; // 'passport' | 'id' | undefined
  const styleId = location.state?.styleId;

  const [showOriginal, setShowOriginal] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  // 여권용 스타일인지 판단
  const isPassportMode = cropMode === 'passport' || PASSPORT_STYLES.includes(styleId);

  useEffect(() => {
    if (!processedImage) {
      navigate('/upload');
    }
  }, [processedImage, navigate]);

  // 이미지 저장
  const handleDownload = async () => {
    if (!processedImage) return;
    try {
      const response = await fetch(processedImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'ai-profile.jpg';
      link.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // 직접 href 방식으로 폴백
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = 'ai-profile.jpg';
      link.click();
    }
  };

  if (!processedImage) return null;

  return (
    <div className="flex flex-col min-h-screen bg-toss-gray-50">
      <TopNavigation title="완성된 프로필" showBack={false} />

      {/* 여권 모드 경고 배너 */}
      <AnimatePresence>
        {isPassportMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-bold text-[14px]">⚠️ 여권 규정 준수 주의</p>
              <p className="text-red-500 text-[12px] mt-0.5 leading-relaxed">
                AI 보정 결과가 실제 외모와 다를 수 있습니다. 여권 사진은 외교부 심사 기준에 따라 반려될 수 있으므로, 규정 준수 여부를 반드시 직접 확인해 주세요.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 p-5 max-w-md mx-auto w-full pb-8">

        {/* 결과 이미지 카드 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', bounce: 0.35 }}
          className="relative rounded-[28px] overflow-hidden shadow-2xl bg-white group cursor-pointer mb-6"
          style={{ aspectRatio: isPassportMode ? '7 / 9' : '3 / 4' }}
          onMouseDown={() => setShowOriginal(true)}
          onMouseUp={() => setShowOriginal(false)}
          onMouseLeave={() => setShowOriginal(false)}
          onTouchStart={() => setShowOriginal(true)}
          onTouchEnd={() => setShowOriginal(false)}
        >
          <img
            src={processedImage}
            alt="AI Profile"
            className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-[1.02]"
          />

          <AnimatePresence>
            {showOriginal && originalImage && (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={originalImage}
                alt="Original"
                className="absolute inset-0 w-full h-full object-cover z-20"
              />
            )}
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 pt-12 z-10 pointer-events-none">
            <p className="text-white/90 text-[13px] font-medium">꾹 눌러서 원본과 비교하기</p>
          </div>
        </motion.div>

        {/* 버튼 영역 */}
        <section className="space-y-3 mb-6">
          <button
            onClick={handleDownload}
            className="toss-button-primary w-full py-4 text-[16px] flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            프로필 사진 저장하기
          </button>

          <button
            onClick={() => navigate('/upload', { state: { prefilledImage: originalImage } })}
            className="bg-white hover:bg-gray-50 border border-toss-gray-200 transition-colors text-toss-gray-800 rounded-[14px] font-semibold text-[16px] w-full flex items-center justify-center gap-2 py-4"
          >
            <RefreshCw className="w-4 h-4 text-toss-gray-500" />
            이 사진으로 다른 스타일 만들기
          </button>
          
          <button
            onClick={() => navigate('/upload')}
            className="bg-transparent hover:bg-gray-100 transition-colors text-toss-gray-500 rounded-[14px] font-medium text-[14px] w-full flex items-center justify-center py-3"
          >
            다른 사진으로 다시 만들기
          </button>
        </section>

        {/* 규정 안내 + 면책조항 (접었다 펼치기) */}
        <div className="bg-white rounded-2xl border border-toss-gray-100 overflow-hidden">
          <button
            onClick={() => setDisclaimerOpen(!disclaimerOpen)}
            className="w-full flex items-center justify-between px-4 py-4 text-left"
          >
            <span className="text-toss-gray-600 text-[13px] font-semibold flex items-center gap-2">
              <span className="text-toss-gray-400">📋</span>
              규정 안내 및 서비스 면책조항
            </span>
            {disclaimerOpen
              ? <ChevronUp className="w-4 h-4 text-toss-gray-400" />
              : <ChevronDown className="w-4 h-4 text-toss-gray-400" />
            }
          </button>

          <AnimatePresence>
            {disclaimerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-5 border-t border-toss-gray-100 space-y-5 text-[12px] leading-relaxed">

                  {/* 여권 규정 */}
                  <div className="pt-4">
                    <p className="font-bold text-toss-gray-800 text-[13px] mb-2">🛂 여권 사진 규정 (외교부 기준, 2024)</p>
                    <p className="text-toss-gray-500 text-[11px] mb-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      ⚠️ 아래 내용은 외교부 발급 기준을 참고한 것으로, 규정은 변경될 수 있습니다. 발급 전 <span className="font-bold text-amber-700">외교부 공식 홈페이지(www.passport.go.kr)</span>에서 최신 규정을 반드시 확인하세요.
                    </p>
                    <div className="space-y-1 text-toss-gray-600">
                      <p className="font-semibold text-toss-gray-700 text-[12px]">📌 주로 사용되는 곳</p>
                      <p>해외여행, 국제공항 출입국 심사, 비자 신청, 해외 공공기관 서류 제출, 국제운전면허증 발급 등</p>
                      <p className="font-semibold text-toss-gray-700 text-[12px] mt-2">📐 규격 및 구도</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>크기: 가로 3.5cm × 세로 4.5cm</li>
                        <li>얼굴 크기: 정수리~턱 기준 <span className="font-bold">사진 세로의 70~80%</span> (3.2~3.6cm)</li>
                        <li>배경: <span className="font-bold">흰색 단색</span> (그라데이션·무늬 불가)</li>
                        <li>촬영: <span className="font-bold">6개월 이내</span> 촬영본</li>
                      </ul>
                      <p className="font-semibold text-toss-gray-700 text-[12px] mt-2">🚫 금지 사항</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>안경 착용 금지 (2021년 이후 전면 금지)</li>
                        <li>컬러 렌즈, 미용 렌즈 금지</li>
                        <li>모자, 머리띠, 두건 착용 금지</li>
                        <li>눈썹을 가리는 앞머리 금지</li>
                        <li>흰색 상의 착용 시 배경과 구분 어려울 수 있으므로 주의</li>
                        <li>치아가 보이는 미소, 입을 벌린 표정 금지</li>
                      </ul>
                    </div>
                  </div>

                  {/* 반명함 규정 */}
                  <div className="border-t border-toss-gray-100 pt-4">
                    <p className="font-bold text-toss-gray-800 text-[13px] mb-2">🪪 반명함 사진 규정</p>
                    <p className="text-toss-gray-500 text-[11px] mb-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      ℹ️ 반명함 규정은 제출 기관마다 다를 수 있습니다. 이력서/입사지원 시 회사 요강을, 자격증/시험 원서 접수 시 해당 기관의 안내를 반드시 확인하세요.
                    </p>
                    <div className="space-y-1 text-toss-gray-600">
                      <p className="font-semibold text-toss-gray-700 text-[12px]">📌 주로 사용되는 곳</p>
                      <p>이력서, 자기소개서, 학생증, 사원증, 각종 자격증 원서, 은행·공공기관 신분 확인 서류, 입사 지원서 등</p>
                      <p className="font-semibold text-toss-gray-700 text-[12px] mt-2">📐 규격 및 특징</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>크기: 가로 3cm × 세로 4cm</li>
                        <li>어깨선이 넉넉히 보이는 것이 심미적으로 좋음</li>
                        <li>얼굴 크기 규정은 여권보다 자유로움</li>
                        <li>치아가 보이지 않는 선에서 가벼운 미소 허용</li>
                        <li>배경: 주로 흰색 또는 밝은 단색 (기관마다 상이)</li>
                      </ul>
                    </div>
                  </div>

                  {/* 공통 면책조항 */}
                  <div className="border-t border-toss-gray-100 pt-4">
                    <p className="font-bold text-toss-gray-800 text-[13px] mb-2">⚠️ AI 서비스 이용 면책조항</p>
                    {isPassportMode && (
                      <div className="mt-2 bg-red-50 rounded-xl p-3 border border-red-100 mb-3">
                        <p className="text-red-600 text-[11px]">
                          여권 사진은 국제 표준 규격 및 외교부 지침에 따라 매우 엄격하게 심사됩니다. AI를 통한 과도한 보정(턱선 변경, 이목구비 수정 등)은 출입국 시 본인 확인 불일치로 여권 발급이 거절될 수 있습니다.
                        </p>
                      </div>
                    )}
                    <ul className="space-y-1 list-disc list-inside text-toss-gray-500">
                      <li>본 서비스는 AI 기술을 활용하여 증명사진 스타일을 생성하는 보조 도구입니다.</li>
                      <li>생성된 사진의 실제 관공서/기관 접수 가능 여부는 해당 기관의 최종 판단에 따르며, 규격 미달로 인한 접수 거부에 대해 당사는 법적 책임을 지지 않습니다.</li>
                      <li>AI 생성물의 특성상 실제 외모와 미세한 차이가 발생할 수 있으며, 이는 사용자의 선택 및 책임하에 사용됩니다.</li>
                    </ul>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>
    </div>
  );
};

export default Result;
