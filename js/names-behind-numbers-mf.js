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
 connectedCallback(){
   this.shadowRoot.innerHTML=`<style>${css}</style>
   <section class="wrap">
    <div class="header">
      <div>
        <div class="eyebrow">KILLED IN GAZA DATASET</div>
        <div class="title">Names Behind Numbers</div>
      </div>
      <div class="rule"></div>
    </div>
    <div class="actions">
      <button class="refresh" id="refresh" type="button">↻ Show other names</button>
    </div>
    <div class="grid" id="grid"></div>
    <div class="status" id="status">Loading…</div>
   </section>`;

   this.shadowRoot.getElementById("refresh").onclick=()=>this.next();
   this.load();
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
   const b=this.orderB[this.index%this.orderB.length];
   const g=this.orderG[this.index%this.orderG.length];
   const grid=this.shadowRoot.getElementById("grid");

   grid.innerHTML=`
    ${this.card(b,"male","BOYS")}
    ${this.card(g,"female","GIRLS")}
   `;
 }
 card(x,type,label){
   return `<article class="card ${type}">
     <div class="overlay"></div>
     <div class="content">
       <div class="gender">${label === "BOYS" ? "CHILDREN · BOYS" : "CHILDREN · GIRLS"}</div>
       <div class="question">Do you know a ${esc(x.name)}?</div>
       <div class="number">${x.count.toLocaleString("en-US")}</div>
       <div class="caption"><span class="red">children</span> named ${esc(x.name)}<br>have been <span class="red">killed.</span></div>
       <div class="source"></div>
     </div>
   </article>`;
 }
}

customElements.define("names-behind-numbers-mf",NamesBehindNumbersMF);
})();