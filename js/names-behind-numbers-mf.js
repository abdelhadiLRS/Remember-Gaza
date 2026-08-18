(() => {
  "use strict";

  const DATA_URL="https://data.techforpalestine.org/api/v2/killed-in-gaza/child-name-counts-en.json";
  const CHILD_IMAGE_URL = "images/names-behind-numbers-mf.JPG"; // رابط الصورة الإضافية

  const css=`
    :host{
      display:block;
      --bg:#f8f6f2;
      --ink:#242321;
      --muted:#777168;
      --red:#cf3b32;
      --card:#0b0b0b;
      font-family:Arial,Helvetica,sans-serif;
      color:var(--ink)
    }
    *{box-sizing:border-box}
    .wrap{background:var(--bg);padding:clamp(18px,3vw,38px)}
    .header{display:flex;align-items:end;gap:22px}
    .eyebrow{font-size:13px;font-weight:800;letter-spacing:.19em;color:var(--red);margin-bottom:7px}
    .title{font:700 clamp(36px,4.2vw,55px)/1 Georgia,"Times New Roman",serif;white-space:nowrap}
    .rule{height:1px;background:#cbc6bf;flex:1;margin-bottom:13px}
    .actions{display:flex;justify-content:center;margin:18px 0 0}
    .refresh, .share{
      border:1px solid #bdb8b1;background:#fffdf9;color:#292724;border-radius:7px;
      padding:10px 18px;font-size:15px;font-weight:700;cursor:pointer; margin-left: 10px;
    }
    .refresh:hover, .share:hover{background:#eeeae4}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(22px,7vw,150px);margin-top:24px}
    .card{
      position:relative;min-height:clamp(390px,34vw,570px);border-radius:12px;overflow:hidden;
      background:#080808;
    }
    .card:before{
      content:"";position:absolute;inset:0;
      background:url("${CHILD_IMAGE_URL}") center center/cover no-repeat;
      filter:saturate(1);
      transform:scale(1.001);
    }
    .overlay{
      position:absolute;inset:0;
      background:linear-gradient(to bottom,rgba(0,0,0,.18),rgba(0,0,0,.58));
    }
    .content{position:absolute;inset:0;color:#fff;padding:34px 30px 24px;display:flex;flex-direction:column;align-items:center;text-align:center}
    .card-share{
      position:absolute;top:14px;right:14px;z-index:5;
      width:42px;height:42px;border:1px solid rgba(255,255,255,.45);
      border-radius:50%;background:rgba(0,0,0,.58);color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:19px;line-height:1;cursor:pointer;
      backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
      transition:transform .15s ease,background .15s ease;
    }
    .card-share:hover{transform:scale(1.07);background:rgba(0,0,0,.78)}
    .card-share:active{transform:scale(.96)}
    .card-share:disabled{opacity:.6;cursor:wait}
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

      grid.querySelectorAll(".card-share").forEach(btn=>{
        btn.onclick=()=>this.shareCard(btn.closest(".card"),btn);
      });
    }
    card(x,type,label){
      const genderLabel = label === "BOYS" ? "CHILDREN · BOYS" : "CHILDREN · GIRLS";
      return `<article class="card ${type}">
        <button class="card-share" type="button" title="Share this card" aria-label="Share this card">↗</button>
        <div class="overlay"></div>
        <div class="content">
          <div class="gender">${genderLabel}</div>
          <div class="question">Do you know a ${esc(x.name)}?</div>
          <div class="number">${x.count.toLocaleString("en-US")}</div>
          <div class="caption"><span class="red">children</span> named ${esc(x.name)}<br>have been <span class="red">killed.</span></div>
          <div class="source"></div>
        </div>
      </article>`;
    }

    // مشاركة لقطة منفصلة للبطاقة التي تم الضغط على زرها
    async shareCard(card, button) {
      if(!card) return;

      try{
        button.disabled=true;
        const canvas = await html2canvas(card, {
          backgroundColor: null,
          useCORS: true,
          scale: Math.min(2, window.devicePixelRatio || 1)
        });

        const blob = await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
        if(!blob) throw new Error("Unable to create image");

        const file = new File([blob], "names-behind-numbers.png", {type:"image/png"});

        if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
          await navigator.share({
            files:[file],
            title:"Names Behind Numbers",
            text:"Explore the names and numbers of children killed in Gaza."
          });
        }else{
          const link=document.createElement("a");
          link.download="names-behind-numbers.png";
          link.href=URL.createObjectURL(blob);
          link.click();
          setTimeout(()=>URL.revokeObjectURL(link.href),1000);
        }
      }catch(error){
        if(error?.name !== "AbortError"){
          console.error("Error sharing card:",error);
          alert("Failed to share the card image.");
        }
      }finally{
        button.disabled=false;
      }
    }

  }

  customElements.define("names-behind-numbers-mf",NamesBehindNumbersMF);
})();