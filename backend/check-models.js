import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to get client? No, genAI is client.
        // actually there isn't a direct listModels on the JS SDK universally exposed in simpler versions, 
        // but we can try to run a generation test on a few likely candidates.

        const candidates = [
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-3-flash-preview",
            "gemini-3.0-flash",
            "gemini-pro-vision"
        ];

        console.log("Testing models...");

        for (const modelName of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello, are you there?");
                const response = await result.response;
                console.log(`✅ ${modelName} is AVAILABLE. Response: ${response.text().substring(0, 20)}...`);
            } catch (e) {
                console.log(`❌ ${modelName} failed: ${e.message.split('] ')[1] || e.message}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
