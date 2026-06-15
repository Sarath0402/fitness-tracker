import { useState, useCallback, useEffect } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import {
  doc, getDoc, setDoc, collection,
  addDoc, getDocs, query, orderBy, deleteDoc
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

/* ═══════════════════════════════════════════
   STYLES
═══════════════════════════════════════════ */
const S = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#060608;--s1:#0d0d12;--s2:#13131a;--s3:#1a1a24;--s4:#22222e;
  --border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.12);
  --accent:#7c6aff;--accent2:#a78bfa;--accentg:rgba(124,106,255,0.15);
  --green:#4ade80;--greeng:rgba(74,222,128,0.12);
  --amber:#fbbf24;--amberg:rgba(251,191,36,0.12);
  --red:#f87171;--redg:rgba(248,113,113,0.12);
  --blue:#60a5fa;--blueg:rgba(96,165,250,0.12);
  --pink:#f472b6;--pinkg:rgba(244,114,182,0.12);
  --cyan:#22d3ee;--cyang:rgba(34,211,238,0.12);
  --text:#eeeef2;--muted:#6b6b80;--muted2:#3a3a4a;
  --r:14px;--rs:8px;--rp:20px;
}
body{background:var(--bg);overflow-x:hidden;}
input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;}
input[type=number]{-moz-appearance:textfield;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:var(--bg);}
::-webkit-scrollbar-thumb{background:var(--s4);border-radius:4px;}
.app{font-family:'Inter',sans-serif;min-height:100vh;background:var(--bg);color:var(--text);}

/* ── NAV ── */
.nav{display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:64px;
  border-bottom:1px solid var(--border);position:sticky;top:0;
  background:rgba(6,6,8,0.9);backdrop-filter:blur(16px);z-index:100;}
.nav-logo{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.5px;
  background:linear-gradient(135deg,#fff 30%,var(--accent2));-webkit-background-clip:text;
  -webkit-text-fill-color:transparent;background-clip:text;}
.nav-right{display:flex;align-items:center;gap:12px;}
.nav-tabs{display:flex;gap:4px;}
.nav-tab{background:transparent;border:none;color:var(--muted);font-family:'Inter',sans-serif;
  font-size:13px;font-weight:500;padding:7px 14px;border-radius:var(--rs);cursor:pointer;transition:all .15s;}
.nav-tab:hover{color:var(--text);background:var(--s3);}
.nav-tab.active{color:var(--text);background:var(--s3);}
.nav-avatar{width:32px;height:32px;border-radius:50%;border:2px solid var(--accent);cursor:pointer;}
.nav-signout{background:transparent;border:1px solid var(--border);color:var(--muted);
  font-family:'Inter',sans-serif;font-size:12px;padding:6px 12px;border-radius:var(--rs);cursor:pointer;transition:all .15s;}
.nav-signout:hover{border-color:var(--red);color:var(--red);}

/* hamburger */
.nav-hamburger{display:none;flex-direction:column;justify-content:center;gap:5px;
  background:transparent;border:none;cursor:pointer;padding:6px;border-radius:var(--rs);}
.nav-hamburger span{display:block;width:22px;height:2px;background:var(--text);border-radius:2px;transition:all .2s;}

/* mobile dropdown */
.nav-mobile-menu{display:none;position:absolute;top:64px;left:0;right:0;
  background:rgba(13,13,18,0.98);backdrop-filter:blur(16px);
  border-bottom:1px solid var(--border);z-index:99;padding:12px 16px 16px;flex-direction:column;gap:6px;}
.nav-mobile-menu.open{display:flex;}
.nav-mobile-tab{background:transparent;border:none;color:var(--muted);font-family:'Inter',sans-serif;
  font-size:14px;font-weight:500;padding:11px 14px;border-radius:var(--rs);cursor:pointer;
  transition:all .15s;text-align:left;width:100%;}
.nav-mobile-tab:hover{color:var(--text);background:var(--s3);}
.nav-mobile-tab.active{color:var(--text);background:var(--s3);}
.nav-mobile-divider{border:none;border-top:1px solid var(--border);margin:6px 0;}
.nav-mobile-bottom{display:flex;align-items:center;justify-content:space-between;padding:8px 14px 0;}

@media(max-width:640px){
  .nav-tabs{display:none;}
  .nav-hamburger{display:flex;}
  .nav-signout{display:none;}
}

/* ── UNIT TOGGLE ── */
.unit-toggle{display:flex;background:var(--s3);border-radius:var(--rs);padding:3px;gap:2px;}
.unit-btn{background:transparent;border:none;color:var(--muted);font-size:12px;font-weight:600;
  font-family:'Inter',sans-serif;padding:5px 10px;border-radius:6px;cursor:pointer;transition:all .15s;}
.unit-btn.active{background:var(--s4);color:var(--text);}

/* ── HERO ── */
.hero{display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:calc(100vh - 64px);text-align:center;padding:40px 24px;position:relative;overflow:hidden;}
.hero-glow{position:absolute;width:600px;height:600px;border-radius:50%;
  background:radial-gradient(circle,rgba(124,106,255,0.08) 0%,transparent 70%);
  top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;}
.hero-eyebrow{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:var(--accent2);margin-bottom:24px;font-weight:600;}
.hero-title{font-family:'Syne',sans-serif;font-size:clamp(56px,10vw,108px);
  line-height:.9;font-weight:800;letter-spacing:-2px;color:var(--text);margin-bottom:24px;}
.hero-title em{font-style:normal;color:var(--accent2);}
.hero-sub{font-size:16px;color:var(--muted);max-width:380px;line-height:1.7;margin-bottom:48px;font-weight:300;}
.hero-features{display:flex;gap:24px;margin-bottom:48px;flex-wrap:wrap;justify-content:center;}
.hero-feat{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px;}
.hero-feat::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--accent);flex-shrink:0;}

/* ── BUTTONS ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-family:'Inter',sans-serif;font-weight:600;cursor:pointer;border:none;transition:all .15s;white-space:nowrap;}
.btn-accent{background:var(--accent);color:#fff;font-size:14px;border-radius:var(--rp);padding:13px 28px;}
.btn-accent:hover{background:var(--accent2);transform:translateY(-1px);}
.btn-outline{background:transparent;color:var(--text);font-size:13px;
  border:1px solid var(--border2);border-radius:var(--rs);padding:9px 18px;}
.btn-outline:hover{border-color:var(--accent);color:var(--accent);}
.btn-green{background:var(--greeng);color:var(--green);font-size:13px;
  border:1px solid rgba(74,222,128,0.2);border-radius:var(--rs);padding:9px 16px;}
.btn-green:hover{background:rgba(74,222,128,0.2);}
.btn-blue{background:var(--blueg);color:var(--blue);font-size:13px;
  border:1px solid rgba(96,165,250,0.2);border-radius:var(--rs);padding:9px 16px;}
.btn-blue:hover{background:rgba(96,165,250,0.22);}
.btn-sm{padding:7px 14px;font-size:12px;border-radius:var(--rs);}
.btn-xs{padding:5px 10px;font-size:11px;border-radius:6px;}
.btn-danger{background:var(--redg);color:var(--red);font-size:12px;
  border:1px solid rgba(248,113,113,0.2);border-radius:var(--rs);padding:7px 14px;}
.btn-danger:hover{background:rgba(248,113,113,0.2);}
.btn-full{width:100%;}
.btn-amber{background:var(--amberg);color:var(--amber);font-size:13px;
  border:1px solid rgba(251,191,36,0.2);border-radius:var(--rs);padding:9px 16px;}
.btn-amber:hover{background:rgba(251,191,36,0.22);}

/* ── CARDS ── */
.card{background:var(--s1);border:1px solid var(--border);border-radius:var(--r);
  padding:22px;transition:border-color .2s;position:relative;}
.card:hover{border-color:var(--border2);}
.card-accent{border-color:rgba(124,106,255,0.25);background:linear-gradient(135deg,rgba(124,106,255,0.04),var(--s1));}
.card-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--muted2);
  font-weight:600;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.card-label-dot{width:6px;height:6px;border-radius:50%;}
.stat-num{font-family:'Syne',sans-serif;font-size:48px;font-weight:800;line-height:1;letter-spacing:-1px;color:var(--text);}
.stat-unit{font-family:'Inter',sans-serif;font-size:16px;color:var(--muted);font-weight:300;}
.stat-sub{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.5;}

/* ── LAYOUT ── */
.dash{padding:28px 32px;max-width:1300px;margin:0 auto;}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
.col-span-2{grid-column:span 2;}
@media(max-width:900px){.grid-3{grid-template-columns:1fr 1fr;}.grid-4{grid-template-columns:1fr 1fr;}}
@media(max-width:600px){.grid-3,.grid-2,.grid-4{grid-template-columns:1fr;}.col-span-2{grid-column:span 1;}}
@media(max-width:900px){.water-cups{gap:6px;}.water-cup{width:auto;flex:1;}}

/* ── BADGES ── */
.badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;
  padding:4px 10px;border-radius:20px;letter-spacing:.3px;}
.badge-green{background:var(--greeng);color:var(--green);}
.badge-amber{background:var(--amberg);color:var(--amber);}
.badge-red{background:var(--redg);color:var(--red);}
.badge-blue{background:var(--blueg);color:var(--blue);}
.badge-purple{background:var(--accentg);color:var(--accent2);}
.badge-cyan{background:var(--cyang);color:var(--cyan);}

/* ── PROGRESS ── */
.prog-track{background:var(--s3);border-radius:6px;height:5px;overflow:hidden;margin-top:12px;}
.prog-fill{height:100%;border-radius:6px;transition:width .6s cubic-bezier(.34,1.56,.64,1);}

/* ── FORM ── */
.form-wrap{min-height:calc(100vh - 64px);display:flex;align-items:center;justify-content:center;padding:40px 24px;}
.form-card{background:var(--s1);border:1px solid var(--border);border-radius:20px;padding:40px;width:100%;max-width:520px;}
.form-title{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;letter-spacing:-1px;margin-bottom:4px;}
.form-sub{font-size:13px;color:var(--muted);margin-bottom:28px;}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;}
.form-group{display:flex;flex-direction:column;gap:6px;}
.form-group.full{grid-column:1/-1;}
.form-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted2);font-weight:600;}
.inp{background:var(--s2);border:1px solid var(--border);border-radius:var(--rs);
  color:var(--text);font-family:'Inter',sans-serif;font-size:14px;
  padding:10px 14px;width:100%;outline:none;transition:border-color .15s;}
