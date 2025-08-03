// A simple Vercel serverless function to proxy requests to the Gemini API.
// This allows the frontend to securely use the API key without exposing it to the client.

// Import the 'fetch' function, which is available in the Node.js environment on Vercel.
// We use a polyfill just in case, but Vercel's environment supports it natively.
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Check if the request method is POST. This proxy is designed to only handle POST requests.
  if (req.method !== 'POST') {
    // If the method is not POST, send a 405 Method Not Allowed error.
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  // Use a try-catch block to handle any potential errors during the API call.
  try {
    // Read the API key from the environment variables.
    // In a Vercel serverless function, environment variables set in the dashboard
    // are available via process.env.
    const apiKey = process.env.VITE_API_KEY;

    // Check if the API key is present. If not, something is wrong with the Vercel configuration.
    if (!apiKey) {
      res.status(500).json({ error: 'API key not configured on the server.' });
      return;
    }

    // Parse the JSON body sent from the client-side JavaScript.
    const { prompt } = req.body;

    // Construct the URL for the Gemini API endpoint.
    // We are using the gemini-2.5-flash-preview-05-20 model for text generation.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // Prepare the payload for the Gemini API request.
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };

    // Make the fetch call to the Gemini API.
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Check if the response from the Gemini API was successful.
    if (!response.ok) {
      // If not, throw an error with the status code.
      const errorText = await response.text();
      throw new Error(`API call failed with status ${response.status}: ${errorText}`);
    }

    // Parse the JSON response from the Gemini API.
    const data = await response.json();

    // Check if the Gemini API response contains valid content.
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      // If the content is valid, send it back to the client with a 200 OK status.
      res.status(200).json(data);
    } else {
      // If the content is not valid, send a 500 Internal Server Error.
      res.status(500).json({ error: 'Invalid response from Gemini API.' });
    }

  } catch (error) {
    // Catch any errors that occurred and send a 500 Internal Server Error response.
    console.error('Error during API proxy:', error);
    res.status(500).json({ error: 'Internal server error processing the request.' });
  }
}
