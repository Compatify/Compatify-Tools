// This file acts as a serverless function proxy for the Gemini API.
// It is designed to be deployed on platforms like Vercel.

// Import the GoogleGenerativeAI library. This is a Node.js library.
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * The main handler for the Vercel serverless function.
 * @param {import('http').IncomingMessage} req - The incoming HTTP request.
 * @param {import('http').ServerResponse} res - The HTTP response object.
 */
export default async function handler(req, res) {
  try {
    // Log the start of the request for debugging purposes.
    console.log('--- New Request ---');
    console.log('Received request method:', req.method);

    // Vercel serverless functions use an Express-like req/res object.
    // Check if the request is a POST request, as this function is designed for POST.
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    // *** FIX FOR `TypeError: request.headers.get is not a function` ***
    // In Node.js, the `headers` object is a plain object, not a browser `Headers` object.
    // We must use bracket notation to access the headers, and they are typically lowercase.
    const contentType = req.headers['content-type'];
    console.log('Received Content-Type:', contentType);

    // Validate the Content-Type header to ensure the request body is JSON.
    if (!contentType || !contentType.includes('application/json')) {
      res.status(400).json({ error: 'Invalid Content-Type. Expected application/json' });
      return;
    }

    // In a Vercel Node.js function, you need to read the request body from a stream.
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    // Parse the JSON body.
    const requestData = JSON.parse(body);
    console.log('Received requestData:', requestData);

    // Extract the required parameters from the request body.
    const { apiKey, model, userPrompt } = requestData;

    // Validate that the required parameters are present.
    if (!apiKey || !model || !userPrompt) {
      res.status(400).json({ error: 'Missing required parameters: apiKey, model, or userPrompt' });
      return;
    }

    // Initialize the Google Generative AI client with the provided API key.
    const genAI = new GoogleGenerativeAI(apiKey);
    const apiModel = genAI.getGenerativeModel({ model: model });

    // Make the API call to generate content.
    const result = await apiModel.generateContent(userPrompt);
    const responseText = result.response.text();
    console.log('API call successful. Response text:', responseText);

    // Send the API response back to the client.
    res.status(200).json({ content: responseText });

  } catch (error) {
    // Log any errors that occur during the process.
    console.error('An error occurred during the API call:', error);

    // Handle potential API errors with specific status codes if possible.
    if (error.response && error.response.status) {
        res.status(error.response.status).json({
            error: 'API call failed with status ' + error.response.status,
            details: error.response.data
        });
    } else {
        // Fallback for unexpected errors.
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
}
