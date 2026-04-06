const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log('Testing gemini-3.1-flash-image-preview (Nano Banana 2)...');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: 'Generate a dark charcoal grey studio background with cinematic lighting',
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const fs = require('fs');
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      fs.writeFileSync('test-output.png', buffer);
      console.log('SUCCESS! Image saved. Size:', buffer.length, 'bytes');
    } else if (part.text) {
      console.log('Text:', part.text.substring(0, 100));
    }
  }
}
test().catch(e => console.error('ERROR:', e.message));