.inp:focus{border-color:var(--accent);}
.inp::placeholder{color:var(--muted2);}
.inp.sm{padding:8px 12px;font-size:13px;}
select.inp{cursor:pointer;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23555' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;}

/* ── DIVIDER ── */
.div{border:none;border-top:1px solid var(--border);margin:16px 0;}

/* ── MACRO BARS ── */
.macro-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.macro-name{font-size:12px;color:var(--muted);width:54px;flex-shrink:0;}
.macro-track{flex:1;background:var(--s3);border-radius:4px;height:4px;overflow:hidden;}
.macro-fill{height:100%;border-radius:4px;transition:width .5s ease;}
.macro-val{font-size:12px;color:var(--text);font-weight:500;min-width:70px;text-align:right;}

/* ── MEAL TABS ── */
.meal-tabs{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;}
.meal-tab{background:var(--s3);border:1px solid var(--border);color:var(--muted);
  font-size:12px;font-weight:500;font-family:'Inter',sans-serif;
  padding:6px 14px;border-radius:20px;cursor:pointer;transition:all .15s;}
.meal-tab.active{background:var(--accentg);border-color:rgba(124,106,255,0.3);color:var(--accent2);}

/* ── FOOD SEARCH ── */
.food-search-wrap{position:relative;}
.food-results{position:absolute;top:calc(100% + 6px);left:0;right:0;
  background:var(--s2);border:1px solid var(--border2);border-radius:var(--r);
  z-index:999;max-height:420px;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.8);}
.food-result-item{display:flex;justify-content:space-between;align-items:center;
  padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .12s;}
.food-result-item:last-child{border-bottom:none;}
.food-result-item:hover{background:var(--s3);}
.food-result-name{font-size:13px;font-weight:500;color:var(--text);margin-bottom:2px;}
.food-result-brand{font-size:11px;color:var(--muted);}
.food-result-macros{display:flex;gap:10px;font-size:11px;}
.food-result-macros span{padding:2px 7px;border-radius:10px;}
.food-spinner{display:flex;align-items:center;justify-content:center;padding:20px;color:var(--muted);font-size:13px;gap:8px;}
.spin{width:16px;height:16px;border:2px solid var(--border2);border-top-color:var(--accent);
  border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.food-empty{padding:20px;text-align:center;color:var(--muted);font-size:13px;}

/* ── FOOD CART ── */
.cart-item{display:flex;justify-content:space-between;align-items:center;
  padding:10px 12px;background:var(--s2);border-radius:var(--rs);margin-bottom:8px;
  border:1px solid var(--border);}
.cart-item-name{font-size:13px;font-weight:500;color:var(--text);}
.cart-item-macros{font-size:11px;color:var(--muted);margin-top:2px;}
.cart-item-right{display:flex;align-items:center;gap:8px;}
.cart-totals{background:var(--accentg);border:1px solid rgba(124,106,255,0.2);
  border-radius:var(--rs);padding:12px 16px;margin:12px 0;}
.cart-total-row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;}
.cart-total-row:last-child{margin-bottom:0;}

/* ── QUANTITY MODAL ── */
.qty-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;
  display:flex;align-items:center;justify-content:center;padding:24px;}
.qty-panel{background:var(--s1);border:1px solid var(--border2);border-radius:20px;
  padding:32px;width:100%;max-width:420px;}
.qty-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;margin-bottom:4px;}
.qty-sub{font-size:12px;color:var(--muted);margin-bottom:20px;}
.qty-macros-preview{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0;}
.qty-macro-box{background:var(--s2);border-radius:var(--rs);padding:10px;text-align:center;}
.qty-macro-label{font-size:10px;color:var(--muted);margin-bottom:4px;letter-spacing:1px;text-transform:uppercase;}
.qty-macro-val{font-size:16px;font-weight:700;font-family:'Syne',sans-serif;}

/* ── WATER TRACKER ── */
.water-cups{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;}
.water-cup{width:36px;height:44px;border-radius:4px 4px 8px 8px;
  border:2px solid var(--border2);cursor:pointer;transition:all .2s;
  display:flex;align-items:flex-end;overflow:hidden;padding:0;}
.water-cup.filled{border-color:var(--cyan);}
.water-cup-fill{width:100%;background:linear-gradient(to top,var(--cyan),rgba(34,211,238,0.5));
  border-radius:0 0 6px 6px;transition:height .3s ease;}
.water-cup:hover{border-color:var(--cyan);transform:translateY(-2px);}

/* ── WEEKLY ── */
.week-row{display:flex;justify-content:space-between;align-items:center;
  padding:10px 0;border-bottom:1px solid var(--border);}
.week-row:last-child{border-bottom:none;}
.week-day{font-size:13px;color:var(--muted);width:80px;}
.week-bar-wrap{flex:1;margin:0 12px;}
.week-bar-bg{background:var(--s3);border-radius:4px;height:6px;overflow:hidden;}
.week-bar-fill{height:100%;border-radius:4px;background:var(--accent);transition:width .5s ease;}
.week-cal{font-size:12px;color:var(--text);font-weight:500;min-width:70px;text-align:right;}

/* ── SECTION HEADER ── */
.section-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}

/* ── TOOLTIP ── */
.tt{background:var(--s2);border:1px solid var(--border2);border-radius:10px;padding:10px 14px;font-family:'Inter',sans-serif;}
.tt-label{font-size:11px;color:var(--muted);margin-bottom:3px;}
.tt-val{font-size:14px;font-weight:600;color:var(--accent2);}

/* ── TOAST ── */
.toast{position:fixed;bottom:24px;right:24px;background:var(--s2);
  border:1px solid var(--border2);border-left:3px solid var(--green);
  border-radius:10px;padding:12px 18px;font-size:13px;color:var(--text);
  z-index:300;animation:toastIn .25s ease;display:flex;align-items:center;gap:8px;}
@keyframes toastIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}

/* ── OVERLAY PANELS ── */
.edit-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:150;
  display:flex;align-items:center;justify-content:center;padding:24px;}
.edit-panel{background:var(--s1);border:1px solid var(--border2);border-radius:20px;
  padding:36px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;}
.edit-title{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;margin-bottom:4px;}
.edit-sub{font-size:13px;color:var(--muted);margin-bottom:24px;}

/* ── STREAK ── */
.streak-num{font-family:'Syne',sans-serif;font-size:52px;font-weight:800;color:var(--amber);line-height:1;}

/* ── MILESTONES ── */
.milestone-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.ms-item{display:flex;flex-direction:column;align-items:center;gap:6px;
  padding:16px 8px;background:var(--s2);border-radius:var(--rs);border:1px solid var(--border);transition:all .2s;}
.ms-item.earned{border-color:rgba(124,106,255,0.3);background:var(--accentg);}
.ms-icon{font-size:24px;line-height:1;}
.ms-label{font-size:10px;text-align:center;color:var(--muted);font-weight:500;line-height:1.3;}
.ms-item.earned .ms-label{color:var(--accent2);}
.ms-item.locked{opacity:.35;}

/* ── AUTH LOADING ── */
.auth-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:calc(100vh - 64px);gap:16px;}
.auth-loading-ring{width:40px;height:40px;border:3px solid var(--border2);
  border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;}
.auth-loading-text{font-size:14px;color:var(--muted);}

/* ── NUTR TABS (sub nav) ── */
.sub-tabs{display:flex;gap:4px;margin-bottom:20px;background:var(--s2);
  border-radius:var(--r);padding:4px;width:fit-content;}
.sub-tab{background:transparent;border:none;color:var(--muted);font-family:'Inter',sans-serif;
  font-size:13px;font-weight:500;padding:8px 16px;border-radius:10px;cursor:pointer;transition:all .15s;}
