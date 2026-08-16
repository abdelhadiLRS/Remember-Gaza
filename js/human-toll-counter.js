(() => {
"use strict";
const START=new Date("2023-10-07T00:00:00");
const css=`
:host{display:block;--bg:#f8f6f2;--paper:#fffdf9;--ink:#292724;--muted:#777168;--line:#d9d4cc;--red:#c9362c;font-family:Arial,Helvetica,sans-serif;color:var(--ink)}
*{box-sizing:border-box}
.wrap{background:var(--bg);padding:clamp(18px,3vw,38px);overflow:hidden}
.inner{display:flex;align-items:baseline;justify-content:center;gap:clamp(8px,1.6vw,20px);direction:rtl;flex-wrap:wrap}
.item{display:flex;align-items:baseline;gap:8px;white-space:nowrap}
.number{font-family:Georgia,"Times New Roman",serif;font-size:clamp(68px,9.5vw,145px);font-weight:700;line-height:.78;letter-spacing:-5px;color:#6f6a64;font-variant-numeric:lining-nums}
.unit{font-family:Arial,Helvetica,sans-serif;font-size:clamp(20px,2.2vw,31px);font-weight:600;color:#6f6a64}
.seconds .number,.seconds .unit{color:var(--red)}
@media(max-width:600px){
.wrap{padding:16px 8px}.inner{gap:8px 12px}.number{font-size:clamp(50px,15vw,86px);letter-spacing:-3px}.unit{font-size:clamp(16px,5vw,24px)}
}
`;
class HumanTollCounter extends HTMLElement{
 constructor(){super();this.timer=null;this.attachShadow({mode:"open"})}
 connectedCallback(){
  this.shadowRoot.innerHTML=`<style>${css}</style>
  <div class="wrap" role="timer" aria-label="المدة منذ 7 أكتوبر 2023">
   <div class="inner">
    <div class="item days"><span id="days" class="number">0</span><span class="unit">يوم</span></div>
    <div class="item hours"><span id="hours" class="number">0</span><span class="unit">ساعة</span></div>
    <div class="item minutes"><span id="minutes" class="number">0</span><span class="unit">دقيقة</span></div>
    <div class="item seconds"><span id="seconds" class="number">0</span><span class="unit">ثانية</span></div>
   </div>
  </div>`;
  this.update();this.timer=setInterval(()=>this.update(),1000);
 }
 disconnectedCallback(){clearInterval(this.timer)}
 update(){
  let ms=Math.max(0,Date.now()-START.getTime());
  const D=86400000,H=3600000,M=60000,S=1000;
  const days=Math.floor(ms/D);ms-=days*D;
  const hours=Math.floor(ms/H);ms-=hours*H;
  const minutes=Math.floor(ms/M);ms-=minutes*M;
  const seconds=Math.floor(ms/S);
  const f=n=>n.toLocaleString("en-US");
  this.shadowRoot.getElementById("days").textContent=f(days);
  this.shadowRoot.getElementById("hours").textContent=f(hours);
  this.shadowRoot.getElementById("minutes").textContent=f(minutes);
  this.shadowRoot.getElementById("seconds").textContent=f(seconds);
 }
}
customElements.define("human-toll-counter",HumanTollCounter);
})();