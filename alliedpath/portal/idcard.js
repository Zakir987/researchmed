/* AlliedPath portal: student identity card.
   Staff add a photo and card details in the student's record; the student sees a two-sided card with photo,
   can flip it, and can download it as an image (front + back) to print or show. */
(function(){
  "use strict";
  var WA="9596830800",SITE="researchmed.in/alliedpath";
  var BLOOD=[["","Not set"],["A+","A+"],["A-","A−"],["B+","B+"],["B-","B−"],["AB+","AB+"],["AB-","AB−"],["O+","O+"],["O-","O−"]];
  var e=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var okPhoto=function(p){return typeof p==="string"&&(/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+\/=]+$/.test(p)||/^https:\/\/[a-z0-9.-]*googleusercontent\.com\//i.test(p))};
  function addYear(iso){if(!iso)return "";var d=new Date(iso+"T00:00:00");if(isNaN(d))return "";d.setFullYear(d.getFullYear()+1);d.setDate(d.getDate()-1);return d.toLocaleDateString("en-CA")}
  function fmt(iso){if(!iso)return "";var d=new Date(String(iso).length>10?iso:iso+"T00:00:00");return isNaN(d)?iso:d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
  function initials(n){return String(n||"?").replace(/^(dr|mr|ms|mrs|prof)\.?\s+/i,"").split(/\s+/).filter(Boolean).slice(0,2).map(function(w){return w[0].toUpperCase()}).join("")||"?"}

  /* ---------- card data travels inside the student's private summary ---------- */
  function cardFor(sid){
    var s=(S.students||{})[sid]||{},b=s.batchId&&S.batches[s.batchId]||{};
    return {photo:okPhoto(s.idPhoto)?s.idPhoto:"",blood:s.bloodGroup||"",dob:s.dob||"",emergency:s.emergencyContact||"",
      valid:s.idValidTill||addYear(b.startDate||s.admitDate||""),issued:s.idIssued||s.admitDate||"",mode:b.mode||""};
  }
  if(typeof window.summaryFor==="function"&&!window.summaryFor.__idc){
    var sf=window.summaryFor;window.summaryFor=function(sid){var o=sf.apply(this,arguments);try{o.idc=cardFor(sid)}catch(x){}return o};window.summaryFor.__idc=true;
  }

  /* ---------- styles ---------- */
  var css=
  '.idc-wrap{flex:0 1 380px;min-width:0;perspective:1200px}'+
  '.idc{position:relative;width:100%;aspect-ratio:1.586;cursor:pointer;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.2,.7,.2,1);outline:none}'+
  '.idc.flip{transform:rotateY(180deg)}.idc:focus-visible{box-shadow:0 0 0 3px var(--brand-teal);border-radius:18px}'+
  '.idc-f,.idc-b{position:absolute;inset:0;border-radius:18px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 24px 48px -20px rgba(0,0,0,.6);color:#06221e;background:linear-gradient(135deg,#ffffff 0%,#effbf9 55%,#d7f5ef 100%)}'+
  '.idc-b{transform:rotateY(180deg)}'+
  '.idc-top{display:flex;align-items:center;gap:8px;padding:9px 12px;background:linear-gradient(110deg,#0b1a30,#0f5a5a);color:#fff}'+
  '.idc-top .aplogo,.idc-top img{width:26px;height:26px;border-radius:7px;flex:none}'+
  '.idc-top b{font-family:var(--display);font-size:.95rem;line-height:1}.idc-top b em{font-style:normal;color:#2ed3bf}'+
  '.idc-top span{margin-left:auto;font-size:.56rem;letter-spacing:.16em;font-weight:700;text-transform:uppercase;color:#9fe9df;text-align:right;line-height:1.25}'+
  '.idc-body{display:flex;gap:12px;padding:10px 12px 0;align-items:flex-start}'+
  '.idc-ph{width:30%;aspect-ratio:.8;border-radius:10px;overflow:hidden;flex:none;background:linear-gradient(135deg,#12917f,#0b1a30);display:grid;place-items:center;color:#fff;font-family:var(--display);font-weight:700;font-size:1.6rem;border:2px solid #fff;box-shadow:0 0 0 2px #2ed3bf}'+
  '.idc-ph img{width:100%;height:100%;object-fit:cover;display:block}'+
  '.idc-info{min-width:0;flex:1;display:flex;flex-direction:column;gap:3px}'+
  '.idc-name{font-family:var(--display);font-weight:700;font-size:1.02rem;line-height:1.15;overflow-wrap:anywhere}'+
  '.idc-id{font-family:var(--mono);font-weight:600;font-size:.86rem;color:#0f8277;letter-spacing:.02em;overflow-wrap:anywhere}'+
  '.idc-row{font-size:.66rem;line-height:1.3;overflow-wrap:anywhere}.idc-row i{font-style:normal;display:block;font-size:.52rem;letter-spacing:.12em;text-transform:uppercase;opacity:.6;font-weight:700}'+
  '.idc-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px 8px;margin-top:2px}'+
  '.idc-foot{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 12px;background:rgba(11,26,48,.06);font-size:.6rem;font-weight:600}'+
  '.idc-blood{background:#ad322b;color:#fff;border-radius:999px;padding:2px 8px;font-weight:700;font-size:.62rem}'+
  '.idc-bbody{display:flex;gap:12px;padding:12px;align-items:center;height:calc(100% - 44px)}'+
  '.idc-qr{width:34%;aspect-ratio:1;background:#fff;border-radius:10px;padding:6px;flex:none;display:grid;place-items:center;box-shadow:0 0 0 1px rgba(11,26,48,.1)}.idc-qr svg{width:100%;height:100%;display:block}'+
  '.idc-bt{font-size:.66rem;line-height:1.4;min-width:0}.idc-bt p{margin:0 0 6px}.idc-bt b{font-weight:700}'+
  '.idc-tools{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.idc-tools button{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:.78rem;font-weight:700;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.12);color:var(--side-ink);border:1px solid rgba(255,255,255,.18)}'+
  '.idc-tools button:hover{background:rgba(255,255,255,.2)}.idc-tools button:focus-visible{outline:2px solid var(--brand-teal)}'+
  '.idc-note{font-size:.78rem;color:var(--side-muted);margin:8px 2px 0}'+
  '.idc-mini{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.idc-mini .idc-wrap{flex:0 1 330px}'+
  '@media (prefers-reduced-motion:no-preference){.idc-f{animation:idcIn .7s cubic-bezier(.2,.7,.2,1) both}@keyframes idcIn{from{opacity:0;transform:translateY(14px) rotateX(12deg)}to{opacity:1;transform:none}}'+
  '.idc-f::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:38%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:idcSh 5s ease-in-out 1.2s infinite;pointer-events:none}@keyframes idcSh{0%,70%{left:-60%}100%{left:130%}}}'+
  '@media (prefers-reduced-motion:reduce){.idc{transition:none}}'+
  '@media (max-width:420px){.idc-name{font-size:.9rem}.idc-id{font-size:.76rem}.idc-row{font-size:.6rem}}';
  function addCss(){if(document.getElementById("idc-css"))return;var s=document.createElement("style");s.id="idc-css";s.textContent=css;document.head.appendChild(s)}

  /* ---------- QR (loaded on demand) ---------- */
  var qrReady=null;
  function loadQR(){if(window.qrcode)return Promise.resolve();if(qrReady)return qrReady;qrReady=new Promise(function(res,rej){var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s)});return qrReady}
  function qrMatrix(text){try{var q=window.qrcode(0,"M");q.addData(text);q.make();var n=q.getModuleCount(),m=[];for(var r=0;r<n;r++){m.push([]);for(var c=0;c<n;c++)m[r].push(q.isDark(r,c))}return m}catch(x){return null}}
  function qrSvg(m){if(!m)return "";var n=m.length,p="";for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(m[r][c])p+="M"+c+" "+r+"h1v1h-1z";return '<svg viewBox="-1 -1 '+(n+2)+' '+(n+2)+'" shape-rendering="crispEdges" aria-label="QR code with student details"><path d="'+p+'" fill="#0b1a30"/></svg>'}
  function qrText(d){return "AlliedPath Student\nName: "+d.name+"\nStudent ID: "+(d.sid||"Pending")+"\nBatch: "+(d.batchCode||"-")+"\nValid till: "+(d.valid?fmt(d.valid):"-")+"\nVerify: WhatsApp "+WA}

  /* ---------- card HTML ---------- */
  function cardData(sv,pv){
    var c=sv.idc||{},photo=c.photo||(!pv&&typeof me!=="undefined"&&me&&okPhoto(me.avatarUrl)?me.avatarUrl:"");
    return {name:sv.name||"",sid:sv.studentId||"",batchCode:sv.batchCode||"",batch:sv.batchName||"",program:sv.program||"",photo:photo,blood:c.blood||"",dob:c.dob||"",
      emergency:c.emergency||"",valid:c.valid||"",issued:c.issued||"",mode:c.mode||""};
  }
  function cardHTML(d,id){
    var logo=typeof LOGO==="string"?LOGO:"";
    var ph=d.photo?'<img src="'+e(d.photo)+'" alt="" referrerpolicy="no-referrer">':e(initials(d.name));
    return '<div class="idc" id="'+id+'" tabindex="0" role="button" aria-label="Student identity card. Press to flip.">'+
      '<div class="idc-f"><div class="idc-top">'+logo+'<b>Allied<em>Path</em></b><span>Student<br>identity card</span></div>'+
        '<div class="idc-body"><div class="idc-ph">'+ph+'</div><div class="idc-info"><div class="idc-name">'+e(d.name)+'</div><div class="idc-id">'+e(d.sid||"ID pending")+'</div>'+
        '<div class="idc-row"><i>Program</i>'+e(d.program||"-")+'</div>'+
        '<div class="idc-grid"><div class="idc-row"><i>Batch ID</i>'+e(d.batchCode||"-")+'</div><div class="idc-row"><i>Valid till</i>'+e(d.valid?fmt(d.valid):"-")+'</div></div></div></div>'+
        '<div class="idc-foot"><span>'+e(SITE)+'</span>'+(d.blood?'<span class="idc-blood">'+e(d.blood.replace("-","−"))+'</span>':'')+'</div></div>'+
      '<div class="idc-b"><div class="idc-top">'+logo+'<b>Allied<em>Path</em></b><span>Teach · Mentor<br>· Guide</span></div>'+
        '<div class="idc-bbody"><div class="idc-qr" data-idcqr></div><div class="idc-bt">'+
        (d.batch?'<p><b>Batch:</b> '+e(d.batch)+'</p>':'')+
        (d.dob?'<p><b>Date of birth:</b> '+e(fmt(d.dob))+'</p>':'')+
        (d.emergency?'<p><b>Emergency contact:</b> '+e(d.emergency)+'</p>':'')+
        '<p>This card belongs to an AlliedPath student. If found, please WhatsApp <b>'+WA+'</b>.</p>'+
        '<p style="opacity:.65;margin:0">AlliedPath provides teaching and mentoring; this card is not a certificate.</p></div></div></div></div>';
  }
  function fillQR(root,d){loadQR().then(function(){var box=root.querySelector("[data-idcqr]");if(box&&!box.firstChild)box.innerHTML=qrSvg(qrMatrix(qrText(d)))}).catch(function(){})}

  /* ---------- download as an image (front + back) ---------- */
  function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
  function wrap(g,t,x,y,maxW,lh,maxLines){var words=String(t).split(/\s+/),line="",n=0;for(var i=0;i<words.length;i++){var test=line?line+" "+words[i]:words[i];if(g.measureText(test).width>maxW&&line){g.fillText(line,x,y);y+=lh;n++;line=words[i];if(maxLines&&n>=maxLines-1){var rest=words.slice(i).join(" ");while(g.measureText(rest+"…").width>maxW&&rest.length)rest=rest.slice(0,-1);g.fillText(rest+(rest.length<words.slice(i).join(" ").length?"…":""),x,y);return y+lh}}else line=test}if(line){g.fillText(line,x,y);y+=lh}return y}
  function loadImg(src){return new Promise(function(res){if(!src)return res(null);var i=new Image();if(!/^data:/.test(src))i.crossOrigin="anonymous";i.referrerPolicy="no-referrer";i.onload=function(){res(i)};i.onerror=function(){res(null)};i.src=src})}
  function logoImg(){var svg=typeof LOGO==="string"&&/^<svg/.test(LOGO)?LOGO.replace("<svg",'<svg xmlns="http://www.w3.org/2000/svg"'):null;return loadImg(svg?"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg):null)}
  async function drawCard(d,withPhoto){
    var W=1012,H=638,GAP=40,cv=document.createElement("canvas");cv.width=W;cv.height=H*2+GAP;var g=cv.getContext("2d");
    try{await document.fonts.ready}catch(x){}
    var F="'Poppins','Segoe UI',sans-serif",B="'Instrument Sans','Segoe UI',sans-serif",M="'JetBrains Mono',Menlo,monospace";
    var logo=await logoImg(),photo=withPhoto?await loadImg(d.photo):null;
    await loadQR().catch(function(){});var qm=window.qrcode?qrMatrix(qrText(d)):null;
    function side(oy,back){
      g.save();rr(g,0,oy,W,H,40);g.clip();
      var bg=g.createLinearGradient(0,oy,W,oy+H);bg.addColorStop(0,"#ffffff");bg.addColorStop(.55,"#effbf9");bg.addColorStop(1,"#d7f5ef");g.fillStyle=bg;g.fillRect(0,oy,W,H);
      var tb=g.createLinearGradient(0,oy,W,oy);tb.addColorStop(0,"#0b1a30");tb.addColorStop(1,"#0f5a5a");g.fillStyle=tb;g.fillRect(0,oy,W,104);
      if(logo)g.drawImage(logo,30,oy+22,60,60);
      g.fillStyle="#fff";g.font="700 40px "+F;g.textBaseline="middle";g.fillText("Allied",106,oy+54);var aw=g.measureText("Allied").width;g.fillStyle="#2ed3bf";g.fillText("Path",106+aw,oy+54);
      g.fillStyle="#9fe9df";g.font="700 20px "+B;g.textAlign="right";
      if(back){g.fillText("TEACH · MENTOR · GUIDE",W-32,oy+54)}else{g.fillText("STUDENT",W-32,oy+40);g.fillText("IDENTITY CARD",W-32,oy+68)}
      g.textAlign="left";g.textBaseline="alphabetic";
      if(!back){
        var px=34,py=oy+132,pw=280,ph=350;
        g.save();rr(g,px-6,py-6,pw+12,ph+12,26);g.fillStyle="#2ed3bf";g.fill();rr(g,px-2,py-2,pw+4,ph+4,22);g.fillStyle="#fff";g.fill();rr(g,px,py,pw,ph,20);g.clip();
        if(photo){var s=Math.max(pw/photo.width,ph/photo.height),iw=photo.width*s,ih=photo.height*s;g.drawImage(photo,px+(pw-iw)/2,py+(ph-ih)/2,iw,ih)}
        else{var pg=g.createLinearGradient(px,py,px+pw,py+ph);pg.addColorStop(0,"#12917f");pg.addColorStop(1,"#0b1a30");g.fillStyle=pg;g.fillRect(px,py,pw,ph);g.fillStyle="#fff";g.font="700 110px "+F;g.textAlign="center";g.fillText(initials(d.name),px+pw/2,py+ph/2+38);g.textAlign="left"}
        g.restore();
        var x=350,y=oy+170,mw=W-x-34;
        g.fillStyle="#06221e";g.font="700 46px "+F;y=wrap(g,d.name,x,y,mw,52,2);
        g.fillStyle="#0f8277";g.font="600 34px "+M;y=wrap(g,d.sid||"ID pending",x,y+6,mw,40,1)+10;
        function field(label,val,fx,fy,w){g.fillStyle="rgba(6,34,30,.55)";g.font="700 18px "+B;g.fillText(label.toUpperCase(),fx,fy);g.fillStyle="#06221e";g.font="600 26px "+B;return wrap(g,val||"-",fx,fy+32,w,32,2)}
        y=field("Program",d.program,x,y+10,mw)+8;
        var half=(mw-20)/2;field("Batch ID",d.batchCode,x,y+10,half);field("Valid till",d.valid?fmt(d.valid):"",x+half+20,y+10,half);
        g.fillStyle="rgba(11,26,48,.06)";g.fillRect(0,oy+H-66,W,66);g.fillStyle="#06221e";g.font="600 22px "+B;g.fillText(SITE,34,oy+H-25);
        if(d.blood){g.font="700 24px "+B;var bw=g.measureText(d.blood).width+44;rr(g,W-34-bw,oy+H-54,bw,42,21);g.fillStyle="#ad322b";g.fill();g.fillStyle="#fff";g.textAlign="center";g.fillText(d.blood.replace("-","−"),W-34-bw/2,oy+H-24);g.textAlign="left"}
      }else{
        var qx=40,qy=oy+140,qs=320;rr(g,qx,qy,qs,qs,22);g.fillStyle="#fff";g.fill();
        if(qm){var n=qm.length,cell=(qs-40)/n;g.fillStyle="#0b1a30";for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(qm[r][c])g.fillRect(qx+20+c*cell,qy+20+r*cell,Math.ceil(cell),Math.ceil(cell))}
        var bx=400,by=oy+170,bw2=W-bx-40;g.fillStyle="#06221e";
        function line(label,val){if(!val)return;g.font="700 24px "+B;g.fillText(label,bx,by);by+=32;g.font="500 24px "+B;by=wrap(g,val,bx,by,bw2,30,2)+14}
        line("Batch",d.batch);line("Date of birth",d.dob?fmt(d.dob):"");line("Emergency contact",d.emergency);
        g.font="500 22px "+B;by=wrap(g,"This card belongs to an AlliedPath student. If found, please WhatsApp "+WA+".",bx,by+4,bw2,28,3);
        g.fillStyle="rgba(6,34,30,.6)";g.font="500 18px "+B;wrap(g,"AlliedPath provides teaching and mentoring; this card is not a certificate.",bx,by+8,bw2,24,2);
      }
      g.restore();
    }
    g.fillStyle="#ffffff";g.fillRect(0,0,cv.width,cv.height);
    side(0,false);side(H+GAP,true);
    return cv;
  }
  async function download(d){
    var cv=await drawCard(d,true),url;
    try{url=cv.toDataURL("image/png")}catch(x){cv=await drawCard(d,false);url=cv.toDataURL("image/png")}
    var a=document.createElement("a");a.href=url;a.download="AlliedPath-ID-"+(d.sid||d.name||"card").replace(/[^A-Za-z0-9-]+/g,"_")+".png";document.body.appendChild(a);a.click();a.remove();
    try{toast("ID card saved to your downloads")}catch(x){}
  }

  /* ---------- student portal: replace the small card with the full ID card ---------- */
  var current=null;
  function decorateStudent(){
    var wrapEl=document.querySelector("#app .idwrap");if(!wrapEl)return;
    var pv=typeof isStaff==="function"&&isStaff()&&ui.preview&&S.students[ui.preview]?ui.preview:null;
    var sv=pv?summaryFor(pv):(typeof SV!=="undefined"?SV:null);if(!sv)return;
    var d=cardData(sv,pv);current=d;addCss();
    var holder=document.createElement("div");holder.className="idc-wrap";
    holder.innerHTML=cardHTML(d,"idcMain")+'<div class="idc-tools"><button type="button" data-idcflip>⟲ Flip card</button><button type="button" data-idcdl>⤓ Download ID card</button>'+(d.sid?'<button type="button" data-idccopy>Copy ID</button>':'')+'</div>'+
      '<p class="idc-note">Use your Student ID in every message, form and payment to AlliedPath.'+(!d.photo?' Your photo appears here once the office adds it.':'')+'</p>';
    wrapEl.replaceWith(holder);fillQR(holder,d);
  }

  /* ---------- staff: ID card panel in the student's record ---------- */
  function decorateStaff(){
    if(typeof view==="undefined"||view!=="students"||!ui.detail||!S.students[ui.detail])return;
    var grid=document.querySelector("#app .main .grid2");if(!grid||grid.querySelector(".idc-panel"))return;
    var sid=ui.detail,s=S.students[sid],c=cardFor(sid);addCss();
    var d={name:s.name,sid:s.studentId||"",batchCode:s.batchId&&S.batches[s.batchId]?S.batches[s.batchId].code:"",batch:s.batchId?batchName(s.batchId):"",program:s.program||"",photo:c.photo,blood:c.blood,dob:c.dob,emergency:c.emergency,valid:c.valid,issued:c.issued};
    var p=document.createElement("section");p.className="panel idc-panel";p.style.gridColumn="1/-1";
    var missing=[!c.photo&&"photo",!c.blood&&"blood group",!c.emergency&&"emergency contact"].filter(Boolean);
    p.innerHTML='<h2>ID card <span class="actions"><button class="btn ghost" data-act="idcEdit" data-arg="'+e(sid)+'">'+(c.photo?"Edit card details":"Add photo & details")+'</button><button class="btn ghost" data-idcdl2>Download</button></span></h2>'+
      '<div class="idc-mini"><div class="idc-wrap">'+cardHTML(d,"idcStaff")+'</div><p class="small muted" style="flex:1 1 220px;margin:0">'+(missing.length?"Missing: "+missing.join(", ")+". ":"")+'The student sees this card on their portal home page and can download it. Tap the card to see the back.'+(s.linkedUid?"":" Link the student\'s login so they can see it.")+'</p></div>';
    grid.insertBefore(p,grid.children[1]||null);fillQR(p,d);
    p.querySelector("[data-idcdl2]").addEventListener("click",function(ev){ev.preventDefault();download(d)});
  }

  if(typeof ACT==="object"){
    ACT.idcEdit=function(sid){
      var s=S.students[sid];if(!s)return;var c=cardFor(sid);
      openForm({title:"ID card · "+s.name,intro:'<p class="small muted" style="margin:-6px 0 12px">These details appear on the student\'s ID card. Keep the photo a clear, front-facing passport-style picture.</p>',
        fields:[{key:"photo",label:c.photo?"Replace photo":"Student photo",type:"file",accept:"image/*",full:true,hint:"Cropped to fit automatically."},
          {key:"bloodGroup",label:"Blood group",type:"select",options:BLOOD,value:s.bloodGroup||""},{key:"dob",label:"Date of birth",type:"date",value:s.dob||""},
          {key:"emergencyContact",label:"Emergency contact",value:s.emergencyContact||"",placeholder:"Name & phone, e.g. Father · 98xxxxxx10",full:true},
          {key:"idValidTill",label:"Valid till",type:"date",value:s.idValidTill||c.valid||"",hint:"Defaults to one year from the batch start."}].concat(c.photo?[{key:"removePhoto",label:"Remove the current photo",type:"checkbox",full:true}]:[]),
        submit:"Save ID card",
        onSubmit:async function(v){var photo=s.idPhoto||"";if(v.removePhoto)photo="";if(v.photo)photo=await readImage(v.photo);
          if(photo.length>220000)throw new Error("That photo is too large. Try a smaller image.");
          var d={};Object.keys(s).forEach(function(k){d[k]=s[k]});d.idPhoto=photo;d.bloodGroup=v.bloodGroup||"";d.dob=v.dob||"";d.emergencyContact=(v.emergencyContact||"").trim();d.idValidTill=v.idValidTill||"";if(!d.idIssued)d.idIssued=today();d.updatedAt=nowISO();delete d.id;
          await put("students",sid,d);await syncStudent(sid);toast("ID card saved")}});
    };
  }

  /* ---------- events ---------- */
  document.addEventListener("click",function(ev){
    var t=ev.target;if(!t||!t.closest)return;
    if(t.closest("[data-idcflip]")){ev.preventDefault();var c=document.getElementById("idcMain");if(c)c.classList.toggle("flip");return}
    if(t.closest("[data-idcdl]")){ev.preventDefault();if(current)download(current);return}
    if(t.closest("[data-idccopy]")){ev.preventDefault();if(current&&current.sid&&navigator.clipboard)navigator.clipboard.writeText(current.sid).then(function(){try{toast("Student ID copied")}catch(x){}});return}
    var card=t.closest(".idc");if(card&&!t.closest("button")){card.classList.toggle("flip")}
  });
  document.addEventListener("keydown",function(ev){var c=ev.target&&ev.target.classList&&ev.target.classList.contains("idc")?ev.target:null;if(c&&(ev.key==="Enter"||ev.key===" ")){ev.preventDefault();c.classList.toggle("flip")}});

  function hook(){
    if(typeof window.render==="function"&&!window.render.__idc){var r=window.render;window.render=function(){var o=r.apply(this,arguments);try{decorateStudent();decorateStaff()}catch(x){}return o};window.render.__idc=true;if(r.__fx)window.render.__fx=true;try{window.render()}catch(x){}}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){hook();setTimeout(hook,1600)});else{hook();setTimeout(hook,1600)}
})();
