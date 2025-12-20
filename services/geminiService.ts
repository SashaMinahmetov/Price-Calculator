import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeShoppingDeal = async (userQuery: string, currency: string, language: Language): Promise<string> => {
  if (!process.env.API_KEY) {
    return language === 'uk' 
      ? "Помилка: API ключ не знайдено." 
      : "Ошибка: API ключ не найден.";
  }

  const langName = language === 'uk' ? 'Ukrainian' : 'Russian';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helpful shopping assistant calculator. 
      The user will ask a question about shopping, prices, or comparing deals.
      The currency is ${currency}.
      
      User Query: "${userQuery}"

      Please provide a concise analysis.
      1. If it's a comparison, do the math step-by-step but keep it brief.
      2. State clearly which option is better.
      3. Format the final answer nicely with bold text for the winner.
      4. Answer in ${langName} language.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || (language === 'uk' ? "Не вдалося отримати відповідь." : "Не удалось получить ответ.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'uk' 
      ? "Сталася помилка при аналізі. Спробуйте ще раз." 
      : "Произошла ошибка при анализе. Попробуйте еще раз.";
  }
};