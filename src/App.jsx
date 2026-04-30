import { useState, useRef, useEffect, useCallback } from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import Landing from "./Landing";

const GEMINI_KEYS = [
  import.meta.env.VITE_GEMINI_KEY_1,
  import.meta.env.VITE_GEMINI_KEY_2,
  import.meta.env.VITE_GEMINI_KEY_3,
  import.meta.env.VITE_GEMINI_KEY_4,
  import.meta.env.VITE_GEMINI_KEY_5,
].filter(Boolean);
const GROQ_KEYS = [
  import.meta.env.VITE_GROQ_KEY_1,
  import.meta.env.VITE_GROQ_KEY_2,
  import.meta.env.VITE_GROQ_KEY_3,
].filter(Boolean);

let geminiIndex = 0;
let groqIndex = 0;
const getGeminiKey = () => GEMINI_KEYS[geminiIndex % GEMINI_KEYS.length];
const getGroqKey   = () => GROQ_KEYS[groqIndex % GROQ_KEYS.length];

const GEMINI_MODEL = "gemini-2.0-flash";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `\
You are an expert browser game developer for VibeStudio — an AI-powered game generator that instantly creates fully playable HTML5 games from plain-English descriptions.

## YOUR ROLE
You produce complete, self-contained, immediately playable browser games as a single raw HTML file.
Every game runs inside a sandboxed iframe (sandbox="allow-scripts") with zero external dependencies.

## OUTPUT FORMAT — STRICTLY ENFORCED
- Return ONLY raw HTML starting with <!DOCTYPE html> and ending with </html>
- NO markdown, NO code fences (\`\`\`), NO backticks, NO prose explanation before or after the code
- The entire game — HTML structure, CSS styles, and JavaScript logic — lives inside one file
- Violating this format will break the app. Output the HTML and nothing else.

## EVERY GAME MUST HAVE
1. A smooth game loop using requestAnimationFrame (never setInterval)
2. A start screen showing the game title and controls
3. Keyboard and/or mouse controls with clear on-screen instructions
4. A live score counter visible during gameplay
5. A game-over screen showing the final score and a "Play Again" button
6. Polished visuals rendered on an HTML5 Canvas element
7. At least a simple animated background (gradient, stars, parallax, etc.)
8. No crashes, no infinite loops, no broken references — the game must be fully playable

## TECHNICAL RULES
- Use HTML5 Canvas for all game rendering — never manipulate DOM elements for game objects
- All assets must be generated programmatically (shapes, gradients, procedural art) — no external images, fonts, or CDN scripts
- Pure vanilla JavaScript only — no jQuery, Phaser, p5.js, or any library
- Canvas must fill the full viewport (window.innerWidth × window.innerHeight) and resize on window resize
- Handle both keyboard (arrow keys / WASD / space) and mouse where appropriate

## VISUAL QUALITY BAR
- Vibrant color palette — avoid plain white or grey backgrounds
- Glow effects, particle bursts, and smooth animations make games feel polished
- UI elements (score, lives, level) should be styled, not plain browser text
- Game-over and start screens should look designed, not like a plain alert

## WHEN REFINING AN EXISTING GAME
- Read the full existing code before making any change
- Apply ONLY what was asked — do not rewrite unrelated sections
- Preserve all existing game logic, scoring, visual style, and control scheme unless explicitly told to change them
- Always return the COMPLETE updated HTML file from <!DOCTYPE html> to </html>`;

