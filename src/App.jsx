import { useState, useEffect, useCallback } from "react";

// ─── Storage ──────────────────────────────────────────────────────────────────
function load(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const KEYS = { weekly: "mmj-weekly", goals: "mmj-goals", affirmations: "mmj-affirmations", entries: "mmj-entries" };

// ─── Data ─────────────────────────────────────────────────────────────────────
const WEEKLY_PROMPTS = [
  { id: "grateful", label: "Was hat mir diese Woche finanzielle Freude gebracht?", icon: "✦", rows: 3 },
  { id: "wins",     label: "Wo habe ich diese Woche eine souveräne Geldentscheidung getroffen?", icon: "◈", rows: 3 },
  { id: "learning", label: "Was ich diese Woche über Geld gelernt habe…", icon: "◎", rows: 2 },
  { id: "next",     label: "Eine konkrete Geldhandlung, die ich nächste Woche angehe", icon: "→", rows: 2 },
];

const DEEP_QUESTIONS = [
  "Wie fühle ich mich gerade, wenn ich an meine Kontostände denke?",
  "Welcher Glaubenssatz über Geld möchte ich heute loslassen?",
  "Was würde mein höchstes Selbst mit 1.000€ extra tun?",
  "In welchem Bereich meines Lebens fühle ich mich finanziell souverän?",
  "Was bedeutet Reichtum für mich – jenseits von Zahlen?",
  "Wann habe ich zuletzt aus Freude statt aus Angst eine Geldentscheidung getroffen?",
  "Welche Ausgabe hat mir diesen Monat wirklich Freude gemacht?",
  "Was möchte ich mir erlauben, das ich mir bisher verboten habe?",
  "Wo sabotiere ich meinen eigenen Wohlstand gerade?",
  "Wenn Geld keine Rolle spielen würde – was würde ich sofort ändern?",
];

const MOOD_OPTIONS = [
  { val: 1, emoji: "😔", label: "Angespannt" },
  { val: 2, emoji: "😐", label: "Neutral" },
  { val: 3, emoji: "🙂", label: "Stabil" },
  { val: 4, emoji: "😊", label: "Zuversichtlich" },
  { val: 5, emoji: "✨", label: "Souverän" },
];

const ENTRY_TAGS = ["Gedanke", "Sorge", "Wunsch", "Idee", "Aha-Moment", "Dankbarkeit"];
const TAG_COLORS = { "Gedanke": "#c9a96e", "Sorge": "#c97b7b", "Wunsch": "#9b8ec4", "Idee": "#7eb89a", "Aha-Moment": "#89b8d4", "Dankbarkeit": "#e8c98a" };

function getWeekKey() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("week");
  const [weekly, setWeekly] = useState({});
  const [goals, setGoals] = useState([]);
  const [affirmations, setAffirmations] = useState(["", "", ""]);
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function init() {
      const [w, g, a, e] = [load(KEYS.weekly), load(KEYS.goals), load(KEYS.affirmations), load(KEYS.entries)];
      if (w) setWeekly(w);
      if (g) setGoals(g);
      if (a) setAffirmations(a);
      if (e) setEntries(e);
      setLoaded(true);
    }
    init();
  }, []);

  const saveWeekly = useCallback((v) => { setWeekly(v); save(KEYS.weekly, v); }, []);
  const saveGoals = useCallback((v) => { setGoals(v); save(KEYS.goals, v); }, []);
  const saveAffirmations = useCallback((v) => { setAffirmations(v); save(KEYS.affirmations, v); }, []);
  const saveEntries = useCallback((v) => { setEntries(v); save(KEYS.entries, v); }, []);

  if (!loaded) return (
    <div style={S.splash}>
      <p style={S.splashText}>✦</p>
    </div>
  );

  const TABS = [
    { id: "week",    icon: "◈", label: "Woche" },
    { id: "deep",    icon: "✦", label: "Tiefe" },
    { id: "goals",   icon: "◇", label: "Ziele" },
    { id: "entries", icon: "✐", label: "Journal" },
  ];

  return (
    <div style={S.app}>
      <Header />
      <nav style={S.nav}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.navBtn, ...(tab === t.id ? S.navActive : {}) }}>
            <span style={S.navIcon}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <main style={S.main}>
        {tab === "week"    && <WeeklyPage weekly={weekly} affirmations={affirmations} onSaveWeekly={saveWeekly} onSaveAffirmations={saveAffirmations} />}
        {tab === "deep"    && <DeepPage entries={entries} onSave={saveEntries} />}
        {tab === "goals"   && <GoalsPage goals={goals} onSave={saveGoals} />}
        {tab === "entries" && <EntriesPage entries={entries} onSave={saveEntries} />}
      </main>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header() {
  const now = new Date();
  const weekday = now.toLocaleDateString("de-DE", { weekday: "long" });
  const date = now.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  const [name, setName] = useState(() => localStorage.getItem("mmj-name") || "");
  const [editing, setEditing] = useState(!localStorage.getItem("mmj-name"));

  const saveName = (v) => { if (v.trim()) { localStorage.setItem("mmj-name", v.trim()); setName(v.trim()); setEditing(false); } };

  return (
    <header style={S.header}>
      <div style={S.headerInner}>
        <p style={S.headerEyebrow}>Money Mindset Journal</p>
        {editing ? (
          <input
            autoFocus
            defaultValue={name}
            placeholder="Dein Name…"
            style={S.headerNameInput}
            onBlur={e => saveName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveName(e.target.value)}
          />
        ) : (
          <h1 style={S.headerTitle} onClick={() => setEditing(true)}>{name} <span style={S.headerEdit}>✎</span></h1>
        )}
        <p style={S.headerDate}>{weekday}, {date}</p>
      </div>
      <div style={S.headerOrb} />
    </header>
  );
}

