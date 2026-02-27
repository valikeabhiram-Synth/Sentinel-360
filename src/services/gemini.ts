import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export async function getChatResponse(prompt: string, model: string, file?: File) {
  try {
    const parts: any[] = [{ text: prompt }];
    
    if (file) {
      const filePart = await fileToGenerativePart(file);
      parts.push(filePart);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: `You are an AI assistant acting as ${model.toUpperCase()}. 
        Adopt the tone, style, and persona of ${model.toUpperCase()}. 
        If the user prompt contains placeholders like [EMAIL], [CARD], etc., 
        acknowledge them as sensitive data that has been protected.`,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
}