async function fetchAI(prompt, signal, retries = 3) {
  let lastError = null;

  // Primary: Gemini
  if (GEMINI_KEYS.length > 0) {
    for (let i = 0; i < retries; i++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${getGeminiKey()}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
        }),
        signal,
      });
      if (res.status === 429 || res.status === 503) {
        geminiIndex++;
        lastError = new Error("Rate limited — too many requests. Please wait a moment and try again.");
        await new Promise(r => setTimeout(r, 1000 * 2 ** i));
        continue;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || res.statusText);
      return data.candidates[0].content.parts[0].text;
    }
  }

  // Fallback: Groq
  if (GROQ_KEYS.length > 0) {
    for (let i = 0; i < retries; i++) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${getGroqKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: 4000,
          temperature: 0.4,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user",   content: prompt },
          ],
        }),
        signal,
      });
      if (res.status === 429) {
        groqIndex++;
        lastError = new Error("Rate limited — too many requests. Please wait a moment and try again.");
        await new Promise(r => setTimeout(r, 1000 * 2 ** i));
        continue;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || res.statusText);
      return data.choices[0].message.content;
    }
  }

  if (lastError) throw lastError;
  throw new Error("No API keys configured. Add VITE_GEMINI_KEY_1 or VITE_GROQ_KEY_1 to your .env file.");
}

function extractHTML(text) {
  const match = text.match(/```html\n?([\s\S]*?)```/);
  if (match) return match[1];
  if (/^(<!|<html|<canvas|<style|<script)/i.test(text.trim())) return text;
  return text;
}

const DEFAULT_CODE = `<!DOCTYPE html>
<html>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:#888;background:#f8fffe;">
  <p>Your game will appear here. Generate one from the Chat tab!</p>
</body>
</html>`;

const SUGGESTIONS = [
  "Pinball with neon theme",
  "Flappy bird but a samurai",
  "Snake in space",
  "Brick breaker with fire",
];

