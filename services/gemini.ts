
import { GoogleGenAI, Type } from "@google/genai";

export const chatWithSylvie = async (prompt: string, history: { role: string; parts: { text: string }[] }[] = []) => {
  // Always initialize fresh instance before calls to ensure correct API key usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "You are Sylvie, an enterprise AI assistant simulator. You provide system insights, career advice, and help with desktop tasks. Your personality is professional yet humorous.",
    },
  });

  const response = await chat.sendMessage({ message: prompt });
  return response.text;
};

export const getSystemSummary = async (stats: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze these system stats and give a one-sentence witty summary: ${JSON.stringify(stats)}`,
  });
  return response.text;
};
