# VibeStudio

A prompt-to-game platform where you can generate, edit, and preview browser games live with full code visibility to learn as you build.

**[Live Demo →](https://learn-vibe-studio.vercel.app)**

---

## What It Does

Type a plain-English description of a game. VibeStudio generates a fully playable HTML5 game in under 10 seconds — complete with a start screen, scoring, game-over screen, and polished visuals. You can then edit the code live and see updates in real time, or keep chatting to refine the game further.

---

## Features

- **Prompt to game in seconds** — describe any 2D game in plain English and get a complete, playable result
- **Live code editor** — syntax-highlighted editor with line numbers; changes reflect in the preview automatically
- **Sandboxed live preview** — games run in an isolated `<iframe sandbox="allow-scripts">` with no external dependencies
- **Iterative refinement** — chat to request changes; the AI reads the existing code and applies only what you asked
- **Copy & download** — export the generated game as a standalone `.html` file
- **Fullscreen preview** — expand the game to fill the screen
- **Dual AI with automatic fallback** — primary generation via Gemini 2.0 Flash, falls back to Groq (Llama 3.3 70B) if rate limited
- **Key rotation** — supports multiple API keys per provider, rotating automatically on rate limit hits
- **Interactive landing page** — animated hero, particle effects, parallax orbs, and a playable mini breakout demo

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 |
| AI (Primary) | Google Gemini 2.0 Flash |
| AI (Fallback) | Groq — Llama 3.3 70B Versatile |
| Code Editor | `@uiw/react-textarea-code-editor` |
| Styling | Inline styles + CSS-in-JS (no external CSS framework) |
| Deployment | Vercel |

---

## Architecture

### AI Pipeline

```
User Prompt
    ↓
fetchAI()
    ↓
Gemini 2.0 Flash  ──(429 / 503)──→  Groq Llama 3.3
    ↓                                      ↓
 Response                               Response
    ↓
extractHTML()  →  Live Preview iframe
```

- Retries up to 3 times per provider with exponential backoff
- Key rotation across multiple API keys per provider
- If all retries fail, surfaces the actual error (rate limit, auth, etc.) to the user

### Game Sandboxing

Every generated game runs inside:
```html
<iframe sandbox="allow-scripts" srcDoc={generatedHTML} />
```

This means:
- No access to the parent page's DOM, cookies, or localStorage
- No external network requests from the game
- Fully self-contained — all assets are generated programmatically (Canvas shapes, gradients, procedural art)

### System Prompt Engineering

The AI is given a strict system prompt that enforces:
- Single-file HTML output (no markdown, no code fences)
- `requestAnimationFrame` game loops (never `setInterval`)
- HTML5 Canvas rendering only (no DOM manipulation for game objects)
- Mandatory start screen, score counter, and game-over screen
- Responsive canvas that fills the viewport
- Pure vanilla JS — no libraries

---

## Local Setup

```bash
# Clone the repo
git clone https://github.com/SingalCoder/VibeStudio.git
cd VibeStudio

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
# Add your API keys to .env

# Start the dev server
npm run dev
```

### Environment Variables

Create a `.env` file in the root with:

```
VITE_GEMINI_KEY_1=your_gemini_api_key
VITE_GEMINI_KEY_2=optional_second_gemini_key

VITE_GROQ_KEY_1=your_groq_api_key
VITE_GROQ_KEY_2=optional_second_groq_key
VITE_GROQ_KEY_3=optional_third_groq_key
```

Get keys:
- Gemini: [aistudio.google.com](https://aistudio.google.com)
- Groq: [console.groq.com](https://console.groq.com)

---

## Deployment

The app is deployed on Vercel. Add the same environment variables in:

**Vercel Dashboard → Project → Settings → Environment Variables**

Every push to `main` triggers an automatic redeploy.

---

## Project Structure

```
src/
├── App.jsx        # Main studio — chat, code editor, live preview, AI pipeline
├── Landing.jsx    # Landing page — hero, game modes, how it works, mini breakout demo
├── index.css      # Global resets
└── main.jsx       # React entry point
```

---

## How the Code Editor Works

The editor is a `<textarea>` with syntax highlighting overlaid via `@uiw/react-textarea-code-editor`. Line numbers are synced to the textarea scroll position manually using a `scroll` event listener and a ref. Code changes trigger a debounced preview refresh (800ms) so the iframe updates as you type without thrashing.

---

## Rate Limits (Free Tier)

| Provider | Model | Requests/min | Requests/day |
|---|---|---|---|
| Gemini | 2.0 Flash | 15 | 1,500 |
| Groq | Llama 3.3 70B | 30 | 14,400 |

Resets: Gemini at 12:30 PM IST · Groq at 5:30 AM IST

---

## Roadmap

- [ ] 3D game generation (WebGL / Three.js)
- [ ] Multiplayer rooms (WebSocket)
- [ ] AI NPCs with live decision-making
- [ ] Game gallery / sharing
- [ ] User accounts and saved games
