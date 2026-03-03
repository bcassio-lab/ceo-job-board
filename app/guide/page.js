
'use client';
import { useState } from 'react';

const C = {
  bg:'#0a0f1a', surface:'#111827', card:'#1a2236', cardAlt:'#151d2e',
  border:'#1e293b', accent:'#22c55e', accentDim:'#166534', gold:'#f59e0b',
  warn:'#ef4444', blue:'#3b82f6', purple:'#a78bfa',
  text:'#e2e8f0', textDim:'#94a3b8', textMute:'#64748b', white:'#ffffff',
};

const employers = [
  { id:'amazon', name:'Amazon', category:'warehouse', icon:'📦', tier:'top', fairChance:5, pay:'$18–$19+/hr', locations:'2 facilities', applyUrl:'https://hiring.amazon.com', applyTime:'~15 min', assessment:false, drugTest:'Mouth swab', highlight:'No interview required — fastest path to a paycheck', positions:'Warehouse associate, sortation associate, delivery station associate', platform:'Amazon custom hiring system', bgCheck:'Accurate Background / Sterling / First Advantage — 7-year lookback', fairChanceNote:'Complies with CA Fair Chance Act; evaluates records case-by-case. Widely considered the most accessible employer for justice-impacted individuals.', steps:['Go to hiring.amazon.com','Search for "Fresno" warehouse jobs','Select a shift and schedule that works for you','Create an account (name, email, phone)','Complete the short application — basic info, work authorization, background check consent. No resume needed.','You may receive a contingent offer the same day','Schedule a pre-hire appointment (badge photo, ID check, drug test, paperwork)','Background check runs after appointment (2–7 business days)'], tips:['Night shifts and less popular shifts are easier to get','Apply during Prime Day (July) and holiday season (Oct–Dec) when Amazon hires thousands','Target warehouse positions first — avoid delivery driver roles initially','You may start as a "white badge" (seasonal) and convert to "blue badge" (permanent)','You\'ll get a $110 Zappos voucher for safety shoes'] },
  { id:'walmart', name:'Walmart', category:'retail', icon:'🏪', tier:'top', fairChance:5, pay:'$18–$19/hr', locations:'7+ stores', applyUrl:'https://careers.walmart.com', applyTime:'45–60 min', assessment:true, drugTest:'Yes', highlight:'Banned the box in 2014 — signed Fair Chance Business Pledge', positions:'Cart attendant, cashier, stocker, online order filler, deli/bakery', platform:'Workday', bgCheck:'First Advantage or Sterling — 7-year lookback', fairChanceNote:'Banned the box nationwide in 2014. Signed the Fair Chance Business Pledge. Background check only after conditional offer.', steps:['Go to careers.walmart.com','Search by Fresno zip code (93706, 93710, etc.)','Create a Workday account with your email','Fill in your availability, work history, and education (resume is optional)','Complete the 65-question assessment test — required, happens immediately','Wait for a callback from the store (1–3 weeks)'], tips:['DO NOT apply for Sporting Goods — federal law prohibits felons from handling firearms','Assessment tip: Always choose answers that prioritize helping the customer first, then teamwork','Take the assessment on a computer in a quiet place, NOT on your phone','If you fail the assessment, you must wait 6 months to retake it','Check "yes" for nights, weekends, and holidays to increase your chances','Apply September–December for holiday hiring surge'] },
  { id:'target', name:'Target', category:'retail', icon:'🎯', tier:'top', fairChance:5, pay:'~$18/hr', locations:'8 stores (incl. Clovis)', applyUrl:'https://corporate.target.com/careers', applyTime:'20–30 min', assessment:false, drugTest:'Yes', highlight:'Signed the Second Chance Pledge — no assessment for most store jobs', positions:'Guest advocate, general merchandise, fulfillment expert, inbound, food & beverage', platform:'Workday', bgCheck:'Sterling or Accurate Background — 7-year lookback', fairChanceNote:'Banned the box in 2014. Signed the Second Chance Pledge. No criminal history question on application or during interview.', steps:['Go to corporate.target.com/careers','Search by Fresno location','Click "Apply" and create a Workday account','Fill out personal info, work history, education, and availability (resume optional)','Submit and wait for callback — Target sometimes holds hiring fairs with same-day offers'], tips:['After conditional offer, Target sends you to a third-party website to explain your background','Store managers CANNOT override the third-party decision — your written explanation matters enormously','Avoid Assets Protection/Security roles — they require a clean background','Best positions: guest advocate, inbound (stocking), fulfillment expert','Apply September–November for seasonal hiring surge'] },
  { id:'homedepot', name:'Home Depot', category:'home-improvement', icon:'🔨', tier:'strong', fairChance:4, pay:'$16.50–$18/hr', locations:'4 stores', applyUrl:'https://careers.homedepot.com', applyTime:'30–45 min', assessment:true, drugTest:'Yes', highlight:'Signed Fair Chance Business Pledge — 53-question assessment', positions:'Cashier, lot associate, freight/receiving, garden, paint, sales associate', platform:'Workday', bgCheck:'First Advantage — 7-year lookback', fairChanceNote:'Signed the Fair Chance Business Pledge. Banned the box nationwide. Evaluates case-by-case.', steps:['Go to careers.homedepot.com','Search for Fresno positions','Create a Workday account','Upload a resume or enter info manually','Complete the 53-question assessment (you have 96 hours — you can stop and restart)'], tips:['Lot associate and freight/receiving have less cash handling — better for theft-related records','Spring hiring (March–August) is the best time to apply','Apply to ALL 4 Fresno-area locations — different managers, different openness','Email myTHDHR@homedepot.com for assessment accommodations'] },
  { id:'lowes', name:'Lowe\'s', category:'home-improvement', icon:'🪚', tier:'strong', fairChance:3, pay:'$16.50–$18/hr', locations:'2 stores', applyUrl:'https://talent.lowes.com', applyTime:'20–30 min', assessment:false, drugTest:'Yes', highlight:'Two interviews — but hires people with records', positions:'Cashier, sales floor, stocker/merchandiser, loader, garden center', platform:'Workday + Luci chatbot', bgCheck:'Third-party provider — 7-year lookback', fairChanceNote:'Supports Ban the Box. Did NOT sign the Fair Chance Pledge. Complies with CA law.', steps:['Go to talent.lowes.com','For store roles, the Luci chatbot may guide you — provide last 4 SSN digits and date of birth','Alternatively, apply through Workday directly','Expect 2 interviews: assistant manager (30–45 min), then HR + department managers'], tips:['Target stocker, merchandiser, and warehouse positions — less cash/customer interaction','Apply January–February when Lowe\'s ramps up for spring','Apply to both Fresno and Clovis stores to double your chances','Be flexible with schedule — nights, weekends, holidays = better odds'] },
  { id:'costco', name:'Costco', category:'retail', icon:'🛒', tier:'strong', fairChance:3, pay:'$20–$21/hr', locations:'2 warehouses', applyUrl:'https://careers.costco.com', applyTime:'20–30 min', assessment:false, drugTest:'Yes — at interview', highlight:'Highest pay of any retailer — employee-owned (ESOP)', positions:'Front end assistant, cashier, stocker, food court, bakery, cart crew, gas station', platform:'Custom/proprietary', bgCheck:'Possibly Checkr — 7-year lookback', fairChanceNote:'Has NOT signed the Fair Chance Pledge. Complies with CA law. Case-by-case evaluation.', steps:['Go to careers.costco.com','Create an account and search by state → city (Fresno)','Select a position (most new hires: front end, cart crew, food court)','Fill out contact info, availability, work history, education','You\'ll be screened for WOTC — this helps because employers get a tax credit for hiring you','Applications expire after 90 days — reapply if you don\'t hear back'], tips:['VISIT THE STORE after applying online — this is critical','Go mid-morning on a weekday, dress business casual, ask for the Assistant General Manager','Say: "I recently applied online and wanted to introduce myself"','Apply to BOTH Fresno warehouses','Check "Any Position" and full availability including holidays','⚠️ Drug test happens at interview — tests for marijuana even in California'] },
  { id:'ross', name:'Ross Dress for Less', category:'discount', icon:'👗', tier:'moderate', fairChance:3, pay:'~$17/hr', locations:'6 stores', applyUrl:'https://jobs.rossstores.com', applyTime:'20–30 min', assessment:false, drugTest:'Not typically', highlight:'6 locations = 6 different managers making hiring decisions', positions:'Sales associate, cashier, stockroom, loss prevention (avoid with record)', platform:'Oracle Taleo', bgCheck:'Accurate Background — 7-year lookback', fairChanceNote:'No formal second-chance program, but no blanket exclusions. Case-by-case.', steps:['Go to jobs.rossstores.com','Search by Fresno zip code','Create a Taleo account','Complete application (20–30 minutes)','Follow up in person 2–3 weeks after applying'], tips:['Theft-related convictions are the biggest challenge for cash-handling positions','Target stocker or receiving positions','With 6 locations, apply broadly — a "no" at one store doesn\'t mean "no" at the next'] },
  { id:'tjmaxx', name:'TJ Maxx / Marshalls', category:'discount', icon:'🏷️', tier:'moderate', fairChance:4, pay:'$17–$18/hr', locations:'3 stores', applyUrl:'https://jobs.tjx.com', applyTime:'15–20 min', assessment:false, drugTest:'Not typically', highlight:'Explicitly states: "Applicants with arrest or conviction records will be considered"', positions:'Sales associate, cashier, stockroom, backroom coordinator', platform:'Workday', bgCheck:'Third-party — 7-year lookback', fairChanceNote:'Job postings explicitly state: "Applicants with arrest or conviction records will be considered for employment." Most transparent fair chance language among discount retailers.', steps:['Go to jobs.tjx.com','Search for TJ Maxx or Marshalls in Fresno','Create a Workday account','Complete the application (15–20 minutes)','Hiring is typically fast — 3–7 days from application to offer'], tips:['Apply to ALL THREE Fresno locations across both brands','TJX has the most welcoming written language toward justice-impacted applicants','Fast hiring timeline — check your phone and email daily after applying'] },
  { id:'burlington', name:'Burlington', category:'discount', icon:'🧥', tier:'moderate', fairChance:3, pay:'$17–$18/hr', locations:'3–4 stores', applyUrl:'https://burlingtonstores.jobs', applyTime:'15–20 min', assessment:false, drugTest:'Varies', highlight:'Growing in Fresno — new store opened Oct 2025 at former Big Lots', positions:'Sales associate, cashier, stockroom, receiving', platform:'iCIMS', bgCheck:'Third-party — 7-year lookback', fairChanceNote:'Documented history of hiring people with records. Complies with CA Fair Chance Act.', steps:['Go to burlingtonstores.jobs','Search for Fresno positions','Create an iCIMS account','Complete application (15–20 minutes)','Some locations do group interviews — be prepared'], tips:['Burlington emphasizes a "fun" culture — show energy and positive attitude in interviews','New Fresno store at 4895 E. Cesar Chavez Blvd is likely hiring to fill out its team'] },
  { id:'dollartree', name:'Dollar Tree / Family Dollar', category:'discount', icon:'💲', tier:'moderate', fairChance:3, pay:'$16.50–$17/hr', locations:'15–20+ stores', applyUrl:'https://careers.dollartree.com', applyTime:'7–9 min', assessment:false, drugTest:'Generally no', highlight:'Fastest application (7 min) and most locations in Fresno', positions:'Sales associate, cashier, stocker, assistant manager', platform:'Workday', bgCheck:'Third-party — 7-year lookback', fairChanceNote:'Family Dollar has stated: "We do not have a policy that bars the hiring of those with past felonies. All are welcome to apply."', steps:['Go to careers.dollartree.com','Search for Dollar Tree or Family Dollar in Fresno','Create a Workday account','Complete the application — only 7–9 minutes'], tips:['With 15–20 locations, each with an independent store manager, you have the most chances here','Apply to MULTIPLE stores simultaneously','Pay is lower, but barriers to entry are also lower','Good stepping-stone employer to build work history'] },
  { id:'food4less', name:'Food 4 Less', category:'grocery', icon:'🛍️', tier:'moderate', fairChance:3, pay:'$16.50–$17.50/hr', locations:'4+ stores', applyUrl:'https://food4lesscentralvalley.com', applyTime:'20–30 min', assessment:false, drugTest:'Varies', highlight:'Fresno stores are independent franchise (Gongco Foods) — NOT Kroger corporate', positions:'Cashier, stocker, deli, bakery, produce, courtesy clerk', platform:'Franchise-operated', bgCheck:'Varies — franchise operated', fairChanceNote:'Fresno stores are operated by Gongco Foods (independent franchise). Kroger\'s corporate fair chance policies may not apply. Building rapport with store managers is key.', steps:['Visit food4lesscentralvalley.com or apply in person at a Fresno store','Alternatively, try krogerfamilycareers.com (some stores use the corporate portal)','Complete the application online or ask for a paper application in-store'], tips:['Franchise stores = the manager has more hiring discretion than corporate chains','In-person applications and introductions may carry more weight here','Union positions (UFCW) may be available — ask about it'] },
  { id:'winco', name:'WinCo Foods', category:'grocery', icon:'🏬', tier:'moderate', fairChance:2, pay:'$16.75–$17.50/hr + ESOP', locations:'2 stores', applyUrl:'https://careers.wincofoods.com', applyTime:'20–30 min', assessment:false, drugTest:'Yes, mandatory', highlight:'Employee-owned (ESOP) — company contributes ~20% of wages in stock. 500+ millionaire employees.', positions:'Cashier, stocker, deli, bakery, produce, night crew', platform:'iCIMS', bgCheck:'HireRight (confirmed) — call 866-521-6995 with questions', fairChanceNote:'Some reports suggest WinCo may be stricter than competitors about criminal records. Apply online only.', steps:['Go to careers.wincofoods.com','Search for Fresno positions','Create an iCIMS account','Complete the full application online — no paper applications accepted','Applications kept on file for 30 days — reapply after that'], tips:['⚠️ Some employee reports suggest WinCo may be stricter about records','Use a computer, not your phone — reports of application issues on mobile','The ESOP makes this potentially life-changing for long-term wealth building','Apply to both Fresno locations: S. Peach Ave and W. Shaw Ave'] },
  { id:'savemart', name:'Save Mart / FoodMaxx', category:'grocery', icon:'🥦', tier:'moderate', fairChance:3, pay:'$16.50–$17/hr', locations:'8+ stores', applyUrl:'https://thesavemartcompanies.com/careers', applyTime:'20–30 min', assessment:false, drugTest:'Yes, mandatory', highlight:'Union jobs (UFCW 8) — seniority protections and just-cause termination', positions:'Cashier, stocker, deli/bakery, produce, night crew, courtesy clerk', platform:'Custom career portal', bgCheck:'Third-party — 7-year lookback', fairChanceNote:'Positions represented by UFCW 8-Golden State union. Once hired, union protections make it harder to be let go unfairly.', steps:['Go to thesavemartcompanies.com/careers','Search for Save Mart or FoodMaxx in Fresno','Create an account and complete the application','After hiring, contact UFCW 8 at 3485 W. Shaw Ave, Suite 101 (559-271-1288) for union membership'], tips:['Union membership provides collective bargaining, seniority protections, and just-cause termination','New ownership (Jim Pattison Group, 2024) but union contracts carry over','Apply to both Save Mart and FoodMaxx locations for maximum coverage'] },
  { id:'autozone', name:'AutoZone', category:'auto', icon:'🔧', tier:'moderate', fairChance:3, pay:'$16.50–$17/hr', locations:'7–10 stores', applyUrl:'https://careers.autozone.com', applyTime:'25–35 min', assessment:true, drugTest:'Generally no', highlight:'Automotive knowledge is a big advantage — many locations in Fresno', positions:'Sales associate (parts advisor), delivery driver, shift manager', platform:'Oracle HCM Cloud', bgCheck:'Third-party — 7-year lookback', fairChanceNote:'Evaluates records case-by-case. Complies with CA Fair Chance Act.', steps:['Go to careers.autozone.com','Search for Fresno locations','Create an account and complete the application','Complete the pre-employment assessment as part of the online application'], tips:['Any automotive knowledge is a significant advantage — mention it!','Avoid delivery driver positions if you have DUI/reckless driving on your record','7–10 locations means many independent managers making decisions'] },
  { id:'oreilly', name:'O\'Reilly Auto Parts', category:'auto', icon:'🚗', tier:'moderate', fairChance:4, pay:'$16.50–$18/hr', locations:'9 stores', applyUrl:'https://careers.oreillyauto.com', applyTime:'15–25 min', assessment:false, drugTest:'No (stores)', highlight:'Strong promote-from-within culture — reports of rapid advancement with felony record', positions:'Parts specialist, delivery specialist, hub driver, assistant manager', platform:'Workday', bgCheck:'Third-party — 7-year lookback', fairChanceNote:'Widely regarded as a felon-friendly employer. Strong promote-from-within culture. One employee reported being hired with a felony and promoted to assistant hub manager within 3 months.', steps:['Go to careers.oreillyauto.com','Search for Fresno locations','Create a Workday account','Complete the application (15–25 minutes)'], tips:['If your felony is sealed, expunged, or dismissed, you are NOT required to report it','Apply to multiple of the 9 Fresno locations','Great promote-from-within culture — show reliability and you\'ll move up fast','No drug test for store positions (distribution center does test)'] },
];

