(()=>{"use strict";
const API="https://data.techforpalestine.org/api/v2/casualties_daily.json";
const SUMMARY="https://data.techforpalestine.org/api/v3/summary.json";
const KNOWN="https://data.techforpalestine.org/api/v3/killed-in-gaza.min.json";
const nf=n=>n==null||n===""||Number.isNaN(Number(n))?"—":Number(n).toLocaleString("en-US");
const num=(o,...ks)=>{for(const k of ks)if(o&&o[k]!=null&&o[k]!=="")return Number(o[k]);return null};
const dateFmt=d=>new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
const css=`
:host{display:block;font-family:'Cairo',Arial,Helvetica,sans-serif;color:var(--ht-ink, #292724)}
*{box-sizing:border-box}.wrap{background:var(--ht-bg, #f8f6f2);padding:clamp(18px,3vw,38px);overflow:hidden}.eyebrow{font-size:12px;letter-spacing:.18em;color:var(--ht-red, #c9362c);font-weight:800}.title{display:flex;align-items:end;gap:20px}.title h1{font:700 clamp(34px,5vw,58px)/.95 Georgia,serif;margin:7px 0}.rule{height:1px;background:var(--ht-line, #d9d4cc);flex:1;margin-bottom:14px}.sub{font-size:clamp(16px,2vw,21px);color:var(--ht-muted, #777168);margin:7px 0 22px}.notice{display:inline-flex;align-items:center;gap:9px;background:var(--ht-notice-bg, #ededed);color:var(--ht-red, #c9362c);font-weight:700;border-radius:24px;padding:11px 17px;margin-bottom:20px;cursor:pointer}.notice span{font-size:18px}.pills{display:flex;gap:8px;flex-wrap:wrap;max-width:1000px}.pill{background:var(--ht-paper, #fffdf9);border:1px solid var(--ht-line, #d9d4cc);border-radius:8px;padding:9px 13px;font-size:clamp(14px,1.5vw,18px);white-space:nowrap}.pill b{font-weight:500}.pill em{font-style:normal;color:var(--ht-red, #c9362c)}.chartHead{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-top:8px}.chartTitle{font:700 25px Georgia,serif;margin-top:13px}.status{font-size:12px;color:var(--ht-muted, #777168);margin-top:5px}.big{text-align:right;font:700 clamp(55px,8vw,105px)/.82 Georgia,serif;color:var(--ht-muted, #6f6a64)}.bigLabel{text-align:right;font-weight:800;font-size:clamp(23px,3vw,34px);color:var(--ht-muted, #6f6a64)}
@media(max-width:850px){.rule{display:none}.chartHead{display:block}.big,.bigLabel{text-align:left}}@media(max-width:500px){.wrap{padding:15px}.pill{white-space:normal}.title h1{font-size:39px}}
`;
class HumanTollWidget extends HTMLElement{
 constructor(){super();this.attachShadow({mode:"open"});this.data=[];this.i=0;this.known=null}
 connectedCallback(){this.renderShell();this.load()}
 renderShell(){this.shadowRoot.innerHTML=`<style>${css}</style><div class="wrap">
 <div class="eyebrow">DAILY CASUALTIES DATASETS</div>
 <div class="title"><h1>The Human Toll</h1><div class="rule"></div></div>
 <div class="sub">Since October 7, 2023 for Gaza</div>
 <div class="notice" id="notice"><span>⚠</span> Learn why these numbers do not fully reflect the human toll</div>
 <div class="method" id="method">These figures are reported datasets and do not necessarily represent the full human toll. Demographic fields are shown only when the underlying daily dataset provides them; derived values are labeled as derived.</div>
 <div class="pills" id="pills"></div>
 <div class="chartHead"><div><div class="chartTitle">Daily cumulative toll</div><div class="status" id="status">Loading live data…</div></div><div><div class="big" id="big">—</div><div class="bigLabel">killed</div></div></div>
 <div class="chartBox"><svg id="svg" viewBox="0 0 1200 430" preserveAspectRatio="none"><path id="area" class="area"/><path id="line" class="line"/><g id="marks"></g></svg><div class="tip" id="tip"></div></div>
 <div class="slider"><div class="dateRow"><span>October 7, 2023</span><span id="today">TODAY</span></div><div class="sliderLine"><div class="track"></div><div class="thumb" id="thumb"></div><input class="range" id="range" type="range" min="0" max="0" value="0"></div><div class="selected" id="selected">—</div></div>
 </div>`;
 this.shadowRoot.getElementById("notice").onclick=()=>{const m=this.shadowRoot.getElementById("method");m.style.display=m.style.display==="block"?"none":"block"};
 this.shadowRoot.getElementById("range").oninput=e=>{this.i=+e.target.value;this.paint()}
 }
 async load(){
  try{
   const r=await fetch(API,{cache:"no-store"});if(!r.ok)throw Error(r.status);
   this.data=(await r.json()).map(x=>({date:x.report_date,killed:num(x,"killed_cum","ext_killed_cum"),injured:num(x,"injured_cum","ext_injured_cum"),children:num(x,"killed_children_cum","ext_killed_children_cum"),women:num(x,"killed_women_cum","ext_killed_women_cum"),medical:num(x,"med_killed_cum","ext_med_killed_cum"),press:num(x,"press_killed_cum","ext_press_killed_cum"),civdef:num(x,"civdef_killed_cum","ext_civdef_killed_cum")})).filter(x=>x.date);
   if(!this.data.length)throw Error("empty");
   this.i=this.data.length-1;const range=this.shadowRoot.getElementById("range");range.max=this.i;range.value=this.i;
   this.shadowRoot.getElementById("today").textContent=this.data.at(-1).date;
   this.shadowRoot.getElementById("status").textContent=`${this.data.length.toLocaleString()} daily records · live API`;
   this.paint();
  }catch(e){this.shadowRoot.getElementById("status").textContent=""}
 }
 paint(){
  const d=this.data[this.i];if(!d)return;
  const root=this.shadowRoot,$=s=>root.querySelector(s);
  $("#big").textContent=nf(d.killed);$("#selected").textContent=dateFmt(d.date);
  const pills=[["",d.killed,"killed"],["",d.injured,"injured"],["",d.children,"children killed"],["",d.women,"women killed"],["",d.medical,"medical personnel killed"],["",d.press,"journalists killed"],["",d.civdef,"first responders killed"]];
  $("#pills").innerHTML=pills.map(p=>`<div class="pill">${nf(p[1])} <em>${p[2]}</em></div>`).join("");
  this.draw();
 }
 draw(){
  const root=this.shadowRoot,$=s=>root.querySelector(s),s=this.data,W=1200,H=430,L=22,R=18,T=18,B=50,max=Math.max(...s.map(x=>Number(x.killed)||0),1);
  const X=i=>W-R-i/(s.length-1||1)*(W-L-R),Y=v=>T+(1-v/max)*(H-T-B),pts=s.map((d,i)=>[X(i),Y(Number(d.killed)||0)]);
  $("#line").setAttribute("d",pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(2)+" "+p[1].toFixed(2)).join(" "));
  $("#area").setAttribute("d",`M ${pts[0][0]} ${H-B} L ${pts.map(p=>p[0].toFixed(2)+" "+p[1].toFixed(2)).join(" L ")} L ${pts.at(-1)[0]} ${H-B} Z`);
  const marks=[0,Math.round((s.length-1)*.36),Math.round((s.length-1)*.70),s.length-1];
  const selectedPoint=this.i;
  $("#marks").innerHTML=marks.map((i,k)=>{const p=pts[i];return `<line class="guide" x1="${p[0]}" x2="${p[0]}" y1="${p[1]}" y2="${H-B}"/><circle class="dot ${i===selectedPoint?"today":""}" cx="${p[0]}" cy="${p[1]}" r="${i===selectedPoint?9:7}"/><text class="axis" x="${p[0]}" y="${H-12}" text-anchor="middle">${new Date(s[i].date+"T00:00:00").getFullYear()}</text>`}).join("");
  const sp=pts[selectedPoint];
  $("#marks").insertAdjacentHTML("beforeend",`<line class="guide" x1="${sp[0]}" x2="${sp[0]}" y1="${sp[1]}" y2="${H-B}" style="stroke:#c9362c;stroke-width:2.5;stroke-dasharray:5 6"/><circle class="dot today" cx="${sp[0]}" cy="${sp[1]}" r="9"/>`);
  const pos=(1-this.i/(s.length-1||1))*100;$("#thumb").style.left=pos+"%";
 }
}
if (!customElements.get("human-toll-widget")) {
  customElements.define("human-toll-widget",HumanTollWidget);
}
})();
