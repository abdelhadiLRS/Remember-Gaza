(() => {
"use strict";
const START=new Date("2023-10-07T00:00:00");
const css=`
:host{display:block;font-family:'Cairo',Arial,Helvetica,sans-serif;color:var(--ink, #292724)}
*{box-sizing:border-box}
.wrap{background:var(--bg, #f8f6f2);padding:clamp(18px,3vw,38px);overflow:hidden}
.inner{display:flex;align-items:baseline;justify-content:center;gap:clamp(8px,1.6vw,20px);flex-wrap:wrap}
.item{display:flex;align-items:baseline;gap:8px;white-space:nowrap}
.number{font-family:Georgia,"Times New Roman",serif;font-size:clamp(68px,9.5vw,145px);font-weight:700;line-height:.78;letter-spacing:-5px;color:var(--muted, #6f6a64);font-variant-numeric:lining-nums}
.unit{font-family:'Cairo',Arial,Helvetica,sans-serif;font-size:clamp(20px,2.2vw,31px);font-weight:600;color:var(--muted, #6f6a64)}
.seconds .number,.seconds .unit{color:var(--red)}
@media(max-width:600px){
.wrap{padding:16px 8px}.inner{gap:8px 12px}.number{font-size:clamp(50px,15vw,86px);letter-spacing:-3px}.unit{font-size:clamp(16px,5vw,24px)}
}
`;
class HumanTollCounter extends HTMLElement{
 constructor(){super();this.timer=null;this.attachShadow({mode:"open"})}
 connectedCallback(){
  this.render();
  this.update();
  this.timer=setInterval(()=>this.update(),1000);
  if(window.i18n && typeof window.i18n.onLanguageChange==='function'){
    window.i18n.onLanguageChange(()=>this.render());
  }
 }
 getLang(){
  return (window.i18n && window.i18n.currentLang) ||
         localStorage.getItem('app_lang') ||
         localStorage.getItem('site_language') ||
         'ar';
 }
 getUnits(){
  const lang = this.getLang();
  const dict = {
    ar: { days: "يوم", hours: "ساعة", minutes: "دقيقة", seconds: "ثانية" },
    en: { days: "days", hours: "hours", minutes: "minutes", seconds: "seconds" },
    fr: { days: "jours", hours: "heures", minutes: "minutes", seconds: "secondes" },
    es: { days: "días", hours: "horas", minutes: "minutos", seconds: "segundos" },
    de: { days: "Tage", hours: "Stunden", minutes: "Minuten", seconds: "Sekunden" },
    tr: { days: "gün", hours: "saat", minutes: "dakika", seconds: "saniye" },
    it: { days: "giorni", hours: "ore", minutes: "minuti", seconds: "secondi" },
    pt: { days: "dias", hours: "horas", minutes: "minutos", seconds: "segundos" },
    id: { days: "hari", hours: "jam", minutes: "menit", seconds: "detik" },
    ms: { days: "hari", hours: "jam", minutes: "minit", seconds: "saat" },
    ur: { days: "دن", hours: "گھنٹے", minutes: "منٹ", seconds: "سیکنڈ" },
    fa: { days: "روز", hours: "ساعت", minutes: "دقیقه", seconds: "ثانیه" },
    nl: { days: "dagen", hours: "uren", minutes: "minuten", seconds: "seconden" },
    ru: { days: "дней", hours: "часов", minutes: "минут", seconds: "секунд" },
    zh: { days: "天", hours: "小时", minutes: "分钟", seconds: "秒" },
    ja: { days: "日", hours: "時間", minutes: "分", seconds: "秒" },
    ko: { days: "일", hours: "시간", minutes: "분", seconds: "초" }
  };
  return dict[lang] || dict.en;
 }
 render(){
  const lang = this.getLang();
  const dir = (lang === 'ar' || lang === 'fa' || lang === 'ur') ? 'rtl' : 'ltr';
  const u = this.getUnits();
  this.shadowRoot.innerHTML=`<style>${css}</style>
  <div class="wrap" role="timer" aria-label="Duration" dir="${dir}">
   <div class="inner">
    <div class="item days"><span id="days" class="number">0</span><span class="unit">${u.days}</span></div>
    <div class="item hours"><span id="hours" class="number">0</span><span class="unit">${u.hours}</span></div>
    <div class="item minutes"><span id="minutes" class="number">0</span><span class="unit">${u.minutes}</span></div>
    <div class="item seconds"><span id="seconds" class="number">0</span><span class="unit">${u.seconds}</span></div>
   </div>
  </div>`;
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