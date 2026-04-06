const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    console.log('Testing gemini-3.1-flash-image-preview API after tier change...');
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{ text: "Generate a tiny 64x64 blue square" }],
    });
    
    let outputImage = null;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) { outputImage = part.inlineData; break; }
    }

    if (outputImage) {
      console.log('SUCCESS! Image received correctly. Billing Tier upgrade confirmed.');
    } else {
      console.log('FAIL: No image returned.');
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}
test();
