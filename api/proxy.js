// vercel.json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/proxy.js"
    }
  ]
}
