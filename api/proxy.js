import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Set CORS headers for preflight OPTIONS request
  // This allows the browser to make the subsequent POST request
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    // Respond with a 200 OK for the preflight request
    res.status(200).end();
    return;
  }

  // Handle the main POST request
  if (req.method !== "POST") {
    // If the method is not POST, return a 405 Method Not Allowed error
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // Ensure the API key is set in the environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "API key not configured." });
    return;
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required in the request body." });
      return;
    }

    // Initialize the Google Generative AI client with the API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Generate content using the prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
