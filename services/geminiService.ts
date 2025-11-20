import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateFlavorText = async (context: string): Promise<string> => {
  if (!ai) return "Building Smart Bangladesh...";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the AI narrator for a mobile game called 'Sheikh Hasina Run'. The theme is building a futuristic 'Smart Bangladesh'.
      Write a very short, energetic, 3-4 word alert message for the player.
      Context (Current Level): ${context}.
      Keywords: Development, Speed, Digital, Padma, Metro, Delta.
      Examples: "Metro Rail Speedup!", "Padma Bridge Clear!", "Digital Boom!"`,
    });
    return response.text || "Keep Running!";
  } catch (error) {
    console.error("GenAI Error:", error);
    return "Full Speed Ahead!";
  }
};

export const generateGameOverMessage = async (distance: number): Promise<string> => {
  if (!ai) return "The journey continues.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `The player hit an obstacle in the game 'Sheikh Hasina Run'. Distance ran: ${distance}m.
      Generate a short, inspiring quote (max 15 words) about resilience, development, and not giving up on the nation's future.
      Tone: Visionary, Leader-like, Strong.`,
    });
    return response.text || "We never bow down. Try again.";
  } catch (error) {
    return "Rise and run again.";
  }
};