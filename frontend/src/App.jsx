import { useState, useRef } from "react";
import axios from "axios";

/* ── INJECT FONTS + GLOBAL CSS ─────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #04050d;
    --s1:       #080b18;
    --s2:       #0c1020;
    --s3:       #101528;
    --border:   #161c30;
    --border2:  #1e2640;
    --blue:     #3d7eff;
    --blue2:    #6fa3ff;
    --cyan:     #00ddb0;
    --orange:   #ff7043;
    --yellow:   #ffc53d;
    --purple:   #a78bfa;
    --red:      #ff4d6d;
    --text:     #b8bdd8;
    --muted:    #454968;
    --bright:   #ffffff;
    --glow:     rgba(61,126,255,0.15);
  }

  body {
    background: var(--bg);
    font-family: 'Outfit', sans-serif;
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* animated background mesh */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 20% -10%, rgba(61,126,255,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 110%, rgba(0,221,176,0.05) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  /* grid lines */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 52px 52px;
    opacity: 0.5;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes spin       { to { transform: rotate(360deg); } }
  @keyframes fadeUp     { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn     { from { opacity:0; } to { opacity:1; } }
  @keyframes shimmer    { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes scanline   { from{top:-2px} to{top:100%} }
  @keyframes pulseGlow  { 0%,100%{box-shadow:0 0 8px 2px rgba(0,221,176,0.4)} 50%{box-shadow:0 0 16px 4px rgba(0,221,176,0.7)} }
  @keyframes barGrow    { from{width:0} to{width:var(--w)} }
  @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes borderPulse{ 0%,100%{border-color:rgba(61,126,255,0.3)} 50%{border-color:rgba(61,126,255,0.7)} }

  .animate-fadeup   { animation: fadeUp .5s ease both; }
  .animate-fadeup-2 { animation: fadeUp .5s .08s ease both; }
  .animate-fadeup-3 { animation: fadeUp .5s .16s ease both; }
  .animate-fadeup-4 { animation: fadeUp .5s .24s ease both; }
  .animate-fadein   { animation: fadeIn .4s ease both; }

  /* scrollbar */
  ::-webkit-scrollbar       { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--s1); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  /* card hover */
  .hov-card {
    transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
  }
  .hov-card:hover {
    transform: translateY(-2px);
    border-color: rgba(61,126,255,0.35) !important;
    box-shadow: 0 8px 32px rgba(61,126,255,0.08);
  }
`;
const styleEl = document.createElement("style");
styleEl.textContent = css;
document.head.appendChild(styleEl);

/* ── CONSTANTS ─────────────────────────────────────────────────────────── */
const API = "http://localhost:8000/api/v1";

const MODES = [
  { id:"summary",  icon:"✦", label:"Summarize",        sub:"Abstractive summary",    color:"#3d7eff", glow:"rgba(61,126,255,0.15)"  },
  { id:"entities", icon:"◈", label:"Extract Entities", sub:"Names · Dates · Orgs",   color:"#00ddb0", glow:"rgba(0,221,176,0.15)"   },
  { id:"classify", icon:"▣", label:"Classify Doc",     sub:"Detect document type",   color:"#a78bfa", glow:"rgba(167,139,250,0.15)" },
  { id:"keyvalue", icon:"⊞", label:"Key-Value Fields", sub:"Structured extraction",  color:"#ffc53d", glow:"rgba(255,197,61,0.15)"  },
  { id:"qa",       icon:"◎", label:"Ask Questions",    sub:"RAG-powered Q&A",        color:"#ff7043", glow:"rgba(255,112,67,0.15)"  },
];

const ENTITY_COLORS = {
  PERSON:"#00ddb0", ORG:"#3d7eff", DATE:"#ffc53d", MONEY:"#00ddb0",
  GPE:"#a78bfa", LOCATION:"#a78bfa", PRODUCT:"#ff7043",
  CARDINAL:"#6fa3ff", EVENT:"#ff7043", OTHER:"#454968",
};

/* ── MAIN APP ───────────────────────────────────────────────────────────── */
export default function App() {
  const [file,     setFile]     = useState(null);
  const [mode,     setMode]     = useState("summary");
  const [question, setQuestion] = useState("");
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();
  const timerRef = useRef();

  const handleFile = (f) => { setFile(f); setResult(null); setError(null); };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file || loading) return;
    setLoading(true); setError(null); setResult(null); setProgress(0);
    // fake progress
    timerRef.current = setInterval(() => setProgress(p => Math.min(p + Math.random() * 12, 88)), 400);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mode", mode);
      if (mode === "qa" && question) form.append("question", question);
      const res = await axios.post(`${API}/parse`, form);
      setProgress(100);
      setTimeout(() => { setResult(res.data); setLoading(false); }, 300);
    } catch (err) {
      setError(err.response?.data?.detail || "Backend not reachable. Make sure python main.py is running.");
      setLoading(false);
    } finally {
      clearInterval(timerRef.current);
    }
  };

  const activeMode = MODES.find(m => m.id === mode);

  return (
    <div style={{ position:"relative", zIndex:1, minHeight:"100vh" }}>

      {/* ── NAV ── */}
      <nav style={{
        position:"sticky", top:0, zIndex:100,
        background:"rgba(4,5,13,0.85)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid var(--border)",
        padding:"0 40px", height:60,
        display:"flex", alignItems:"center", gap:14,
      }}>
        {/* logo mark */}
        <div style={{
          width:32, height:32, borderRadius:9,
          background:"linear-gradient(135deg,#3d7eff,#00ddb0)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, color:"#fff", fontWeight:800, flexShrink:0,
        }}>⬡</div>

        <div>
          <div style={{ fontWeight:700, fontSize:15, color:"var(--bright)", letterSpacing:"-0.3px" }}>
            Smart Document Parser
          </div>
          <div style={{ fontSize:10, color:"var(--muted)", fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.06em" }}>
            FINAL YEAR CSE PROJECT · AI/NLP PIPELINE
          </div>
        </div>

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:20 }}>
          {["Summary","Entities","Classify","KV","Q&A"].map((l,i) => (
            <span key={i} style={{ fontSize:11, color:"var(--muted)", fontFamily:"'JetBrains Mono',monospace", display:"none" }}>{l}</span>
          ))}
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{
              width:7, height:7, borderRadius:"50%", background:"#00ddb0",
              animation:"pulseGlow 2s infinite",
            }}/>
            <span style={{ fontSize:11, color:"#00ddb0", fontFamily:"'JetBrains Mono',monospace" }}>LIVE</span>
          </div>
          <div style={{
            background:"var(--s2)", border:"1px solid var(--border2)",
            borderRadius:8, padding:"5px 12px",
            fontSize:11, color:"var(--muted)", fontFamily:"'JetBrains Mono',monospace",
          }}>
            localhost:8000
          </div>
        </div>
      </nav>

      {/* ── HERO STRIP ── */}
      <div style={{
        padding:"36px 40px 28px",
        borderBottom:"1px solid var(--border)",
        background:"linear-gradient(180deg, rgba(61,126,255,0.04) 0%, transparent 100%)",
      }} className="animate-fadeup">
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:"rgba(61,126,255,0.08)", border:"1px solid rgba(61,126,255,0.2)",
            borderRadius:999, padding:"5px 14px", marginBottom:16,
            fontSize:11, color:"#6fa3ff", fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.08em",
          }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#3d7eff", display:"inline-block", animation:"shimmer 1.8s infinite" }}/>
            NLP · TRANSFORMERS · OCR · RAG · FASTAPI
          </div>
          <h1 style={{
            fontFamily:"'Outfit',sans-serif", fontSize:"clamp(28px,4vw,48px)",
            fontWeight:800, color:"var(--bright)", letterSpacing:"-1px", lineHeight:1.1,
            marginBottom:10,
          }}>
            Parse any document with{" "}
            <span style={{
              background:"linear-gradient(90deg,#3d7eff,#00ddb0)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>AI intelligence</span>
          </h1>
          <p style={{ fontSize:14, color:"var(--muted)", maxWidth:560, lineHeight:1.7 }}>
            Upload PDFs, DOCX, images or text. Instantly summarize, extract entities, classify, get structured fields, or ask questions — powered by BART, spaCy &amp; LangChain.
          </p>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{
        maxWidth:1100, margin:"0 auto",
        padding:"32px 40px 80px",
        display:"grid", gridTemplateColumns:"360px 1fr",
        gap:24, alignItems:"start",
      }}>

        {/* ══ LEFT PANEL ══ */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* UPLOAD CARD */}
          <div className="animate-fadeup" style={{
            background:"var(--s1)", border:"1px solid var(--border)",
            borderRadius:18, overflow:"hidden",
          }}>
            <div style={{
              padding:"16px 20px", borderBottom:"1px solid var(--border)",
              display:"flex", alignItems:"center", gap:10,
            }}>
              <div style={{
                width:26, height:26, borderRadius:7,
                background:"rgba(61,126,255,0.12)", border:"1px solid rgba(61,126,255,0.2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, color:"#3d7eff",
              }}>01</div>
              <span style={{ fontSize:12, fontWeight:600, color:"var(--bright)", letterSpacing:"0.02em" }}>Upload Document</span>
              <span style={{
                marginLeft:"auto", fontSize:10, color:"var(--muted)",
                fontFamily:"'JetBrains Mono',monospace",
              }}>PDF · DOCX · TXT · IMG</span>
            </div>

            {/* dropzone */}
            <div
              style={{
                margin:16, borderRadius:12, padding: file ? "20px" : "36px 20px",
                border:`2px dashed ${dragging ? "#3d7eff" : "var(--border2)"}`,
                background: dragging ? "rgba(61,126,255,0.05)" : "var(--s2)",
                cursor:"pointer", textAlign:"center", transition:"all .2s",
                position:"relative", overflow:"hidden",
              }}
              onClick={() => inputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {dragging && (
                <div style={{
                  position:"absolute", left:0, right:0, height:2,
                  background:"linear-gradient(90deg,transparent,#3d7eff,transparent)",
                  animation:"scanline 1.5s linear infinite", top:0,
                }}/>
              )}
              <input ref={inputRef} type="file"
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                style={{ display:"none" }}
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="animate-fadein">
                  {/* file type badge */}
                  <div style={{
                    display:"inline-flex", alignItems:"center", gap:8,
                    background:"rgba(61,126,255,0.1)", border:"1px solid rgba(61,126,255,0.25)",
                    borderRadius:10, padding:"10px 16px", marginBottom:12,
                  }}>
                    <span style={{ fontSize:22 }}>
                      {file.name.endsWith(".pdf") ? "📄" : file.name.endsWith(".docx") ? "📝" : file.name.match(/\.(png|jpg|jpeg)$/) ? "🖼️" : "📃"}
                    </span>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--bright)", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"'JetBrains Mono',monospace" }}>
                        {(file.size/1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      style={{
                        background:"transparent", border:"1px solid var(--border2)",
                        color:"var(--muted)", borderRadius:7, padding:"5px 14px",
                        fontSize:11, cursor:"pointer", fontFamily:"inherit",
                        transition:"all .15s",
                      }}
                      onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                      onMouseEnter={e => e.target.style.borderColor="#ff4d6d"}
                      onMouseLeave={e => e.target.style.borderColor="var(--border2)"}
                    >✕ Remove file</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize:36, marginBottom:10, animation:"float 3s ease infinite" }}>⬆</div>
                  <div style={{ fontSize:14, color:"var(--text)", marginBottom:6, fontWeight:500 }}>
                    Drop file here or <span style={{ color:"#3d7eff", fontWeight:600 }}>browse</span>
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"'JetBrains Mono',monospace" }}>
                    Max 10MB · Any document format
                  </div>
                </>
              )}
            </div>
          </div>

          {/* MODE SELECTOR CARD */}
          <div className="animate-fadeup-2" style={{
            background:"var(--s1)", border:"1px solid var(--border)",
            borderRadius:18, overflow:"hidden",
          }}>
            <div style={{
              padding:"16px 20px", borderBottom:"1px solid var(--border)",
              display:"flex", alignItems:"center", gap:10,
            }}>
              <div style={{
                width:26, height:26, borderRadius:7,
                background:"rgba(0,221,176,0.1)", border:"1px solid rgba(0,221,176,0.2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, color:"#00ddb0",
              }}>02</div>
              <span style={{ fontSize:12, fontWeight:600, color:"var(--bright)" }}>Select Parse Mode</span>
            </div>
            <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:8 }}>
              {MODES.map(m => (
                <button key={m.id}
                  onClick={() => { setMode(m.id); setResult(null); }}
                  style={{
                    display:"flex", alignItems:"center", gap:14,
                    padding:"12px 16px", borderRadius:11, cursor:"pointer",
                    border:`1px solid ${mode===m.id ? m.color+"50" : "var(--border)"}`,
                    background: mode===m.id ? m.glow : "var(--s2)",
                    textAlign:"left", fontFamily:"inherit",
                    transition:"all .18s",
                    position:"relative", overflow:"hidden",
                  }}
                  onMouseEnter={e => { if(mode!==m.id) e.currentTarget.style.borderColor = m.color+"30"; }}
                  onMouseLeave={e => { if(mode!==m.id) e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  {mode===m.id && (
                    <div style={{
                      position:"absolute", left:0, top:0, bottom:0, width:3,
                      background:m.color, borderRadius:"3px 0 0 3px",
                    }}/>
                  )}
                  <div style={{
                    width:34, height:34, borderRadius:9, flexShrink:0,
                    background: mode===m.id ? m.color+"20" : "var(--s3)",
                    border:`1px solid ${mode===m.id ? m.color+"40" : "var(--border)"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:16, color: mode===m.id ? m.color : "var(--muted)",
                    transition:"all .18s",
                  }}>{m.icon}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color: mode===m.id ? "var(--bright)" : "var(--text)" }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"'JetBrains Mono',monospace", marginTop:1 }}>
                      {m.sub}
                    </div>
                  </div>
                  {mode===m.id && (
                    <div style={{
                      marginLeft:"auto", width:7, height:7, borderRadius:"50%",
                      background:m.color, boxShadow:`0 0 8px ${m.color}`,
                    }}/>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* QUESTION INPUT */}
          {mode === "qa" && (
            <div className="animate-fadein" style={{
              background:"var(--s1)", border:"1px solid rgba(255,112,67,0.2)",
              borderRadius:18, overflow:"hidden",
            }}>
              <div style={{
                padding:"14px 20px", borderBottom:"1px solid rgba(255,112,67,0.15)",
                display:"flex", alignItems:"center", gap:10,
              }}>
                <div style={{
                  width:26, height:26, borderRadius:7,
                  background:"rgba(255,112,67,0.1)", border:"1px solid rgba(255,112,67,0.25)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, color:"#ff7043",
                }}>03</div>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--bright)" }}>Your Question</span>
              </div>
              <div style={{ padding:16 }}>
                <textarea
                  style={{
                    width:"100%", background:"var(--s2)", border:"1px solid var(--border2)",
                    borderRadius:10, padding:"12px 14px", color:"var(--text)",
                    fontFamily:"'Outfit',sans-serif", fontSize:13, resize:"vertical",
                    minHeight:90, outline:"none", lineHeight:1.65,
                    transition:"border-color .2s",
                  }}
                  placeholder="e.g. What is the total amount? Who signed this?"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onFocus={e => e.target.style.borderColor="#ff7043"}
                  onBlur={e => e.target.style.borderColor="var(--border2)"}
                />
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="animate-fadeup-3">
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              style={{
                width:"100%", padding:"15px", borderRadius:12, border:"none",
                background: !file || loading
                  ? "var(--s2)"
                  : `linear-gradient(135deg, ${activeMode.color}, ${activeMode.color}cc)`,
                color: !file || loading ? "var(--muted)" : "#fff",
                fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15,
                cursor: !file || loading ? "not-allowed" : "pointer",
                transition:"all .2s", letterSpacing:"0.2px",
                boxShadow: file && !loading ? `0 4px 24px ${activeMode.color}30` : "none",
                position:"relative", overflow:"hidden",
              }}
            >
              {loading ? (
                <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                  <span style={{
                    width:16, height:16, border:"2px solid rgba(255,255,255,0.3)",
                    borderTop:"2px solid white", borderRadius:"50%",
                    animation:"spin .7s linear infinite", display:"inline-block",
                  }}/>
                  Analyzing document...
                </span>
              ) : (
                <span>⚡ Parse Document</span>
              )}
            </button>

            {/* progress bar */}
            {loading && (
              <div style={{
                marginTop:10, height:3, background:"var(--border)",
                borderRadius:2, overflow:"hidden",
              }}>
                <div style={{
                  height:"100%", borderRadius:2,
                  width:`${progress}%`,
                  background:`linear-gradient(90deg, ${activeMode.color}, #00ddb0)`,
                  transition:"width .4s ease",
                }}/>
              </div>
            )}
          </div>

        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div style={{ minHeight:500 }}>

          {/* empty state */}
          {!result && !loading && !error && (
            <div className="animate-fadein" style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", height:500, gap:20, textAlign:"center",
              background:"var(--s1)", border:"1px solid var(--border)",
              borderRadius:20, padding:40,
            }}>
              <div style={{
                width:80, height:80, borderRadius:20,
                background:"var(--s2)", border:"1px solid var(--border2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:36, opacity:0.4, animation:"float 3s ease infinite",
              }}>🧠</div>
              <div>
                <div style={{ fontSize:16, fontWeight:600, color:"var(--text)", marginBottom:8 }}>
                  Ready to parse
                </div>
                <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.7, maxWidth:300 }}>
                  Upload a document and select a parse mode.<br/>
                  Results will appear here with full detail.
                </div>
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
                {MODES.map(m => (
                  <div key={m.id} style={{
                    fontSize:11, padding:"5px 12px", borderRadius:999,
                    background:m.glow, border:`1px solid ${m.color}30`,
                    color:m.color, fontFamily:"'JetBrains Mono',monospace",
                  }}>{m.label}</div>
                ))}
              </div>
            </div>
          )}

          {/* loading skeleton */}
          {loading && (
            <div className="animate-fadein" style={{
              background:"var(--s1)", border:"1px solid var(--border)",
              borderRadius:20, padding:32,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
                <div style={{
                  width:40, height:40, borderRadius:10,
                  background:`${activeMode.color}15`,
                  border:`1px solid ${activeMode.color}30`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:18, color:activeMode.color,
                }}>{activeMode.icon}</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:"var(--bright)" }}>{activeMode.label}</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>Processing with AI pipeline...</div>
                </div>
              </div>
              {[100,80,90,60,75].map((w,i) => (
                <div key={i} style={{
                  height:12, borderRadius:6, marginBottom:12,
                  background:"var(--s3)", width:`${w}%`,
                  animation:`shimmer ${1+i*0.15}s infinite`,
                }}/>
              ))}
            </div>
          )}

          {/* error */}
          {error && (
            <div className="animate-fadein" style={{
              background:"rgba(255,77,109,0.05)", border:"1px solid rgba(255,77,109,0.25)",
              borderRadius:16, padding:"20px 24px",
              display:"flex", gap:14, alignItems:"flex-start",
            }}>
              <span style={{ fontSize:20 }}>⚠️</span>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:"#ff4d6d", marginBottom:6 }}>Parse Error</div>
                <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>{error}</div>
              </div>
            </div>
          )}

          {/* results */}
          {result && <Results result={result} mode={mode} activeMode={activeMode} />}
        </div>
      </div>
    </div>
  );
}

