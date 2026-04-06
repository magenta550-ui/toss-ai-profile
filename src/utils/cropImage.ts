/**
 * react-easy-crop 크롭 유틸리티
 * - CORS 이슈를 피하는 drawImage 방식 사용
 * - 이미지 외부(박스 밖 영역)는 흰색으로 채움 (검은 배경 방지)
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // crossOrigin 없이 재시도 (일부 환경 대응)
      const img2 = new Image();
      img2.onload = () => resolve(img2);
      img2.onerror = reject;
      img2.src = url + '?t=' + Date.now(); // 캐시 무력화
    };
    img.src = url;
  });

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // 흰색 배경을 먼저 채워서 이미지 밖 영역이 검정이 아닌 흰색으로 나오게 함
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 크롭 좌표 기반으로 이미지 부분만 그림
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(URL.createObjectURL(blob));
      else reject(new Error('Canvas toBlob 실패'));
    }, 'image/jpeg', 0.92);
  });
}
