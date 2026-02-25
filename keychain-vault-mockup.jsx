import { useState, useEffect, useRef } from "react";

const MASTER_PASSWORD = "demo";

const INITIAL_CATEGORIES = [
  { key: "dev", label: "Development", icon: "⌬" },
  { key: "personal", label: "Personal", icon: "◉" },
  { key: "finance", label: "Finance", icon: "◆" },
  { key: "entertainment", label: "Entertainment", icon: "▣" },
];

const INITIAL_VAULT = [
  { id: 1, type: "login", name: "GitHub", username: "dev@myemail.com", password: "g1tHub$ecure!2024", url: "github.com", category: "dev", lastUsed: "2 min ago", strength: 95, fav: false },
  { id: 2, type: "login", name: "AWS Console", username: "admin@company.io", password: "Aws!R00t#Adm1n", url: "aws.amazon.com", category: "dev", lastUsed: "1 hr ago", strength: 88, fav: true },
  { id: 3, type: "login", name: "Gmail", username: "personal@gmail.com", password: "Gm@1l_P@ss!word", url: "mail.google.com", category: "personal", lastUsed: "5 min ago", strength: 72, fav: false },
  { id: 4, type: "login", name: "Netflix", username: "me@email.com", password: "N3tfl1x&Ch1ll!", url: "netflix.com", category: "entertainment", lastUsed: "3 days ago", strength: 81, fav: false },
  { id: 5, type: "login", name: "Bank of Ireland", username: "john.doe", password: "B@nk!ng$ecure#99", url: "boi.com", category: "finance", lastUsed: "1 day ago", strength: 97, fav: true },
  { id: 6, type: "login", name: "Figma", username: "design@studio.com", password: "F1gm@Des1gn!", url: "figma.com", category: "dev", lastUsed: "30 min ago", strength: 84, fav: false },
  { id: 7, type: "login", name: "Spotify", username: "music.lover@pm.me", password: "Sp0t1fy#Beats", url: "spotify.com", category: "entertainment", lastUsed: "12 hr ago", strength: 69, fav: false },
  { id: 8, type: "login", name: "Stripe Dashboard", username: "finance@startup.io", password: "Str1pe$API#Key!", url: "dashboard.stripe.com", category: "finance", lastUsed: "4 hr ago", strength: 92, fav: false },
  { id: 100, type: "card", name: "Visa •••• 4829", cardHolder: "John Doe", cardNumber: "4539 1234 5678 4829", expiry: "09/27", cvv: "312", category: "finance", lastUsed: "2 days ago", fav: true },
  { id: 101, type: "card", name: "Mastercard •••• 7210", cardHolder: "John Doe", cardNumber: "5425 9876 5432 7210", expiry: "03/28", cvv: "891", category: "finance", lastUsed: "1 week ago", fav: false },
  { id: 200, type: "note", name: "Recovery Codes", noteText: "GitHub 2FA backup codes:\n8f29a-3k1m0\n29dk1-mm38f\nz93kd-10dmf\n\nKeep these safe!", category: "dev", lastUsed: "5 days ago", fav: false },
  { id: 201, type: "note", name: "Wi-Fi Passwords", noteText: "Home: MyNetwork_5G → Tr0ub4dor&3\nOffice: Corp-Secure → W3lc0me!2024\nParents: OldRouter → password123", category: "personal", lastUsed: "2 weeks ago", fav: false },
];

const MENUBAR_ICON_OPTIONS = [
  { id: "lock-text", emoji: "🔐", showLabel: true, label: "Vault" },
  { id: "lock-only", emoji: "🔐", showLabel: false },
  { id: "key-text", emoji: "🔑", showLabel: true, label: "Keys" },
  { id: "key-only", emoji: "🔑", showLabel: false },
  { id: "shield-text", emoji: "🛡️", showLabel: true, label: "Vault" },
  { id: "shield-only", emoji: "🛡️", showLabel: false },
  { id: "minimal-dot", emoji: "◆", showLabel: false },
  { id: "minimal-text", emoji: "◆", showLabel: true, label: "KV" },
];

const WORD_LIST = ["alpha","brave","coral","delta","eagle","flame","grace","haven","ivory","jewel","karma","lunar","maple","noble","ocean","pearl","quest","river","solar","tiger","unity","vivid","whale","xenon","youth","zephyr","amber","blaze","cedar","drift","ember","frost","glyph","haze","index","jazz","knack","lemon","mirth","nexus","opal","plume","quirk","ridge","sage","torch","ultra","valor","wren","axiom","brisk"];

function calcStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s += 15; if (pw.length >= 12) s += 15; if (pw.length >= 16) s += 10; if (pw.length >= 20) s += 10;
  if (/[a-z]/.test(pw)) s += 10; if (/[A-Z]/.test(pw)) s += 10; if (/[0-9]/.test(pw)) s += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) s += 15; if (new Set(pw).size > pw.length * 0.6) s += 5;
  return Math.min(100, s);
}
function strengthColor(s) { return s >= 90 ? "#34d399" : s >= 75 ? "#fbbf24" : s >= 50 ? "#fb923c" : "#f87171"; }
function strengthLabel(s) { return s >= 90 ? "Excellent" : s >= 75 ? "Strong" : s >= 50 ? "Fair" : s > 0 ? "Weak" : ""; }
function genRandomPassword(len, numbers, symbols) {
  let c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz"; if (numbers) c += "23456789"; if (symbols) c += "!@#$%^&*()_+-=";
  let pw = ""; for (let i = 0; i < len; i++) pw += c[Math.floor(Math.random() * c.length)]; return pw;
}
function genMemorablePassword(wc, sep, cap, full) {
  const seps = { Hyphens: "-", Periods: ".", Spaces: " ", Commas: ",", Underscores: "_" };
  let words = [];
  for (let i = 0; i < wc; i++) { let w = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]; if (!full) w = w.slice(0, 3 + Math.floor(Math.random() * 2)); if (cap) w = w[0].toUpperCase() + w.slice(1); words.push(w); }
  if (sep === "Numbers") return words.map((w, i) => i < words.length - 1 ? w + Math.floor(Math.random() * 10) : w).join("");
  return words.join(seps[sep] || "-");
}
function genPIN(len) { let p = ""; for (let i = 0; i < len; i++) p += Math.floor(Math.random() * 10); return p; }