export default function App() {
  const [tab, setTab] = useState("chat");
  const [showHome, setShowHome] = useState(true);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome to VibeStudio! Describe a 2D game and I'll build it instantly. Then switch to the Code tab to edit it live." },
  ]);
  const [input, setInput] = useState("");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [loading, setLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const chatEndRef = useRef(null);
  const previewTimeout = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const editorWrapRef = useRef(null);
  const lineNumsRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  useEffect(() => {
    return () => {
      clearTimeout(previewTimeout.current);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (tab !== "code") return;
    const scrollEl = editorWrapRef.current?.querySelector(".w-tc-editor") ?? editorWrapRef.current?.querySelector("textarea");
    if (!scrollEl) return;
    const sync = () => { if (lineNumsRef.current) lineNumsRef.current.scrollTop = scrollEl.scrollTop; };
    scrollEl.addEventListener("scroll", sync);
    return () => scrollEl.removeEventListener("scroll", sync);
  }, [tab]);

  const handleCodeChange = useCallback((val) => {
    setCode(val);
    clearTimeout(previewTimeout.current);
    previewTimeout.current = setTimeout(() => setPreviewKey((k) => k + 1), 800);
  }, []);

  const sendMessage = async () => {
    const userText = input.trim();
    if (!userText || loading) return;

    setInput("");
    if (inputRef.current) inputRef.current.style.height = "38px";

    const isRefine = !code.includes("Your game will appear here");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const prompt = isRefine
      ? `Here is the current game code:\n\n${code}\n\nUser request: "${userText}"`
      : `Create a 2D browser game: "${userText}"`;

    try {
      const text = await fetchAI(prompt, abortRef.current.signal);
      const html = extractHTML(text);
      setCode(html);
      setPreviewKey((k) => k + 1);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: isRefine
          ? "Done! Changes applied. Switch to Code tab to edit further."
          : "Game ready! Check the preview on the right. Switch to the Code tab to edit it live.",
      }]);
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((prev) => [...prev, { role: "assistant", content: err.message || "Something went wrong. Check your API key and try again." }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "game.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasGame = !code.includes("Your game will appear here");

  if (showHome) return <Landing onEnterStudio={() => setShowHome(false)} />;

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,200,200,0.2); border-radius: 4px; }
        textarea:focus, input:focus { outline: none; }
        .tab-btn { cursor:pointer; border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; padding:11px 22px; transition:all 0.2s; color:rgba(0,100,120,0.5); border-bottom: 2px solid transparent; letter-spacing:0.2px; }
        .tab-btn:hover { color: #00b4cc; }
        .tab-active { color: #007a8a !important; border-bottom: 2px solid #00b4cc !important; }
        .send-btn:hover { transform: scale(1.05); }
        .icon-btn:hover { background: rgba(0,180,204,0.2) !important; color: #007a8a !important; border-color: rgba(0,180,204,0.4) !important; }
        .suggestion:hover { background: rgba(0,200,220,0.12) !important; color: #007a8a !important; border-color: rgba(0,180,204,0.4) !important; }
        .msg-user { background: rgba(0,180,204,0.12); border: 1px solid rgba(0,180,204,0.25); border-radius: 14px 14px 4px 14px; backdrop-filter: blur(8px); }
        .msg-ai { background: rgba(255,255,255,0.5); border: 1px solid rgba(0,180,204,0.15); border-radius: 14px 14px 14px 4px; backdrop-filter: blur(8px); }
        @keyframes pulse { 0%,100%{opacity:0.4;transform:scale(1);}50%{opacity:1;transform:scale(1.3);} }
        @keyframes livePulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,200,160,0.5);}50%{opacity:0.7;box-shadow:0 0 0 4px rgba(0,200,160,0);} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
      `}</style>

      <div style={s.bgGradient} />
      <div style={s.bgOrb1} />
      <div style={s.bgOrb2} />
      <div style={s.bgOrb3} />

      {/* NAV */}
      <div style={s.nav}>
        <div style={s.navLeft}>
          <button className="icon-btn" style={{ ...s.navBtn, fontSize: 12, marginRight: 4 }} onClick={() => setShowHome(true)} title="Back to home">← Home</button>
          <span style={s.navLogo}>◈</span>
          <span style={s.navName}>VibeStudio</span>
          <span style={s.navTag}>2D Game Builder</span>
        </div>
        <div style={s.navRight}>
          {hasGame && (
            <>
              <button className="icon-btn" style={s.navBtn} onClick={copyCode} title="Copy HTML to clipboard">
                {copied ? "✓ Copied" : "⎘ Copy"}
              </button>
              <button className="icon-btn" style={s.navBtn} onClick={downloadCode} title="Download as HTML file">
                ↓ Download
              </button>
            </>
          )}
          <span style={s.navHint}>Generate · Edit · Play · Learn</span>
        </div>
      </div>

      {/* MAIN */}
      <div style={s.main}>

        {/* LEFT PANEL */}
        {!fullscreen && (
          <div style={s.left}>
            <div style={s.tabBar}>
              <button className={`tab-btn ${tab === "chat" ? "tab-active" : ""}`} onClick={() => setTab("chat")}>💬 Chat</button>
              <button className={`tab-btn ${tab === "code" ? "tab-active" : ""}`} onClick={() => setTab("code")}>{"</>"} Code</button>
            </div>

            {/* CHAT TAB */}
            {tab === "chat" && (
              <div style={s.tabContent}>
                <div style={s.chatScroll}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ animation: "fadeIn 0.25s ease", marginBottom: 12, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                      {m.role === "assistant" && <span style={s.aiAvatar}>◈</span>}
                      <div className={m.role === "user" ? "msg-user" : "msg-ai"} style={s.bubble}>{m.content}</div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
                      <span style={s.aiAvatar}>◈</span>
                      <div className="msg-ai" style={{ ...s.bubble, display: "flex", gap: 5, alignItems: "center" }}>
                        {[0, 150, 300].map((d) => (
                          <span key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#00b4cc", display: "inline-block", animation: `pulse 1.2s ${d}ms infinite` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {messages.length <= 1 && (
                  <div style={s.suggestionsWrap}>
                    <span style={s.suggestLabel}>Try these:</span>
                    <div style={s.suggestions}>
                      {SUGGESTIONS.map((sg) => (
                        <button key={sg} className="suggestion" style={s.suggestion} onClick={() => { setInput(sg); inputRef.current?.focus(); }}>{sg} →</button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={s.inputRow}>
                  <textarea
                    ref={inputRef}
                    style={s.input}
                    placeholder="Describe a game or ask for changes... (Shift+Enter for newline)"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKey}
                    disabled={loading}
                    rows={1}
                  />
                  <button className="send-btn" style={{ ...s.sendBtn, opacity: loading || !input.trim() ? 0.4 : 1 }} onClick={sendMessage} disabled={loading || !input.trim()}>↑</button>
                </div>
              </div>
            )}

            {/* CODE TAB */}
            {tab === "code" && (
              <div style={s.tabContent}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", borderBottom: "1px solid rgba(0,180,204,0.12)", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(0,120,140,0.45)" }}>
                    {code.split("\n").length} lines
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="icon-btn" style={s.runBtn} onClick={copyCode}>{copied ? "✓ Copied" : "⎘ Copy"}</button>
                    <button className="icon-btn" style={s.runBtn} onClick={downloadCode}>↓ Download</button>
                    <button className="icon-btn" style={{ ...s.runBtn, borderColor: "rgba(0,180,204,0.4)", color: "#00a0b0" }} onClick={() => setPreviewKey((k) => k + 1)}>▶ Run</button>
                  </div>
                </div>
                <div ref={editorWrapRef} style={{ display: "flex", flex: 1, overflow: "hidden", margin: 10, borderRadius: 8, background: "rgba(0,40,50,0.78)" }}>
                  <div ref={lineNumsRef} style={s.lineNums}>
                    {code.split("\n").map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <CodeEditor
                    value={code}
                    language="html"
                    onChange={(e) => handleCodeChange(e.target.value)}
                    padding={14}
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      lineHeight: 1.7,
                      overflowY: "auto",
                      background: "transparent",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {!fullscreen && <div style={s.divider} />}

        {/* RIGHT — LIVE PREVIEW */}
        <div style={{ ...s.right, ...(fullscreen ? { width: "100%" } : {}) }}>
          <div style={s.previewHeader}>
            <span style={s.liveDot} />
            <span style={s.previewLabel}>LIVE PREVIEW</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              {!fullscreen && <span style={s.previewHint}>auto-updates as you edit</span>}
              <button className="icon-btn" style={s.previewBtn} onClick={() => setPreviewKey((k) => k + 1)} title="Refresh preview">↺</button>
              <button className="icon-btn" style={s.previewBtn} onClick={() => setFullscreen((f) => !f)} title={fullscreen ? "Exit fullscreen" : "Expand preview"}>
                {fullscreen ? "⊠ Exit" : "⊡ Expand"}
              </button>
            </div>
          </div>
          <iframe key={previewKey} srcDoc={code} style={s.iframe} sandbox="allow-scripts" title="Game Preview" />
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { display: "flex", flexDirection: "column", height: "100vh", width: "100vw", fontFamily: "'DM Sans',sans-serif", color: "#004d5c", overflow: "hidden", position: "relative" },
  bgGradient: { position: "fixed", inset: 0, background: "linear-gradient(135deg, #b2f0f0 0%, #d0fafa 40%, #c8f4f9 70%, #a8eeee 100%)", zIndex: 0 },
  bgOrb1: { position: "fixed", top: "-120px", left: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,210,220,0.4) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" },
  bgOrb2: { position: "fixed", bottom: "-150px", right: "-100px", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,180,200,0.13) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" },
  bgOrb3: { position: "fixed", top: "40%", left: "45%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(100,240,240,0.08) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "46px", background: "rgba(255,255,255,0.4)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,180,204,0.18)", flexShrink: 0, position: "relative", zIndex: 10 },
  navLeft: { display: "flex", alignItems: "center", gap: 10 },
  navRight: { display: "flex", alignItems: "center", gap: 8 },
  navLogo: { fontSize: 18, color: "#00b4cc" },
  navName: { fontSize: 15, fontWeight: 700, color: "#005f6e", letterSpacing: "-0.3px" },
  navTag: { fontSize: 11, color: "#00a0b0", fontFamily: "'JetBrains Mono',monospace", background: "rgba(0,180,204,0.1)", border: "1px solid rgba(0,180,204,0.25)", padding: "2px 8px", borderRadius: 20 },
  navBtn: { fontSize: 11, fontFamily: "'JetBrains Mono',monospace", background: "rgba(0,180,204,0.08)", border: "1px solid rgba(0,180,204,0.2)", color: "#007a8a", padding: "4px 10px", borderRadius: 6, cursor: "pointer", transition: "all 0.15s" },
  navHint: { fontSize: 11, color: "rgba(0,150,170,0.35)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 },
  main: { display: "flex", flex: 1, overflow: "hidden", position: "relative", zIndex: 1 },
  left: { width: "50%", display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(255,255,255,0.35)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(0,180,204,0.15)" },
  tabBar: { display: "flex", borderBottom: "1px solid rgba(0,180,204,0.15)", background: "rgba(255,255,255,0.4)", flexShrink: 0 },
  tabContent: { display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" },
  chatScroll: { flex: 1, overflowY: "auto", padding: "16px" },
  aiAvatar: { fontSize: 12, color: "#00b4cc", flexShrink: 0, marginBottom: 4, lineHeight: 1 },
  bubble: { padding: "10px 14px", fontSize: 13, lineHeight: 1.6, maxWidth: "85%", color: "#004d5c" },
  suggestionsWrap: { padding: "0 16px 10px", flexShrink: 0 },
  suggestLabel: { fontSize: 10, color: "rgba(0,120,140,0.45)", fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: 6 },
  suggestions: { display: "flex", flexWrap: "wrap", gap: 6 },
  suggestion: { background: "rgba(0,180,204,0.07)", border: "1px solid rgba(0,180,204,0.2)", borderRadius: 20, color: "#007a8a", fontSize: 11, padding: "5px 12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" },
  inputRow: { display: "flex", gap: 8, padding: "10px 16px", borderTop: "1px solid rgba(0,180,204,0.12)", alignItems: "flex-end", flexShrink: 0, background: "rgba(255,255,255,0.3)" },
  input: { flex: 1, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,180,204,0.25)", borderRadius: 10, color: "#004d5c", fontSize: 13, padding: "9px 14px", fontFamily: "'DM Sans',sans-serif", resize: "none", minHeight: 38, maxHeight: 120, lineHeight: 1.55, overflowY: "auto" },
  sendBtn: { width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #00b4cc, #0090a8)", border: "none", color: "white", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 0.15s", boxShadow: "0 2px 12px rgba(0,180,204,0.35)" },
  runBtn: { fontSize: 11, fontFamily: "'JetBrains Mono',monospace", background: "rgba(0,180,204,0.1)", border: "1px solid rgba(0,180,204,0.3)", color: "#007a8a", padding: "4px 12px", borderRadius: 6, cursor: "pointer", transition: "all 0.15s" },
  lineNums: { paddingTop: 14, paddingBottom: 14, paddingLeft: 10, paddingRight: 10, textAlign: "right", color: "rgba(100,200,220,0.25)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7, userSelect: "none", minWidth: 44, borderRight: "1px solid rgba(0,180,204,0.08)", overflowY: "hidden", flexShrink: 0 },
  divider: { width: 1, background: "rgba(0,180,204,0.15)", flexShrink: 0 },
  right: { width: "50%", display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" },
  previewHeader: { display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid rgba(0,180,204,0.15)", flexShrink: 0, background: "rgba(255,255,255,0.4)" },
  liveDot: { width: 7, height: 7, borderRadius: "50%", background: "#00c8a0", display: "inline-block", flexShrink: 0, animation: "livePulse 2.4s ease-in-out infinite" },
  previewLabel: { fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#007a8a", letterSpacing: "1.5px" },
  previewHint: { fontSize: 10, color: "rgba(0,150,170,0.35)", fontFamily: "'JetBrains Mono',monospace" },
  previewBtn: { fontSize: 11, fontFamily: "'JetBrains Mono',monospace", background: "rgba(0,180,204,0.08)", border: "1px solid rgba(0,180,204,0.22)", color: "#007a8a", padding: "3px 9px", borderRadius: 6, cursor: "pointer", transition: "all 0.15s" },
  iframe: { flex: 1, border: "none", background: "#fff", width: "100%", height: "100%" },
};