/* ── RESULTS RENDERER ───────────────────────────────────────────────────── */
function Results({ result, mode, activeMode }) {
  return (
    <div className="animate-fadein" style={{
      background:"var(--s1)", border:`1px solid ${activeMode.color}25`,
      borderRadius:20, overflow:"hidden",
      boxShadow:`0 0 40px ${activeMode.color}08`,
    }}>
      {/* result header */}
      <div style={{
        padding:"18px 24px",
        borderBottom:`1px solid ${activeMode.color}20`,
        background:`linear-gradient(90deg, ${activeMode.color}08, transparent)`,
        display:"flex", alignItems:"center", gap:14,
      }}>
        <div style={{
          width:38, height:38, borderRadius:10,
          background:`${activeMode.color}15`, border:`1px solid ${activeMode.color}30`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, color:activeMode.color,
        }}>{activeMode.icon}</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"var(--bright)" }}>{activeMode.label} Results</div>
          <div style={{
            fontSize:11, color:activeMode.color, fontFamily:"'JetBrains Mono',monospace",
            marginTop:2, opacity:0.8,
          }}>{result.filename}</div>
        </div>
        <div style={{
          marginLeft:"auto", fontSize:10, padding:"4px 10px",
          background:`${activeMode.color}15`, border:`1px solid ${activeMode.color}30`,
          borderRadius:6, color:activeMode.color, fontFamily:"'JetBrains Mono',monospace",
        }}>SUCCESS ✓</div>
      </div>

      <div style={{ padding:24 }}>
        {mode === "summary"  && <SummaryResult  result={result} />}
        {mode === "entities" && <EntitiesResult result={result} />}
        {mode === "classify" && <ClassifyResult result={result} />}
        {mode === "keyvalue" && <KeyValueResult result={result} />}
        {mode === "qa"       && <QAResult       result={result} />}
      </div>
    </div>
  );
}

