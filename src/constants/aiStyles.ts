export interface AIStyle {
  id: string;
  name: string;
  description: string;
  emoji: string;
  prompt: string;
}

// 모든 스타일 공통: 세로(3:4) 비율, 얼굴+어깨+상반신이 넉넉하게 보이는 사진
// 얼굴이 너무 꽉 차면 크롭 박스에서 어깨가 잘릴 수 없으므로 반드시 멀리서 찍은 구도
const PORTRAIT_PREFIX = `IMPORTANT COMPOSITION RULES:
1. Generate as a VERTICAL PORTRAIT image (3:4 ratio, taller than wide).
2. The subject MUST be photographed from a medium distance — showing the FULL HEAD + SHOULDERS + UPPER CHEST clearly. Do NOT fill the frame with just the face.
3. The face should occupy approximately 40-55% of the image height, with ample space above the head and below the chest.
4. Leave some empty background space around the subject so the image can be cropped to different ID photo sizes.

`;

export const AI_STYLES: AIStyle[] = [
  {
    id: 'cinematic',
    name: '시네마틱 스튜디오',
    description: '어두운 배경과 시네마틱한 조명으로 영화 속 주인공처럼',
    emoji: '🎬',
    prompt: PORTRAIT_PREFIX + `Transform this person's photo into a refined, ultra-high-resolution, premium VERTICAL portrait photograph. Keep the person's exact face, facial features, skin texture, and identity identical. Apply: Stark cinematic chiaroscuro lighting, deep charcoal grey studio background, sophisticated dark textured high-necked collar blazer. Focus: Sharp eyes and face. Style: Clean, professional, no text, no watermarks.`
  },
  {
    id: 'professional',
    name: '비즈니스 프로필',
    description: '신뢰감을 주는 밝고 깨끗한 사무실 배경의 프로필',
    emoji: '💼',
    prompt: PORTRAIT_PREFIX + `Transform this person's photo into a professional, bright business portrait VERTICAL image. Keep the person's exact face, facial features, and identity identical. Apply: Bright natural window light from the side, blurred modern glass office interior background, wearing a neat white formal shirt and navy suit jacket. Expression: Subtle professional smile, direct eye contact. High resolution, photorealistic.`
  },
  {
    id: 'id-photo',
    name: '정석 증명사진',
    description: '가장 깔끔하고 단정한 느낌의 정석 포트레이트',
    emoji: '🆔',
    prompt: PORTRAIT_PREFIX + `An extreme photorealistic, ultra-high resolution professional official identification (ID) VERTICAL photograph of the person in the provided image. The subject is shown from the top of the head to the upper chest/shoulders. Perfectly centered and strictly front-facing, looking directly at the camera lens with eyes wide open. Completely symmetrical and level pose with zero head tilt. Deadpan neutral expression, mouth tightly closed, no teeth visible. Symmetrical flat soft studio lighting, zero harsh shadows. Wearing clean neat dark navy formal attire. Background is a uniform neutral gray studio backdrop with subtle gradient — no objects, no shadows. No glasses, no jewelry, no hats. Clean sharp photograph, no text, no watermarks, no filters.`
  },
  {
    id: 'y2k',
    name: 'Y2K 하이틴',
    description: '90년대 졸업앨범 느낌의 레트로한 하이틴 필터',
    emoji: '🎓',
    prompt: PORTRAIT_PREFIX + `Transform this person's photo into a 90s vintage high school yearbook portrait VERTICAL image. Keep the person's exact face and identity identical. Apply: Blue mottled muslin backdrop, soft vintage flash lighting, slightly grainy film texture. Clothing: 90s style school vest or oversized sweater. Style: Warm nostalgia, retro aesthetic, high school dream vibe.`
  }
];
