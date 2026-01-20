
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function testModel(modelName) {
    console.log(`\n🧪 Testing model: ${modelName}`);
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`✅ Success! Response: ${response.text().substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.log(`❌ Failed:`, error.message);
        return false;
    }
}

async function main() {
    console.log("Checking API Key:", process.env.GOOGLE_API_KEY ? "Present" : "Missing");

    // Test the configured model
    await testModel(process.env.GEMINI_MODEL || 'gemini-3-flash-preview');

    // Test known good model
    await testModel('gemini-1.5-flash');
}

main();