const categories = [
  {id:'all',label:'All',icon:'📋'},{id:'warehouse',label:'Warehouse',icon:'📦'},
  {id:'retail',label:'Big Box',icon:'🏪'},{id:'home-improvement',label:'Home Improvement',icon:'🔨'},
  {id:'discount',label:'Discount',icon:'🏷️'},{id:'grocery',label:'Grocery',icon:'🛒'},
  {id:'auto',label:'Auto Parts',icon:'🔧'},
];

function Stars({count}){const colors=['',C.warn,C.gold,C.gold,C.accent,C.accent];return <span style={{letterSpacing:2,fontSize:14}}>{[1,2,3,4,5].map(i=><span key={i} style={{color:i<=count?colors[count]:'#334155'}}>★</span>)}</span>;}
function Badge({children,color=C.accent}){return <span style={{display:'inline-block',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600,letterSpacing:0.5,color,background:color+'18',border:`1px solid ${color}30`,whiteSpace:'nowrap'}}>{children}</span>;}

function EmployerCard({emp}){
  const [open,setOpen]=useState(false);
  const tierColor=emp.tier==='top'?C.accent:emp.tier==='strong'?C.blue:C.textDim;
  const tierLabel=emp.tier==='top'?'TOP PICK':emp.tier==='strong'?'STRONG':'SOLID OPTION';
  return (
    <div style={{background:C.card,borderRadius:14,overflow:'hidden',border:`1px solid ${emp.tier==='top'?C.accent+'40':C.border}`}}>
      <div onClick={()=>setOpen(!open)} style={{padding:'18px 20px',cursor:'pointer',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:28}}>{emp.icon}</span>
            <div>
              <h3 style={{margin:0,fontSize:18,fontWeight:700,color:C.white}}>{emp.name}</h3>
              <div style={{display:'flex',gap:6,alignItems:'center',marginTop:4}}><Stars count={emp.fairChance}/><Badge color={tierColor}>{tierLabel}</Badge></div>
            </div>
          </div>
          <span style={{fontSize:20,color:C.textDim,transition:'transform 0.3s',transform:open?'rotate(180deg)':'rotate(0deg)'}}>▾</span>
        </div>
        <p style={{margin:0,fontSize:14,color:C.gold,fontWeight:500,lineHeight:1.4}}>{emp.highlight}</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          <Badge color={C.accent}>💰 {emp.pay}</Badge>
          <Badge color={C.blue}>📍 {emp.locations}</Badge>
          <Badge color={emp.assessment?C.gold:C.accent}>{emp.assessment?'📝 Assessment':'✅ No Assessment'}</Badge>
          <Badge color={C.purple}>⏱ {emp.applyTime}</Badge>
          {(emp.drugTest==='Not typically'||emp.drugTest==='Generally no'||emp.drugTest==='No (stores)')
            ?<Badge color={C.accent}>💊 No Drug Test</Badge>
            :<Badge color={C.gold}>💊 {emp.drugTest}</Badge>}
        </div>
      </div>
      {open && (
        <div style={{padding:'0 20px 20px',borderTop:`1px solid ${C.border}`}}>
          <a href={emp.applyUrl} target="_blank" rel="noopener noreferrer" style={{display:'block',textAlign:'center',padding:'14px 20px',margin:'16px 0',borderRadius:10,fontWeight:700,fontSize:16,background:`linear-gradient(135deg, ${C.accent}, ${C.accentDim})`,color:C.white,textDecoration:'none',letterSpacing:0.5,boxShadow:`0 4px 20px ${C.accent}30`}}>
            Apply Now → {emp.applyUrl.replace('https://','')}
          </a>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:12,marginBottom:16}}>
            <div style={{background:C.cardAlt,borderRadius:8,padding:'10px 14px'}}><div style={{fontSize:11,color:C.textMute,textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>Positions</div><div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{emp.positions}</div></div>
            <div style={{background:C.cardAlt,borderRadius:8,padding:'10px 14px'}}><div style={{fontSize:11,color:C.textMute,textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>Platform</div><div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{emp.platform}</div></div>
            <div style={{background:C.cardAlt,borderRadius:8,padding:'10px 14px'}}><div style={{fontSize:11,color:C.textMute,textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>Background Check</div><div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{emp.bgCheck}</div></div>
          </div>
          <div style={{background:C.accent+'10',borderRadius:10,padding:16,border:`1px solid ${C.accent}25`,marginBottom:16}}>
            <h4 style={{margin:'0 0 6px',fontSize:13,color:C.accent,textTransform:'uppercase',letterSpacing:1}}>Fair Chance Policy</h4>
            <p style={{margin:0,fontSize:14,color:C.text,lineHeight:1.6}}>{emp.fairChanceNote}</p>
          </div>
          <div style={{marginBottom:16}}>
            <h4 style={{margin:'0 0 10px',fontSize:14,color:C.white,fontWeight:600}}>📋 How to Apply — Step by Step</h4>
            <ol style={{margin:0,paddingLeft:20}}>{emp.steps.map((s,i)=><li key={i} style={{color:C.text,fontSize:14,lineHeight:1.7,marginBottom:6}}>{s}</li>)}</ol>
          </div>
          <div style={{background:C.gold+'10',borderRadius:10,padding:16,border:`1px solid ${C.gold}25`}}>
            <h4 style={{margin:'0 0 10px',fontSize:13,color:C.gold,textTransform:'uppercase',letterSpacing:1}}>💡 Tips for Justice-Impacted Applicants</h4>
            <ul style={{margin:0,paddingLeft:18}}>{emp.tips.map((t,i)=><li key={i} style={{color:C.text,fontSize:14,lineHeight:1.7,marginBottom:4}}>{t}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GuidePage(){
  const [section,setSection]=useState('rights');
  const [cat,setCat]=useState('all');
  const filtered=cat==='all'?employers:employers.filter(e=>e.category===cat);
  const scrollTo=(id)=>{setSection(id);document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});};
  const sections=[{id:'rights',label:'⚖️ Your Rights'},{id:'getready',label:'📄 Get Ready'},{id:'employers',label:'🏢 Employers'},{id:'comparison',label:'📊 Compare'},{id:'talkaboutit',label:'💬 Your Record'},{id:'resources',label:'📞 Resources'}];

  return (
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,fontFamily:"'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif"}}>
      <style>{`*{box-sizing:border-box}a{color:${C.accent}}::-webkit-scrollbar{height:4px;width:6px}::-webkit-scrollbar-thumb{background:${C.textMute};border-radius:4px}@media(max-width:640px){.cmp-tbl{font-size:12px!important}.cmp-tbl td,.cmp-tbl th{padding:6px 8px!important}}`}</style>

      {/* Header */}
      <header style={{background:`linear-gradient(180deg,${C.surface} 0%,${C.bg} 100%)`,borderBottom:`1px solid ${C.border}`,padding:'24px 20px 20px'}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <a href="/" style={{fontSize:13,color:C.accent,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:6,marginBottom:16}}>← Back to Job Board</a>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <span style={{background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,color:C.white,padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase'}}>GUIDE</span>
            <span style={{fontSize:12,color:C.textMute}}>Updated March 2026</span>
          </div>
          <h1 style={{margin:'0 0 8px',fontSize:26,fontWeight:800,color:C.white,lineHeight:1.2}}>Fair Chance Application Guide</h1>
          <p style={{margin:0,fontSize:15,color:C.textDim,lineHeight:1.5}}>Step-by-step instructions for applying to 16 Fresno employers that hire people with records.<br/>Your background is not the end of your story — California law protects you.</p>
        </div>
      </header>

      {/* Sticky Nav */}
      <nav style={{position:'sticky',top:0,zIndex:50,background:C.surface+'f0',backdropFilter:'blur(12px)',borderBottom:`1px solid ${C.border}`,padding:'8px 20px',overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'flex',gap:4}}>
          {sections.map(s=><button key={s.id} onClick={()=>scrollTo(s.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:8,border:'none',cursor:'pointer',background:section===s.id?C.accent+'20':'transparent',color:section===s.id?C.accent:C.textDim,fontSize:13,fontWeight:section===s.id?600:400,whiteSpace:'nowrap'}}>{s.label}</button>)}
        </div>
      </nav>

      <main style={{maxWidth:900,margin:'0 auto',padding:'24px 20px 80px'}}>

        {/* ═══ RIGHTS ═══ */}
        <section id="rights" style={{marginBottom:48}}>
          <h2 style={{margin:'0 0 6px',fontSize:22,fontWeight:800,color:C.white}}>⚖️ Know Your Rights</h2>
          <p style={{margin:'0 0 20px',fontSize:14,color:C.textDim}}>California law protects you — understand it before applying anywhere</p>

          <div style={{background:C.accent+'10',borderRadius:14,padding:20,border:`1px solid ${C.accent}25`,marginBottom:20}}>
            <h3 style={{margin:'0 0 12px',fontSize:16,color:C.accent}}>California Fair Chance Act (AB 1008)</h3>
            <p style={{margin:0,fontSize:15,color:C.text,lineHeight:1.7}}><strong style={{color:C.white}}>No employer with 5+ employees can ask about your criminal history until AFTER they make you a conditional job offer.</strong> This applies to every employer in this guide. You get a fair shot at the interview first.</p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:16,marginBottom:20}}>
            <div style={{background:C.warn+'08',borderRadius:12,padding:18,border:`1px solid ${C.warn}25`}}>
              <h4 style={{margin:'0 0 4px',fontSize:15,color:C.warn}}>Before a Job Offer</h4>
              <p style={{margin:'0 0 10px',fontSize:12,color:C.textDim}}>Employers CANNOT:</p>
              <ul style={{margin:0,paddingLeft:16}}>{['Ask about convictions on the application','Ask about your record during the interview','Run a background check','Google your criminal history','Post ads saying "No Felons"'].map((item,i)=><li key={i} style={{fontSize:14,color:C.text,lineHeight:1.7,marginBottom:2}}>{item}</li>)}</ul>
            </div>
            <div style={{background:C.accent+'08',borderRadius:12,padding:18,border:`1px solid ${C.accent}25`}}>
              <h4 style={{margin:'0 0 4px',fontSize:15,color:C.accent}}>After a Conditional Offer</h4>
              <p style={{margin:'0 0 10px',fontSize:12,color:C.textDim}}>If background check shows a conviction, employer MUST:</p>
              <ul style={{margin:0,paddingLeft:16}}>{['Conduct an individualized assessment (no blanket "no felons" policy)','Send you written notice identifying the specific conviction','Give you a copy of the background check report','Give you at least 5 business days to respond','Actually consider your response before deciding'].map((item,i)=><li key={i} style={{fontSize:14,color:C.text,lineHeight:1.7,marginBottom:2}}>{item}</li>)}</ul>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:12}}>
            {[{icon:'📅',title:'7-Year Rule',text:'In California, background check companies generally cannot report convictions older than 7 years. If your conviction is from 2019 or earlier, it likely won\'t appear.'},
              {icon:'🧹',title:'SB 731 — Clean Slate Act',text:'Since Oct 2024, CA automatically seals most non-violent, non-sex-offense felonies 4 years after sentence completion if no new felony convictions.'},
              {icon:'📉',title:'Proposition 47',text:'If your felony was for shoplifting, theft, forgery (under $950), or simple drug possession, it may qualify for reclassification as a misdemeanor.'}
            ].map((c,i)=><div key={i} style={{background:C.card,borderRadius:10,padding:16,border:`1px solid ${C.border}`}}><div style={{fontSize:20,marginBottom:6}}>{c.icon}</div><h4 style={{margin:'0 0 4px',fontSize:14,color:C.white}}>{c.title}</h4><p style={{margin:0,fontSize:13,color:C.textDim,lineHeight:1.6}}>{c.text}</p></div>)}
          </div>

          <div style={{background:C.gold+'10',borderRadius:10,padding:14,marginTop:16,border:`1px solid ${C.gold}25`,fontSize:14,color:C.text,lineHeight:1.6}}>
            <strong style={{color:C.gold}}>If an employer violates your rights:</strong> File a complaint with the California Civil Rights Department at <strong>(800) 884-1684</strong> or online at calcivilrights.ca.gov. You have 3 years to file.
          </div>
        </section>

        {/* ═══ GET READY ═══ */}
        <section id="getready" style={{marginBottom:48}}>
          <h2 style={{margin:'0 0 6px',fontSize:22,fontWeight:800,color:C.white}}>📄 Get Ready Before You Apply</h2>
          <p style={{margin:'0 0 20px',fontSize:14,color:C.textDim}}>Gather these items now — you'll need them for every application</p>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:14}}>
            {[{icon:'🪪',title:'Valid Photo ID',text:'California ID or driver\'s license. Fresno DMV — make appointment at dmv.ca.gov. Cost: ~$35.'},
              {icon:'🔢',title:'Social Security Number',text:'Get free replacement at SSA: 865 Fulton St (Downtown), 5140 E. Olive Ave (East), 640 W. Locust Ave (North). Call 1-800-772-1213.'},
              {icon:'📝',title:'Work History',text:'Write down every job: employer name, address, phone, your title, dates. Include CEO transitional work.'},
              {icon:'👥',title:'2–3 References',text:'Supervisors, counselors, teachers, community leaders — not family. Tell them in advance.'},
              {icon:'📧',title:'Professional Email',text:'Create free Gmail at mail.google.com. Use firstname.lastname@gmail.com. Check it daily.'},
              {icon:'📱',title:'Professional Voicemail',text:'Record: "You\'ve reached [name]. Please leave a message." Check voicemail twice a day.'},
            ].map((c,i)=><div key={i} style={{background:C.card,borderRadius:10,padding:16,border:`1px solid ${C.border}`,display:'flex',gap:12,alignItems:'flex-start'}}><span style={{fontSize:24,flexShrink:0}}>{c.icon}</span><div><h4 style={{margin:'0 0 4px',fontSize:14,color:C.white}}>{c.title}</h4><p style={{margin:0,fontSize:13,color:C.textDim,lineHeight:1.6}}>{c.text}</p></div></div>)}
          </div>

          <div style={{background:C.blue+'10',borderRadius:12,padding:16,marginTop:16,border:`1px solid ${C.blue}25`}}>
            <h4 style={{margin:'0 0 8px',fontSize:14,color:C.blue}}>Need Help Getting Documents?</h4>
            <ul style={{margin:0,paddingLeft:18,fontSize:14,color:C.text,lineHeight:1.8}}>
              <li><strong>CEO Fresno</strong> — 2333 Merced St • (559) 777-7116 • Wraparound services</li>
              <li><strong>Turning Point Belgravia</strong> — (559) 233-0515 • CA ID and SSN help</li>
              <li><strong>GEO Reentry</strong> — 3636 N. First St • (559) 365-5308 • Document workshops</li>
            </ul>
          </div>

          <div style={{background:C.purple+'10',borderRadius:12,padding:16,marginTop:12,border:`1px solid ${C.purple}25`,fontSize:14,color:C.text,lineHeight:1.6}}>
            <strong style={{color:C.purple}}>No Computer?</strong> Free computers at any Fresno County Library. Central Library: <strong>2420 Mariposa St</strong>. Workforce Connection: <strong>3302 N. Blackstone Ave</strong> (559-230-3600).
          </div>
        </section>

        {/* ═══ EMPLOYERS ═══ */}
        <section id="employers" style={{marginBottom:48}}>
          <h2 style={{margin:'0 0 6px',fontSize:22,fontWeight:800,color:C.white}}>🏢 Employer-by-Employer Guides</h2>
          <p style={{margin:'0 0 16px',fontSize:14,color:C.textDim}}>Tap any employer to see step-by-step instructions, tips, and fair chance details</p>

          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16,padding:'12px 0',borderBottom:`1px solid ${C.border}`}}>
            {categories.map(c=><button key={c.id} onClick={()=>setCat(c.id)} style={{padding:'6px 14px',borderRadius:20,border:`1px solid ${cat===c.id?C.accent:C.border}`,background:cat===c.id?C.accent+'20':'transparent',color:cat===c.id?C.accent:C.textDim,fontSize:13,fontWeight:500,cursor:'pointer'}}>{c.icon} {c.label}</button>)}
          </div>

          <div style={{fontSize:13,color:C.textMute,marginBottom:12}}>Showing {filtered.length} employer{filtered.length!==1?'s':''} — tap to expand</div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>{filtered.map(emp=><EmployerCard key={emp.id} emp={emp}/>)}</div>
        </section>

        {/* ═══ COMPARISON ═══ */}
        <section id="comparison" style={{marginBottom:48}}>
          <h2 style={{margin:'0 0 6px',fontSize:22,fontWeight:800,color:C.white}}>📊 Quick Comparison</h2>
          <p style={{margin:'0 0 16px',fontSize:14,color:C.textDim}}>All employers at a glance — scroll right on mobile</p>
          <div style={{overflowX:'auto',borderRadius:12,border:`1px solid ${C.border}`}}>
            <table className="cmp-tbl" style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:700}}>
              <thead><tr style={{background:C.surface}}>
                {['Employer','Pay','Locations','Fair Chance','Assessment','Drug Test','Apply Time'].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,color:C.textMute,textTransform:'uppercase',letterSpacing:1,borderBottom:`1px solid ${C.border}`,whiteSpace:'nowrap'}}>{h}</th>)}
              </tr></thead>
              <tbody>{employers.map((emp,i)=>(
                <tr key={emp.id} style={{background:i%2===0?C.card:C.cardAlt}}>
                  <td style={{padding:'10px 12px',fontWeight:600,color:C.white,whiteSpace:'nowrap',borderBottom:`1px solid ${C.border}`}}>{emp.icon} {emp.name}</td>
                  <td style={{padding:'10px 12px',color:C.accent,fontWeight:600,borderBottom:`1px solid ${C.border}`,whiteSpace:'nowrap'}}>{emp.pay}</td>
                  <td style={{padding:'10px 12px',color:C.text,borderBottom:`1px solid ${C.border}`,whiteSpace:'nowrap'}}>{emp.locations}</td>
                  <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`}}><Stars count={emp.fairChance}/></td>
                  <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`,color:emp.assessment?C.gold:C.accent}}>{emp.assessment?'📝 Yes':'✅ No'}</td>
                  <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`,color:C.text,whiteSpace:'nowrap'}}>{emp.drugTest}</td>
                  <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`,color:C.purple,whiteSpace:'nowrap'}}>{emp.applyTime}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>

        {/* ═══ TALK ABOUT IT ═══ */}
        <section id="talkaboutit" style={{marginBottom:48}}>
          <h2 style={{margin:'0 0 6px',fontSize:22,fontWeight:800,color:C.white}}>💬 How to Talk About Your Record</h2>
          <p style={{margin:'0 0 20px',fontSize:14,color:C.textDim}}>This only happens AFTER you get a conditional offer — you've already impressed them</p>

          <div style={{background:C.card,borderRadius:14,padding:20,marginBottom:16,border:`1px solid ${C.border}`}}>
            <h3 style={{margin:'0 0 16px',fontSize:16,color:C.white}}>The 30-Second Method: Context → Ownership → Development</h3>
            {[{num:'1',title:'Context',color:C.blue,text:'Briefly explain (1–2 sentences): "In [year], I was going through a difficult time and made some poor decisions."'},
              {num:'2',title:'Ownership',color:C.gold,text:'"I take complete responsibility for my actions."'},
              {num:'3',title:'Development',color:C.accent,text:'"Since then, I\'ve completed [program/training], I\'ve been working with CEO where I gained experience in [skills], and I\'m committed to building a stable career."'}
            ].map((s,i)=><div key={i} style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:12}}>
              <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,background:s.color+'20',color:s.color,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14}}>{s.num}</div>
              <div><h4 style={{margin:'0 0 2px',fontSize:14,color:s.color}}>{s.title}</h4><p style={{margin:0,fontSize:14,color:C.text,lineHeight:1.6}}>{s.text}</p></div>
            </div>)}
          </div>

          <div style={{background:C.surface,borderRadius:14,padding:20,marginBottom:16,border:`1px solid ${C.accent}30`}}>
            <h4 style={{margin:'0 0 10px',fontSize:14,color:C.accent}}>📝 Sample Script You Can Practice</h4>
            <p style={{margin:0,fontSize:14,color:C.text,lineHeight:1.8,fontStyle:'italic',padding:'12px 16px',borderRadius:8,background:C.card,borderLeft:`3px solid ${C.accent}`}}>
              "I want to be upfront with you. In [year], I was convicted of [general description]. I served my time and used that experience to completely turn my life around. Since my release, I've completed workforce training through CEO, earned my [certificates], and I've been working consistently on transitional work crews. I'm focused on building a long-term career, and I believe the discipline I've developed makes me a reliable employee."
            </p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:12}}>
            {[{icon:'⏱️',title:'Keep It Under 2 Minutes',text:'Don\'t over-share details. Be concise, then pivot to what you offer.'},
              {icon:'🚫',title:'Never Lie',text:'Employers will find out through the background check. Dishonesty is a bigger disqualifier than most records.'},
              {icon:'💰',title:'Mention WOTC',text:'Tell employers they may receive a federal Work Opportunity Tax Credit for hiring you — it\'s a financial incentive.'},
              {icon:'🛡️',title:'Federal Bonding',text:'The Federal Bonding Program (1-877-US2-JOBS) provides free fidelity bond insurance to employers — removes their risk.'}
            ].map((c,i)=><div key={i} style={{background:C.card,borderRadius:10,padding:16,border:`1px solid ${C.border}`}}><div style={{fontSize:20,marginBottom:6}}>{c.icon}</div><h4 style={{margin:'0 0 4px',fontSize:14,color:C.white}}>{c.title}</h4><p style={{margin:0,fontSize:13,color:C.textDim,lineHeight:1.6}}>{c.text}</p></div>)}
          </div>
        </section>

        {/* ═══ RESOURCES ═══ */}
        <section id="resources" style={{marginBottom:48}}>
          <h2 style={{margin:'0 0 6px',fontSize:22,fontWeight:800,color:C.white}}>📞 Fresno Resources</h2>
          <p style={{margin:'0 0 20px',fontSize:14,color:C.textDim}}>Organizations that can help you right now</p>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[{name:'Center for Employment Opportunities (CEO) — Fresno',address:'2333 Merced St, Fresno, CA 93721',phone:'(559) 777-7116',email:'referralsfresno@ceoworks.org',hours:'Mon–Fri, 9am–5pm',services:'Job readiness orientation, paid transitional work, job coaching, full-time placement, wraparound services',color:C.accent},
              {name:'Workforce Connection (America\'s Job Center)',address:'3302 N. Blackstone Ave, Suite 155',phone:'(559) 230-3600',services:'Free job search help, resume writing, career training, computer access, job fairs, scholarships',color:C.blue},
              {name:'GEO Reentry Services',address:'3636 N. First St, Suite 121',phone:'(559) 365-5308',services:'Vocational assessments, OSHA cert, HiSET (GED), job workshops, computer lab. Requires Fresno County Probation referral.',color:C.purple},
              {name:'Fresno County Public Defender — Clean Slate Program',phone:'fresnocountyca.gov/Public-Defender',services:'FREE expungement, juvenile record sealing, felony reduction, Prop 64 relief',color:C.gold},
              {name:'Central California Legal Services (CCLS)',phone:'centralcallegal.org',services:'FREE criminal record expungement clinics with volunteer advocates',color:C.gold},
              {name:'Root & Rebound — Reentry Legal Hotline',phone:'(510) 279-4662 — Fridays 9am–3pm',services:'Free legal advice on employment barriers. Accepts collect calls from jail/prison.',color:C.gold},
              {name:'Fresno Area Express (FAX) Bus',phone:'(559) 621-RIDE (7433)',services:'Base fare: $1.00 • Free transfers 90 min • Bike racks on all buses • Veterans ride free',color:C.textDim},
            ].map((r,i)=><div key={i} style={{background:C.card,borderRadius:12,padding:18,border:`1px solid ${C.border}`,borderLeft:`4px solid ${r.color}`}}>
              <h4 style={{margin:'0 0 8px',fontSize:15,color:C.white}}>{r.name}</h4>
              <div style={{fontSize:13,color:C.textDim,lineHeight:1.8}}>
                {r.address&&<div>📍 {r.address}</div>}
                {r.phone&&<div>📞 {r.phone}</div>}
                {r.email&&<div>📧 {r.email}</div>}
                {r.hours&&<div>🕐 {r.hours}</div>}
                {r.services&&<div style={{marginTop:6,color:C.text}}>→ {r.services}</div>}
              </div>
            </div>)}
          </div>
        </section>

        {/* Footer CTA */}
        <div style={{background:`linear-gradient(135deg,${C.accent}15,${C.blue}15)`,borderRadius:16,padding:28,textAlign:'center',border:`1px solid ${C.accent}25`}}>
          <h2 style={{margin:'0 0 8px',fontSize:22,color:C.white}}>Your record is not the end of your story.</h2>
          <p style={{margin:'0 0 20px',fontSize:15,color:C.textDim,lineHeight:1.6,maxWidth:600,marginLeft:'auto',marginRight:'auto'}}>These 16 employers operate <strong style={{color:C.white}}>75+ locations across Fresno</strong>. Each one has managers making independent hiring decisions. A "no" at one store doesn't mean "no" at the next.</p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <a href="/" style={{display:'inline-block',padding:'12px 24px',borderRadius:10,background:C.accent,color:C.white,fontWeight:700,fontSize:15,textDecoration:'none'}}>← Back to Job Board</a>
            <a href="https://hiring.amazon.com" target="_blank" rel="noopener noreferrer" style={{display:'inline-block',padding:'12px 24px',borderRadius:10,background:C.blue,color:C.white,fontWeight:700,fontSize:15,textDecoration:'none'}}>Apply to Amazon Now →</a>
          </div>
        </div>

        <footer style={{textAlign:'center',padding:'32px 0 0',fontSize:13,color:C.textMute}}>
          Center for Employment Opportunities • Fresno, CA<br/>Guide last updated March 2026 • Verify details with employers directly
        </footer>
      </main>
    </div>
  );
}
