import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ============================================================
// TRON ARES 2025 — THEME
// ============================================================
const T = {
  bg:        "#00040a",
  bgGrid:    "#020810",
  card:      "rgba(0,20,40,0.85)",
  border:    "#0af",
  borderDim: "#0369a1",
  cyan:      "#00d4ff",
  cyanGlow:  "rgba(0,212,255,0.18)",
  cyanDim:   "rgba(0,212,255,0.06)",
  orange:    "#ff6a00",
  orangeGlow:"rgba(255,106,0,0.2)",
  green:     "#00ff9f",
  purple:    "#bf5fff",
  white:     "#e0f7ff",
  muted:     "#3a7a99",
  text:      "#c8eeff",
};

// ============================================================
// CLAUDE API
// ============================================================
async function callClaude(messages, system = "", search = false) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system,
    messages,
    ...(search && { tools: [{ type: "web_search_20250305", name: "web_search" }] }),
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  return d.content.map(b => b.text || "").filter(Boolean).join("\n");
}

// ============================================================
// IN-MEMORY STORE
// ============================================================
let store = {
  foodLog: [],
  activityLog: [],
  profile: { name: "USER_01", age: 21, height: "5'11\"", weight: 70, goal: "FAT LOSS", targetCalories: 2000, targetProtein: 150, targetCarbs: 200, targetFat: 60 },
  weeklyWeight: [{ w: "W1", v: 72 }, { w: "W2", v: 71.5 }, { w: "W3", v: 71 }, { w: "W4", v: 70.5 }],
  influencers: [],
};

// ============================================================
// GLOBAL CSS — TRON ARES 2025
// ============================================================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');

*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

:root {
  --cyan: #00d4ff;
  --cyan-glow: rgba(0,212,255,0.25);
  --orange: #ff6a00;
  --bg: #00040a;
}

body {
  background: var(--bg);
  color: #c8eeff;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 500;
  overflow: hidden;
  height: 100vh;
}

/* GRID BACKGROUND */
.tron-bg {
  position: fixed; inset: 0; z-index: 0;
  background:
    linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: gridPulse 8s ease-in-out infinite;
}
@keyframes gridPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }

/* SCANLINE OVERLAY */
.scanline {
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px
  );
}

