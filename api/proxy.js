import { GoogleGenerativeAI } from "@google/generative-ai";

// IMPORTANT: The environment variable must be named VITE_API_KEY
// in Vercel's settings to be accessible here.
const apiKey = process.env.VITE_API_KEY;

export default async function (request, response) {
    try {
        // Ensure the API key exists
        if (!apiKey) {
            return response.status(500).json({ error: "API key is not configured." });
        }

        // Initialize the AI model
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

        // Get the user's message from the request body
        const { contents } = await request.json();

        // Call the Gemini API
        const result = await model.generateContent({ contents });

        // Respond with the API result
        response.status(200).json(result.response);
    } catch (error) {
        console.error("Proxy Error:", error);
        // Return a generic 500 error to the client to avoid leaking API key details
        response.status(500).json({ error: "Internal Server Error" });
    }
}