.sub-tab.active{background:var(--s4);color:var(--text);}
`;

/* ═══════════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════════ */
const toKg   = (v, u) => u === "lbs" ? +(v / 2.2046).toFixed(1) : +v;
const toDisp = (v, u) => u === "lbs" ? +(v * 2.2046).toFixed(1) : +v;
const todayKey = () => new Date().toISOString().slice(0, 10);

const MILESTONES = [
  { id:"first_log",    icon:"🏁", label:"First Log",     check: d => d.logs >= 1 },
  { id:"week_streak",  icon:"🔥", label:"7-Day Streak",  check: d => d.streak >= 7 },
  { id:"5kg",          icon:"⚡", label:"5kg Change",    check: d => d.change >= 5 },
  { id:"30_logs",      icon:"📅", label:"30 Logs",       check: d => d.logs >= 30 },
  { id:"goal_half",    icon:"🎯", label:"Halfway There", check: d => d.halfGoal },
  { id:"goal_done",    icon:"🏆", label:"Goal Reached",  check: d => d.goalDone },
  { id:"month_streak", icon:"💎", label:"30-Day Streak", check: d => d.streak >= 30 },
  { id:"protein_hit",  icon:"🥩", label:"Protein Goal",  check: d => d.proteinHit },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tt">
      <p className="tt-label">{label}</p>
      <p className="tt-val">{payload[0].value} kg</p>
    </div>
  );
};

/* ═══════════════════════════════════════════
   FOOD SEARCH  (Open Food Facts India — free, no key)
═══════════════════════════════════════════ */

// Curated Indian food nutrition database (per 100g)
const INDIAN_FOODS_DB = [
  { name:"Idli",              brand:"Homemade", calories:58,  protein:2.0, carbs:12.0, fat:0.4 },
  { name:"Dosa (plain)",      brand:"Homemade", calories:133, protein:3.5, carbs:25.0, fat:2.4 },
  { name:"Masala Dosa",       brand:"Homemade", calories:168, protein:4.0, carbs:28.0, fat:4.5 },
  { name:"Chapati / Roti",    brand:"Homemade", calories:297, protein:8.0, carbs:52.0, fat:5.6 },
  { name:"Paratha (plain)",   brand:"Homemade", calories:300, protein:7.5, carbs:45.0, fat:10.0 },
  { name:"Aloo Paratha",      brand:"Homemade", calories:274, protein:6.0, carbs:42.0, fat:9.0 },
  { name:"Puri",              brand:"Homemade", calories:340, protein:7.0, carbs:50.0, fat:13.0 },
  { name:"Basmati Rice (cooked)", brand:"Homemade", calories:121, protein:2.7, carbs:25.2, fat:0.3 },
  { name:"Dal (cooked)",      brand:"Homemade", calories:116, protein:9.0, carbs:20.0, fat:0.4 },
  { name:"Dal Tadka",         brand:"Homemade", calories:135, protein:8.5, carbs:19.0, fat:3.5 },
  { name:"Dal Makhani",       brand:"Homemade", calories:168, protein:9.0, carbs:20.0, fat:5.5 },
  { name:"Chana Masala",      brand:"Homemade", calories:164, protein:8.5, carbs:22.0, fat:5.0 },
  { name:"Rajma (cooked)",    brand:"Homemade", calories:144, protein:8.7, carbs:23.0, fat:1.5 },
  { name:"Paneer (raw)",      brand:"Dairy",    calories:265, protein:18.3, carbs:1.2, fat:20.0 },
  { name:"Paneer Butter Masala", brand:"Homemade", calories:180, protein:9.5, carbs:8.0, fat:12.0 },
  { name:"Palak Paneer",      brand:"Homemade", calories:152, protein:9.0, carbs:7.0, fat:9.5 },
  { name:"Shahi Paneer",      brand:"Homemade", calories:198, protein:9.0, carbs:9.0, fat:14.0 },
  { name:"Chicken Curry",     brand:"Homemade", calories:155, protein:18.0, carbs:5.0, fat:7.5 },
  { name:"Butter Chicken",    brand:"Homemade", calories:165, protein:17.0, carbs:6.0, fat:8.5 },
  { name:"Chicken Biryani",   brand:"Homemade", calories:174, protein:11.0, carbs:22.0, fat:4.5 },
  { name:"Mutton Biryani",    brand:"Homemade", calories:191, protein:12.0, carbs:22.0, fat:6.0 },
  { name:"Egg Curry",         brand:"Homemade", calories:145, protein:10.5, carbs:5.0, fat:9.0 },
  { name:"Fish Curry",        brand:"Homemade", calories:132, protein:15.0, carbs:4.0, fat:6.0 },
  { name:"Sambar",            brand:"Homemade", calories:55,  protein:3.0, carbs:9.0, fat:1.0 },
  { name:"Upma",              brand:"Homemade", calories:150, protein:4.0, carbs:26.0, fat:3.5 },
  { name:"Poha",              brand:"Homemade", calories:130, protein:2.5, carbs:26.0, fat:2.5 },
  { name:"Uttapam",           brand:"Homemade", calories:107, protein:3.5, carbs:18.0, fat:2.5 },
  { name:"Medu Vada",         brand:"Homemade", calories:218, protein:7.5, carbs:27.0, fat:9.0 },
  { name:"Khichdi",           brand:"Homemade", calories:120, protein:4.5, carbs:22.0, fat:2.0 },
  { name:"Aloo Sabzi",        brand:"Homemade", calories:107, protein:2.0, carbs:18.0, fat:3.5 },
  { name:"Bhindi Masala",     brand:"Homemade", calories:80,  protein:2.0, carbs:9.0, fat:4.0 },
  { name:"Baingan Bharta",    brand:"Homemade", calories:73,  protein:1.8, carbs:8.5, fat:3.5 },
  { name:"Chole Bhature",     brand:"Homemade", calories:280, protein:8.5, carbs:38.0, fat:10.0 },
  { name:"Pav Bhaji",         brand:"Homemade", calories:192, protein:5.0, carbs:28.0, fat:7.0 },
  { name:"Vada Pav",          brand:"Homemade", calories:258, protein:6.0, carbs:38.0, fat:9.0 },
  { name:"Samosa",            brand:"Homemade", calories:262, protein:4.5, carbs:28.0, fat:15.0 },
  { name:"Pakora (onion)",    brand:"Homemade", calories:200, protein:4.5, carbs:22.0, fat:11.0 },
  { name:"Dhokla",            brand:"Homemade", calories:160, protein:5.0, carbs:28.0, fat:3.5 },
  { name:"Khaman",            brand:"Homemade", calories:149, protein:5.5, carbs:25.0, fat:3.0 },
  { name:"Halwa (sooji)",     brand:"Homemade", calories:316, protein:4.0, carbs:46.0, fat:12.0 },
  { name:"Gulab Jamun",       brand:"Mithai",   calories:384, protein:6.5, carbs:56.0, fat:15.0 },
  { name:"Rasgulla",          brand:"Mithai",   calories:186, protein:4.5, carbs:38.0, fat:1.5 },
  { name:"Kheer (rice)",      brand:"Homemade", calories:178, protein:4.5, carbs:28.0, fat:5.5 },
  { name:"Lassi (sweet)",     brand:"Dairy",    calories:107, protein:3.5, carbs:16.0, fat:3.5 },
  { name:"Buttermilk / Chaas",brand:"Dairy",    calories:40,  protein:3.0, carbs:5.0,  fat:1.0 },
  { name:"Masala Chai (with milk)", brand:"Beverage", calories:44, protein:1.7, carbs:6.5, fat:1.2 },
  { name:"Coconut Chutney",   brand:"Homemade", calories:195, protein:2.0, carbs:8.0, fat:17.0 },
  { name:"Tomato Chutney",    brand:"Homemade", calories:65,  protein:1.5, carbs:12.0, fat:1.5 },
  { name:"Raita (plain)",     brand:"Dairy",    calories:55,  protein:3.0, carbs:5.5,  fat:2.0 },
  { name:"Pappad (roasted)",  brand:"Store",    calories:345, protein:22.0, carbs:55.0, fat:1.5 },
  { name:"Egg (boiled)",      brand:"",         calories:155, protein:13.0, carbs:1.1,  fat:11.0 },
  { name:"Egg White (boiled)",brand:"",         calories:52,  protein:11.0, carbs:0.7,  fat:0.2 },
  { name:"Banana",            brand:"Fruit",    calories:89,  protein:1.1, carbs:23.0, fat:0.3 },
  { name:"Mango",             brand:"Fruit",    calories:60,  protein:0.8, carbs:15.0, fat:0.4 },
  { name:"Guava",             brand:"Fruit",    calories:68,  protein:2.6, carbs:14.0, fat:1.0 },
  { name:"Papaya",            brand:"Fruit",    calories:43,  protein:0.5, carbs:11.0, fat:0.3 },
  { name:"Chikoo / Sapota",   brand:"Fruit",    calories:83,  protein:0.4, carbs:20.0, fat:1.1 },
  { name:"Moong Dal (cooked)",brand:"Homemade", calories:105, protein:7.0, carbs:18.5, fat:0.4 },
  { name:"Rava / Semolina",   brand:"",         calories:360, protein:10.0, carbs:73.0, fat:1.0 },
  { name:"Besan / Gram Flour",brand:"",         calories:387, protein:22.5, carbs:58.0, fat:6.0 },
  { name:"Whole Wheat Flour", brand:"",         calories:340, protein:13.0, carbs:71.0, fat:2.5 },
  { name:"Peanuts (roasted)", brand:"",         calories:567, protein:26.0, carbs:16.0, fat:49.0 },
  { name:"Cashew Nuts",       brand:"",         calories:553, protein:18.0, carbs:30.0, fat:44.0 },
  { name:"Almonds",           brand:"",         calories:579, protein:21.0, carbs:22.0, fat:50.0 },
  { name:"Coconut (fresh)",   brand:"",         calories:354, protein:3.3, carbs:15.0, fat:33.0 },
  { name:"Dahi / Curd (full fat)", brand:"Dairy", calories:98, protein:3.1, carbs:3.4, fat:4.3 },
  { name:"Dahi / Curd (low fat)", brand:"Dairy", calories:62, protein:3.5, carbs:4.7, fat:1.5 },
  { name:"Milk (full fat)",   brand:"Dairy",    calories:61,  protein:3.2, carbs:4.8,  fat:3.3 },
  { name:"Milk (toned)",      brand:"Dairy",    calories:44,  protein:3.2, carbs:5.0,  fat:1.5 },
];

async function searchFood(query) {
  const q = query.toLowerCase().trim();

  // 1. First search local Indian database
  const localResults = INDIAN_FOODS_DB
    .filter(f => f.name.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q))
    .map(f => ({
      name:        f.name,
      brand:       f.brand,
      per100:      { calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat },
      servingSize: "100g",
    }));

  // 2. Also try Open Food Facts India API for packaged/branded items
  try {
    const url = `https://in.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,brands,nutriments,serving_size&tagtype_0=countries&tag_contains_0=contains&tag_0=india`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();

    const apiResults = (data.products || [])
      .filter(p => p.product_name && p.nutriments)
      .map(p => {
        const n = p.nutriments;
        // Try multiple possible calorie fields
        const kcal = n["energy-kcal_100g"]
          ?? n["energy-kcal"]
          ?? (n["energy_100g"] ? Math.round(n["energy_100g"] / 4.184) : null)
          ?? (n["energy"]      ? Math.round(n["energy"]      / 4.184) : null)
          ?? 0;
        return {
          name:        p.product_name,
          brand:       p.brands || "India",
          per100:      {
            calories: Math.round(kcal),
            protein:  +(n.proteins_100g      ?? n.proteins      ?? 0).toFixed(1),
            carbs:    +(n.carbohydrates_100g ?? n.carbohydrates ?? 0).toFixed(1),
            fat:      +(n.fat_100g           ?? n.fat           ?? 0).toFixed(1),
          },
          servingSize: p.serving_size || "100g",
        };
      })
      // Only keep items that have at least some nutritional data
      .filter(p => p.per100.calories > 0 || p.per100.protein > 0);

    // Merge: local results first, then API results (deduplicated by name)
    const seen = new Set(localResults.map(f => f.name.toLowerCase()));
    const merged = [...localResults];
    for (const item of apiResults) {
      if (!seen.has(item.name.toLowerCase())) {
        merged.push(item);
        seen.add(item.name.toLowerCase());
      }
    }
    return merged.slice(0, 15);
  } catch {
    // API failed — return local results only (always reliable)
    return localResults.slice(0, 15);
  }
}

