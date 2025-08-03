// Note: Vercel's Node.js environment includes a native `fetch` API,
// so there is no need to import `node-fetch`.
// This change is the most likely fix for the 500 Internal Server Error.

export default async function handler(request, response) {
  console.log('--- New Request ---');
  console.log(`Received request method: ${request.method}`);

  // Ensure request method is POST
  if (request.method !== 'POST') {
    console.error('Method Not Allowed: Received a non-POST request.');
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // Ensure a valid content-type
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    console.error('Bad Request: Invalid or missing Content-Type header.');
    return response.status(400).json({ error: 'Bad Request: Content-Type must be application/json' });
  }

  let prompt;
  try {
    const body = await request.json();
    prompt = body.prompt;
    if (!prompt) {
      console.error('Bad Request: Missing "prompt" field in request body.');
      return response.status(400).json({ error: 'Missing prompt in request body' });
    }
    console.log('Successfully parsed request body. Prompt received.');
  } catch (parseError) {
    console.error('Bad Request: Failed to parse JSON body.', parseError);
    return response.status(400).json({ error: 'Bad Request: Invalid JSON body' });
  }

  // Use the correct environment variable name
  const API_KEY = process.env.VITE_API_KEY;
  if (!API_KEY) {
    console.error('Internal Server Error: VITE_API_KEY environment variable is not set.');
    return response.status(500).json({ error: 'API key is not configured on the server.' });
  }
  console.log('Successfully retrieved VITE_API_KEY from environment variables.');

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

  try {
    console.log('Attempting to fetch from Gemini API...');
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    console.log(`Gemini API Response Status: ${geminiResponse.status}`);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Error from Gemini API: Status ${geminiResponse.status}. Body: ${errorText}`);
      return response.status(geminiResponse.status).json({
        error: `Gemini API responded with an error.`,
        details: errorText
      });
    }

    const data = await geminiResponse.json();
    response.status(200).json(data);
    console.log('Successfully proxied response from Gemini API. End of request.');
  } catch (error) {
    console.error('Unhandled error during API proxy:', error);
    response.status(500).json({ error: 'Failed to get a response from Gemini API', details: error.message });
  }
}
