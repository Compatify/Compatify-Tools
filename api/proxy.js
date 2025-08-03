// api/proxy.js
// This Vercel serverless function acts as a proxy for the Gemini API.

// The `VITE_API_KEY` is a secret environment variable configured in Vercel.
const API_KEY = process.env.VITE_API_KEY;

// The Gemini API endpoint for text generation.
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=" + API_KEY;

// This is the main handler for the Vercel serverless function.
module.exports = async (req, res) => {
    // Check if the request method is POST. This is crucial for fixing the 405 error.
    if (req.method !== 'POST') {
        // If the method is not POST, send a 405 Method Not Allowed response.
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    // A simple guardrail to prevent the function from running without a key.
    if (!API_KEY) {
        res.status(500).json({ error: 'API key is not configured.' });
        return;
    }

    try {
        // Forward the request body directly to the Gemini API.
        const geminiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // The body from the client request is used as the body for the Gemini API request.
            body: JSON.stringify(req.body),
        });

        // Parse the response from the Gemini API.
        const data = await geminiResponse.json();

        // Send the status and data from the Gemini API back to the client.
        res.status(geminiResponse.status).json(data);
    } catch (error) {
        console.error('Error in proxy:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