// ── Themes ──
const themes = {
  dark: {
    bg: "#0c0c0e", barBg: "linear-gradient(180deg, #2a2a2e 0%, #1c1c1f 100%)", barBorder: "#27272a",
    barText: "#d4d4d8", dropBg: "linear-gradient(165deg, #18181b 0%, #0f0f12 100%)", dropBorder: "rgba(255,255,255,0.06)",
    dropShadow: "0 25px 80px rgba(0,0,0,0.7), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.04)",
    text: "#e4e4e7", textSecondary: "#a1a1aa", textMuted: "#71717a", textFaint: "#52525b", textGhost: "#3f3f46", textInvisible: "#27272a",
    inputBg: "rgba(255,255,255,0.03)", inputBorder: "rgba(255,255,255,0.07)", fieldBg: "rgba(255,255,255,0.02)",
    hoverBg: "rgba(255,255,255,0.02)", activeBg: "rgba(59,130,246,0.08)", pillBg: "rgba(59,130,246,0.2)",
    toggleOff: "rgba(255,255,255,0.1)", toggleThumb: "#fff", cardBg: "rgba(255,255,255,0.02)", cardBorder: "rgba(255,255,255,0.04)",
    accentBlue: "#3b82f6", accentBlueLt: "#60a5fa", accentPurple: "#a855f7", accentGreen: "#34d399", accentRed: "#f87171",
    focusBorder: "rgba(59,130,246,0.4)", selectionBg: "rgba(59,130,246,0.3)",
    ddBg: "#1e1e22", ddBorder: "rgba(255,255,255,0.1)", ddItemHover: "rgba(255,255,255,0.04)",
  },
  light: {
    bg: "#f4f4f5", barBg: "linear-gradient(180deg, #f8f8f9 0%, #ececee 100%)", barBorder: "#d4d4d8",
    barText: "#3f3f46", dropBg: "linear-gradient(165deg, #ffffff 0%, #fafafa 100%)", dropBorder: "rgba(0,0,0,0.08)",
    dropShadow: "0 25px 60px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08)",
    text: "#18181b", textSecondary: "#52525b", textMuted: "#71717a", textFaint: "#a1a1aa", textGhost: "#d4d4d8", textInvisible: "#e4e4e7",
    inputBg: "rgba(0,0,0,0.03)", inputBorder: "rgba(0,0,0,0.1)", fieldBg: "rgba(0,0,0,0.02)",
    hoverBg: "rgba(0,0,0,0.03)", activeBg: "rgba(59,130,246,0.06)", pillBg: "rgba(59,130,246,0.12)",
    toggleOff: "rgba(0,0,0,0.12)", toggleThumb: "#fff", cardBg: "rgba(0,0,0,0.02)", cardBorder: "rgba(0,0,0,0.06)",
    accentBlue: "#2563eb", accentBlueLt: "#3b82f6", accentPurple: "#7c3aed", accentGreen: "#059669", accentRed: "#dc2626",
    focusBorder: "rgba(37,99,235,0.4)", selectionBg: "rgba(59,130,246,0.2)",
    ddBg: "#ffffff", ddBorder: "rgba(0,0,0,0.1)", ddItemHover: "rgba(0,0,0,0.04)",
  },
};

