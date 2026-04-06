import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import TopNavigation from '../components/TopNavigation';
import getCroppedImg from '../utils/cropImage';

// 실제 크롭 박스 픽셀 크기 (이 값을 기준으로 실루엣도 동일하게 맞춤)
const CROP_SIZE = { passport: { width: 245, height: 315 }, id: { width: 245, height: 327 } };

const Crop: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const baseImage = location.state?.processedImage;
  const originalImage = location.state?.originalImage;
  const styleId = location.state?.styleId;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  // zoom은 1 미만으로 내려가지 않게 → 이미지가 항상 크롭 박스를 채움 (검은 배경 방지)
  const [cropMode, setCropMode] = useState<'passport' | 'id'>(
    styleId === 'id-photo' ? 'passport' : 'id'
  );

  if (!baseImage) {
    navigate('/upload');
    return null;
  }

  const isPassport = cropMode === 'passport';
  const currentCropSize = isPassport ? CROP_SIZE.passport : CROP_SIZE.id;
  // 여권: 7:9 / 반명함: 3:4
  const aspectRatio = isPassport ? 7 / 9 : 3 / 4;

  const onCropComplete = useCallback((_croppedArea: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFinish = async () => {
    try {
      if (!croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(baseImage, croppedAreaPixels);
      navigate('/result', {
        state: { originalImage, processedImage: croppedImage, cropMode, styleId }
      });
    } catch (e) {
      console.error(e);
      alert('크롭 중 오류가 발생했습니다.');
    }
  };

  // 마우스 휠 줌 감도 조절 (minZoom=0.15 이하로 내려가지 않음)
  const handleWheelZoom = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY < 0 ? 0.04 : -0.04;
    setZoom(prev => Math.min(3, Math.max(0.15, prev + delta)));
  }, []);

  const handleModeChange = (mode: 'passport' | 'id') => {
    setCropMode(mode);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      <TopNavigation title="사진 구도 조정" showBack={true} />

      {/* 증명사진 스타일만 여권/반명함 탭 표시 (다른 스타일은 일반 크롭) */}
      {styleId === 'id-photo' ? (
        <div className="bg-[#111] shrink-0 flex p-3 gap-3 border-b border-white/10">
          <button
            onClick={() => handleModeChange('passport')}
            className={`
              flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all duration-200 border-2
              ${isPassport
                ? 'bg-white text-black border-white shadow-lg scale-[1.03]'
                : 'bg-white/10 text-white/50 border-white/10'}
            `}
          >
            <div className={`border-2 rounded-sm ${isPassport ? 'border-black' : 'border-white/40'}`}
              style={{ width: '22px', height: '28px' }} />
            <span className="text-[13px] font-bold">여권사진</span>
            <span className={`text-[11px] font-medium ${isPassport ? 'text-black/60' : 'text-white/30'}`}>3.5 × 4.5 cm</span>
            {isPassport && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-0.5">얼굴 70~80% 필수</span>
            )}
          </button>

          <button
            onClick={() => handleModeChange('id')}
            className={`
              flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all duration-200 border-2
              ${!isPassport
                ? 'bg-white text-black border-white shadow-lg scale-[1.03]'
                : 'bg-white/10 text-white/50 border-white/10'}
            `}
          >
            <div className={`border-2 rounded-sm ${!isPassport ? 'border-black' : 'border-white/40'}`}
              style={{ width: '22px', height: '29px' }} />
            <span className="text-[13px] font-bold">반명함</span>
            <span className={`text-[11px] font-medium ${!isPassport ? 'text-black/60' : 'text-white/30'}`}>3 × 4 cm</span>
            {!isPassport && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-0.5">어깨 포함 권장</span>
            )}
          </button>
        </div>
      ) : (
        // 다른 스타일(시네마틱, 비즈니스, Y2K)은 모드 탭 없이 상단 안내만 표시
        <div className="bg-[#111] shrink-0 px-4 py-3 border-b border-white/10 text-center">
          <p className="text-white/60 text-[12px]">자유롭게 구도를 잡아주세요</p>
        </div>
      )}

      {/* 여권 경고 - id-photo 스타일 & 여권 모드일 때만 */}
      {styleId === 'id-photo' && isPassport && (
        <div className="bg-red-900/60 px-4 py-2 shrink-0">
          <p className="text-red-300 text-[12px] font-medium text-center">
            ⚠️ 빨간 실루엣 기준 — 얼굴이 사진 높이의 70~80%를 차지해야 합니다
          </p>
        </div>
      )}

      {/* 크롭 영역 */}
      <div className="flex-1 relative w-full" onWheel={handleWheelZoom}>
        <Cropper
          image={baseImage}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          // cropSize를 고정하면 화면 내 크롭 박스가 항상 이 크기로 표시됨
          cropSize={currentCropSize}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={() => {}} // 휠/슬라이더로만 조절
          showGrid={true}
          restrictPosition={false}  // 자유롭게 이동 가능 (이미지 전체를 박스 안에 넣을 수 있음)
          minZoom={0.15}            // 아주 작게 줄여서 전체 이미지를 박스 안에 넣을 수 있게
          maxZoom={3}
        />

        {/* 실루엣 오버레이: 증명사진(id-photo)만 표시 */}
        {styleId === 'id-photo' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
            {isPassport ? (
              /* 여권: 얼굴 크게 */
              <div
                className="relative flex flex-col items-center overflow-hidden"
                style={{ width: `${currentCropSize.width}px`, height: `${currentCropSize.height}px` }}
              >
                <div style={{
                  width: `${Math.round(currentCropSize.width * 0.68)}px`,
                  height: `${Math.round(currentCropSize.height * 0.65)}px`,
                  marginTop: `${Math.round(currentCropSize.height * 0.04)}px`,
                  border: '2px solid rgba(255,80,80,0.85)',
                  borderRadius: '48% 48% 43% 43% / 55% 55% 45% 45%',
                  background: 'rgba(255,60,60,0.04)',
                  flexShrink: 0,
                }} />
                {/* 목 */}
                <div style={{
                  width: `${Math.round(currentCropSize.width * 0.22)}px`,
                  height: `${Math.round(currentCropSize.height * 0.07)}px`,
                  border: '2px solid rgba(255,80,80,0.6)',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  marginTop: '-1px',
                  flexShrink: 0,
                }} />
                {/* 어깨 */}
                <div style={{
                  width: `${currentCropSize.width - 6}px`,
                  height: `${Math.round(currentCropSize.height * 0.18)}px`,
                  border: '2px solid rgba(255,80,80,0.5)',
                  borderRadius: '48% 48% 0 0',
                  borderBottom: 'none',
                  marginTop: '-2px',
                  flexShrink: 0,
                }} />
                <div className="absolute top-2 left-0 right-0 text-center">
                  <span className="text-[11px] font-bold text-red-200 bg-red-700/70 px-3 py-0.5 rounded-full">
                    여권 · 얼굴 꽉 차게
                  </span>
                </div>
              </div>
            ) : (
              /* 반명함: 얼굴 작게, 어깨 넉넉히 */
              <div
                className="relative flex flex-col items-center overflow-hidden"
                style={{ width: `${currentCropSize.width}px`, height: `${currentCropSize.height}px` }}
              >
                <div style={{
                  width: `${Math.round(currentCropSize.width * 0.38)}px`,
                  height: `${Math.round(currentCropSize.height * 0.36)}px`,
                  marginTop: `${Math.round(currentCropSize.height * 0.06)}px`,
                  border: '2px solid rgba(80,160,255,0.85)',
                  borderRadius: '48% 48% 43% 43% / 58% 58% 42% 42%',
                  background: 'rgba(60,120,255,0.04)',
                  flexShrink: 0,
                }} />
                {/* 목 */}
                <div style={{
                  width: `${Math.round(currentCropSize.width * 0.18)}px`,
                  height: `${Math.round(currentCropSize.height * 0.06)}px`,
                  border: '2px solid rgba(80,160,255,0.6)',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  marginTop: '-1px',
                  flexShrink: 0,
                }} />
                {/* 어깨 */}
                <div style={{
                  width: `${currentCropSize.width - 6}px`,
                  height: `${Math.round(currentCropSize.height * 0.38)}px`,
                  border: '2px solid rgba(80,160,255,0.5)',
                  borderRadius: '48% 48% 0 0',
                  borderBottom: 'none',
                  marginTop: '-2px',
                  flexShrink: 0,
                }} />
                {/* 반명함은 라벨 없음 — 오해 방지 */}
              </div>
            )}
          </div>
        )}

        {/* 하단 안내 */}
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-20">
          <span className="text-white/60 text-[12px] bg-black/50 inline-block px-3 py-1 rounded-full">
            {styleId === 'id-photo'
              ? isPassport
                ? '빨간 실루엣에 얼굴을 크게 맞추세요'
                : '파란 실루엣 기준으로 구도를 맞추세요'
              : '원하는 구도로 자유롭게 조정하세요'}
          </span>
        </div>
      </div>

      {/* PC 전용 정밀 슬라이더 + 완료 버튼 */}
      <div className="bg-[#111] shrink-0 px-5 pt-4 pb-6 space-y-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-[12px]">🔍</span>
          <input
            type="range"
            min={0.15}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-white h-1 cursor-pointer"
          />
          <span className="text-white/50 text-[12px] w-10 text-right">{zoom.toFixed(1)}×</span>
        </div>
        <button
          onClick={handleFinish}
          className="toss-button-primary w-full py-4 text-[16px]"
        >
          이 구도로 결과 확인하기 →
        </button>
      </div>
    </div>
  );
};

export default Crop;
