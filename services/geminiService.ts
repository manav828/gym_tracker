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
        model: 'gemini-2.5-flash-lite',
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
      if (error.status === 429 || error.message?.includes("429")) {
        throw new Error("Daily quota exceeded for AI. Please try again later.");
      }
      throw new Error("Failed to generate routine. Please try again.");
    }
  },

  chatWithData: async (message: string, context: string): Promise<string> => {
    if (!apiKey) return "API Key is missing. I cannot connect to the brain.";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
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
      if (error.status === 429 || error.message?.includes("429")) {
        return "I'm tired (Quota exceeded). Come back later!";
      }
      return "I'm having trouble connecting to the server.";
    }
  },

  analyzeFoodImage: async (imageBase64: string): Promise<{ items: any[], notes: string } | null> => {
    if (!apiKey) {
      alert("API Key is missing.");
      return null;
    }

    try {
      // Strip header if present (data:image/jpeg;base64,...)
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite', // Flash is cheaper and great for this
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Analyze this food image. Identify the meal and provide a detailed breakdown of EACH food item visible.
                        
                        CRITICAL INSTRUCTIONS:
                        1. Separate the meal into individual components (e.g. Rice, Dal, Curd, Roti, Salad).
                        2. **COUNT THE ITEMS**: If you see multiple pieces (e.g. 4 Rotis, 2 Eggs), count them and calculate nutrition for the TOTAL quantity visible.
                        3. Estimate portion sizes realistically.
                        4. BE CONSERVATIVE with PROTEIN. Do not overestimate. 
                           - Rice (100g cooked) ~ 2.5g protein
                           - Roti/Chapati (1 medium) ~ 3g protein (So 4 Rotis = ~12g protein)
                           - Dal (1 bowl) ~ 5-7g protein
                           - Curd/Yogurt (100g) ~ 3-4g protein
                           - Chicken Breast (100g) ~ 25-30g protein
                        5. Return valid JSON with this structure:
                        {
                            "items": [
                                {
                                    "food_name": "Name of item (e.g. 4 Rotis)",
                                    "calories": number,
                                    "protein": number,
                                    "carbs": number,
                                    "fats": number,
                                    "quantity": 1,
                                    "unit": "serving estimate (e.g. 4 pieces)"
                                }
                            ],
                            "notes": "Brief summary of the meal and what you counted."
                        }
                        Do not wrap in markdown code blocks.` },
              { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "";
      if (!text) return null;

      // Robust JSON extraction
      let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }

      try {
        return JSON.parse(jsonString);
      } catch (e) {
        console.error("Gemini JSON Parse Error", e, text);
        return null;
      }
    } catch (error) {
      console.error("Gemini Vision Error:", error);
      if (error.status === 429 || error.message?.includes("429")) {
        alert("Daily quota exceeded. try again later.");
        return null;
      }
      alert("Failed to analyze image. Try again.");
      return null;
    }
  }
};