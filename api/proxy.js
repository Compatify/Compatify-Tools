// A Vercel serverless function to proxy requests to the Google AI Studio API.
// This allows you to securely use your API key via Vercel's environment variables.

// The API endpoint for the Gemini-1.5-flash model
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

// The API key is securely stored as an environment variable in Vercel.
// It is accessed via process.env.VITE_API_KEY
const apiKey = process.env.VITE_API_KEY;

// This is the main function that handles incoming requests.
export default async function handler(req, res) {
    // Only allow POST requests to this endpoint.
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        // Log the start of the request for debugging purposes.
        console.log('--- New Proxy Request ---');
        console.log('API Key Status:', apiKey ? 'Present' : 'Missing');

        // Check if the Vercel environment variable for the API key is set.
        if (!apiKey) {
            console.error('API key is missing.');
            return res.status(500).json({ error: 'Server configuration error: API key is not set. Please check the VITE_API_KEY environment variable in Vercel.' });
        }

        // Vercel's middleware automatically parses JSON requests.
        // The parsed body is available on the `req.body` property.
        const requestData = req.body;
        
        // Ensure the 'contents' field is present and correctly structured.
        if (!requestData || !requestData.contents || !Array.isArray(requestData.contents) || requestData.contents.length === 0 || !requestData.contents[0].parts || !requestData.contents[0].parts[0].text) {
            console.error('Invalid request body received. Expected "contents" array.');
            return res.status(400).json({ error: 'Request body must contain a valid "contents" array.' });
        }
        
        // Extract the contents from the request body.
        const { contents } = requestData;
        
        // Construct the full API URL with the API key.
        const apiUrl = `${GEMINI_API_URL}?key=${apiKey}`;
        
        // Prepare the payload for the Gemini API.
        const payload = {
            contents: contents
        };
        
        // Log the payload being sent to the Gemini API.
        console.log('Sending payload to Gemini API:', JSON.stringify(payload, null, 2));

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
            return res.status(geminiResponse.status).json({ error: `Gemini API responded with an error: ${geminiResponse.statusText}`, details: errorText });
        }

        // Parse the response from the Gemini API.
        const result = await geminiResponse.json();
        
        // Extract the generated text from the response.
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'No content found.';

        // Log the successful response.
        console.log('Successfully received response from Gemini API.');
        
        // Send the generated text back to the client in a simple format.
        res.status(200).json({ content: text });

    } catch (error) {
        // This catch block will handle any unexpected errors during the process.
        console.error('An unexpected error occurred in the proxy function:', error);
        res.status(500).json({ error: 'An internal server error occurred.', details: error.message });
    }
}
