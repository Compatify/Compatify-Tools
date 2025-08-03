import fetch from 'node-fetch';

export default async function handler(request, response) {
  // Use VITE_API_KEY from environment variables instead of GEMINI_API_KEY
  const apiKey = process.env.VITE_API_KEY;

  if (!apiKey) {
    console.error('VITE_API_KEY environment variable is not set.');
    response.status(500).json({ error: 'API key not configured' });
    return;
  }

  // Allow only POST requests
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Ensure the request body is valid
  if (!request.body) {
    response.status(400).json({ error: 'Request body is missing' });
    return;
  }

  try {
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.body),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Error from Gemini API:', data);
      response.status(apiResponse.status).json(data);
      return;
    }

    response.status(200).json(data);
  } catch (error) {
    console.error('Error in proxy handler:', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
}
