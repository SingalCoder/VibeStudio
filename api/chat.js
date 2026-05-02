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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { prompt, systemPrompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  console.log("Keys loaded - Gemini:", GEMINI_KEYS.length, "Groq:", GROQ_KEYS.length);

  let lastError = null;

  if (GEMINI_KEYS.length > 0) {
    const shuffled = [...GEMINI_KEYS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i++) {
      try {
        console.log("Trying Gemini key", i);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${shuffled[i]}`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
          }),
        });
        console.log("Gemini key", i, "status:", r.status);
        if (r.status === 429 || r.status === 503) { lastError = "Rate limited"; continue; }
        const data = await r.json();
        if (!r.ok) {
          console.error("Gemini error:", data?.error?.message);
          return res.status(r.status).json({ error: data?.error?.message });
        }
        return res.json({ text: data.candidates[0].content.parts[0].text });
      } catch (e) {
        console.error("Gemini key", i, "threw:", e.message);
        lastError = e.message;
      }
    }
  }

  if (GROQ_KEYS.length > 0) {
    const shuffled = [...GROQ_KEYS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i++) {
      try {
        console.log("Trying Groq key", i);
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${shuffled[i]}`, "Content-Type": "application/json" },
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
        console.log("Groq key", i, "status:", r.status);
        if (r.status === 429) { lastError = "Rate limited"; continue; }
        const data = await r.json();
        if (!r.ok) {
          console.error("Groq error:", data?.error?.message);
          return res.status(r.status).json({ error: data?.error?.message });
        }
        return res.json({ text: data.choices[0].message.content });
      } catch (e) {
        console.error("Groq key", i, "threw:", e.message);
        lastError = e.message;
      }
    }
  }

  console.error("All keys failed, lastError:", lastError);
  res.status(500).json({ error: lastError || "No API keys configured" });
}
