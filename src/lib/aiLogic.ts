import { GoogleGenAI } from '@google/genai';

export type AISettings = {
  provider: 'gemini' | 'custom';
  apiKey: string;
  customUrl: string;
  customModel: string;
  corsProxy: string;
};

export const defaultSettings: AISettings = {
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY || '',
  customUrl: 'https://api.groq.com/openai/v1/chat/completions',
  customModel: 'llama3-70b-8192',
  corsProxy: ''
};

export async function chatCompletion(
  messages: { role: string; content: string }[],
  settings: AISettings
): Promise<string> {
  const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages.filter(m => m.role !== 'system');

  if (settings.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: settings.apiKey });
    
    const contents = userMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2 // keep it deterministic for code
      }
    });

    return response.text || '';
  } else {
    // Custom OpenAI compatible endpoint
    let url = settings.customUrl;
    if (settings.corsProxy) {
      url = settings.corsProxy + url;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.customModel,
        messages: messages,
        temperature: 0.2
      })
    });

    if (response.status === 429) {
      throw new Error('429');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || '';
  }
}