/* ── SUMMARY ────────────────────────────────────────────────────────────── */
function SummaryResult({ result }) {
  return (
    <div>
      <div style={{
        background:"var(--s2)", border:"1px solid var(--border2)",
        borderLeft:`3px solid #3d7eff`, borderRadius:"0 12px 12px 0",
        padding:"20px 24px",
      }}>
        <p style={{ fontSize:15, lineHeight:1.85, color:"var(--text)", fontWeight:400 }}>
          {result.summary}
        </p>
      </div>
      <div style={{ marginTop:16, display:"flex", gap:10, flexWrap:"wrap" }}>
        <Chip label={`~${result.summary?.split(" ").length} words`} color="#3d7eff" />
        <Chip label="Abstractive Summary" color="#3d7eff" />
        <Chip label="BART Model" color="#3d7eff" />
      </div>
    </div>
  );
}

/* ── ENTITIES ───────────────────────────────────────────────────────────── */
function EntitiesResult({ result }) {
  const entities = result.entities || [];
  const groups = entities.reduce((acc, e) => {
    (acc[e.type] = acc[e.type] || []).push(e.value);
    return acc;
  }, {});

  return (
    <div>
      <div style={{
        display:"flex", alignItems:"center", gap:10, marginBottom:20,
        paddingBottom:16, borderBottom:"1px solid var(--border)",
      }}>
        <div style={{ fontSize:24, fontWeight:800, color:"var(--bright)" }}>{entities.length}</div>
        <div style={{ fontSize:13, color:"var(--muted)" }}>entities extracted across {Object.keys(groups).length} types</div>
      </div>
      {Object.entries(groups).map(([type, values]) => (
        <div key={type} style={{ marginBottom:16 }}>
          <div style={{
            fontSize:10, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.12em",
            color: ENTITY_COLORS[type] || "#454968",
            textTransform:"uppercase", marginBottom:8,
            display:"flex", alignItems:"center", gap:8,
          }}>
            <div style={{
              width:6, height:6, borderRadius:"50%",
              background: ENTITY_COLORS[type] || "#454968",
            }}/>
            {type}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {values.map((v,i) => (
              <div key={i} className="hov-card" style={{
                background:"var(--s2)", border:`1px solid ${(ENTITY_COLORS[type]||"#454968")}25`,
                borderRadius:9, padding:"8px 14px",
                fontSize:13, color:"var(--bright)", fontWeight:500,
              }}>{v}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── CLASSIFY ───────────────────────────────────────────────────────────── */
function ClassifyResult({ result }) {
  const cls = result.classification || {};
  const scores = cls.all_scores || {};
  const max = Math.max(...Object.values(scores), 0.01);

  return (
    <div>
      <div style={{ marginBottom:24, textAlign:"center" }}>
        <div style={{
          display:"inline-flex", flexDirection:"column", alignItems:"center", gap:6,
          background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.2)",
          borderRadius:16, padding:"20px 32px",
        }}>
          <div style={{ fontSize:32, fontWeight:800, color:"#a78bfa", letterSpacing:"-1px" }}>
            {cls.category}
          </div>
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            fontSize:13, color:"#00ddb0", fontFamily:"'JetBrains Mono',monospace",
          }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#00ddb0" }}/>
            {((cls.confidence||0)*100).toFixed(1)}% confidence
          </div>
        </div>
      </div>

      {cls.reasoning && (
        <div style={{
          background:"var(--s2)", border:"1px solid var(--border2)",
          borderRadius:10, padding:"12px 16px", marginBottom:20,
          fontSize:13, color:"var(--muted)", lineHeight:1.6,
        }}>
          💡 {cls.reasoning}
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {Object.entries(scores).map(([cat, score]) => (
          <div key={cat} style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:130, fontSize:12, color:"var(--muted)", flexShrink:0 }}>{cat}</div>
            <div style={{
              flex:1, height:7, background:"var(--s3)", borderRadius:4, overflow:"hidden",
            }}>
              <div style={{
                height:"100%", borderRadius:4,
                width:`${(score/max)*100}%`,
                background: cat === cls.category
                  ? "linear-gradient(90deg,#a78bfa,#3d7eff)"
                  : "var(--border2)",
                transition:"width .8s cubic-bezier(.16,1,.3,1)",
              }}/>
            </div>
            <div style={{
              width:42, textAlign:"right", fontSize:12,
              color: cat === cls.category ? "#a78bfa" : "var(--muted)",
              fontFamily:"'JetBrains Mono',monospace",
            }}>{((score||0)*100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── KEY VALUE ──────────────────────────────────────────────────────────── */
function KeyValueResult({ result }) {
  const kvs = result.key_values || [];
  return (
    <div>
      <div style={{
        display:"flex", alignItems:"center", gap:10, marginBottom:20,
        paddingBottom:16, borderBottom:"1px solid var(--border)",
      }}>
        <div style={{ fontSize:24, fontWeight:800, color:"var(--bright)" }}>{kvs.length}</div>
        <div style={{ fontSize:13, color:"var(--muted)" }}>structured fields extracted</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
        {kvs.map((kv, i) => (
          <div key={i} className="hov-card" style={{
            display:"grid", gridTemplateColumns:"160px 1fr",
            padding:"11px 14px", borderRadius:10,
            border:"1px solid transparent",
            background: i%2===0 ? "var(--s2)" : "var(--s3)",
            transition:"all .15s",
          }}>
            <div style={{
              fontSize:11, color:"#ffc53d", fontFamily:"'JetBrains Mono',monospace",
              textTransform:"uppercase", letterSpacing:"0.06em",
              display:"flex", alignItems:"center", gap:6,
            }}>
              <span style={{ opacity:0.5 }}>⊞</span> {kv.key}
            </div>
            <div style={{ fontSize:13, color:"var(--bright)", fontWeight:500 }}>{kv.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Q&A ────────────────────────────────────────────────────────────────── */
function QAResult({ result }) {
  return (
    <div>
      <div style={{
        background:"rgba(255,112,67,0.05)", border:"1px solid rgba(255,112,67,0.2)",
        borderRadius:12, padding:"16px 20px", marginBottom:20,
        fontSize:13, color:"#ff7043", fontFamily:"'JetBrains Mono',monospace",
      }}>
        ◎ RAG-powered answer from document context
      </div>
      <div style={{
        background:"var(--s2)", border:"1px solid var(--border2)",
        borderLeft:"3px solid #ff7043", borderRadius:"0 12px 12px 0",
        padding:"20px 24px",
      }}>
        <p style={{ fontSize:14, lineHeight:1.85, color:"var(--text)" }}>
          {result.answer}
        </p>
      </div>
    </div>
  );
}

/* ── CHIP HELPER ────────────────────────────────────────────────────────── */
function Chip({ label, color }) {
  return (
    <div style={{
      fontSize:11, padding:"4px 12px", borderRadius:999,
      background:`${color}12`, border:`1px solid ${color}30`,
      color:color, fontFamily:"'JetBrains Mono',monospace",
    }}>{label}</div>
  );
}
