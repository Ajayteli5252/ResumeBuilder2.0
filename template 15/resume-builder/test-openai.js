import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Load environment variables
dotenv.config();

// Check if OpenAI API key exists
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('USE_OPENAI value:', process.env.USE_OPENAI);

// Function to test OpenAI API
async function testOpenAI() {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    console.log('Attempting to call OpenAI API...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, this is a test message." }
      ],
      max_tokens: 50
    });
    
    console.log('API call successful!');
    console.log('Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI API error:', error.message);
  }
}

// Run the test
testOpenAI();