/* ═══════════════════════════════════════════
   QUANTITY MODAL
═══════════════════════════════════════════ */
function QuantityModal({ food, onAdd, onClose }) {
  const [grams, setGrams] = useState(100);
  const ratio = grams / 100;
  const calc  = {
    calories: Math.round(food.per100.calories * ratio),
    protein:  +(food.per100.protein  * ratio).toFixed(1),
    carbs:    +(food.per100.carbs    * ratio).toFixed(1),
    fat:      +(food.per100.fat      * ratio).toFixed(1),
  };
  return (
    <div className="qty-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="qty-panel">
        <h3 className="qty-title">{food.name}</h3>
        <p className="qty-sub">{food.brand || "Generic"} · Per 100g: {food.per100.calories} kcal</p>
        <div className="form-group" style={{marginBottom:4}}>
          <label className="form-label">Amount (grams)</label>
          <input className="inp" type="number" value={grams}
            onChange={e => setGrams(Math.max(1, +e.target.value))}
            min="1" />
        </div>
        <div className="qty-macros-preview">
          {[
            { label:"Calories", val:calc.calories, unit:"kcal", color:"var(--accent2)" },
            { label:"Protein",  val:calc.protein,  unit:"g",    color:"var(--blue)" },
            { label:"Carbs",    val:calc.carbs,    unit:"g",    color:"var(--amber)" },
            { label:"Fat",      val:calc.fat,      unit:"g",    color:"var(--pink)" },
          ].map(m => (
            <div key={m.label} className="qty-macro-box">
              <div className="qty-macro-label">{m.label}</div>
              <div className="qty-macro-val" style={{color:m.color}}>{m.val}</div>
              <div style={{fontSize:10,color:"var(--muted)"}}>{m.unit}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button className="btn btn-accent btn-full" onClick={() => onAdd({ ...food, grams, calculated: calc })}>
            Add to Meal
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FOOD SEARCH PANEL
═══════════════════════════════════════════ */
function FoodSearchPanel({ onAddToCart, uid }) {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [open,      setOpen]      = useState(false);
  const [error,     setError]     = useState(false);
  const [favorites, setFavorites] = useState([]);

  // Load favorites from Firestore on mount
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "profiles", uid, "meta", "favorites"));
        if (snap.exists()) setFavorites(snap.data().items || []);
      } catch {}
    })();
  }, [uid]);

  const saveFavorites = async (updated) => {
    setFavorites(updated);
    try { await setDoc(doc(db, "profiles", uid, "meta", "favorites"), { items: updated }); } catch {}
  };

  const isFav = (food) => favorites.some(f => f.name === food.name);

  const toggleFav = async (e, food) => {
    e.stopPropagation();
    const updated = isFav(food)
      ? favorites.filter(f => f.name !== food.name)
      : [...favorites, { name: food.name, brand: food.brand, per100: food.per100, servingSize: food.servingSize }];
    await saveFavorites(updated);
  };

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setOpen(true); setResults([]); setError(false);
    try {
      const r = await searchFood(query);
      setResults(r);
    } catch { setResults([]); setError(true); }
    setLoading(false);
  };

  const handleAdd = (foodWithCalc) => {
    onAddToCart(foodWithCalc);
    setSelected(null);
    setOpen(false);
    setQuery("");
    setResults([]);
    setError(false);
  };

  const FoodRow = ({ food, showStar = true }) => (
    <div className="food-result-item" onClick={() => { setSelected(food); setOpen(false); }}
      style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{flex:1,minWidth:0}}>
        <div className="food-result-name">{food.name}</div>
        {food.brand && <div className="food-result-brand">{food.brand}</div>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <div className="food-result-macros">
          <span style={{background:"var(--accentg)",color:"var(--accent2)"}}>{food.per100.calories} kcal</span>
          <span style={{background:"var(--blueg)",color:"var(--blue)"}}>P {food.per100.protein}g</span>
          <span style={{background:"var(--amberg)",color:"var(--amber)"}}>C {food.per100.carbs}g</span>
          <span style={{background:"var(--pinkg)",color:"var(--pink)"}}>F {food.per100.fat}g</span>
        </div>
        {showStar && (
          <button onClick={(e) => toggleFav(e, food)} title={isFav(food) ? "Remove from favorites" : "Add to favorites"}
            style={{background:"none",border:"none",cursor:"pointer",fontSize:15,padding:"2px 4px",
              color: isFav(food) ? "var(--amber)" : "var(--muted2)",flexShrink:0,lineHeight:1}}>
            {isFav(food) ? "★" : "☆"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Favorites quick-access */}
      {favorites.length > 0 && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"var(--muted2)",fontWeight:600,marginBottom:8}}>
            ★ Favorites
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {favorites.map((food, i) => (
              <button key={i} onClick={() => setSelected(food)}
                style={{background:"var(--amberg)",border:"1px solid rgba(251,191,36,0.2)",
                  borderRadius:20,padding:"4px 12px",fontSize:12,color:"var(--amber)",
                  cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:500}}>
                {food.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="food-search-wrap">
        <div style={{display:"flex",gap:8}}>
          <input className="inp" placeholder='Search food e.g. "egg", "banana", "dosa"…'
            value={query}
            onChange={e => { setQuery(e.target.value); if (!e.target.value) { setOpen(false); setResults([]); setError(false); } }}
            onKeyDown={e => e.key === "Enter" && doSearch()}
          />
          <button className="btn btn-blue btn-sm" onClick={doSearch} style={{whiteSpace:"nowrap"}}>
            {loading ? <span className="spin" /> : "Search"}
          </button>
        </div>

        {open && (
          <div className="food-results">
            {loading && (
              <div className="food-spinner"><span className="spin" />Searching Indian food database…</div>
            )}
            {!loading && error && (
              <div className="food-empty" style={{color:"var(--red)"}}>⚠ Search failed. Check your connection and try again.</div>
            )}
            {!loading && !error && results.length === 0 && (
              <div className="food-empty">No results found. Try a different name or spelling.</div>
            )}
            {!loading && results.map((food, i) => <FoodRow key={i} food={food} />)}
          </div>
        )}
      </div>
     
      {selected && (
        <QuantityModal food={selected} onAdd={handleAdd} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   WATER TRACKER
═══════════════════════════════════════════ */
function WaterTracker({ uid, cups, setCups, goal = 8 }) {
  const setCupsAndSave = async (n) => {
    setCups(n);
    try {
      await setDoc(doc(db, "profiles", uid, "water", todayKey()), { cups: n, date: todayKey() });
    } catch { /* silently fail */ }
  };

  const pct = Math.round((cups / goal) * 100);

  return (
    <div className="card">
      <div className="card-label">
        <span className="card-label-dot" style={{background:"var(--cyan)"}} />
        Water Intake Today
        <span className="badge badge-cyan" style={{marginLeft:"auto"}}>{cups} / {goal} cups</span>
      </div>

      <div className="water-cups">
        {Array.from({length: goal}).map((_, i) => (
          <div
            key={i}
            className={`water-cup ${i < cups ? "filled" : ""}`}
            onClick={() => setCupsAndSave(i < cups ? i : i + 1)}
            title={`${i + 1} cup${i > 0 ? "s" : ""}`}
          >
            <div className="water-cup-fill" style={{height: i < cups ? "100%" : "0%"}} />
          </div>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--muted)",marginTop:8,marginBottom:4}}>
        <span>{cups >= goal ? "🎉 Daily goal hit!" : `${goal - cups} more cup${goal - cups !== 1 ? "s" : ""} to go`}</span>
        <span>{pct}%</span>
      </div>
      <div className="prog-track" style={{marginTop:4}}>
        <div className="prog-fill" style={{width:`${pct}%`,background:"var(--cyan)"}} />
      </div>

      <div style={{display:"flex",gap:8,marginTop:14}}>
        <button className="btn btn-blue btn-sm" onClick={() => cups < goal && setCupsAndSave(cups + 1)}>
          + Add Cup
        </button>
        {cups > 0 && (
          <button className="btn btn-outline btn-sm" onClick={() => setCupsAndSave(0)}>Reset</button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
export default function App() {
  /* ── state ── */
  const [user,        setUser]        = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showEdit,    setShowEdit]    = useState(false);
  const [toast,       setToast]       = useState("");
  const [activeTab,   setActiveTab]   = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [nutrSubTab,  setNutrSubTab]  = useState("search"); // "search" | "manual" | "log"
  const [unit,        setUnit]        = useState("kg");
  const [authLoading, setAuthLoading] = useState(false);

  /* weight */
  const [weightHistory, setWeightHistory] = useState([]);
  const [newWeight,     setNewWeight]     = useState("");
  const [streak,        setStreak]        = useState(0);
  const [nutrStreak,    setNutrStreak]    = useState(0);

  /* nutrition */
  const [activeMeal,       setActiveMeal]       = useState("Breakfast");
  const [cart,             setCart]             = useState([]); // food items from search
  const [manualNutr,       setManualNutr]       = useState({ calories:"", protein:"", carbs:"", fat:"" });
  const [todayNutrition,   setTodayNutrition]   = useState({ calories:0, protein:0, carbs:0, fat:0 });
  const [nutritionHistory, setNutrHistory]      = useState([]);

  /* water — lifted up to avoid flicker on tab switch */
  const [waterCups, setWaterCups] = useState(0);

  /* profile */
  const [profile,     setProfile]     = useState({ age:"", gender:"Male", height:"", weight:"", goalWeight:"", goal:"Muscle Gain", activityLevel:"Moderately Active", waterGoal: 8 });
  const [editProfile, setEditProfile] = useState(null);

  /* ── helpers ── */
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  /* ── cart totals ── */
  const cartTotals = cart.reduce((a, item) => ({
    calories: a.calories + item.calculated.calories,
    protein:  +(a.protein  + item.calculated.protein).toFixed(1),
    carbs:    +(a.carbs    + item.calculated.carbs).toFixed(1),
    fat:      +(a.fat      + item.calculated.fat).toFixed(1),
  }), { calories:0, protein:0, carbs:0, fat:0 });

  /* ── loaders ── */
  const loadWeightHistory = useCallback(async (uid) => {
    const q    = query(collection(db, "profiles", uid, "weightHistory"), orderBy("date"));
    const snap = await getDocs(q);
    const entries = snap.docs.map(d => ({ weight: d.data().weight, date: new Date(d.data().date) }));
    if (!entries.length) { setWeightHistory([]); return; }
    const expanded = [];
    for (let i = 0; i < entries.length; i++) {
      const cur = entries[i], nxt = entries[i + 1];
      expanded.push({ weight: cur.weight, displayDate: cur.date.toLocaleDateString("en-GB", { day:"2-digit", month:"short" }) });
      if (nxt) {
        const t = new Date(cur.date); t.setDate(t.getDate() + 1);
        while (t < nxt.date) {
          expanded.push({ weight: cur.weight, displayDate: t.toLocaleDateString("en-GB", { day:"2-digit", month:"short" }) });
          t.setDate(t.getDate() + 1);
        }
      }
    }
    const last = entries[entries.length - 1];
    const t = new Date(last.date); t.setDate(t.getDate() + 1);
    while (t <= new Date()) {
      expanded.push({ weight: last.weight, displayDate: t.toLocaleDateString("en-GB", { day:"2-digit", month:"short" }) });
      t.setDate(t.getDate() + 1);
    }
    setWeightHistory(expanded);
    const logDays = new Set(entries.map(e => e.date.toISOString().slice(0, 10)));
    let s = 0; const d = new Date();
    while (logDays.has(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1); }
    setStreak(s);
  }, []);

  const loadNutrHistory = useCallback(async (uid) => {
    const q    = query(collection(db, "profiles", uid, "nutritionHistory"), orderBy("date", "desc"));
    const snap = await getDocs(q);
    const rows = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    setNutrHistory(rows);
    const todayRows = rows.filter(r => r.date?.slice(0, 10) === todayKey());
    const totals = todayRows.reduce((acc, r) => ({
      calories: acc.calories + (r.calories || 0),
      protein:  acc.protein  + (r.protein  || 0),
      carbs:    acc.carbs    + (r.carbs    || 0),
      fat:      acc.fat      + (r.fat      || 0),
    }), { calories:0, protein:0, carbs:0, fat:0 });
    setTodayNutrition(totals);
    // nutrition streak — count consecutive days with at least one meal logged
    const loggedDays = new Set(rows.map(r => r.date?.slice(0, 10)).filter(Boolean));
    let ns = 0; const nd = new Date();
    while (loggedDays.has(nd.toISOString().slice(0, 10))) { ns++; nd.setDate(nd.getDate() - 1); }
    setNutrStreak(ns);
  }, []);

  /* ── auth ── */
  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const lu = result.user;
      setUser(lu);
      const snap = await getDoc(doc(db, "profiles", lu.uid));
      if (!snap.exists()) { setShowProfile(true); }
      else {
        const data = snap.data();
        setProfileData(data);
        setUnit(data.preferredUnit || "kg");
        await loadWeightHistory(lu.uid);
        await loadNutrHistory(lu.uid);
        // Load water for today
        try {
          const wref = doc(db, "profiles", lu.uid, "water", todayKey());
          const wsnap = await getDoc(wref);
          if (wsnap.exists()) setWaterCups(wsnap.data().cups || 0);
        } catch {}
        showToast(`Welcome back, ${lu.displayName.split(" ")[0]}! 👋`);
      }
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") alert(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null); setProfileData(null); setWeightHistory([]); setNutrHistory([]);
    setStreak(0); setNutrStreak(0); setActiveTab("dashboard"); setCart([]); setWaterCups(0);
  };

  /* ── profile ── */
  const saveProfile = async () => {
    const bmi = Number(profile.weight) / ((Number(profile.height) / 100) ** 2);
    const obj = { ...profile, age:+profile.age, height:+profile.height, weight:+profile.weight,
      goalWeight:+profile.goalWeight, bmi:bmi.toFixed(2), name:user.displayName, email:user.email,
      lastWeightUpdate:new Date().toISOString(), preferredUnit:unit };
    await setDoc(doc(db, "profiles", user.uid), obj);
    await addDoc(collection(db, "profiles", user.uid, "weightHistory"), { weight:+profile.weight, date:new Date().toISOString() });
    setProfileData(obj);
    await loadWeightHistory(user.uid);
    setShowProfile(false);
    showToast("Profile created! Let's go 🚀");
  };

  const openEdit = () => { setEditProfile({...profileData}); setShowEdit(true); };
  const saveEdit = async () => {
    const bmi = Number(editProfile.weight) / ((Number(editProfile.height) / 100) ** 2);
    const obj = { ...editProfile, age:+editProfile.age, height:+editProfile.height,
      weight:+editProfile.weight, goalWeight:+editProfile.goalWeight,
      bmi:bmi.toFixed(2), lastWeightUpdate:new Date().toISOString(), preferredUnit:unit };
    await setDoc(doc(db, "profiles", user.uid), obj);
    setProfileData(obj); setShowEdit(false);
    showToast("Profile updated ✓");
  };

  /* ── weight ── */
  const updateWeight = async () => {
    if (!newWeight) return;
    const kg  = toKg(newWeight, unit);
    const bmi = kg / ((Number(profileData.height) / 100) ** 2);
    const upd = { ...profileData, weight:kg, bmi:bmi.toFixed(2), lastWeightUpdate:new Date().toISOString() };
    await setDoc(doc(db, "profiles", user.uid), upd);
    await addDoc(collection(db, "profiles", user.uid, "weightHistory"), { weight:kg, date:new Date().toISOString() });
    setProfileData(upd);
    await loadWeightHistory(user.uid);
    setNewWeight("");
    showToast("Weight logged ✓");
  };

  /* ── nutrition: log cart ── */
  const logCart = async () => {
    if (!cart.length) return;
    const entry = {
      meal: activeMeal,
      calories: cartTotals.calories,
      protein:  cartTotals.protein,
      carbs:    cartTotals.carbs,
      fat:      cartTotals.fat,
      items:    cart.map(c => `${c.name} (${c.grams}g)`).join(", "),
      date:     new Date().toISOString(),
    };
    await addDoc(collection(db, "profiles", user.uid, "nutritionHistory"), entry);
    await loadNutrHistory(user.uid);
    setCart([]);
    showToast(`${activeMeal} logged ✓`);
  };

  /* ── nutrition: manual log ── */
  const logManual = async () => {
    const entry = {
      meal:     activeMeal,
      calories: +manualNutr.calories || 0,
      protein:  +manualNutr.protein  || 0,
      carbs:    +manualNutr.carbs    || 0,
      fat:      +manualNutr.fat      || 0,
      items:    "Manual entry",
      date:     new Date().toISOString(),
    };
    await addDoc(collection(db, "profiles", user.uid, "nutritionHistory"), entry);
    await loadNutrHistory(user.uid);
    setManualNutr({ calories:"", protein:"", carbs:"", fat:"" });
    showToast(`${activeMeal} logged ✓`);
  };

  /* ── delete entry ── */
  const deleteLog = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await deleteDoc(doc(db, "profiles", user.uid, "nutritionHistory", entryId));
      await loadNutrHistory(user.uid);
      showToast("Entry deleted 🗑️");
    } catch (e) {
      showToast("Failed to delete entry.");
    }
  };

  /* ── derived ── */
  const getActivityMult = lvl => ({ Sedentary:1.2, "Lightly Active":1.375, "Very Active":1.725 }[lvl] || 1.55);
  const calcBMR = pd => {
    if (!pd) return 0;
    const {weight:w,height:h,age:a,gender:g} = pd;
    return g === "Female" ? 10*+w + 6.25*+h - 5*+a - 161 : 10*+w + 6.25*+h - 5*+a + 5;
  };
  const maintenance = profileData ? Math.round(calcBMR(profileData) * getActivityMult(profileData.activityLevel)) : 0;
  const targetCal   = profileData ? maintenance + (profileData.goal === "Muscle Gain" ? 300 : profileData.goal === "Fat Loss" ? -500 : 0) : 0;
  const proteinTarget = profileData ? Math.round(profileData.weight * (profileData.goal !== "Maintain" ? 1.8 : 1.6)) : 0;

  // Goal-aware macro splits from targetCal
  const carbsTarget = profileData ? (() => {
    const proteinCal = proteinTarget * 4;
    const fatPct     = profileData.goal === "Fat Loss" ? 0.30 : profileData.goal === "Muscle Gain" ? 0.25 : 0.28;
    const fatCal     = Math.round(targetCal * fatPct);
    return Math.round((targetCal - proteinCal - fatCal) / 4);
  })() : 300;
  const fatTarget = profileData ? (() => {
    const fatPct = profileData.goal === "Fat Loss" ? 0.30 : profileData.goal === "Muscle Gain" ? 0.25 : 0.28;
    return Math.round((targetCal * fatPct) / 9);
  })() : 80;
  const dispWeight   = profileData ? toDisp(profileData.weight,    unit) : 0;
  const dispGoalWt   = profileData ? toDisp(profileData.goalWeight, unit) : 0;
  const remaining    = profileData ? +Math.abs(dispWeight - dispGoalWt).toFixed(1) : 0;

  const weeklyDelta = (() => {
    if (weightHistory.length < 14) return null;
    const r = weightHistory.slice(-14);
    return +((r[r.length - 1].weight - r[0].weight) / 2).toFixed(2);
  })();
  const projectedDate = (() => {
    if (!profileData || !weeklyDelta || weeklyDelta === 0) return null;
    const diff = profileData.goalWeight - profileData.weight;
    if ((diff > 0 && weeklyDelta < 0) || (diff < 0 && weeklyDelta > 0)) return null;
    const d = new Date(); d.setDate(d.getDate() + Math.round(Math.abs(diff / weeklyDelta) * 7));
    return d.toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
  })();

  const bmiCat = bmi => {
    const b = +bmi;
    if (b < 18.5) return { label:"Underweight", cls:"badge-amber" };
    if (b < 25)   return { label:"Normal",      cls:"badge-green" };
    if (b < 30)   return { label:"Overweight",  cls:"badge-amber" };
    return              { label:"Obese",         cls:"badge-red"   };
  };

  const daysSince = profileData?.lastWeightUpdate
    ? Math.floor((new Date() - new Date(profileData.lastWeightUpdate)) / 86400000) : 0;

  const weeklySummary = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const cal = nutritionHistory.filter(r => r.date?.slice(0, 10) === key).reduce((a, r) => a + (r.calories || 0), 0);
      days.push({ label: d.toLocaleDateString("en-GB", { weekday:"short" }), cal });
    }
    return days;
  })();
  const maxWeeklyCal = Math.max(...weeklySummary.map(d => d.cal), 1);

  const calPct  = targetCal     > 0 ? Math.min(100, Math.round(todayNutrition.calories / targetCal     * 100)) : 0;
  const protPct = proteinTarget > 0 ? Math.min(100, Math.round(todayNutrition.protein  / proteinTarget * 100)) : 0;

  // 7-day weight trend: ↑ gaining, ↓ losing, → stable
  const weightTrend = (() => {
    if (weightHistory.length < 7) return null;
    const recent = weightHistory.slice(-7);
    const delta  = recent[recent.length - 1].weight - recent[0].weight;
    if (Math.abs(delta) < 0.2) return { arrow:"→", color:"var(--muted)", label:"Stable" };
    return delta > 0
      ? { arrow:"↑", color:"var(--red)",   label:`+${toDisp(delta, unit).toFixed(1)}${unit}/wk` }
      : { arrow:"↓", color:"var(--green)", label:`${toDisp(delta, unit).toFixed(1)}${unit}/wk` };
  })();

  const msData = {
    logs:       weightHistory.length,
    streak,
    nutrStreak,
    change:     profileData ? Math.abs(profileData.weight - (weightHistory[0]?.weight || profileData.weight)) : 0,
    halfGoal:   profileData ? remaining <= Math.abs(profileData.goalWeight - (weightHistory[0]?.weight || profileData.weight)) / 2 : false,
    goalDone:   profileData ? remaining <= 0.5 : false,
    proteinHit: todayNutrition.protein >= proteinTarget,
  };

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <>
      <style>{S}</style>
      <div className="app">

        {/* ── NAV ── */}
        <nav className="nav" style={{position:"sticky",top:0}}>
          <div className="nav-logo">FormTrack</div>

          {/* desktop tabs */}
          {user && profileData && (
            <div className="nav-tabs">
              {["dashboard","nutrition","progress","milestones"].map(t => (
                <button key={t} className={`nav-tab${activeTab===t?" active":""}`}
                  onClick={() => setActiveTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}

          <div className="nav-right">
            <div className="unit-toggle">
              <button className={`unit-btn${unit==="kg"?" active":""}`} onClick={() => setUnit("kg")}>kg</button>
              <button className={`unit-btn${unit==="lbs"?" active":""}`} onClick={() => setUnit("lbs")}>lbs</button>
            </div>
            {user && (
              <>
                <img src={user.photoURL} alt="" className="nav-avatar" onClick={openEdit} title="Edit profile" />
                <button className="nav-signout" onClick={handleSignOut}>Sign out</button>
             </>
            )}
            {/* hamburger — mobile only */}
            {user && profileData && (
              <button className="nav-hamburger" onClick={() => setMobileMenuOpen(o => !o)} aria-label="Menu">
                <span /><span /><span />
              </button>
            )}
          </div>

          {/* mobile dropdown */}
          {user && profileData && (
            <div className={`nav-mobile-menu${mobileMenuOpen?" open":""}`}>
              {["dashboard","nutrition","progress","milestones"].map(t => (
              <button key={t} className={`nav-mobile-tab${activeTab===t?" active":""}`}
                onClick={() => { setActiveTab(t); setMobileMenuOpen(false); }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
              <hr className="nav-mobile-divider" />
              <div className="nav-mobile-bottom">
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <img src={user.photoURL} alt="" className="nav-avatar" onClick={() => { openEdit(); setMobileMenuOpen(false); }} />
                  <span style={{fontSize:13,color:"var(--muted)"}}>Edit Profile</span>
                </div>
                <button className="nav-signout" onClick={handleSignOut}>Sign out</button>
              </div>
            </div>
          )}
        </nav>

        {/* ── HERO ── */}
        {!user && !authLoading && (
          <div className="hero">
            <div className="hero-glow" />
            <p className="hero-eyebrow">Performance Intelligence</p>
            <h1 className="hero-title">Train.<br /><em>Track.</em><br />Transform.</h1>
            <p className="hero-sub">Smart fitness tracking with food search, water intake, streaks and more.</p>
            <div className="hero-features">
              {["Food database search","Water tracker","Streak & badges","Meal logging","Goal projections","Unit toggle"].map(f => (
                <span key={f} className="hero-feat">{f}</span>
              ))}
            </div>
            <button className="btn btn-accent" onClick={handleLogin} disabled={authLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        {/* ── AUTH LOADING ── */}
        {authLoading && (
          <div className="auth-loading">
            <div className="auth-loading-ring" />
            <p className="auth-loading-text">Signing you in…</p>
          </div>
        )}

        {/* ── PROFILE SETUP ── */}
        {showProfile && (
          <div className="form-wrap">
            <div className="form-card">
              <h2 className="form-title">Build your profile</h2>
              <p className="form-sub">We use this to personalise your calorie & macro targets.</p>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="inp" type="number" placeholder="25" onChange={e => setProfile({...profile, age:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="inp" onChange={e => setProfile({...profile, gender:e.target.value})}>
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input className="inp" type="number" placeholder="175" onChange={e => setProfile({...profile, height:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight ({unit})</label>
                  <input className="inp" type="number" placeholder={unit==="kg"?"75":"165"}
                    onChange={e => setProfile({...profile, weight: unit==="lbs" ? (e.target.value/2.2046).toFixed(1) : e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Goal Weight ({unit})</label>
                  <input className="inp" type="number" placeholder={unit==="kg"?"70":"154"}
                    onChange={e => setProfile({...profile, goalWeight: unit==="lbs" ? (e.target.value/2.2046).toFixed(1) : e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Water Goal (cups)</label>
                  <input className="inp" type="number" placeholder="4"
                    value={profile.waterGoal || ""}
                    onChange={e => setProfile({...profile, waterGoal: +e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Goal</label>
                  <select className="inp" onChange={e => setProfile({...profile, goal:e.target.value})}>
                    <option>Muscle Gain</option><option>Fat Loss</option><option>Maintain</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Activity Level</label>
                  <select className="inp" onChange={e => setProfile({...profile, activityLevel:e.target.value})}>
                    <option>Sedentary</option><option>Lightly Active</option>
                    <option>Moderately Active</option><option>Very Active</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-accent btn-full" style={{marginTop:8}} onClick={saveProfile}>
                Create Profile →
              </button>
            </div>
          </div>
        )}

        {/* ── EDIT PROFILE ── */}
        {showEdit && editProfile && (
          <div className="edit-overlay" onClick={e => e.target===e.currentTarget && setShowEdit(false)}>
            <div className="edit-panel">
              <h3 className="edit-title">Edit Profile</h3>
              <p className="edit-sub">Tap outside to close.</p>
              <div className="form-grid">
                {[
                  {label:"Age",                   key:"age",        ph:"25"},
                  {label:`Weight (${unit})`,       key:"weight",     ph:"75"},
                  {label:`Goal Weight (${unit})`,  key:"goalWeight", ph:"70"},
                  {label:"Height (cm)",            key:"height",     ph:"175"},
                ].map(({label,key,ph}) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <input className="inp" type="number" placeholder={ph}
                      value={key==="weight"||key==="goalWeight" ? toDisp(editProfile[key],unit) : editProfile[key]}
                      onChange={e => setEditProfile({...editProfile,
                        [key]: key==="weight"||key==="goalWeight" ? toKg(e.target.value,unit) : e.target.value})} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="inp" value={editProfile.gender} onChange={e => setEditProfile({...editProfile, gender:e.target.value})}>
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Goal</label>
                  <select className="inp" value={editProfile.goal} onChange={e => setEditProfile({...editProfile, goal:e.target.value})}>
                    <option>Muscle Gain</option><option>Fat Loss</option><option>Maintain</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Activity Level</label>
                  <select className="inp" value={editProfile.activityLevel} onChange={e => setEditProfile({...editProfile, activityLevel:e.target.value})}>
                    <option>Sedentary</option><option>Lightly Active</option>
                    <option>Moderately Active</option><option>Very Active</option>
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:12}}>
                <button className="btn btn-accent" style={{flex:1}} onClick={saveEdit}>Save Changes</button>
                <button className="btn btn-outline" onClick={() => setShowEdit(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            DASHBOARD TAB
        ══════════════════════════════════ */}
        {profileData && !showProfile && activeTab === "dashboard" && (
          <div className="dash">
            <div style={{marginBottom:28}}>
              <h2 style={{fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,letterSpacing:"-0.5px"}}>
                Hey, {profileData.name?.split(" ")[0]} 👋
              </h2>
              <p style={{color:"var(--muted)",fontSize:13,marginTop:4}}>
                {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
                {streak > 0 && <span style={{color:"var(--amber)",marginLeft:12}}>🔥 {streak}-day weight streak</span>}
                {nutrStreak > 0 && <span style={{color:"var(--green)",marginLeft:12}}>🥗 {nutrStreak}-day meal streak</span>}
              </p>
            </div>

            {/* stat row */}
            <div className="grid-4" style={{marginBottom:14}}>
              <div className="card card-accent">
                <div className="card-label"><span className="card-label-dot" style={{background:"var(--accent)"}} />Current Weight</div>
                <div style={{display:"flex",alignItems:"baseline",gap:10}}>
                  <span className="stat-num">{dispWeight}</span>
                  <span className="stat-unit">{unit}</span>
                  {weightTrend && (
                    <span style={{fontSize:16,fontWeight:700,color:weightTrend.color,marginLeft:4}} title={weightTrend.label}>
                      {weightTrend.arrow}
                    </span>
                  )}
                </div>
                <p className="stat-sub">
                  BMI {profileData.bmi} · <span className={`badge ${bmiCat(profileData.bmi).cls}`} style={{fontSize:10}}>{bmiCat(profileData.bmi).label}</span>
                  {weightTrend && <span style={{color:weightTrend.color,marginLeft:8,fontSize:11}}>{weightTrend.label}</span>}
                </p>
              </div>
              <div className="card">
                <div className="card-label"><span className="card-label-dot" style={{background:"var(--green)"}} />Target Calories</div>
                <div><span className="stat-num">{targetCal}</span><span className="stat-unit"> kcal</span></div>
                <p className="stat-sub">{profileData.goal} · Maint. {maintenance}</p>
              </div>
              <div className="card">
                <div className="card-label"><span className="card-label-dot" style={{background:"var(--blue)"}} />Protein Target</div>
                <div><span className="stat-num">{proteinTarget}</span><span className="stat-unit"> g</span></div>
                <p className="stat-sub">Per day · {profileData.activityLevel}</p>
              </div>
              <div className="card">
                <div className="card-label"><span className="card-label-dot" style={{background:"var(--amber)"}} />Remaining</div>
                <div><span className="stat-num">{remaining}</span><span className="stat-unit"> {unit}</span></div>
                <p className="stat-sub">to goal of {dispGoalWt} {unit}
                  {projectedDate && <span style={{display:"block",color:"var(--accent2)",marginTop:3}}>~{projectedDate}</span>}
                </p>
              </div>
            </div>

            <div style={{marginBottom:14}}>
              {/* today nutrition — full width */}
              <div className="card">
                <div className="card-label"><span className="card-label-dot" style={{background:"var(--pink)"}} />Today's Nutrition</div>

                {[
                  { label:"Cal",     pct:calPct,  consumed:todayNutrition.calories, target:targetCal,     unit:"kcal", color:"var(--accent)" },
                  { label:"Protein", pct:protPct, consumed:todayNutrition.protein,  target:proteinTarget, unit:"g",    color:"var(--blue)"   },
                  { label:"Carbs",   pct:Math.min(100,Math.round(todayNutrition.carbs/carbsTarget*100)), consumed:todayNutrition.carbs, target:carbsTarget, unit:"g", color:"var(--amber)" },
                  { label:"Fat",     pct:Math.min(100,Math.round(todayNutrition.fat/fatTarget*100)),   consumed:todayNutrition.fat,  target:fatTarget,  unit:"g", color:"var(--pink)"  },
                ].map(r => {
                  const diff    = r.target - r.consumed;
                  const over    = diff < 0;
                  const diffAbs = Math.abs(Math.round(diff * 10) / 10);
                  return (
                    <div key={r.label} style={{display:"grid",gridTemplateColumns:"52px 1fr auto auto",alignItems:"center",gap:"0 10px",marginBottom:10}}>
                      {/* label */}
                      <span style={{fontSize:11,color:"var(--muted)",fontWeight:600,letterSpacing:".3px"}}>{r.label}</span>
                      {/* bar */}
                      <div style={{background:"var(--s3)",borderRadius:4,height:5,overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:4,width:`${r.pct}%`,background:r.color,transition:"width .5s ease"}} />
                      </div>
                      {/* taken / target */}
                      <span style={{fontSize:11,color:"var(--muted2)",whiteSpace:"nowrap"}}>
                        <span style={{color:r.color,fontWeight:600}}>{r.consumed}</span>
                        <span style={{color:"var(--muted2)"}}>{r.unit==="kcal"?` kcal`:"g"}</span>
                        <span style={{color:"var(--muted2)"}}> / {r.target}{r.unit==="kcal"?" kcal":"g"}</span>
                      </span>
                      {/* deficit chip */}
                      <span style={{
                        fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap",
                        background: over?"rgba(248,113,113,0.12)":"rgba(74,222,128,0.10)",
                        color:      over?"var(--red)":"var(--green)",
                        border:`1px solid ${over?"rgba(248,113,113,0.2)":"rgba(74,222,128,0.18)"}`,
                      }}>
                        {over?`+${diffAbs}${r.unit==="kcal"?" over":"g over"}`:`-${diffAbs}${r.unit==="kcal"?" left":"g left"}`}
                      </span>
                    </div>
                  );
                })}

                <hr className="div" style={{margin:"8px 0"}} />
                <button className="btn btn-outline btn-sm btn-full" onClick={() => setActiveTab("nutrition")}>
                  + Log a meal →
                </button>
              </div>
            </div>

            {/* water + log weight — side by side on desktop, stacked on mobile */}
            <div style={{display:"flex",gap:14,marginBottom:14,alignItems:"stretch",flexWrap:"wrap"}}>
              {/* water */}
              <div style={{flex:"0 0 68%",minWidth:"0",width:"100%",boxSizing:"border-box"}}>
                {user && <WaterTracker uid={user.uid} cups={waterCups} setCups={setWaterCups} goal={profileData.waterGoal || 8} />}
              </div>
              {/* log weight */}
              <div style={{flex:"1 1 200px",minWidth:"200px",width:"100%"}}>
                <div className="card" style={{height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                  <div>
                    <div className="card-label"><span className="card-label-dot" style={{background:"var(--green)"}} />Log Weight</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
                      <input className="inp" type="number" placeholder={`in ${unit}`}
                        value={newWeight} onChange={e => setNewWeight(e.target.value)}
                        onKeyDown={e => e.key==="Enter" && updateWeight()} />
                      <button className="btn btn-green btn-sm" onClick={updateWeight} style={{width:"100%"}}>Save</button>
                    </div>
                    <p className="stat-sub" style={{fontSize:11}}>
                      {daysSince === 0 ? "✓ Logged today" : `Last: ${daysSince}d ago`}
                    </p>
                    {daysSince > 7 && (
                      <div style={{marginTop:8,fontSize:11,color:"var(--amber)",
                        background:"var(--amberg)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:8,padding:"6px 10px"}}>
                        ⚠ Over a week
                      </div>
                    )}
                  </div>
                  <div style={{marginTop:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginBottom:5}}>
                      <span>Goal progress</span>
                      <span>{Math.max(0,100-Math.round(remaining/Math.max(0.1,Math.abs(+profileData.weight - +profileData.goalWeight)+remaining)*100))}%</span>
                    </div>
                    <div className="prog-track">
                      <div className="prog-fill" style={{width:`${Math.max(0,100-Math.round(remaining/Math.max(0.1,Math.abs(+profileData.weight - +profileData.goalWeight)+remaining)*100))}%`,background:"var(--accent)"}} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* weight chart */}
            <div className="card" style={{marginBottom:14}}>
              <div className="section-hd">
                <span className="card-label" style={{margin:0}}><span className="card-label-dot" style={{background:"var(--accent2)"}} />Weight History</span>
                {projectedDate && <span className="badge badge-purple">🎯 Goal by {projectedDate}</span>}
              </div>
              <div style={{height:220,marginTop:8}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightHistory} margin={{top:5,right:10,left:-20,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="displayDate" tick={{fill:"#3a3a4a",fontSize:11}} axisLine={{stroke:"rgba(255,255,255,0.05)"}} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{fill:"#3a3a4a",fontSize:11}} axisLine={false} tickLine={false} domain={["auto","auto"]} />
                    <Tooltip content={<CustomTooltip />} cursor={{stroke:"rgba(255,255,255,0.06)"}} />
                    {profileData?.goalWeight && (
                      <ReferenceLine y={profileData.goalWeight} stroke="rgba(124,106,255,0.4)" strokeDasharray="6 3"
                        label={{value:"Goal",fill:"#7c6aff",fontSize:10}} />
                    )}
                    <Line type="monotone" dataKey="weight" stroke="#7c6aff" strokeWidth={2.5}
                      dot={false} activeDot={{r:5,fill:"#a78bfa",stroke:"#060608",strokeWidth:2}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* weekly summary */}
            <div className="card">
              <div className="card-label"><span className="card-label-dot" style={{background:"var(--green)"}} />This Week's Calories</div>
              {weeklySummary.map(d => (
                <div key={d.label} className="week-row">
                  <span className="week-day">{d.label}</span>
                  <div className="week-bar-wrap">
                    <div className="week-bar-bg">
                      <div className="week-bar-fill" style={{width:`${Math.round(d.cal/maxWeeklyCal*100)}%`}} />
                    </div>
                  </div>
                  <span className="week-cal">{d.cal > 0 ? `${d.cal} kcal` : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            NUTRITION TAB
        ══════════════════════════════════ */}
        {profileData && !showProfile && activeTab === "nutrition" && (
          <div className="dash">
            <div style={{marginBottom:20}}>
              <h2 style={{fontFamily:"Syne,sans-serif",fontSize:24,fontWeight:800,letterSpacing:"-0.5px",marginBottom:4}}>Nutrition</h2>
              <p style={{color:"var(--muted)",fontSize:13}}>Search foods, build your meal, then log it.</p>
            </div>

            {/* sub tabs */}
            <div className="sub-tabs">
              {[["search","🔍 Food Search"],["manual","✏️ Manual Entry"],["log","📋 History"]].map(([id,label]) => (
                <button key={id} className={`sub-tab${nutrSubTab===id?" active":""}`} onClick={() => setNutrSubTab(id)}>
                  {label}
                </button>
              ))}
            </div>

            {/* meal selector (always visible) */}
            <div style={{marginBottom:16}}>
              <div className="meal-tabs">
                {["Breakfast","Lunch","Dinner","Snack"].map(m => (
                  <button key={m} className={`meal-tab${activeMeal===m?" active":""}`} onClick={() => setActiveMeal(m)}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* ── FOOD SEARCH SUB-TAB ── */}
            {nutrSubTab === "search" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* CART — full width, top */}
                <div className="card">
                  <div className="card-label">
                    <span className="card-label-dot" style={{background:"var(--accent2)"}} />
                    {activeMeal} Cart
                    {cart.length > 0 && <span className="badge badge-purple" style={{marginLeft:"auto"}}>{cart.length} item{cart.length !== 1 ? "s" : ""}</span>}
                  </div>

                  {cart.length === 0 && (
                    <p style={{color:"var(--muted)",fontSize:13,padding:"8px 0"}}>
                      Search foods below and add them here to build your {activeMeal}.
                    </p>
                  )}

                  {cart.length > 0 && (
                    <>
                      {/* items in a responsive grid */}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8,marginBottom:14}}>
                        {cart.map((item, i) => (
                          <div key={i} className="cart-item">
                            <div style={{flex:1}}>
                              <div className="cart-item-name">{item.name}</div>
                              <div className="cart-item-macros">
                                {item.grams}g · {item.calculated.calories} kcal · P {item.calculated.protein}g · C {item.calculated.carbs}g · F {item.calculated.fat}g
                              </div>
                            </div>
                            <button className="btn btn-danger btn-xs"
                              onClick={() => setCart(prev => prev.filter((_,j) => j !== i))}>✕</button>
                          </div>
                        ))}
                      </div>

                      {/* totals row */}
                      <div className="cart-totals">
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                          {[
                            {label:"Calories", val:`${cartTotals.calories} kcal`, color:"var(--accent2)"},
                            {label:"Protein",  val:`${cartTotals.protein}g`,      color:"var(--blue)"},
                            {label:"Carbs",    val:`${cartTotals.carbs}g`,        color:"var(--amber)"},
                            {label:"Fat",      val:`${cartTotals.fat}g`,          color:"var(--pink)"},
                          ].map(m => (
                            <div key={m.label} style={{textAlign:"center"}}>
                              <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4}}>{m.label}</div>
                              <div style={{fontSize:18,fontWeight:700,fontFamily:"Syne,sans-serif",color:m.color}}>{m.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{display:"flex",gap:8,marginTop:4}}>
                        <button className="btn btn-accent btn-full" onClick={logCart}>
                          Log {activeMeal}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setCart([])}>Clear All</button>
                      </div>
                    </>
                  )}
                </div>

                {/* SEARCH — full width, below cart, overflow visible so dropdown shows */}
                <div style={{background:"var(--s1)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"22px",position:"relative"}}>
                  <div className="card-label"><span className="card-label-dot" style={{background:"var(--blue)"}} />Search Food Database</div>
                  <FoodSearchPanel onAddToCart={item => setCart(prev => [...prev, item])} uid={user?.uid} />
                </div>

              </div>
            )}

            {/* ── MANUAL ENTRY SUB-TAB ── */}
            {nutrSubTab === "manual" && (
              <div className="grid-2">
                <div className="card">
                  <div className="card-label"><span className="card-label-dot" style={{background:"var(--accent)"}} />Enter Macros Manually</div>
                  <div className="form-grid">
                    {[["calories","Calories (kcal)"],["protein","Protein (g)"],["carbs","Carbs (g)"],["fat","Fat (g)"]].map(([k,l]) => (
                      <div key={k} className="form-group">
                        <label className="form-label">{l}</label>
                        <input className="inp sm" type="number" placeholder="0"
                          value={manualNutr[k]}
                          onChange={e => setManualNutr({...manualNutr,[k]:e.target.value})} />
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-accent btn-full" style={{marginTop:12}} onClick={logManual}>
                    Log {activeMeal}
                  </button>
                </div>

                <div className="card">
                  <div className="card-label"><span className="card-label-dot" style={{background:"var(--pink)"}} />Today's Total</div>
                  {[
                    {label:"Calories", val:`${todayNutrition.calories} / ${targetCal} kcal`, pct:calPct,  color:"var(--accent)"},
                    {label:"Protein",  val:`${todayNutrition.protein} / ${proteinTarget}g`,  pct:protPct, color:"var(--blue)"},
                    {label:"Carbs",    val:`${todayNutrition.carbs}g`, pct:Math.min(100,Math.round(todayNutrition.carbs/carbsTarget*100)), color:"var(--amber)"},
                    {label:"Fat",      val:`${todayNutrition.fat}g`,   pct:Math.min(100,Math.round(todayNutrition.fat/fatTarget*100)),   color:"var(--pink)"},
                  ].map(row => (
                    <div key={row.label} style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                        <span style={{color:"var(--muted)"}}>{row.label}</span>
                        <span style={{fontWeight:500}}>{row.val}</span>
                      </div>
                      <div className="prog-track">
                        <div className="prog-fill" style={{width:`${row.pct}%`,background:row.color}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── HISTORY SUB-TAB ── */}
            {nutrSubTab === "log" && (() => {
              // Group entries by date
              const grouped = nutritionHistory.reduce((acc, entry) => {
                const day = entry.date?.slice(0, 10) || "Unknown";
                if (!acc[day]) acc[day] = [];
                acc[day].push(entry);
                return acc;
              }, {});
              const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).slice(0, 14);

              return (
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {nutritionHistory.length === 0 && (
                    <div className="card"><p style={{color:"var(--muted)",fontSize:13}}>No entries yet. Log your first meal above.</p></div>
                  )}
                  {sortedDays.map(day => {
                    const entries = grouped[day];
                    const dayTotals = entries.reduce((a, r) => ({
                      calories: a.calories + (r.calories || 0),
                      protein:  +(a.protein  + (r.protein  || 0)).toFixed(1),
                      carbs:    +(a.carbs    + (r.carbs    || 0)).toFixed(1),
                      fat:      +(a.fat      + (r.fat      || 0)).toFixed(1),
                    }), { calories:0, protein:0, carbs:0, fat:0 });
                    const isToday = day === todayKey();
                    const calDiff = targetCal - dayTotals.calories;
                    const dateLabel = isToday ? "Today" : new Date(day).toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" });

                    return (
                      <div key={day} className="card">
                        {/* day header */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontWeight:700,fontSize:14}}>{dateLabel}</span>
                            {isToday && <span className="badge badge-purple" style={{fontSize:10}}>Today</span>}
                          </div>
                          {/* daily totals row */}
                          <div style={{display:"flex",gap:10,fontSize:12}}>
                            <span style={{color:"var(--accent2)",fontWeight:700}}>{dayTotals.calories} kcal</span>
                            <span style={{color:"var(--blue)"}}>P {dayTotals.protein}g</span>
                            <span style={{color:"var(--amber)"}}>C {dayTotals.carbs}g</span>
                            <span style={{color:"var(--pink)"}}>F {dayTotals.fat}g</span>
                            <span style={{
                              fontSize:11,fontWeight:600,padding:"1px 8px",borderRadius:20,
                              background: calDiff < 0 ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.10)",
                              color:      calDiff < 0 ? "var(--red)" : "var(--green)",
                              border:`1px solid ${calDiff < 0 ? "rgba(248,113,113,0.2)" : "rgba(74,222,128,0.18)"}`,
                            }}>
                              {calDiff < 0 ? `+${Math.abs(calDiff)} over` : `-${calDiff} left`}
                            </span>
                          </div>
                        </div>
                        {/* calorie progress bar */}
                        <div style={{background:"var(--s3)",borderRadius:4,height:4,overflow:"hidden",marginBottom:12}}>
                          <div style={{height:"100%",borderRadius:4,background:"var(--accent)",
                            width:`${Math.min(100, Math.round(dayTotals.calories/targetCal*100))}%`,transition:"width .5s ease"}} />
                        </div>
                        {/* individual meal entries */}
                        {entries.map(entry => (
                          <div key={entry.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
                            padding:"8px 0",borderTop:"1px solid var(--border)"}}>
                              <div style={{flex:1}}>
                                <span style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{entry.meal}</span>
                                <span style={{fontSize:11,color:"var(--muted)",marginLeft:8}}>
                                  {entry.date && new Date(entry.date).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}
                                </span>
                                {entry.items && entry.items !== "Manual entry" && (
                                  <p style={{fontSize:11,color:"var(--muted2)",marginTop:2}}>{entry.items}</p>
                                )}
                              </div>
                              <div style={{display:"flex",gap:12,alignItems:"center",flexShrink:0}}>
                              <div style={{display:"flex",gap:8,fontSize:11}}>
                                <span style={{color:"var(--accent2)",fontWeight:600}}>{entry.calories} kcal</span>
                                <span style={{color:"var(--blue)"}}>P {entry.protein}g</span>
                                <span style={{color:"var(--amber)"}}>C {entry.carbs}g</span>
                                <span style={{color:"var(--pink)"}}>F {entry.fat}g</span>
                              </div>
                              <button 
                                onClick={() => deleteLog(entry.id)}
                                style={{background:"transparent",border:"none",color:"var(--muted2)",cursor:"pointer",fontSize:14,padding:"2px 4px",transition:"color 0.15s"}}
                                onMouseEnter={e => e.target.style.color = "var(--red)"}
                                onMouseLeave={e => e.target.style.color = "var(--muted2)"}
                                title="Delete entry"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ══════════════════════════════════
            PROGRESS TAB
        ══════════════════════════════════ */}
        {profileData && !showProfile && activeTab === "progress" && (
          <div className="dash">
            <div style={{marginBottom:24}}>
              <h2 style={{fontFamily:"Syne,sans-serif",fontSize:24,fontWeight:800,letterSpacing:"-0.5px",marginBottom:4}}>Progress</h2>
              <p style={{color:"var(--muted)",fontSize:13}}>Your full weight history and weekly breakdown.</p>
            </div>

            <div className="card" style={{marginBottom:14}}>
              <div className="section-hd">
                <span className="card-label" style={{margin:0}}><span className="card-label-dot" style={{background:"var(--accent)"}} />Weight Over Time</span>
                {projectedDate && <span className="badge badge-purple">🎯 Goal by {projectedDate}</span>}
              </div>
              <div style={{height:300,marginTop:12}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightHistory} margin={{top:5,right:20,left:-10,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="displayDate" tick={{fill:"#3a3a4a",fontSize:11}} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{fill:"#3a3a4a",fontSize:11}} axisLine={false} tickLine={false} domain={["auto","auto"]} />
                    <Tooltip content={<CustomTooltip />} cursor={{stroke:"rgba(255,255,255,0.06)"}} />
                    {profileData?.goalWeight && (
                      <ReferenceLine y={profileData.goalWeight} stroke="rgba(124,106,255,0.5)" strokeDasharray="6 3"
                        label={{value:"Goal",fill:"#a78bfa",fontSize:11,position:"right"}} />
                    )}
                    <Line type="monotone" dataKey="weight" stroke="#7c6aff" strokeWidth={2.5}
                      dot={false} activeDot={{r:5,fill:"#a78bfa",stroke:"#060608",strokeWidth:2}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid-2" style={{marginBottom:14}}>
              <div className="card">
                <div className="card-label"><span className="card-label-dot" style={{background:"var(--amber)"}} />Weekly Calories</div>
                {weeklySummary.map(d => (
                  <div key={d.label} className="week-row">
                    <span className="week-day">{d.label}</span>
                    <div className="week-bar-wrap">
                      <div className="week-bar-bg"><div className="week-bar-fill" style={{width:`${Math.round(d.cal/maxWeeklyCal*100)}%`}} /></div>
                    </div>
                    <span className="week-cal">{d.cal>0?`${d.cal}`:""}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-label"><span className="card-label-dot" style={{background:"var(--green)"}} />Stats at a Glance</div>
                {[
                  {label:"Starting Weight", val: weightHistory[0] ? `${toDisp(weightHistory[0].weight,unit)} ${unit}` : "—"},
                  {label:"Current Weight",  val: `${dispWeight} ${unit}`},
                  {label:"Goal Weight",     val: `${dispGoalWt} ${unit}`},
                  {label:"Total Change",    val: weightHistory[0] ? `${toDisp(Math.abs(profileData.weight - weightHistory[0].weight),unit).toFixed(1)} ${unit}` : "—"},
                  {label:"Weekly Δ",        val: weeklyDelta!=null ? `${weeklyDelta>0?"+":""}${toDisp(weeklyDelta,unit).toFixed(2)} ${unit}/wk` : "Need 14 days"},
                  {label:"Streak",          val: `${streak} day${streak!==1?"s":""}`},
                  {label:"Days Logged",     val: weightHistory.length},
                ].map(({label,val}) => (
                  <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
                    <span style={{color:"var(--muted)"}}>{label}</span>
                    <span style={{fontWeight:500}}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            MILESTONES TAB
        ══════════════════════════════════ */}
        {profileData && !showProfile && activeTab === "milestones" && (
          <div className="dash">
            <div style={{marginBottom:24}}>
              <h2 style={{fontFamily:"Syne,sans-serif",fontSize:24,fontWeight:800,letterSpacing:"-0.5px",marginBottom:4}}>Milestones</h2>
              <p style={{color:"var(--muted)",fontSize:13}}>
                {MILESTONES.filter(m => m.check(msData)).length} of {MILESTONES.length} earned
              </p>
            </div>

            <div className="card" style={{marginBottom:14}}>
              <div className="card-label"><span className="card-label-dot" style={{background:"var(--amber)"}} />Your Streak</div>
              <div style={{display:"flex",alignItems:"center",gap:24}}>
                <div>
                  <div style={{fontSize:36}}>🔥</div>
                  <div className="streak-num">{streak}</div>
                  <p style={{fontSize:12,color:"var(--muted)",marginTop:4}}>consecutive days</p>
                </div>
                <div style={{flex:1}}>
                  {[7,14,30,60,90].map(n => (
                    <div key={n} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                        <span style={{color:"var(--muted)"}}>{n}-day streak</span>
                        <span style={{color: streak>=n ? "var(--amber)" : "var(--muted2)"}}>{streak>=n?"✓ Earned":"Locked"}</span>
                      </div>
                      <div className="prog-track">
                        <div className="prog-fill" style={{width:`${Math.min(100,Math.round(streak/n*100))}%`,background:"var(--amber)"}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-label"><span className="card-label-dot" style={{background:"var(--accent2)"}} />Achievement Badges</div>
              <div className="milestone-grid">
                {MILESTONES.map(m => {
                  const earned = m.check(msData);
                  return (
                    <div key={m.id} className={`ms-item ${earned?"earned":"locked"}`}>
                      <div className="ms-icon">{m.icon}</div>
                      <div className="ms-label">{m.label}</div>
                      {earned && <span className="badge badge-purple" style={{fontSize:9,padding:"2px 6px"}}>Earned</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TOAST ── */}
        {toast && (
          <div className="toast">
            <span style={{color:"var(--green)"}}>✓</span> {toast}
          </div>
        )}
      </div>
    </>
  );
}
