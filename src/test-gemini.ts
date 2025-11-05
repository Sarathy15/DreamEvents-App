import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDkiwy_1zT6UQ8IPRt-MpohA57H_mjAYnM';
const genAI = new GoogleGenerativeAI(API_KEY);

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API connection...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chat = model.startChat();
    const result = await chat.sendMessage('Hello, this is a test message. Please respond with "API is working!" if you receive this.');
    console.log('API Response:', result.response.text());
    console.log('API test successful!');
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testGeminiAPI();