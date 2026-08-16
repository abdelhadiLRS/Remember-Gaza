(() => {
"use strict";

const DATA_URL="https://data.techforpalestine.org/api/v2/killed-in-gaza/child-name-counts-en.json";

const css=`
:host{
  display:block;
  font-family:'Cairo',Arial,Helvetica,sans-serif;
  color:var(--ink, #242321)
}
*{box-sizing:border-box}
.wrap{background:var(--bg, #f8f6f2);padding:clamp(18px,3vw,38px)}
.header{display:flex;align-items:end;gap:22px}
.eyebrow{font-size:13px;font-weight:800;letter-spacing:.19em;color:var(--red);margin-bottom:7px}
.title{font:700 clamp(36px,4.2vw,55px)/1 Georgia,"Times New Roman",serif;white-space:nowrap}
.rule{height:1px;background:#cbc6bf;flex:1;margin-bottom:13px}
.actions{display:flex;justify-content:center;margin:18px 0 0}
.refresh{
 border:1px solid #bdb8b1;background:#fffdf9;color:#292724;border-radius:7px;
 padding:10px 18px;font-size:15px;font-weight:700;cursor:pointer
}
.refresh:hover{background:#eeeae4}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(22px,7vw,150px);margin-top:24px}
.card{
 position:relative;min-height:clamp(390px,34vw,570px);border-radius:12px;overflow:hidden;
 background:#080808;
}
.card:before{
 content:"";position:absolute;inset:0;
 background:
 radial-gradient(circle at 50% 38%,#303030 0,#111 45%,#050505 100%);
}
.overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.36),rgba(0,0,0,.84))}
.content{position:absolute;inset:0;color:#fff;padding:34px 30px 24px;display:flex;flex-direction:column;align-items:center;text-align:center}
.gender{
 align-self:flex-start;font-size:12px;font-weight:800;letter-spacing:.17em;
 color:#ddd;text-transform:uppercase
}
.question{margin-top:22px;font:700 clamp(25px,2.5vw,40px)/1.05 Georgia,"Times New Roman",serif}
.number{
 margin-top:clamp(65px,8vw,125px);
 font:700 clamp(90px,11vw,175px)/.76 Georgia,"Times New Roman",serif;
 color:var(--red);letter-spacing:-6px
}
.caption{margin-top:24px;font:700 clamp(21px,2.1vw,31px)/1.22 Georgia,"Times New Roman",serif;max-width:94%}
.caption .red{color:var(--red)}
.source{margin-top:auto;color:#aaa;font-size:12px}
.card.male{background:#111}
.card.female{background:#111}
.card.male .gender:before{content:"♂ ";color:#d9d4cc}
.card.female .gender:before{content:"♀ ";color:#d9d4cc}
.status{text-align:center;color:#777168;font-size:12px;margin-top:12px}
@media(max-width:850px){
 .header{display:block}.rule{display:none}.title{margin-top:6px}
 .grid{grid-template-columns:1fr;gap:18px}
 .card{min-height:470px}
}
@media(max-width:500px){
 .wrap{padding:15px}.card{min-height:420px}.content{padding:24px 16px}
 .question{font-size:28px}.number{margin-top:90px;font-size:105px}
 .caption{font-size:22px}
}
`;

const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);

class NamesBehindNumbersMF extends HTMLElement{
 constructor(){
   super();
   this.attachShadow({mode:"open"});
   this.boys=[];
   this.girls=[];
   this.orderB=[];
   this.orderG=[];
   this.index=0;
 }
 getLang(){
   return (window.i18n && window.i18n.currentLang) ||
          localStorage.getItem('app_lang') ||
          localStorage.getItem('site_language') ||
          'ar';
 }
 getDict(){
   const lang = this.getLang();
   const dicts = {
     ar: {
       eyebrow: "قاعدة بيانات شهداء غزة",
       title: "أسماء خلف الأرقام",
       refresh: "↻ إظهار أسماء أخرى",
       boysLabel: "أطفال · ذكور",
       girlsLabel: "أطفال · إناث",
       question: (name) => `هل تعرف ${esc(name)}؟`,
       caption: (name) => `أطفال يحملون اسم <span class="red">${esc(name)}</span><br>تم <span class="red">إبادتهم واستشهادهم.</span>`,
       status: (b, g) => `الأطفال فقط · ${b} اسماً للذكور · ${g} اسماً للإناث`
     },
     en: {
       eyebrow: "KILLED IN GAZA DATASET",
       title: "Names Behind Numbers",
       refresh: "↻ Show other names",
       boysLabel: "CHILDREN · BOYS",
       girlsLabel: "CHILDREN · GIRLS",
       question: (name) => `Do you know a ${esc(name)}?`,
       caption: (name) => `children named ${esc(name)}<br>have been <span class="red">killed.</span>`,
       status: (b, g) => `Children only · ${b} boys’ names · ${g} girls’ names`
     },
     fr: {
       eyebrow: "DONNÉES DES MARTYRS DE GAZA",
       title: "Des noms derrière les chiffres",
       refresh: "↻ Afficher d'autres noms",
       boysLabel: "ENFANTS · GARÇONS",
       girlsLabel: "ENFANTS · FILLES",
       question: (name) => `Connaissez-vous un(e) ${esc(name)}?`,
       caption: (name) => `enfants nommés ${esc(name)}<br>ont été <span class="red">tués.</span>`,
       status: (b, g) => `Enfants uniquement · ${b} prénoms de garçons · ${g} prénoms de filles`
     },
     es: {
       eyebrow: "DATOS DE LAS VÍCTIMAS EN GAZA",
       title: "Nombres detrás de los números",
       refresh: "↻ Mostrar otros nombres",
       boysLabel: "NIÑOS · NIÑOS",
       girlsLabel: "NIÑOS · NIÑAS",
       question: (name) => `¿Conoces a un(a) ${esc(name)}?`,
       caption: (name) => `niños llamados ${esc(name)}<br>han sido <span class="red">asesinados.</span>`,
       status: (b, g) => `Solo niños · ${b} nombres de niños · ${g} nombres de niñas`
     },
     de: {
       eyebrow: "DATENBANK DER OPFER IN GAZA",
       title: "Namen hinter den Zahlen",
       refresh: "↻ Andere Namen anzeigen",
       boysLabel: "KINDER · JUNGEN",
       girlsLabel: "KINDER · MÄDCHEN",
       question: (name) => `Kennst du eine(n) ${esc(name)}?`,
       caption: (name) => `Kinder namens ${esc(name)}<br>wurden <span class="red">getötet.</span>`,
       status: (b, g) => `Nur Kinder · ${b} Jungennamen · ${g} Mädchennamen`
     },
     tr: {
       eyebrow: "GAZZE ŞEHİTLERİ VERİTABANI",
       title: "Rakamların Arkasındaki İsimler",
       refresh: "↻ Başka isimler göster",
       boysLabel: "ÇOCUKLAR · ERKEK",
       girlsLabel: "ÇOCUKLAR · KIZ",
       question: (name) => `${esc(name)} isminde birini tanıyor musunuz?`,
       caption: (name) => `${esc(name)} adındaki çocuklar<br><span class="red">katledildi.</span>`,
       status: (b, g) => `Sadece çocuklar · ${b} erkek ismi · ${g} kız ismi`
     }
   };
   return dicts[lang] || dicts.en;
 }
 connectedCallback(){
   this.renderShell();
   if(window.i18n && typeof window.i18n.onLanguageChange==='function'){
     window.i18n.onLanguageChange(() => {
       this.renderShell();
       this.render();
     });
   }
 }
 renderShell(){
   const d = this.getDict();
   this.shadowRoot.innerHTML=`<style>${css}</style>
   <section class="wrap">
    <div class="header">
      <div>
        <div class="eyebrow" id="eyebrow">${d.eyebrow}</div>
        <div class="title" id="title">${d.title}</div>
      </div>
      <div class="rule"></div>
    </div>
    <div class="actions">
      <button class="refresh" id="refresh" type="button">${d.refresh}</button>
    </div>
    <div class="grid" id="grid"></div>
    <div class="status" id="status">Loading…</div>
   </section>`;

   this.shadowRoot.getElementById("refresh").onclick=()=>this.next();
   if(this.boys.length && this.girls.length) {
     const status = this.shadowRoot.getElementById("status");
     if(status) status.textContent = d.status(this.boys.length, this.girls.length);
   } else {
     this.load();
   }
 }
 async load(){
   try{
     const res=await fetch(DATA_URL,{cache:"no-store"});
     if(!res.ok) throw new Error("HTTP "+res.status);
     const data=await res.json();

     this.boys=(data.boys||[]).map(x=>({name:x[0],count:Number(x[1])}))
       .filter(x=>x.name && Number.isFinite(x.count));
     this.girls=(data.girls||[]).map(x=>({name:x[0],count:Number(x[1])}))
       .filter(x=>x.name && Number.isFinite(x.count));

     this.orderB=shuffle([...this.boys]);
     this.orderG=shuffle([...this.girls]);
     this.index=0;
     this.render();
     this.shadowRoot.getElementById("status").textContent=
       `Children only · ${this.boys.length} boys’ names · ${this.girls.length} girls’ names · `;
   }catch(e){
     console.error(e);
     this.shadowRoot.getElementById("status").textContent="Unable to load names.";
   }
 }
 next(){
   if(!this.orderB.length || !this.orderG.length)return;
   this.index++;
   if(this.index>=Math.max(this.orderB.length,this.orderG.length)){
     this.orderB=shuffle([...this.boys]);
     this.orderG=shuffle([...this.girls]);
     this.index=0;
   }
   this.render();
 }
 render(){
   if(!this.orderB.length || !this.orderG.length) return;
   const b=this.orderB[this.index%this.orderB.length];
   const g=this.orderG[this.index%this.orderG.length];
   const grid=this.shadowRoot.getElementById("grid");
   if(!grid) return;

   const d = this.getDict();
   grid.innerHTML=`
    ${this.card(b,"male",d.boysLabel,d)}
    ${this.card(g,"female",d.girlsLabel,d)}
   `;
 }
 card(x,type,label,d){
   if(!x) return "";
   return `<article class="card ${type}">
     <div class="overlay"></div>
     <div class="content">
       <div class="gender">${label}</div>
       <div class="question">${d.question(x.name)}</div>
       <div class="number">${x.count.toLocaleString("en-US")}</div>
       <div class="caption">${d.caption(x.name)}</div>
       <div class="source"></div>
     </div>
   </article>`;
 }
}

customElements.define("names-behind-numbers-mf",NamesBehindNumbersMF);
})();