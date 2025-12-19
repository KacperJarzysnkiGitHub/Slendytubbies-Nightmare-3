
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client exclusively using the process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getScaryMessage = async (custardsCount: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a psychological horror narrator. The player just found their ${custardsCount} custard out of 10 in a dark, twisted Teletubby-like wasteland. Provide a short, cryptic, and terrifying message (under 15 words) that makes them feel watched.`,
      config: {
        temperature: 0.9,
        topP: 0.8,
      },
    });
    // Access generated text using the .text property
    return response.text?.trim() || "He is closer now...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The silence is deafening.";
  }
};

export const getInitialLore = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a creepy 3-sentence intro for a horror game where a mutated purple creature hunts you in a foggy forest for stealing its custards.",
    });
    // Access generated text using the .text property
    return response.text?.trim() || "The forest remembers. The hunger never fades. Don't look back.";
  } catch (error) {
    return "Collect them all. Survive the night.";
  }
};