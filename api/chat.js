const GEMINI_KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
].filter(Boolean);

const GROQ_KEYS = [
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
].filter(Boolean);

let geminiIndex = 0;
let groqIndex = 0;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { prompt, systemPrompt, retries = 3 } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  let lastError = null;

  if (GEMINI_KEYS.length > 0) {
    for (let i = 0; i < retries; i++) {
      const key = GEMINI_KEYS[geminiIndex % GEMINI_KEYS.length];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
        }),
      });
      if (r.status === 429 || r.status === 503) {
        geminiIndex++;
        lastError = "Rate limited";
        await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** i));
        continue;
      }
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data?.error?.message });
      return res.json({ text: data.candidates[0].content.parts[0].text });
    }
  }

  if (GROQ_KEYS.length > 0) {
    for (let i = 0; i < retries; i++) {
      const key = GROQ_KEYS[groqIndex % GROQ_KEYS.length];
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 4000,
          temperature: 0.4,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (r.status === 429) {
        groqIndex++;
        lastError = "Rate limited";
        await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** i));
        continue;
      }
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data?.error?.message });
      return res.json({ text: data.choices[0].message.content });
    }
  }

  res.status(500).json({ error: lastError || "No API keys configured" });
}
