// A Vercel serverless function to proxy requests to the Google AI Studio API.
// This allows you to securely use your API key via Vercel's environment variables.

// The API endpoint for the Gemini-1.5-flash model
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

// The API key is securely stored as an environment variable in Vercel.
// It is accessed via process.env.VITE_API_KEY
const apiKey = process.env.VITE_API_KEY;

// This is the main function that handles incoming requests.
export default async function handler(request, response) {
    // Only allow POST requests to this endpoint.
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        // Parse the request body to get the 'contents' field.
        // This payload format is what the Gemini API expects.
        const { contents } = await request.json();

        // Check if the Vercel environment variable for the API key is set.
        if (!apiKey) {
            return response.status(500).json({ error: 'API key is not configured. Please set the VITE_API_KEY environment variable in Vercel.' });
        }
        
        // Ensure the 'contents' field is present and correctly structured.
        if (!contents || !Array.isArray(contents) || contents.length === 0 || !contents[0].parts || !contents[0].parts[0].text) {
             return response.status(400).json({ error: 'Request body must contain a valid "contents" field with a text part.' });
        }

        // Construct the full API URL with the API key.
        const apiUrl = `${GEMINI_API_URL}?key=${apiKey}`;

        // Prepare the payload for the Gemini API.
        const payload = {
            contents: contents
        };

        // Forward the request to the Gemini API.
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        // Check for a successful response from the Gemini API.
        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API Error:', geminiResponse.status, errorText);
            return response.status(geminiResponse.status).json({ error: `Gemini API responded with an error: ${geminiResponse.statusText}` });
        }

        // Parse the response from the Gemini API.
        const result = await geminiResponse.json();
        
        // Extract the generated text from the response.
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'No content found.';

        // Send the generated text back to the client in a simple format.
        response.status(200).json({ content: text });

    } catch (error) {
        console.error('Proxy Error:', error);
        response.status(500).json({ error: 'An internal server error occurred.' });
    }
}