function Toggle({ on, onChange, accentColor = "#3b82f6", t }) {
  return (
    <div onClick={onChange} style={{ width: 44, height: 26, borderRadius: 13, cursor: "pointer", background: on ? accentColor : (t?.toggleOff || "rgba(255,255,255,0.1)"), transition: "background 0.2s ease", position: "relative", flexShrink: 0, boxShadow: on ? `0 0 8px ${accentColor}44` : "inset 0 1px 3px rgba(0,0,0,0.2)" }}>
      <div style={{ width: 20, height: 20, borderRadius: 10, background: t?.toggleThumb || "#fff", position: "absolute", top: 3, left: on ? 21 : 3, transition: "left 0.2s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

function Dropdown({ value, options, onChange, width = 180, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div ref={ref} style={{ position: "relative", width }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "7px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: t.inputBg, border: open ? `1px solid ${t.focusBorder}` : `1px solid ${t.inputBorder}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: t.text, transition: "all 0.15s ease" }}>
        <span>{value}</span><span style={{ fontSize: 8, color: t.textMuted, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, background: t.ddBg, border: `1px solid ${t.ddBorder}`, borderRadius: 10, boxShadow: "0 12px 40px rgba(0,0,0,0.3)", overflow: "hidden" }}>
          {options.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              style={{ padding: "9px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: opt === value ? t.accentBlueLt : t.textSecondary, display: "flex", justifyContent: "space-between", background: opt === value ? t.activeBg : "transparent", transition: "background 0.1s" }}
              onMouseEnter={(e) => { if (opt !== value) e.currentTarget.style.background = t.ddItemHover; }}
              onMouseLeave={(e) => { if (opt !== value) e.currentTarget.style.background = "transparent"; }}>
              <span>{opt}</span>{opt === value && <span style={{ color: t.accentBlue }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KeychainVault() {
  const [theme, setTheme] = useState("dark");
  const t = themes[theme];
  const [screen, setScreen] = useState("menubar");
  const [unlocked, setUnlocked] = useState(false);
  const [masterInput, setMasterInput] = useState("");
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [vaultData, setVaultData] = useState(INITIAL_VAULT);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [panel, setPanel] = useState("list");
  const [typeFilter, setTypeFilter] = useState("all"); // all, login, card, note
  // Add new
  const [newType, setNewType] = useState("login");
  const [newName, setNewName] = useState(""); const [newUrl, setNewUrl] = useState(""); const [newUsername, setNewUsername] = useState(""); const [newPassword, setNewPassword] = useState(""); const [newCategory, setNewCategory] = useState("personal"); const [showNewPw, setShowNewPw] = useState(false); const [newSaved, setNewSaved] = useState(false);
  // Card fields
  const [newCardHolder, setNewCardHolder] = useState(""); const [newCardNumber, setNewCardNumber] = useState(""); const [newExpiry, setNewExpiry] = useState(""); const [newCvv, setNewCvv] = useState("");
  // Note fields
  const [newNoteText, setNewNoteText] = useState("");
  // Generator
  const [genType, setGenType] = useState("Random Password"); const [genLen, setGenLen] = useState(20); const [genNumbers, setGenNumbers] = useState(true); const [genSymbols, setGenSymbols] = useState(true); const [genWords, setGenWords] = useState(4); const [genSeparator, setGenSeparator] = useState("Hyphens"); const [genCapitalize, setGenCapitalize] = useState(false); const [genFullWords, setGenFullWords] = useState(true); const [genPinLen, setGenPinLen] = useState(6); const [genPw, setGenPw] = useState(""); const [genGenerating, setGenGenerating] = useState(false);
  // Settings
  const [menuBarStyle, setMenuBarStyle] = useState(MENUBAR_ICON_OPTIONS[0]); const [autoLockEnabled, setAutoLockEnabled] = useState(true); const [autoLockMin, setAutoLockMin] = useState(5); const [clipboardClearEnabled, setClipboardClearEnabled] = useState(true); const [clipboardClear, setClipboardClear] = useState(30);
  // Tags
  const [newTagName, setNewTagName] = useState(""); const [newTagIcon, setNewTagIcon] = useState("◎");
  // Import/Export
  const [showImportSuccess, setShowImportSuccess] = useState(false); const [showExportSuccess, setShowExportSuccess] = useState(false);
  // Detail show fields
  const [showCardNum, setShowCardNum] = useState(false); const [showCvv, setShowCvv] = useState(false);

  const inputRef = useRef(null);
  const mono = "'JetBrains Mono', monospace";

  useEffect(() => { if (screen === "unlock" && inputRef.current) setTimeout(() => inputRef.current.focus(), 300); }, [screen]);
  useEffect(() => { setFadeIn(true); const x = setTimeout(() => setFadeIn(false), 400); return () => clearTimeout(x); }, [screen, selectedItem, panel]);

  const handleUnlock = () => { if (masterInput === MASTER_PASSWORD) { setUnlocked(true); setScreen("vault"); setMasterInput(""); setError(false); setPanel("list"); } else { setError(true); setShakeError(true); setTimeout(() => setShakeError(false), 600); } };
  const handleLock = () => { setUnlocked(false); setScreen("menubar"); setSelectedItem(null); setSearch(""); setActiveCategory("all"); setPanel("list"); setTypeFilter("all"); };
  const handleCopy = (f) => { setCopiedField(f); setTimeout(() => setCopiedField(null), 1500); };

  const sortedFiltered = vaultData
    .filter(item => { const mc = activeCategory === "all" || item.category === activeCategory; const ms = item.name.toLowerCase().includes(search.toLowerCase()) || (item.username || "").toLowerCase().includes(search.toLowerCase()); const mt = typeFilter === "all" || item.type === typeFilter; return mc && ms && mt; })
    .sort((a, b) => { if (a.fav !== b.fav) return a.fav ? -1 : 1; return a.name.localeCompare(b.name); });

  const resetNew = () => { setNewType("login"); setNewName(""); setNewUrl(""); setNewUsername(""); setNewPassword(""); setNewCategory("personal"); setShowNewPw(false); setNewSaved(false); setNewCardHolder(""); setNewCardNumber(""); setNewExpiry(""); setNewCvv(""); setNewNoteText(""); };

  const handleSaveNew = () => {
    if (!newName) return;
    let item = { id: Date.now(), type: newType, name: newName, category: newCategory, lastUsed: "Just now", fav: false };
    if (newType === "login") { if (!newUsername || !newPassword) return; Object.assign(item, { username: newUsername, password: newPassword, url: newUrl || "", strength: calcStrength(newPassword) }); }
    else if (newType === "card") { if (!newCardNumber) return; Object.assign(item, { cardHolder: newCardHolder, cardNumber: newCardNumber, expiry: newExpiry, cvv: newCvv }); }
    else { if (!newNoteText) return; item.noteText = newNoteText; }
    setVaultData(prev => [item, ...prev]); setNewSaved(true);
    setTimeout(() => { setPanel("list"); resetNew(); }, 1000);
  };

  const toggleFav = (id) => { setVaultData(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i)); };

  const doGenerate = () => { setGenGenerating(true); setTimeout(() => { let pw = genType === "Random Password" ? genRandomPassword(genLen, genNumbers, genSymbols) : genType === "Memorable Password" ? genMemorablePassword(genWords, genSeparator, genCapitalize, genFullWords) : genPIN(genPinLen); setGenPw(pw); setGenGenerating(false); }, 400); };

  const handleAddTag = () => { if (!newTagName.trim()) return; const key = newTagName.trim().toLowerCase().replace(/\s+/g, "_"); if (categories.find(c => c.key === key)) return; setCategories(prev => [...prev, { key, label: newTagName.trim(), icon: newTagIcon }]); setNewTagName(""); setNewTagIcon("◎"); };
  const handleRemoveTag = (key) => { if (["dev","personal","finance","entertainment"].includes(key)) return; setCategories(prev => prev.filter(c => c.key !== key)); setVaultData(prev => prev.map(i => i.category === key ? { ...i, category: "personal" } : i)); if (activeCategory === key) setActiveCategory("all"); };

  const getCatIcon = (k) => { const c = categories.find(x => x.key === k); return c ? c.icon : "◎"; };
  const getCatColor = (k) => { const m = { dev: [t.accentBlue + "1e", t.accentBlueLt], finance: [t.accentGreen + "1e", t.accentGreen], entertainment: ["#fbbf2418", "#fbbf24"] }; return m[k] || [t.accentPurple + "1e", t.accentPurple]; };
  const getTypeIcon = (type) => type === "card" ? "💳" : type === "note" ? "📝" : null;

  const detailItem = selectedItem ? vaultData.find(v => v.id === selectedItem) : null;
  const newPwStrength = calcStrength(newPassword);
  const genPwStrength = calcStrength(genPw);

  // ── Styles (theme-aware) ──
  const inputStyle = { width: "100%", padding: "10px 12px", background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, color: t.text, fontSize: 13, fontFamily: mono, outline: "none", transition: "border-color 0.15s" };
  const labelStyle = { fontSize: 10, color: t.textFaint, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5, display: "block" };
  const btnPrimary = { width: "100%", padding: "11px 0", background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "-apple-system, sans-serif", letterSpacing: 0.3 };
  const pillBtn = (active) => ({ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none", background: active ? t.pillBg : "transparent", color: active ? t.accentBlueLt : t.textMuted, fontFamily: mono, transition: "all 0.15s", whiteSpace: "nowrap" });
  const cpyBtn = (copied) => ({ padding: "4px 10px", borderRadius: 6, border: "none", background: copied ? t.accentGreen + "33" : t.fieldBg, color: copied ? t.accentGreen : t.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: mono, transition: "all 0.15s", fontWeight: 500 });
  const fieldRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: t.fieldBg, borderRadius: 8, marginBottom: 6 };
  const footerBtn = { padding: "5px 12px", borderRadius: 6, border: "none", background: t.fieldBg, color: t.textMuted, fontSize: 11, cursor: "pointer", fontFamily: mono, transition: "all 0.15s" };
  const itemIconStyle = (cat) => { const [bg, fg] = getCatColor(cat); return { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, background: bg, color: fg }; };
  const settingRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" };
  const TAG_ICONS = ["◎","★","♦","●","▲","■","♠","♣","⬟","⬡"];

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: t.bg, fontFamily: mono, color: t.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes successPop { 0%{transform:scale(1)} 50%{transform:scale(1.15)} 100%{transform:scale(1)} }
        @keyframes checkDraw { from{stroke-dashoffset:20} to{stroke-dashoffset:0} }
        * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: ${t.textGhost} transparent; }
        *::-webkit-scrollbar { width: 4px; } *::-webkit-scrollbar-thumb { background: ${t.textGhost}; border-radius: 4px; }
        ::selection { background: ${t.selectionBg}; }
        input::placeholder { color: ${t.textGhost}; }
        input:focus { border-color: ${t.focusBorder} !important; }
        textarea::placeholder { color: ${t.textGhost}; }
        textarea:focus { border-color: ${t.focusBorder} !important; outline: none; }
        input[type=range] { -webkit-appearance: none; background: ${t.inputBorder}; border-radius: 4px; height: 4px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; cursor: pointer; border: 2px solid ${t.bg}; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
      `}</style>

      {/* ── MENU BAR ── */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 28, background: t.barBg, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", fontSize: 13, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: t.barText, zIndex: 1000, borderBottom: `1px solid ${t.barBorder}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}></span>
          {["Finder","File","Edit","View","Go","Window"].map((m,i)=><span key={m} style={{opacity:i===0?.8:.5}}>{m}</span>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ opacity: 0.5, fontSize: 14 }}>◧</span>
          <div style={{ cursor: "pointer", padding: "2px 10px", borderRadius: 4, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s", userSelect: "none", background: screen !== "menubar" ? (theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "transparent" }}
            onClick={() => { if (screen === "menubar") setScreen(unlocked ? "vault" : "unlock"); else setScreen("menubar"); }}>
            <span style={{ fontSize: menuBarStyle.emoji.length > 2 ? 13 : 15 }}>{menuBarStyle.emoji}</span>
            {menuBarStyle.showLabel && <span style={{ fontSize: 12, fontWeight: 600 }}>{menuBarStyle.label}</span>}
            {unlocked && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.accentGreen, boxShadow: `0 0 6px ${t.accentGreen}` }} />}
          </div>
          <span style={{ opacity: 0.6, fontSize: 12 }}>Tue 15:42</span>
        </div>
      </div>

      <div style={{ paddingTop: 32, width: "100%", minHeight: "100vh" }}>
        {screen === "menubar" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 80px)", gap: 16, opacity: 0.3 }}>
            <span style={{ fontSize: 48 }}>{menuBarStyle.emoji}</span>
            <p style={{ fontFamily: mono, fontSize: 13, color: t.textFaint }}>Click <strong style={{ color: t.textMuted }}>{menuBarStyle.showLabel ? menuBarStyle.label : "the icon"}</strong> in the menu bar</p>
            <p style={{ fontFamily: mono, fontSize: 11, color: t.textGhost }}>⌘ + Shift + P — Quick Access</p>
          </div>
        )}

        {/* ── DROPDOWN ── */}
        {screen !== "menubar" && (
          <div style={{ position: "fixed", top: 32, right: 120, width: 420, maxHeight: 650, background: t.dropBg, borderRadius: 14, border: `1px solid ${t.dropBorder}`, boxShadow: t.dropShadow, overflow: "hidden", zIndex: 999, animation: fadeIn ? "dropIn 0.25s cubic-bezier(0.16,1,0.3,1)" : undefined, display: "flex", flexDirection: "column" }}>

            {/* ═══ UNLOCK ═══ */}
            {screen === "unlock" && (
              <div style={{ padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 8px 32px rgba(59,130,246,0.3)" }}>🔒</div>
                <div style={{ textAlign: "center" }}>
                  <h2 style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, margin: 0, color: t.text }}>Keychain Vault</h2>
                  <p style={{ fontSize: 12, color: t.textMuted, margin: "6px 0 0", fontFamily: mono }}>Enter master password to unlock</p>
                </div>
                <input ref={inputRef} type="password" placeholder="••••••••" value={masterInput} onChange={(e) => { setMasterInput(e.target.value); setError(false); }} onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  style={{ ...inputStyle, letterSpacing: 4, textAlign: "center", fontSize: 16, borderColor: error ? t.accentRed : t.inputBorder, animation: shakeError ? "shake 0.5s ease" : undefined }} />
                {error && <p style={{ fontSize: 11, color: t.accentRed, margin: 0, fontFamily: mono }}>✕ Incorrect password</p>}
                <button onClick={handleUnlock} style={btnPrimary}>Unlock Vault</button>
                <div style={{ display: "flex", gap: 16 }}><span style={{ fontSize: 10, color: t.textGhost, fontFamily: mono }}>◈ AES-256</span><span style={{ fontSize: 10, color: t.textGhost, fontFamily: mono }}>◈ Argon2id</span></div>
                <p style={{ fontSize: 10, color: t.textInvisible, marginTop: 8, fontFamily: mono }}>hint: try "demo"</p>
              </div>
            )}

            {/* ═══ VAULT ═══ */}
            {screen === "vault" && (
              <div style={{ display: "flex", flexDirection: "column", maxHeight: 650, overflow: "hidden" }}>
                {/* Top bar */}
                <div style={{ padding: "12px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>🔓</span>
                    <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: t.text }}>
                      {panel === "list" ? "Vault" : panel === "addNew" ? "New Item" : panel === "generator" ? "Generator" : panel === "tags" ? "Categories" : "Settings"}
                    </span>
                    {panel === "list" && <span style={{ fontSize: 10, color: t.accentGreen, fontFamily: mono, background: t.accentGreen + "1a", padding: "2px 8px", borderRadius: 10 }}>UNLOCKED</span>}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {panel !== "list" ? (
                      <button onClick={() => { setPanel("list"); resetNew(); setSelectedItem(null); }} style={{ ...footerBtn, color: t.textSecondary }}>← Back</button>
                    ) : (
                      <>
                        <button onClick={() => { setPanel("addNew"); setSelectedItem(null); resetNew(); }} style={{ ...footerBtn, color: t.accentBlueLt, background: t.accentBlue + "18" }}>+ New</button>
                        <button onClick={() => { setPanel("generator"); setSelectedItem(null); setGenPw(""); }} style={{ ...footerBtn, color: t.accentPurple, background: t.accentPurple + "14" }}>⚡</button>
                        <button onClick={() => { setPanel("settings"); setSelectedItem(null); }} style={{ ...footerBtn }}>⚙</button>
                        <button onClick={handleLock} style={{ ...footerBtn, color: t.accentRed }}>Lock</button>
                      </>
                    )}
                  </div>
                </div>

                {/* ════ LIST ════ */}
                {panel === "list" && (<>
                  <div style={{ padding: "10px 16px 0", flexShrink: 0 }}>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: t.textFaint, pointerEvents: "none" }}>⌕</span>
                      <input placeholder="Search vault…  ⌘K" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 34 }} />
                    </div>
                  </div>
                  {/* Type filter */}
                  <div style={{ display: "flex", gap: 2, padding: "8px 16px 0", flexShrink: 0 }}>
                    {[["all","All"],["login","Logins"],["card","Cards"],["note","Notes"]].map(([k,l]) => (
                      <button key={k} onClick={() => { setTypeFilter(k); setSelectedItem(null); }} style={pillBtn(typeFilter === k)}>{k === "card" ? "💳 " : k === "note" ? "📝 " : k === "login" ? "🔑 " : ""}{l}</button>
                    ))}
                  </div>
                  {/* Category filter */}
                  <div style={{ display: "flex", gap: 2, padding: "4px 16px 6px", overflowX: "auto", flexShrink: 0, alignItems: "center" }}>
                    <button onClick={() => { setActiveCategory("all"); setSelectedItem(null); }} style={pillBtn(activeCategory === "all")}>⊞ All</button>
                    {categories.map(cat => <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setSelectedItem(null); }} style={pillBtn(activeCategory === cat.key)}>{cat.icon} {cat.label}</button>)}
                    <button onClick={() => setPanel("tags")} style={{ ...pillBtn(false), color: t.textGhost, fontSize: 13 }}>＋</button>
                  </div>
                  {/* Items */}
                  <div style={{ flex: 1, overflowY: "auto", minHeight: 0, maxHeight: selectedItem ? 180 : 340 }}>
                    {sortedFiltered.map(item => (
                      <div key={item.id}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", cursor: "pointer", background: selectedItem === item.id ? t.activeBg : "transparent", borderLeft: selectedItem === item.id ? `2px solid ${t.accentBlue}` : "2px solid transparent", transition: "all 0.12s" }}
                        onClick={() => { setSelectedItem(selectedItem === item.id ? null : item.id); setShowPassword(false); setShowCardNum(false); setShowCvv(false); }}
                        onMouseEnter={(e) => { if (selectedItem !== item.id) e.currentTarget.style.background = t.hoverBg; }}
                        onMouseLeave={(e) => { if (selectedItem !== item.id) e.currentTarget.style.background = "transparent"; }}>
                        <div style={itemIconStyle(item.category)}>
                          {getTypeIcon(item.type) || getCatIcon(item.category)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: t.text }}>{item.name}</span>
                          </div>
                          <div style={{ fontFamily: mono, fontSize: 11, color: t.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.username || item.cardHolder || (item.noteText ? item.noteText.slice(0, 30) + "…" : "")}</div>
                        </div>
                        {/* Fav star */}
                        <button onClick={(e) => { e.stopPropagation(); toggleFav(item.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 2, color: item.fav ? "#fbbf24" : t.textGhost, transition: "color 0.15s", flexShrink: 0 }}>{item.fav ? "★" : "☆"}</button>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 10, color: t.textGhost, fontFamily: mono }}>{item.lastUsed}</div>
                          {item.strength != null && (
                            <div style={{ width: 36, height: 3, borderRadius: 2, marginTop: 3, background: t.fieldBg, overflow: "hidden", marginLeft: "auto" }}>
                              <div style={{ width: `${item.strength}%`, height: "100%", borderRadius: 2, background: strengthColor(item.strength) }} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {sortedFiltered.length === 0 && <div style={{ padding: "30px 16px", textAlign: "center", color: t.textGhost, fontSize: 12, fontFamily: mono }}>No items found</div>}
                  </div>
                  {/* Detail */}
                  {detailItem && (
                    <div style={{ padding: "14px 16px 10px", borderTop: `1px solid ${t.cardBorder}`, animation: fadeIn ? "slideUp 0.2s" : undefined, flexShrink: 0, overflowY: "auto", maxHeight: 260 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ ...itemIconStyle(detailItem.category), width: 28, height: 28, fontSize: 13 }}>{getTypeIcon(detailItem.type) || getCatIcon(detailItem.category)}</div>
                        <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: t.text, flex: 1 }}>{detailItem.name}</span>
                        <button onClick={() => toggleFav(detailItem.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: detailItem.fav ? "#fbbf24" : t.textGhost }}>{detailItem.fav ? "★" : "☆"}</button>
                      </div>
                      {detailItem.type === "login" && (<>
                        <div style={fieldRow}><div style={{ flex: 1 }}><div style={{ fontSize: 9, color: t.textFaint, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>URL</div><div style={{ fontSize: 13, fontFamily: mono, color: t.accentBlueLt, marginTop: 2 }}>{detailItem.url}</div></div><button onClick={() => handleCopy("url")} style={cpyBtn(copiedField === "url")}>{copiedField === "url" ? "✓" : "Copy"}</button></div>
                        <div style={fieldRow}><div><div style={{ fontSize: 9, color: t.textFaint, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>Username</div><div style={{ fontSize: 13, fontFamily: mono, color: t.text, marginTop: 2 }}>{detailItem.username}</div></div><button onClick={() => handleCopy("user")} style={cpyBtn(copiedField === "user")}>{copiedField === "user" ? "✓" : "Copy"}</button></div>
                        <div style={fieldRow}><div style={{ flex: 1 }}><div style={{ fontSize: 9, color: t.textFaint, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>Password</div><div style={{ fontSize: 13, fontFamily: mono, color: showPassword ? t.text : t.accentBlueLt, marginTop: 2 }}>{showPassword ? detailItem.password : "•".repeat(14)}</div></div><div style={{ display: "flex", gap: 4 }}><button onClick={() => setShowPassword(!showPassword)} style={cpyBtn(false)}>{showPassword ? "Hide" : "Show"}</button><button onClick={() => handleCopy("pass")} style={cpyBtn(copiedField === "pass")}>{copiedField === "pass" ? "✓" : "Copy"}</button></div></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 12px" }}><span style={{ fontSize: 9, color: t.textFaint, fontFamily: mono, letterSpacing: 1 }}>STRENGTH</span><div style={{ flex: 1, height: 4, borderRadius: 2, background: t.fieldBg, overflow: "hidden" }}><div style={{ width: `${detailItem.strength}%`, height: "100%", borderRadius: 2, background: strengthColor(detailItem.strength) }} /></div><span style={{ fontSize: 11, fontFamily: mono, color: strengthColor(detailItem.strength), fontWeight: 600 }}>{detailItem.strength}%</span></div>
                      </>)}
                      {detailItem.type === "card" && (<>
                        <div style={fieldRow}><div><div style={{ fontSize: 9, color: t.textFaint, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>Cardholder</div><div style={{ fontSize: 13, fontFamily: mono, color: t.text, marginTop: 2 }}>{detailItem.cardHolder}</div></div><button onClick={() => handleCopy("holder")} style={cpyBtn(copiedField === "holder")}>{copiedField === "holder" ? "✓" : "Copy"}</button></div>
                        <div style={fieldRow}><div style={{ flex: 1 }}><div style={{ fontSize: 9, color: t.textFaint, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>Card Number</div><div style={{ fontSize: 13, fontFamily: mono, color: showCardNum ? t.text : t.accentBlueLt, marginTop: 2, letterSpacing: 1 }}>{showCardNum ? detailItem.cardNumber : "•••• •••• •••• " + detailItem.cardNumber.slice(-4)}</div></div><div style={{ display: "flex", gap: 4 }}><button onClick={() => setShowCardNum(!showCardNum)} style={cpyBtn(false)}>{showCardNum ? "Hide" : "Show"}</button><button onClick={() => handleCopy("cardnum")} style={cpyBtn(copiedField === "cardnum")}>{copiedField === "cardnum" ? "✓" : "Copy"}</button></div></div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <div style={{ ...fieldRow, flex: 1 }}><div><div style={{ fontSize: 9, color: t.textFaint, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>Expiry</div><div style={{ fontSize: 13, fontFamily: mono, color: t.text, marginTop: 2 }}>{detailItem.expiry}</div></div><button onClick={() => handleCopy("exp")} style={cpyBtn(copiedField === "exp")}>{copiedField === "exp" ? "✓" : "Copy"}</button></div>
                          <div style={{ ...fieldRow, flex: 1 }}><div style={{ flex: 1 }}><div style={{ fontSize: 9, color: t.textFaint, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>CVV</div><div style={{ fontSize: 13, fontFamily: mono, color: showCvv ? t.text : t.accentBlueLt, marginTop: 2 }}>{showCvv ? detailItem.cvv : "•••"}</div></div><button onClick={() => setShowCvv(!showCvv)} style={cpyBtn(false)}>{showCvv ? "Hide" : "Show"}</button></div>
                        </div>
                      </>)}
                      {detailItem.type === "note" && (
                        <div style={{ ...fieldRow, flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                          <div style={{ fontSize: 9, color: t.textFaint, fontFamily: mono, letterSpacing: 1, textTransform: "uppercase" }}>Secure Note</div>
                          <div style={{ fontSize: 12, fontFamily: mono, color: t.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{detailItem.noteText}</div>
                          <button onClick={() => handleCopy("note")} style={{ ...cpyBtn(copiedField === "note"), alignSelf: "flex-end" }}>{copiedField === "note" ? "✓ Copied" : "Copy All"}</button>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ padding: "8px 16px", borderTop: `1px solid ${t.cardBorder}`, display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: t.textInvisible, fontFamily: mono }}>{vaultData.length} items · AES-256</span>
                    <span style={{ fontSize: 10, color: t.textInvisible, fontFamily: mono }}>Auto-lock: {autoLockEnabled ? autoLockMin + "m" : "Off"}</span>
                  </div>
                </>)}

                {/* ════ ADD NEW ════ */}
                {panel === "addNew" && (
                  <div style={{ padding: "16px", overflowY: "auto", flex: 1, animation: fadeIn ? "slideUp 0.2s" : undefined }}>
                    {newSaved ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px 0", gap: 16 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: t.accentGreen + "1e", display: "flex", alignItems: "center", justifyContent: "center", animation: "successPop 0.4s ease" }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.accentGreen} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" style={{ strokeDasharray: 20, animation: "checkDraw 0.4s ease forwards" }} /></svg>
                        </div>
                        <p style={{ fontFamily: mono, fontSize: 14, fontWeight: 600, color: t.accentGreen }}>Saved to Vault</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {/* Type selector */}
                        <div>
                          <label style={labelStyle}>Item Type</label>
                          <div style={{ display: "flex", gap: 4 }}>
                            {[["login","🔑 Login"],["card","💳 Card"],["note","📝 Note"]].map(([k,l]) => (
                              <button key={k} onClick={() => setNewType(k)} style={{ ...pillBtn(newType === k), border: newType === k ? `1px solid ${t.accentBlue}44` : `1px solid ${t.inputBorder}`, padding: "7px 16px", fontSize: 12 }}>{l}</button>
                            ))}
                          </div>
                        </div>
                        <div><label style={labelStyle}>Name</label><input placeholder={newType === "card" ? "e.g. Visa •••• 1234" : newType === "note" ? "e.g. Recovery Codes" : "e.g. GitHub"} value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} autoFocus /></div>

                        {newType === "login" && (<>
                          <div><label style={labelStyle}>Domain / URL</label><input placeholder="e.g. github.com" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Username / Email</label><input placeholder="e.g. user@email.com" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={inputStyle} /></div>
                          <div>
                            <label style={labelStyle}>Password</label>
                            <div style={{ display: "flex", gap: 6 }}>
                              <div style={{ flex: 1, position: "relative" }}>
                                <input type={showNewPw ? "text" : "password"} placeholder="Enter or generate…" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 44 }} />
                                <button onClick={() => setShowNewPw(!showNewPw)} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: t.textFaint, cursor: "pointer", fontSize: 11, fontFamily: mono, padding: "4px 6px" }}>{showNewPw ? "Hide" : "Show"}</button>
                              </div>
                              <button onClick={() => setNewPassword(genRandomPassword(20, true, true))} style={{ padding: "0 14px", borderRadius: 8, border: `1px solid ${t.accentPurple}33`, background: t.accentPurple + "14", color: t.accentPurple, fontSize: 12, cursor: "pointer", fontFamily: mono, fontWeight: 600, whiteSpace: "nowrap" }}>⚡ Gen</button>
                            </div>
                            {newPassword && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}><div style={{ flex: 1, height: 4, borderRadius: 2, background: t.fieldBg, overflow: "hidden" }}><div style={{ width: `${newPwStrength}%`, height: "100%", borderRadius: 2, background: strengthColor(newPwStrength), transition: "width 0.3s" }} /></div><span style={{ fontSize: 10, fontFamily: mono, color: strengthColor(newPwStrength), fontWeight: 600 }}>{strengthLabel(newPwStrength)} {newPwStrength}%</span></div>}
                          </div>
                        </>)}

                        {newType === "card" && (<>
                          <div><label style={labelStyle}>Cardholder Name</label><input placeholder="e.g. John Doe" value={newCardHolder} onChange={(e) => setNewCardHolder(e.target.value)} style={inputStyle} /></div>
                          <div><label style={labelStyle}>Card Number</label><input placeholder="e.g. 4539 1234 5678 9012" value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value)} style={{ ...inputStyle, letterSpacing: 2 }} /></div>
                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ flex: 1 }}><label style={labelStyle}>Expiry</label><input placeholder="MM/YY" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} style={inputStyle} /></div>
                            <div style={{ flex: 1 }}><label style={labelStyle}>CVV</label><input type="password" placeholder="•••" value={newCvv} onChange={(e) => setNewCvv(e.target.value)} style={inputStyle} /></div>
                          </div>
                        </>)}

                        {newType === "note" && (
                          <div><label style={labelStyle}>Secure Note</label><textarea placeholder="Enter your secure note…" value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} rows={5} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} /></div>
                        )}

                        <div>
                          <label style={labelStyle}>Category</label>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {categories.map(cat => <button key={cat.key} onClick={() => setNewCategory(cat.key)} style={{ ...pillBtn(newCategory === cat.key), border: newCategory === cat.key ? `1px solid ${t.accentBlue}44` : `1px solid ${t.inputBorder}`, padding: "6px 14px" }}>{cat.icon} {cat.label}</button>)}
                          </div>
                        </div>
                        <button onClick={handleSaveNew} disabled={!newName || (newType === "login" && (!newUsername || !newPassword)) || (newType === "card" && !newCardNumber) || (newType === "note" && !newNoteText)}
                          style={{ ...btnPrimary, marginTop: 4, opacity: 0.4, ...(newName && ((newType === "login" && newUsername && newPassword) || (newType === "card" && newCardNumber) || (newType === "note" && newNoteText)) ? { opacity: 1, cursor: "pointer" } : { cursor: "not-allowed" }) }}>
                          🔒 Encrypt & Save
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ════ GENERATOR ════ */}
                {panel === "generator" && (
                  <div style={{ padding: "16px", overflowY: "auto", flex: 1, animation: fadeIn ? "slideUp 0.2s" : undefined }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      <button onClick={() => handleCopy("gen")} style={{ ...cpyBtn(copiedField === "gen"), padding: "6px 14px" }}>{copiedField === "gen" ? "✓ Copied" : "Copy"}</button>
                      <button onClick={doGenerate} style={{ ...cpyBtn(false), padding: "6px 10px", fontSize: 14 }}>↻</button>
                      <div style={{ flex: 1 }} />
                      <button onClick={doGenerate} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: mono }}>Autofill</button>
                    </div>
                    <div style={{ ...fieldRow, minHeight: 48, marginBottom: 4 }}>
                      <div style={{ fontFamily: mono, fontSize: 14, color: genPw ? t.text : t.textGhost, flex: 1, wordBreak: "break-all", lineHeight: 1.5 }}>
                        {genGenerating ? <span style={{ animation: "pulse 0.8s infinite", color: t.textFaint }}>generating…</span> : genPw || "Click ↻ or Autofill"}
                      </div>
                    </div>
                    {genPw && <div style={{ height: 4, borderRadius: 2, background: t.fieldBg, overflow: "hidden", marginBottom: 16 }}><div style={{ width: `${genPwStrength}%`, height: "100%", borderRadius: 2, background: strengthColor(genPwStrength), transition: "width 0.3s" }} /></div>}
                    {!genPw && <div style={{ height: 20 }} />}
                    <div style={{ borderTop: `1px solid ${t.cardBorder}`, marginBottom: 16 }} />
                    <div style={settingRow}><span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>Type</span><Dropdown value={genType} options={["Random Password","Memorable Password","PIN Code"]} onChange={(v) => { setGenType(v); setGenPw(""); }} width={190} t={t} /></div>
                    {genType === "Random Password" && (<>
                      <div style={{ ...settingRow, flexDirection: "column", alignItems: "stretch", gap: 8 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>Characters</span><span style={{ fontSize: 13, fontFamily: mono, color: t.accentBlueLt, fontWeight: 600, background: t.accentBlue + "14", padding: "2px 10px", borderRadius: 6 }}>{genLen}</span></div><input type="range" min={8} max={50} value={genLen} onChange={(e) => setGenLen(+e.target.value)} style={{ width: "100%", accentColor: t.accentBlue }} /></div>
                      <div style={settingRow}><span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>Numbers</span><Toggle on={genNumbers} onChange={() => setGenNumbers(!genNumbers)} t={t} /></div>
                      <div style={settingRow}><span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>Symbols</span><Toggle on={genSymbols} onChange={() => setGenSymbols(!genSymbols)} t={t} /></div>
                    </>)}
                    {genType === "Memorable Password" && (<>
                      <div style={{ ...settingRow, flexDirection: "column", alignItems: "stretch", gap: 8 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>Words</span><span style={{ fontSize: 13, fontFamily: mono, color: t.accentBlueLt, fontWeight: 600, background: t.accentBlue + "14", padding: "2px 10px", borderRadius: 6 }}>{genWords}</span></div><input type="range" min={2} max={8} value={genWords} onChange={(e) => setGenWords(+e.target.value)} style={{ width: "100%", accentColor: t.accentBlue }} /></div>
                      <div style={settingRow}><span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>Separator</span><Dropdown value={genSeparator} options={["Hyphens","Periods","Spaces","Commas","Underscores","Numbers"]} onChange={setGenSeparator} width={140} t={t} /></div>
                      <div style={settingRow}><span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>Capitalize</span><Toggle on={genCapitalize} onChange={() => setGenCapitalize(!genCapitalize)} t={t} /></div>
                      <div style={settingRow}><span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>Full Words</span><Toggle on={genFullWords} onChange={() => setGenFullWords(!genFullWords)} t={t} /></div>
                    </>)}
                    {genType === "PIN Code" && (
                      <div style={{ ...settingRow, flexDirection: "column", alignItems: "stretch", gap: 8 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>Digits</span><span style={{ fontSize: 13, fontFamily: mono, color: t.accentBlueLt, fontWeight: 600, background: t.accentBlue + "14", padding: "2px 10px", borderRadius: 6 }}>{genPinLen}</span></div><input type="range" min={4} max={12} value={genPinLen} onChange={(e) => setGenPinLen(+e.target.value)} style={{ width: "100%", accentColor: t.accentBlue }} /></div>
                    )}
                    <div style={{ borderTop: `1px solid ${t.cardBorder}`, marginTop: 12, paddingTop: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.textGhost, fontSize: 12, fontFamily: mono, cursor: "pointer" }}><span>⏱</span><span>Password Generator History</span><span style={{ marginLeft: "auto" }}>›</span></div>
                    </div>
                  </div>
                )}

                {/* ════ TAGS ════ */}
                {panel === "tags" && (
                  <div style={{ padding: "16px", overflowY: "auto", flex: 1, animation: fadeIn ? "slideUp 0.2s" : undefined }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                      {categories.map(cat => {
                        const isDef = ["dev","personal","finance","entertainment"].includes(cat.key);
                        return (<div key={cat.key} style={{ ...fieldRow, marginBottom: 0 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ ...itemIconStyle(cat.key), width: 28, height: 28, fontSize: 13 }}>{cat.icon}</div><span style={{ fontFamily: mono, fontSize: 13, color: t.text }}>{cat.label}</span></div>{isDef ? <span style={{ fontSize: 9, color: t.textGhost, fontFamily: mono }}>DEFAULT</span> : <button onClick={() => handleRemoveTag(cat.key)} style={{ ...cpyBtn(false), color: t.accentRed, fontSize: 13, padding: "2px 8px" }}>✕</button>}</div>);
                      })}
                    </div>
                    <div style={{ borderTop: `1px solid ${t.cardBorder}`, paddingTop: 16 }}>
                      <label style={{ ...labelStyle, marginBottom: 10 }}>Add New Category</label>
                      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                        {TAG_ICONS.map(icon => <button key={icon} onClick={() => setNewTagIcon(icon)} style={{ width: 30, height: 30, borderRadius: 8, border: newTagIcon === icon ? `1px solid ${t.focusBorder}` : `1px solid ${t.inputBorder}`, background: newTagIcon === icon ? t.activeBg : t.fieldBg, color: t.text, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</button>)}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input placeholder="Category name…" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddTag()} style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={handleAddTag} disabled={!newTagName.trim()} style={{ ...cpyBtn(false), color: newTagName.trim() ? t.accentBlueLt : t.textGhost, padding: "8px 16px", fontWeight: 600, opacity: newTagName.trim() ? 1 : 0.5 }}>Add</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════ SETTINGS ════ */}
                {panel === "settings" && (
                  <div style={{ padding: "16px", overflowY: "auto", flex: 1, animation: fadeIn ? "slideUp 0.2s" : undefined }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                      {/* Theme */}
                      <div style={settingRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{theme === "dark" ? "🌙" : "☀️"}</span>
                          <span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
                        </div>
                        <Toggle on={theme === "light"} onChange={() => setTheme(theme === "dark" ? "light" : "dark")} accentColor="#f59e0b" t={t} />
                      </div>

                      {/* Menu bar icon */}
                      <div>
                        <label style={{ ...labelStyle, marginBottom: 10 }}>Menu Bar Icon</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          {MENUBAR_ICON_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => setMenuBarStyle(opt)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: menuBarStyle.id === opt.id ? `1px solid ${t.focusBorder}` : `1px solid ${t.inputBorder}`, background: menuBarStyle.id === opt.id ? t.activeBg : t.fieldBg, transition: "all 0.15s" }}>
                              <div style={{ background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderRadius: 4, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                                <span style={{ fontSize: opt.emoji.length > 2 ? 11 : 13 }}>{opt.emoji}</span>
                                {opt.showLabel && <span style={{ fontSize: 10, fontWeight: 600, fontFamily: mono, color: t.text }}>{opt.label}</span>}
                              </div>
                              {menuBarStyle.id === opt.id && <span style={{ fontSize: 10, color: t.accentBlue, marginLeft: "auto" }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Auto-lock */}
                      <div>
                        <div style={settingRow}><span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>Auto-Lock</span><Toggle on={autoLockEnabled} onChange={() => setAutoLockEnabled(!autoLockEnabled)} t={t} /></div>
                        {autoLockEnabled && <div style={{ paddingLeft: 4 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 11, fontFamily: mono, color: t.textFaint }}>Timer</span><span style={{ fontSize: 12, fontFamily: mono, color: t.accentBlueLt, fontWeight: 600 }}>{autoLockMin} min</span></div><input type="range" min={1} max={30} value={autoLockMin} onChange={(e) => setAutoLockMin(+e.target.value)} style={{ width: "100%", accentColor: t.accentBlue }} /><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 9, color: t.textGhost, fontFamily: mono }}>1m</span><span style={{ fontSize: 9, color: t.textGhost, fontFamily: mono }}>30m</span></div></div>}
                      </div>

                      {/* Clipboard */}
                      <div>
                        <div style={settingRow}><span style={{ fontSize: 13, fontFamily: mono, color: t.text }}>Clear Clipboard</span><Toggle on={clipboardClearEnabled} onChange={() => setClipboardClearEnabled(!clipboardClearEnabled)} t={t} /></div>
                        {clipboardClearEnabled && <div style={{ paddingLeft: 4 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 11, fontFamily: mono, color: t.textFaint }}>After</span><span style={{ fontSize: 12, fontFamily: mono, color: t.accentBlueLt, fontWeight: 600 }}>{clipboardClear}s</span></div><input type="range" min={5} max={120} step={5} value={clipboardClear} onChange={(e) => setClipboardClear(+e.target.value)} style={{ width: "100%", accentColor: t.accentBlue }} /><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 9, color: t.textGhost, fontFamily: mono }}>5s</span><span style={{ fontSize: 9, color: t.textGhost, fontFamily: mono }}>120s</span></div></div>}
                      </div>

                      {/* Import / Export */}
                      <div>
                        <label style={{ ...labelStyle, marginBottom: 10 }}>Data</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <button onClick={() => { setShowImportSuccess(true); setTimeout(() => setShowImportSuccess(false), 2000); }}
                            style={{ ...fieldRow, cursor: "pointer", marginBottom: 0, border: `1px solid ${t.inputBorder}`, transition: "all 0.15s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 16 }}>📥</span>
                              <div>
                                <div style={{ fontSize: 13, fontFamily: mono, color: t.text, fontWeight: 500 }}>Import</div>
                                <div style={{ fontSize: 10, fontFamily: mono, color: t.textFaint }}>1Password, CSV, JSON, Bitwarden</div>
                              </div>
                            </div>
                            {showImportSuccess ? <span style={{ fontSize: 11, color: t.accentGreen, fontFamily: mono }}>✓ Imported</span> : <span style={{ color: t.textGhost }}>›</span>}
                          </button>
                          <button onClick={() => { setShowExportSuccess(true); setTimeout(() => setShowExportSuccess(false), 2000); }}
                            style={{ ...fieldRow, cursor: "pointer", marginBottom: 0, border: `1px solid ${t.inputBorder}`, transition: "all 0.15s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 16 }}>📤</span>
                              <div>
                                <div style={{ fontSize: 13, fontFamily: mono, color: t.text, fontWeight: 500 }}>Export</div>
                                <div style={{ fontSize: 10, fontFamily: mono, color: t.textFaint }}>Encrypted backup or CSV</div>
                              </div>
                            </div>
                            {showExportSuccess ? <span style={{ fontSize: 11, color: t.accentGreen, fontFamily: mono }}>✓ Exported</span> : <span style={{ color: t.textGhost }}>›</span>}
                          </button>
                        </div>
                      </div>

                      {/* Security */}
                      <div style={{ background: t.cardBg, borderRadius: 10, border: `1px solid ${t.cardBorder}`, padding: 14 }}>
                        <div style={{ ...labelStyle, marginBottom: 10, color: t.textMuted }}>Security</div>
                        {[["◈ Encryption","AES-256-GCM"],["◈ KDF","Argon2id"],["◈ Storage","Local only"],["◈ Network","None"],["◈ Biometrics","Touch ID"]].map(([l,v])=><div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 11, fontFamily: mono, color: t.textFaint }}>{l}</span><span style={{ fontSize: 11, fontFamily: mono, color: t.textSecondary, fontWeight: 500 }}>{v}</span></div>)}
                      </div>

                      <div style={{ background: t.cardBg, borderRadius: 8, padding: "10px 12px", border: `1px solid ${t.cardBorder}` }}>
                        <div style={{ ...labelStyle, marginBottom: 4 }}>Vault Location</div>
                        <div style={{ fontSize: 11, fontFamily: mono, color: t.textFaint, wordBreak: "break-all" }}>~/Library/Application Support/KeychainVault/vault.enc</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