/* CORNER GLOW */
.corner-glow {
  position: fixed; pointer-events: none; z-index: 1;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
}
.corner-glow.tl { top:-120px; left:-120px; width:300px; height:300px; background:#00d4ff; }
.corner-glow.br { bottom:-120px; right:-120px; width:250px; height:250px; background:#ff6a00; }

.app {
  position: relative; z-index: 2;
  max-width: 430px; margin: 0 auto;
  height: 100vh; display: flex; flex-direction: column;
}

/* HEADER */
.hdr {
  padding: 14px 18px 10px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid rgba(0,212,255,0.15);
  position: relative;
}
.hdr::after {
  content:'';
  position:absolute; bottom:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, #00d4ff, transparent);
  animation: scanH 3s linear infinite;
}
@keyframes scanH { 0%{opacity:0.3} 50%{opacity:1} 100%{opacity:0.3} }

.logo {
  font-family: 'Share Tech Mono', monospace;
  font-size: 18px; letter-spacing: 4px;
  color: var(--cyan);
  text-shadow: 0 0 20px var(--cyan), 0 0 40px rgba(0,212,255,0.4);
  animation: logoFlicker 6s ease-in-out infinite;
}
@keyframes logoFlicker {
  0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.7} 94%{opacity:1} 97%{opacity:0.8} 98%{opacity:1}
}

.hdr-right { text-align:right; }
.hdr-date {
  font-family:'Share Tech Mono',monospace; font-size:10px;
  color: #3a7a99; letter-spacing:1px;
}
.hdr-status {
  font-size:10px; color: #00ff9f;
  font-family:'Share Tech Mono',monospace;
  animation: blink 2s step-end infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

/* PAGE */
.page {
  flex:1; overflow-y:auto; padding: 12px 14px 90px;
  scrollbar-width: thin; scrollbar-color: #00d4ff transparent;
}

/* CARD */
.card {
  background: rgba(0,16,32,0.9);
  border: 1px solid rgba(0,212,255,0.2);
  border-radius: 4px;
  padding: 14px;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}
.card::before {
  content:'';
  position:absolute; top:0;left:0;right:0; height:1px;
  background: linear-gradient(90deg, transparent 0%, #00d4ff 30%, #00d4ff 70%, transparent 100%);
  opacity: 0.6;
}
.card::after {
  content:'';
  position:absolute; inset:0;
  background: linear-gradient(135deg, rgba(0,212,255,0.03) 0%, transparent 60%);
  pointer-events:none;
}

/* CORNER BRACKETS */
.card-inner { position:relative; }
.card-corner {
  position:absolute; width:8px; height:8px;
  border-color: #00d4ff; border-style:solid; opacity:0.7;
}
.card-corner.tl { top:-2px;left:-2px; border-width:2px 0 0 2px; }
.card-corner.tr { top:-2px;right:-2px; border-width:2px 2px 0 0; }
.card-corner.bl { bottom:-2px;left:-2px; border-width:0 0 2px 2px; }
.card-corner.br { bottom:-2px;right:-2px; border-width:0 2px 2px 0; }

.sec-label {
  font-family:'Share Tech Mono',monospace;
  font-size:10px; color:#3a7a99;
  letter-spacing:3px; text-transform:uppercase;
  margin: 16px 0 8px;
  display:flex; align-items:center; gap:8px;
}
.sec-label::after {
  content:''; flex:1; height:1px;
  background: linear-gradient(90deg, rgba(0,212,255,0.3), transparent);
}

/* BIG NUMBER */
.big-n {
  font-family:'Share Tech Mono',monospace;
  font-size:42px; color: var(--cyan);
  text-shadow: 0 0 30px var(--cyan), 0 0 60px rgba(0,212,255,0.3);
  line-height:1;
}
.big-n-unit { font-size:14px; color:#3a7a99; font-family:'Share Tech Mono',monospace; margin-top:2px; }

/* PROGRESS */
.prog-wrap {
  background: rgba(0,212,255,0.06); height:3px; border-radius:0; margin-top:6px;
  position:relative; overflow:visible;
}
.prog-fill {
  height:100%; position:relative;
  transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
}
.prog-fill::after {
  content:''; position:absolute; right:0; top:-2px;
  width:6px; height:7px;
  background: var(--cyan);
  box-shadow: 0 0 10px var(--cyan), 0 0 20px var(--cyan);
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

/* MACRO PILLS */
.mpill-row { display:flex; gap:6px; margin-top:12px; }
.mpill {
  flex:1; background:rgba(0,212,255,0.04);
  border:1px solid rgba(0,212,255,0.12); border-radius:2px;
  padding:8px 6px; text-align:center;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}
.mpill-v { font-family:'Share Tech Mono',monospace; font-size:16px; font-weight:500; }
.mpill-l { font-size:10px; color:#3a7a99; letter-spacing:1px; margin-top:3px; font-family:'Share Tech Mono',monospace; }

/* INPUT */
.inp {
  width:100%; background:rgba(0,212,255,0.04);
  border:1px solid rgba(0,212,255,0.2); border-radius:2px;
  padding:10px 14px; color:#c8eeff;
  font-family:'Rajdhani',sans-serif; font-size:15px; font-weight:500;
  outline:none; transition:all 0.2s;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}
.inp:focus {
  border-color:#00d4ff;
  box-shadow: 0 0 20px rgba(0,212,255,0.15), inset 0 0 10px rgba(0,212,255,0.05);
}
.inp::placeholder { color:#1e4a66; }

/* BUTTONS */
.btn {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding:10px 20px; border:none; cursor:pointer;
  font-family:'Rajdhani',sans-serif; font-weight:700; font-size:14px;
  letter-spacing:2px; text-transform:uppercase; transition:all 0.2s;
  position:relative; overflow:hidden;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}
.btn::before {
  content:''; position:absolute; inset:0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
  opacity:0; transition:opacity 0.2s;
}
.btn:hover::before { opacity:1; }

.btn-cyan {
  background: linear-gradient(135deg, #005580, #0077aa);
  color:#00d4ff;
  border:1px solid #00d4ff;
  box-shadow: 0 0 20px rgba(0,212,255,0.2), inset 0 0 20px rgba(0,212,255,0.05);
}
.btn-cyan:hover {
  box-shadow: 0 0 40px rgba(0,212,255,0.4), inset 0 0 20px rgba(0,212,255,0.1);
  transform:translateY(-1px);
}
.btn-cyan:disabled { opacity:0.3; cursor:not-allowed; transform:none; box-shadow:none; }

.btn-orange {
  background: linear-gradient(135deg, #5c2600, #8a3a00);
  color:#ff6a00;
  border:1px solid #ff6a00;
  box-shadow: 0 0 20px rgba(255,106,0,0.2);
}
.btn-orange:hover { box-shadow: 0 0 40px rgba(255,106,0,0.4); }

.btn-ghost {
  background:transparent; color:#3a7a99;
  border:1px solid rgba(0,212,255,0.2);
}
.btn-ghost:hover { border-color:#00d4ff; color:#00d4ff; }

/* UPLOAD */
.upload-z {
  border:1px dashed rgba(0,212,255,0.25);
  background:rgba(0,212,255,0.02);
  padding:28px; text-align:center; cursor:pointer;
  transition:all 0.3s; border-radius:2px;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
}
.upload-z:hover, .upload-z.active {
  border-color:#00d4ff;
  background:rgba(0,212,255,0.06);
  box-shadow: 0 0 30px rgba(0,212,255,0.1);
}

/* AI RESULT BOX */
.ai-box {
  background:rgba(0,212,255,0.04);
  border:1px solid rgba(0,212,255,0.25); border-radius:2px;
  padding:14px; margin-top:10px;
  border-left:2px solid #00d4ff;
  font-size:13px; line-height:1.7;
  white-space:pre-wrap;
  box-shadow: -4px 0 20px rgba(0,212,255,0.1);
}

/* LIST ITEMS */
.list-item {
  display:flex; align-items:center; justify-content:space-between;
  padding:9px 0; border-bottom:1px solid rgba(0,212,255,0.08);
}
.list-item:last-child { border-bottom:none; }
.item-name { font-size:14px; font-weight:600; letter-spacing:0.5px; }
.item-sub {
  font-size:11px; color:#3a7a99; margin-top:2px;
  font-family:'Share Tech Mono',monospace;
}
.item-val {
  font-family:'Share Tech Mono',monospace; font-size:14px;
  color:#00d4ff;
  text-shadow: 0 0 10px rgba(0,212,255,0.5);
}

/* ACTIVITY ITEM */
.act-item { display:flex; gap:10px; align-items:center; padding:9px 0; border-bottom:1px solid rgba(0,212,255,0.08); }
.act-item:last-child { border-bottom:none; }
.act-icon {
  width:38px; height:38px; border-radius:2px;
  display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;
  border:1px solid rgba(0,212,255,0.2);
  background:rgba(0,212,255,0.06);
}

/* SPINNING */
.spin { display:inline-block; animation:spin360 0.8s linear infinite; }
@keyframes spin360 { to{transform:rotate(360deg)} }

/* BOTTOM NAV */
.nav {
  position:fixed; bottom:0; left:50%; transform:translateX(-50%);
  width:430px; max-width:100vw;
  background:rgba(0,4,10,0.97);
  border-top:1px solid rgba(0,212,255,0.2);
  display:flex; padding:6px 0 20px; z-index:100;
  backdrop-filter:blur(20px);
}
.nav::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,#00d4ff 30%,#00d4ff 70%,transparent);
  opacity:0.5;
}
.nav-btn {
  flex:1; display:flex; flex-direction:column;
  align-items:center; gap:3px; padding:8px 4px;
  cursor:pointer; border:none; background:none; transition:all 0.2s;
}
.nav-ico { font-size:20px; transition:all 0.2s; }
.nav-lbl {
  font-size:9px; font-weight:700; color:#3a7a99;
  letter-spacing:1.5px; text-transform:uppercase;
  font-family:'Share Tech Mono',monospace;
  transition:all 0.2s;
}
.nav-btn.on .nav-lbl { color:#00d4ff; text-shadow: 0 0 10px rgba(0,212,255,0.8); }
.nav-btn.on .nav-ico { filter:drop-shadow(0 0 8px #00d4ff) drop-shadow(0 0 16px #00d4ff); }
.nav-btn:hover .nav-lbl { color:#00d4ff; }

/* INFLUENCER CARD */
.inf-card {
  background:rgba(0,10,20,0.9); border:1px solid rgba(0,212,255,0.2);
  border-radius:2px; padding:14px; margin-bottom:10px;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
  position:relative;
}
.inf-card::before { content:''; position:absolute; top:0;left:0;right:0; height:1px; background:linear-gradient(90deg,#00d4ff,transparent); }
.inf-name { font-size:18px; font-weight:700; letter-spacing:2px; color:#e0f7ff; }
.inf-handle { font-family:'Share Tech Mono',monospace; font-size:11px; color:#00d4ff; margin: 3px 0 10px; }

/* PROFILE FIELD */
.pf-field { margin-bottom:12px; }
.pf-label { font-family:'Share Tech Mono',monospace; font-size:10px; color:#3a7a99; letter-spacing:2px; text-transform:uppercase; margin-bottom:4px; }

/* TAG */
.tag {
  display:inline-block; padding:2px 10px; border-radius:1px;
  font-size:11px; font-weight:700; letter-spacing:1px;
  font-family:'Share Tech Mono',monospace;
}
.tag-c { background:rgba(0,212,255,0.1); color:#00d4ff; border:1px solid rgba(0,212,255,0.3); }
.tag-g { background:rgba(0,255,159,0.1); color:#00ff9f; border:1px solid rgba(0,255,159,0.3); }
.tag-o { background:rgba(255,106,0,0.1); color:#ff6a00; border:1px solid rgba(255,106,0,0.3); }

/* DIVIDER */
.divider {
  display:flex; align-items:center; gap:8px;
  margin:10px 0; font-family:'Share Tech Mono',monospace;
  font-size:10px; color:#1e4a66; letter-spacing:2px;
}
.divider::before, .divider::after { content:''; flex:1; height:1px; background:rgba(0,212,255,0.1); }

/* TOOLTIP CUSTOM */
.recharts-tooltip-wrapper .recharts-default-tooltip {
  background:rgba(0,16,32,0.95) !important; border:1px solid rgba(0,212,255,0.3) !important;
  border-radius:2px !important; font-family:'Share Tech Mono',monospace !important;
  font-size:11px !important;
}

/* EMPTY STATE */
.empty-state {
  text-align:center; padding:50px 20px; color:#1e4a66;
}
.empty-ico { font-size:40px; margin-bottom:12px; opacity:0.5; }
.empty-txt { font-family:'Share Tech Mono',monospace; font-size:12px; letter-spacing:1px; line-height:1.8; }
`;

// ============================================================
// CORNER DECO
// ============================================================
function Corners() {
  return (
    <>
      <div className="card-corner tl" />
      <div className="card-corner tr" />
      <div className="card-corner bl" />
      <div className="card-corner br" />
    </>
  );
}

// ============================================================
// NUTRITION PAGE
// ============================================================
function NutritionPage() {
  const [img, setImg] = useState(null);
  const [imgData, setImgData] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const today = store.foodLog.filter(f => f.date === new Date().toDateString());
  const totCal = today.reduce((s, f) => s + (f.calories || 0), 0);
  const totP = today.reduce((s, f) => s + (f.protein || 0), 0);
  const totC = today.reduce((s, f) => s + (f.carbs || 0), 0);
  const totF = today.reduce((s, f) => s + (f.fat || 0), 0);
  const { targetCalories: tCal, targetProtein: tP, targetCarbs: tC, targetFat: tF } = store.profile;

  const onFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => { setImg(e.target.result); setImgData(e.target.result.split(",")[1]); };
    r.readAsDataURL(file);
  };

  const analyze = async () => {
    setLoading(true); setResult(null);
    try {
      let msgs;
      if (imgData) {
        msgs = [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imgData } },
          { type: "text", text: "Identify this Pakistani/desi food and provide calories and macros. Return ONLY JSON (no markdown): {\"name\":\"\",\"calories\":0,\"protein\":0,\"carbs\":0,\"fat\":0,\"serving\":\"\",\"notes\":\"\"}" }
        ]}];
      } else {
        msgs = [{ role: "user", content: `Search nutritional data for Pakistani desi food: "${query}". Home-cooked style. Return ONLY JSON: {"name":"","calories":0,"protein":0,"carbs":0,"fat":0,"serving":"","notes":""}` }];
      }
      const raw = await callClaude(msgs, "Pakistani food nutrition expert. Return ONLY valid JSON, no extra text.", true);
      try {
        const clean = raw.replace(/```json|```/g, "").trim();
        const m = clean.match(/\{[\s\S]*\}/);
        setResult(JSON.parse(m ? m[0] : clean));
      } catch { setResult({ name: query || "Food", calories: 0, protein: 0, carbs: 0, fat: 0, notes: raw }); }
    } catch { setResult({ name: "ERROR", calories: 0, notes: "Connection failed." }); }
    setLoading(false);
  };

  const logFood = () => {
    store.foodLog.push({ ...result, date: new Date().toDateString(), time: new Date().toLocaleTimeString() });
    setResult(null); setImg(null); setImgData(null); setQuery("");
    alert("LOGGED TO SYSTEM");
  };

  const bars = [
    { l: "PROT", v: totP, t: tP, c: T.cyan },
    { l: "CARB", v: totC, t: tC, c: T.green },
    { l: "FAT",  v: totF, t: tF, c: T.orange },
  ];

  return (
    <div>
      {/* DAILY STATS */}
      <div className="card">
        <div className="card-inner">
          <Corners />
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:T.muted, letterSpacing:3, marginBottom:8 }}>ENERGY INTAKE // TODAY</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
            <div className="big-n">{totCal}</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:13, color:T.muted, marginBottom:8 }}>/ {tCal} KCAL</div>
          </div>
          <div className="prog-wrap">
            <div className="prog-fill" style={{ width:`${Math.min((totCal/tCal)*100,100)}%`, background:`linear-gradient(90deg,#005580,${T.cyan})` }} />
          </div>
          <div className="mpill-row">
            {bars.map(b => (
              <div key={b.l} className="mpill">
                <div className="mpill-v" style={{ color:b.c, textShadow:`0 0 10px ${b.c}` }}>{b.v}g</div>
                <div className="mpill-l">{b.l}</div>
                <div className="prog-wrap" style={{ marginTop:4 }}>
                  <div className="prog-fill" style={{ width:`${Math.min((b.v/b.t)*100,100)}%`, background:b.c }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sec-label">// SCAN FOOD UNIT</div>

      {/* UPLOAD */}
      <div className="card">
        <div
          className={`upload-z${img ? " active" : ""}`}
          onClick={() => fileRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
        >
          {img
            ? <img src={img} style={{ width:"100%", borderRadius:2, maxHeight:180, objectFit:"cover" }} alt="food" />
            : <>
                <div style={{ fontSize:32, marginBottom:8 }}>◈</div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:T.muted, letterSpacing:1, lineHeight:1.7 }}>
                  TAP TO UPLOAD FOOD IMAGE<br/>
                  <span style={{ color:T.cyan }}>DESI / PAKISTANI DISHE
