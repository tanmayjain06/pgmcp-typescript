// src/services/ai.ts
import { GoogleGenAI } from '@google/genai';

export class AIService {
  private client: GoogleGenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    this.client = new GoogleGenAI({ apiKey });
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  async generateSql(prompt: string): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [{ parts: [{ text: prompt }] }]
      });
      
      // Extract text from response
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
