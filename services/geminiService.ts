import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedRoutine } from "../types";

// Safe access to API Key to prevent "process is not defined" crashes in browser
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || '';
    }
    return '';
  } catch (e) {
    return '';
  }
};

const apiKey = getApiKey();

const ai = new GoogleGenAI({ apiKey });

export const GeminiService = {
  generateRoutine: async (prompt: string): Promise<GeneratedRoutine[]> => {
    if (!apiKey) {
      alert("API Key is missing. Please set the API_KEY environment variable.");
      return [];
    }
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a workout routine list based on this request: "${prompt}". 
        Return a list of routines. For each routine, provide a name and a list of exercises.
        Each exercise must have a name, muscleGroup, recommended sets, recommended reps, and a short note on form or focus.
        Make sure the response is valid JSON matching the schema.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the workout day/routine (e.g. Chest Day)" },
                exercises: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      muscleGroup: { type: Type.STRING },
                      sets: { type: Type.NUMBER },
                      reps: { type: Type.NUMBER },
                      notes: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) return [];
      
      const data = JSON.parse(text) as GeneratedRoutine[];
      return data;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to generate routine. Please try again.");
    }
  },

  chatWithData: async (message: string, context: string): Promise<string> => {
    if (!apiKey) return "API Key is missing. I cannot connect to the brain.";
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert fitness coach called IronCoach. 
        You have access to the user's data.
        
        DATA CONTEXT:
        ${context}

        USER QUESTION: "${message}"

        INSTRUCTIONS:
        1. Answer the user's question based on their data (Volume, Frequency, Weight, RPE).
        2. Be motivating but honest about progress.
        3. If they want to gain muscle, look at volume and RPE.
        4. If they want to lose weight, look at consistency and cardio.
        5. Keep answers concise.`
      });
      return response.text || "I couldn't analyze that right now.";
    } catch (error) {
      console.error("Gemini Chat Error", error);
      return "I'm having trouble connecting to the server.";
    }
  }
};