// ─── Weekly Page ──────────────────────────────────────────────────────────────
function WeeklyPage({ weekly, affirmations, onSaveWeekly, onSaveAffirmations }) {
  const wk = getWeekKey();
  const thisWeek = weekly[wk] || {};

  const update = (field, value) => {
    const updated = { ...weekly, [wk]: { ...thisWeek, [field]: value } };
    onSaveWeekly(updated);
  };

  const mood = thisWeek.mood || 0;

  return (
    <div style={S.page}>
      <SectionLabel>Diese Woche</SectionLabel>

      {/* Mood */}
      <div style={S.card}>
        <p style={S.cardLabel}>Wie fühle ich mich gerade mit Geld?</p>
        <div style={S.moodRow}>
          {MOOD_OPTIONS.map(m => (
            <button key={m.val} onClick={() => update("mood", m.val)}
              style={{ ...S.moodBtn, ...(mood === m.val ? S.moodActive : {}) }}>
              <span style={S.moodEmoji}>{m.emoji}</span>
              <span style={S.moodLabel}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weekly prompts */}
      {WEEKLY_PROMPTS.map(p => (
        <div key={p.id} style={S.card}>
          <p style={S.cardLabel}><span style={S.promptIcon}>{p.icon}</span> {p.label}</p>
          {Array.from({ length: p.rows }).map((_, i) => (
            <div key={i} style={S.lineWrap}>
              <span style={S.lineNum}>{i + 1}.</span>
              <input
                style={S.lineInput}
                value={(thisWeek[p.id] || [])[i] || ""}
                onChange={e => {
                  const arr = [...(thisWeek[p.id] || Array(p.rows).fill(""))];
                  arr[i] = e.target.value;
                  update(p.id, arr);
                }}
                placeholder="…"
              />
            </div>
          ))}
        </div>
      ))}

      {/* Affirmations */}
      <div style={S.card}>
        <p style={S.cardLabel}>✐ Meine Geld-Affirmationen</p>
        <p style={S.cardHint}>Schreibe sie auf, als wären sie schon wahr.</p>
        {affirmations.map((a, i) => (
          <div key={i} style={S.lineWrap}>
            <span style={S.lineNum}>{i + 1}.</span>
            <input
              style={{ ...S.lineInput, fontStyle: "italic", color: "#c9a96e" }}
              value={a}
              onChange={e => {
                const arr = [...affirmations];
                arr[i] = e.target.value;
                onSaveAffirmations(arr);
              }}
              placeholder="Ich bin…"
            />
          </div>
        ))}
      </div>

      {/* Kontostand snapshot */}
      <div style={S.card}>
        <p style={S.cardLabel}>◎ Aktueller Stand (optional)</p>
        <p style={S.cardHint}>Nicht zur Kontrolle – zur Bewusstwerdung.</p>
        <div style={S.balanceGrid}>
          {["Girokonto", "Notgroschen", "ETFs/Aktien", "Tiny House", "Sonstiges"].map(b => (
            <div key={b} style={S.balanceBox}>
              <p style={S.balanceBoxLabel}>{b}</p>
              <input
                style={S.balanceInput}
                value={(thisWeek.balances || {})[b] || ""}
                onChange={e => update("balances", { ...(thisWeek.balances || {}), [b]: e.target.value })}
                placeholder="€"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Deep Reflection Page ─────────────────────────────────────────────────────
function DeepPage({ entries, onSave }) {
  const [active, setActive] = useState(null);
  const [draft, setDraft] = useState("");

  const answered = entries.filter(e => e.source === "deep");
  const usedQs = answered.map(e => e.question);

  const open = (q) => {
    const existing = entries.find(e => e.question === q && e.source === "deep");
    setDraft(existing ? existing.text : "");
    setActive(q);
  };

  const saveAnswer = () => {
    if (!draft.trim()) return;
    const existing = entries.findIndex(e => e.question === active && e.source === "deep");
    let updated;
    if (existing >= 0) {
      updated = entries.map((e, i) => i === existing ? { ...e, text: draft, updatedAt: new Date().toISOString() } : e);
    } else {
      updated = [{ id: Date.now(), source: "deep", question: active, text: draft, tag: "Aha-Moment", date: new Date().toISOString() }, ...entries];
    }
    onSave(updated);
    setActive(null);
  };

  return (
    <div style={S.page}>
      <SectionLabel>Tiefenarbeit</SectionLabel>
      <p style={S.pageSubtitle}>Ehrliche Fragen. Dein innerer Raum.</p>

      {active ? (
        <div style={S.card}>
          <p style={S.deepQ}>✦ {active}</p>
          <textarea
            style={S.textarea}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Schreibe, was wirklich wahr ist für dich…"
            autoFocus
          />
          <div style={S.btnRow}>
            <button style={S.btnGold} onClick={saveAnswer}>Speichern</button>
            <button style={S.btnGhost} onClick={() => setActive(null)}>Abbrechen</button>
          </div>
        </div>
      ) : (
        <div>
          {DEEP_QUESTIONS.map((q, i) => {
            const done = usedQs.includes(q);
            const answer = entries.find(e => e.question === q && e.source === "deep");
            return (
              <button key={i} style={S.deepCard} onClick={() => open(q)}>
                <div style={S.deepCardInner}>
                  <span style={{ ...S.deepNum, color: done ? "#c9a96e" : "#4a4035" }}>{done ? "✦" : (i + 1)}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <p style={S.deepCardQ}>{q}</p>
                    {answer
                      ? <p style={S.deepCardPreview}>"{answer.text.slice(0, 90)}{answer.text.length > 90 ? "…" : ""}"</p>
                      : <p style={S.deepCardEmpty}>Noch nicht beantwortet</p>
                    }
                  </div>
                </div>
                <span style={S.deepArrow}>{done ? "✎" : "→"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Goals Page ───────────────────────────────────────────────────────────────
function GoalsPage({ goals, onSave }) {
  const [form, setForm] = useState({ name: "", vision: "", by: "", emoji: "◇" });
  const [adding, setAdding] = useState(false);
  const [depositFor, setDepositFor] = useState(null);
  const [depositAmt, setDepositAmt] = useState("");

  const EMOJIS = ["◇", "✈️", "🏡", "💰", "🌿", "💎", "🌊", "✦", "🎓", "🌴"];

  const addGoal = () => {
    if (!form.name) return;
    onSave([...goals, { ...form, id: Date.now(), saved: 0, target: parseFloat(form.target) || 0, milestones: [] }]);
    setForm({ name: "", vision: "", by: "", emoji: "◇", target: "" });
    setAdding(false);
  };

  const deposit = (id) => {
    const amt = parseFloat(depositAmt);
    if (!amt) return;
    onSave(goals.map(g => g.id === id ? { ...g, saved: (g.saved || 0) + amt } : g));
    setDepositFor(null);
    setDepositAmt("");
  };

  const remove = (id) => onSave(goals.filter(g => g.id !== id));

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <SectionLabel>Meine Ziele</SectionLabel>
          <p style={S.pageSubtitle}>Spar-Meilensteine & Visionen</p>
        </div>
        <button style={S.btnGold} onClick={() => setAdding(!adding)}>+ Neu</button>
      </div>

      {adding && (
        <div style={S.card}>
          <p style={S.cardLabel}>Neues Ziel</p>
          <div style={S.emojiRow}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setForm({ ...form, emoji: e })}
                style={{ ...S.emojiBtn, ...(form.emoji === e ? S.emojiBtnActive : {}) }}>{e}</button>
            ))}
          </div>
          <input style={S.input} placeholder="Name des Ziels" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input style={S.input} placeholder="Warum ist dieses Ziel wichtig für mich?" value={form.vision} onChange={e => setForm({ ...form, vision: e.target.value })} />
          <input style={S.input} type="number" placeholder="Zielbetrag (€)" value={form.target || ""} onChange={e => setForm({ ...form, target: e.target.value })} />
          <input style={S.input} type="date" value={form.by} onChange={e => setForm({ ...form, by: e.target.value })} />
          <div style={S.btnRow}>
            <button style={S.btnGold} onClick={addGoal}>Speichern</button>
            <button style={S.btnGhost} onClick={() => setAdding(false)}>Abbrechen</button>
          </div>
        </div>
      )}

      {goals.length === 0 && !adding && (
        <div style={S.empty}>
          <p style={S.emptyIcon}>◇</p>
          <p style={S.emptyText}>Noch kein Ziel definiert.</p>
          <p style={S.emptyHint}>Was möchtest du dir als nächstes ermöglichen?</p>
        </div>
      )}

      {goals.map(g => {
        const pct = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0;
        return (
          <div key={g.id} style={S.goalCard}>
            <div style={S.goalTop}>
              <span style={S.goalEmoji}>{g.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={S.goalName}>{g.name}</p>
                {g.vision && <p style={S.goalVision}>"{g.vision}"</p>}
                {g.by && <p style={S.goalBy}>Bis {new Date(g.by).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</p>}
              </div>
              <button style={S.delBtn} onClick={() => remove(g.id)}>✕</button>
            </div>

            {g.target > 0 && (
              <div style={{ margin: "14px 0 8px" }}>
                <div style={S.goalAmounts}>
                  <span style={S.goalSaved}>{(g.saved || 0).toFixed(0)} € gespart</span>
                  <span style={S.goalTarget}>{g.target.toFixed(0)} € Ziel</span>
                </div>
                <div style={S.bar}>
                  <div style={{ ...S.barFill, width: `${pct}%`, background: pct >= 100 ? "#5a9e7a" : `linear-gradient(90deg,${C.tan},${C.tanLight})` }} />
                </div>
                <p style={S.goalPct}>{pct >= 100 ? "🎉 Geschafft!" : `${pct.toFixed(0)}% — noch ${(g.target - g.saved).toFixed(0)} €`}</p>
              </div>
            )}

            {depositFor === g.id ? (
              <div style={S.depositRow}>
                <input type="number" placeholder="€" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} style={{ ...S.input, flex: 1, marginBottom: 0 }} autoFocus />
                <button style={S.btnGold} onClick={() => deposit(g.id)}>Einzahlen</button>
                <button style={S.btnGhost} onClick={() => setDepositFor(null)}>✕</button>
              </div>
            ) : (
              g.target > 0 && <button style={S.btnSecondary} onClick={() => setDepositFor(g.id)}>+ Einzahlung</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Entries / Free Journal ───────────────────────────────────────────────────
function EntriesPage({ entries, onSave }) {
  const [mode, setMode] = useState("list");
  const [draft, setDraft] = useState({ title: "", text: "", tag: "Gedanke" });
  const [viewing, setViewing] = useState(null);
  const [filterTag, setFilterTag] = useState("Alle");

  const freeEntries = entries.filter(e => e.source !== "deep");

  const saveEntry = () => {
    if (!draft.text.trim()) return;
    onSave([{ ...draft, id: Date.now(), source: "free", date: new Date().toISOString() }, ...entries]);
    setDraft({ title: "", text: "", tag: "Gedanke" });
    setMode("list");
  };

  const remove = (id) => { onSave(entries.filter(e => e.id !== id)); setMode("list"); };

  const filtered = filterTag === "Alle" ? freeEntries : freeEntries.filter(e => e.tag === filterTag);

  if (mode === "new") return (
    <div style={S.page}>
      <SectionLabel>Neuer Eintrag</SectionLabel>
      <div style={S.card}>
        <div style={S.tagRow}>
          {ENTRY_TAGS.map(t => (
            <button key={t} onClick={() => setDraft({ ...draft, tag: t })}
              style={{ ...S.tagBtn, ...(draft.tag === t ? { background: TAG_COLORS[t] + "22", borderColor: TAG_COLORS[t], color: TAG_COLORS[t] } : {}) }}>
              {t}
            </button>
          ))}
        </div>
        <input style={S.input} placeholder="Titel (optional)" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
        <textarea style={{ ...S.textarea, minHeight: 180 }} placeholder="Was beschäftigt dich gerade wirklich?" value={draft.text} onChange={e => setDraft({ ...draft, text: e.target.value })} autoFocus />
        <div style={S.btnRow}>
          <button style={S.btnGold} onClick={saveEntry}>Speichern</button>
          <button style={S.btnGhost} onClick={() => setMode("list")}>Abbrechen</button>
        </div>
      </div>
    </div>
  );

  if (mode === "view" && viewing) return (
    <div style={S.page}>
      <button style={S.backBtn} onClick={() => setMode("list")}>← Zurück</button>
      <div style={S.card}>
        <span style={{ ...S.tagChip, borderColor: TAG_COLORS[viewing.tag], color: TAG_COLORS[viewing.tag] }}>{viewing.tag}</span>
        {viewing.title && <h2 style={S.viewTitle}>{viewing.title}</h2>}
        <p style={S.viewDate}>{new Date(viewing.date).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
        <p style={S.viewText}>{viewing.text}</p>
        <button style={{ ...S.btnGhost, color: "#c97b7b", borderColor: "#c97b7b33", marginTop: 20 }} onClick={() => remove(viewing.id)}>Löschen</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <SectionLabel>Tagebuch</SectionLabel>
          <p style={S.pageSubtitle}>Dein freier Schreibraum</p>
        </div>
        <button style={S.btnGold} onClick={() => setMode("new")}>✐ Neu</button>
      </div>

      <div style={S.filterScroll}>
        {["Alle", ...ENTRY_TAGS].map(t => (
          <button key={t} onClick={() => setFilterTag(t)}
            style={{ ...S.filterBtn, ...(filterTag === t ? { borderColor: TAG_COLORS[t] || "#c9a96e", color: TAG_COLORS[t] || "#c9a96e" } : {}) }}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={S.empty}>
          <p style={S.emptyIcon}>✐</p>
          <p style={S.emptyText}>Noch nichts geschrieben.</p>
          <p style={S.emptyHint}>Was trägt dich oder drückt dich gerade?</p>
        </div>
      ) : filtered.map(e => (
        <button key={e.id} style={S.entryCard} onClick={() => { setViewing(e); setMode("view"); }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
            <div style={{ ...S.tagDot, background: TAG_COLORS[e.tag] }} />
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <p style={S.entryTitle}>{e.title || e.tag}</p>
                <p style={S.entryDate}>{new Date(e.date).toLocaleDateString("de-DE")}</p>
              </div>
              <p style={S.entryPreview}>{e.text.slice(0, 100)}{e.text.length > 100 ? "…" : ""}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <p style={S.sectionLabel}>{children}</p>;
}

// ─── Brand Colors ─────────────────────────────────────────────────────────────
// #2A4D69 navy  #4B86B4 blue  #F2E8CF cream  #A68A64 tan  #F7F7F7 offwhite
const C = {
  navy:    "#2A4D69",
  blue:    "#4B86B4",
  cream:   "#F2E8CF",
  tan:     "#A68A64",
  offwhite:"#F7F7F7",
  // derived
  navyDark:  "#1e3a50",
  blueMid:   "#3a6d99",
  creamDark: "#e0d4b8",
  tanLight:  "#c4aa84",
  tanDark:   "#7a6448",
  border:    "#d8cdb5",
  borderMid: "#c2b49a",
  textDark:  "#1e2e3d",
  textMid:   "#4a5a6a",
  textLight: "#8a9aaa",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", background: C.offwhite, color: C.textDark, fontFamily: "'Georgia','Times New Roman',serif" },
  splash: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.offwhite },
  splashText: { fontSize: 40, color: C.tan },

  header: { position: "relative", padding: "36px 24px 28px", background: `linear-gradient(160deg,${C.navy} 0%,${C.navyDark} 100%)`, borderBottom: `1px solid ${C.blueMid}`, overflow: "hidden" },
  headerInner: { position: "relative", zIndex: 1 },
  headerEyebrow: { fontSize: 10, letterSpacing: 4, color: C.tanLight, textTransform: "uppercase", margin: "0 0 8px", fontFamily: "system-ui,sans-serif" },
  headerTitle: { fontSize: 28, fontWeight: "normal", margin: "0 0 6px", color: C.cream, letterSpacing: 1 },
  headerDate: { fontSize: 13, color: "#a0b8cc", margin: 0, fontFamily: "system-ui,sans-serif" },
  headerOrb: { position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle,${C.blue}33 0%,transparent 70%)`, pointerEvents: "none" },

  nav: { display: "flex", borderBottom: `1px solid ${C.border}`, background: C.offwhite, position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 8px rgba(42,77,105,0.07)" },
  navBtn: { flex: 1, padding: "13px 8px", background: "none", border: "none", borderBottom: "2px solid transparent", color: C.textLight, cursor: "pointer", fontSize: 11, fontFamily: "system-ui,sans-serif", letterSpacing: 0.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "color 0.2s" },
  navActive: { color: C.navy, borderBottomColor: C.tan },
  navIcon: { fontSize: 15 },

  main: { maxWidth: 560, margin: "0 auto", padding: "0 16px 60px" },
  page: { paddingTop: 24 },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  sectionLabel: { fontSize: 10, letterSpacing: 3, color: C.tan, textTransform: "uppercase", margin: "0 0 4px", fontFamily: "system-ui,sans-serif" },
  pageSubtitle: { fontSize: 13, color: C.textLight, margin: "0 0 20px", fontFamily: "system-ui,sans-serif" },

  card: { background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px", marginBottom: 14, boxShadow: "0 2px 12px rgba(42,77,105,0.06)" },
  cardLabel: { fontSize: 14, color: C.navy, margin: "0 0 14px", lineHeight: 1.5 },
  cardHint: { fontSize: 12, color: C.textLight, margin: "-8px 0 12px", fontFamily: "system-ui,sans-serif", fontStyle: "italic" },

  moodRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  moodBtn: { flex: 1, minWidth: 56, background: C.offwhite, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.2s" },
  moodActive: { background: `${C.blue}18`, borderColor: C.blue },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 9, color: C.textLight, fontFamily: "system-ui,sans-serif", textAlign: "center" },

  promptIcon: { color: C.tan, marginRight: 4 },
  lineWrap: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  lineNum: { color: C.textLight, fontSize: 13, minWidth: 18 },
  lineInput: { flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${C.border}`, color: C.textDark, fontSize: 14, fontFamily: "'Georgia',serif", padding: "4px 0", outline: "none" },

  balanceGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  balanceBox: { background: C.cream, border: `1px solid ${C.creamDark}`, borderRadius: 10, padding: 12 },
  balanceBoxLabel: { fontSize: 10, color: C.tanDark, margin: "0 0 6px", letterSpacing: 1, textTransform: "uppercase", fontFamily: "system-ui,sans-serif" },
  balanceInput: { width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${C.creamDark}`, color: C.navy, fontSize: 16, fontFamily: "'Georgia',serif", padding: "2px 0", outline: "none", boxSizing: "border-box" },

  deepQ: { fontSize: 16, color: C.navy, margin: "0 0 16px", lineHeight: 1.6 },
  deepCard: { width: "100%", background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", boxShadow: "0 1px 6px rgba(42,77,105,0.05)" },
  deepCardInner: { display: "flex", gap: 12, alignItems: "flex-start", flex: 1 },
  deepNum: { fontSize: 13, minWidth: 20, paddingTop: 2, fontFamily: "system-ui,sans-serif", color: C.textLight },
  deepCardQ: { fontSize: 14, color: C.textDark, margin: 0, lineHeight: 1.5 },
  deepCardPreview: { fontSize: 12, color: C.textMid, margin: "6px 0 0", fontStyle: "italic", lineHeight: 1.4 },
  deepCardEmpty: { fontSize: 12, color: C.textLight, margin: "4px 0 0", fontFamily: "system-ui,sans-serif" },
  deepArrow: { color: C.textLight, fontSize: 16, marginLeft: 12, flexShrink: 0 },

  goalCard: { background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 14, boxShadow: "0 2px 12px rgba(42,77,105,0.06)" },
  goalTop: { display: "flex", gap: 12, alignItems: "flex-start" },
  goalEmoji: { fontSize: 26, lineHeight: 1 },
  goalName: { fontSize: 16, color: C.navy, margin: "0 0 2px" },
  goalVision: { fontSize: 12, color: C.textMid, fontStyle: "italic", margin: "0 0 3px", lineHeight: 1.4 },
  goalBy: { fontSize: 11, color: C.textLight, fontFamily: "system-ui,sans-serif" },
  goalAmounts: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  goalSaved: { fontSize: 14, color: C.tan },
  goalTarget: { fontSize: 14, color: C.textLight },
  goalPct: { fontSize: 11, color: C.textLight, margin: "4px 0 0", fontFamily: "system-ui,sans-serif" },
  bar: { background: C.creamDark, borderRadius: 6, height: 7, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6, transition: "width 0.5s ease" },
  depositRow: { display: "flex", gap: 8, marginTop: 10, alignItems: "center" },

  entryCard: { width: "100%", background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "15px", marginBottom: 10, cursor: "pointer", display: "flex", textAlign: "left", boxShadow: "0 1px 6px rgba(42,77,105,0.05)" },
  entryTitle: { fontSize: 14, color: C.navy, margin: 0, fontFamily: "system-ui,sans-serif" },
  entryDate: { fontSize: 11, color: C.textLight, fontFamily: "system-ui,sans-serif", flexShrink: 0 },
  entryPreview: { fontSize: 12, color: C.textMid, margin: "4px 0 0", lineHeight: 1.5 },
  tagDot: { width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0 },
  tagRow: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 },
  tagBtn: { background: C.offwhite, border: `1px solid ${C.border}`, borderRadius: 20, padding: "5px 12px", color: C.textMid, fontSize: 11, fontFamily: "system-ui,sans-serif", cursor: "pointer" },
  tagChip: { border: "1px solid", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontFamily: "system-ui,sans-serif", display: "inline-block", marginBottom: 12 },
  filterScroll: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 16, scrollbarWidth: "none" },
  filterBtn: { background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 14px", color: C.textLight, fontSize: 11, fontFamily: "system-ui,sans-serif", cursor: "pointer", flexShrink: 0 },

  viewTitle: { fontSize: 20, fontWeight: "normal", color: C.navy, margin: "12px 0 4px" },
  viewDate: { fontSize: 12, color: C.textLight, margin: "0 0 18px", fontFamily: "system-ui,sans-serif" },
  viewText: { fontSize: 15, color: C.textMid, lineHeight: 1.85, margin: 0 },
  backBtn: { background: "none", border: "none", color: C.textLight, cursor: "pointer", fontSize: 13, fontFamily: "system-ui,sans-serif", padding: "0 0 16px", display: "block" },

  input: { width: "100%", background: C.offwhite, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.textDark, fontSize: 14, fontFamily: "'Georgia',serif", outline: "none", boxSizing: "border-box", marginBottom: 10 },
  textarea: { width: "100%", background: C.offwhite, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px", color: C.textDark, fontSize: 14, fontFamily: "'Georgia',serif", outline: "none", resize: "vertical", minHeight: 130, lineHeight: 1.75, boxSizing: "border-box" },

  btnGold: { background: C.tan, color: "#ffffff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 12, fontFamily: "system-ui,sans-serif", fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, flexShrink: 0 },
  btnGhost: { background: "transparent", color: C.textMid, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", fontSize: 12, fontFamily: "system-ui,sans-serif", cursor: "pointer" },
  btnSecondary: { background: "transparent", color: C.blue, border: `1px solid ${C.blue}44`, borderRadius: 8, padding: "8px 16px", fontSize: 12, fontFamily: "system-ui,sans-serif", cursor: "pointer", marginTop: 8 },
  btnRow: { display: "flex", gap: 8, marginTop: 14 },
  delBtn: { background: "none", border: "none", color: C.textLight, cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 },

  emojiRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  emojiBtn: { background: C.offwhite, border: `1px solid ${C.border}`, borderRadius: 8, width: 36, height: 36, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  emojiBtnActive: { borderColor: C.tan, background: `${C.cream}` },

  empty: { textAlign: "center", padding: "52px 20px" },
  emptyIcon: { fontSize: 30, margin: "0 0 12px", opacity: 0.4, color: C.blue },
  emptyText: { fontSize: 15, color: C.textLight, margin: "0 0 6px" },
  emptyHint: { fontSize: 13, color: C.textLight, fontFamily: "system-ui,sans-serif", opacity: 0.7 },
};

// injected style additions
Object.assign(S, {
  headerNameInput: { background: "transparent", border: "none", borderBottom: "2px solid rgba(242,232,207,0.5)", color: C.cream, fontSize: 28, fontFamily: "'Georgia','Times New Roman',serif", letterSpacing: 1, outline: "none", width: "100%", marginBottom: 6, padding: "2px 0" },
  headerEdit: { fontSize: 14, opacity: 0.5, cursor: "pointer" },
});
