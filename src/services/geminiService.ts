import { GoogleGenerativeAI } from '@google/generative-ai';

// Validate API key is present
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
}

// List of models to try in order of preference
const modelCandidates = [
  'gemini-2.5-flash',
  'gemini-pro',
  'gemini-1.0-pro'
];

async function getWorkingModel() {
  for (const modelName of modelCandidates) {
    try {
      const testModel = genAI.getGenerativeModel({ model: modelName });
      // Test if model works
      const chat = testModel.startChat();
      await chat.sendMessage('test');
      console.log(`Successfully connected to model: ${modelName}`);
      return testModel;
    } catch (error: any) {
      console.warn(`Model ${modelName} not available:`, error.message);
      continue;
    }
  }
  throw new Error('No compatible Gemini model available');
}

// Initialize model
let model: any;
getWorkingModel().then(m => model = m).catch(console.error);

export const getChatbotResponse = async (history: { role: string, parts: { text: string }[] }[], message: string): Promise<string> => {
  try {
    if (!model) {
      model = await getWorkingModel();
    }

    const systemPrompt = {
      role: 'user',
      parts: [{ text: 'You are a friendly and helpful event planning assistant for DreamEvents. Help users with booking services, answering questions about events, and providing relevant information. Keep responses concise, actionable, and focused on event planning.' }]
    };

    const chat = model.startChat({
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      history: [systemPrompt, ...history],
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(getErrorMessage(error));
  }
};

const getErrorMessage = (error: any): string => {
  if (error.message?.includes('invalid api key')) {
    return 'Invalid API key. Please check your configuration.';
  }
  if (error.message?.includes('rate limit')) {
    return 'Service is currently busy. Please try again in a moment.';
  }
  if (error.message?.includes('not found')) {
    return 'AI model not available. Please try again later.';
  }
  return 'Failed to get response from AI. Please try again.';
};
