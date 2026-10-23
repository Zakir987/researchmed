/* AlliedPath portal: certificates.
   Staff issue Participant (webinar), Student (course) and Speaker certificates in the final classic design,
   one at a time or a whole webinar list at once. Each gets a unique ID (AP-WEB / AP-CRS / AP-SPK), a QR code
   and a public verify page. Speaker/faculty signatures are saved once as signature profiles.
   Students see their own certificates on their portal home page. Needs ../certs/render.js. */
(function(){
  "use strict";
  if(window.__apCerts)return;window.__apCerts=true;
  var C={certs:{},priv:{},sigs:{},on:false,ready:false},CS={q:"",type:"all"};
  var e=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var fsdb=function(){return window.firebase&&firebase.firestore()};
  var R=function(){try{if(typeof schedule==="function")schedule();else if(typeof render==="function")render()}catch(x){}};
  var T=function(){return window.APCert?APCert.TYPES:{}};
  var todayISO=function(){return new Date().toLocaleDateString("en-CA")};
  var nowI=function(){return new Date().toISOString()};
  var say=function(m){try{toast(m)}catch(x){alert(m)}};
  var staffOk=function(){try{return isStaff()}catch(x){return false}};
  var adminOk=function(){try{return isAdmin()}catch(x){return false}};
  var sigMap=function(){var o={};Object.keys(C.sigs).forEach(function(k){if(C.sigs[k]&&C.sigs[k].data)o[k]=C.sigs[k].data});return o};
  var TONE={participation:"teal",completion:"blue",appreciation:"amber"};

  /* ---------- live data (staff) ---------- */
  function watch(){
    if(C.on||!staffOk()||!fsdb())return;C.on=true;var n=0;
    function done(){if(++n>=3){C.ready=true}R()}
    var f1=true,f2=true,f3=true;
    fsdb().collection("certificates").onSnapshot(function(sn){var o={};sn.docs.forEach(function(d){o[d.id]=d.data()});C.certs=o;if(f1){f1=false;done()}else R()},function(){if(f1){f1=false;C.err=true;done()}});
    fsdb().collection("certprivate").onSnapshot(function(sn){var o={};sn.docs.forEach(function(d){o[d.id]=d.data()});C.priv=o;if(f2){f2=false;done()}else R()},function(){if(f2){f2=false;done()}});
    fsdb().collection("certsigs").onSnapshot(function(sn){var o={};sn.docs.forEach(function(d){o[d.id]=d.data()});C.sigs=o;if(f3){f3=false;done()}else R()},function(){if(f3){f3=false;done()}});
  }

  /* ---------- IDs ---------- */
  async function nextId(type){
    var code=(T()[type]||{}).code||"GEN",y=new Date().getFullYear(),key=code+y,ref=fsdb().doc("certmeta/counters");
    var n=await fsdb().runTransaction(async function(tx){var d=await tx.get(ref);var cur=(d.exists&&d.data()[key])||0;var o={};o[key]=cur+1;tx.set(ref,o,{merge:true});return cur+1});
    return "AP-"+code+"-"+y+"-"+String(n).padStart(4,"0");
  }
  async function issue(c,priv){
    var id=await nextId(c.type);c.id=id;
    var pub={};Object.keys(c).forEach(function(k){if(c[k]!==undefined&&k!=="id")pub[k]=c[k]});
    pub.status="valid";pub.issued=pub.issued||todayISO();pub.createdAt=nowI();pub.createdBy=(typeof me!=="undefined"&&me&&me.email)||"";
    await fsdb().doc("certificates/"+id).set(pub);
    var p={email:(priv&&priv.email)||"",phone:(priv&&priv.phone)||"",createdAt:pub.createdAt};
    try{await fsdb().doc("certprivate/"+id).set(p)}catch(x){}
    C.certs[id]=pub;C.priv[id]=p;
    if(pub.sid&&typeof syncStudent==="function"){try{await syncStudent(pub.sid)}catch(x){}}
    return id;
  }
  function certOf(id){var c=C.certs[id];if(!c)return null;var o={id:id};Object.keys(c).forEach(function(k){o[k]=c[k]});return o}

  /* ---------- signature clean-up: photo of a signature → transparent ink PNG ---------- */
  function cleanSignature(file){return new Promise(function(res,rej){
    if(!/^image\//.test(file.type||""))return rej(new Error("Choose a photo or scan of the signature (JPG or PNG)."));
    var r=new FileReader();r.onerror=function(){rej(new Error("Couldn't read that file."))};
    r.onload=function(){var img=new Image();img.onerror=function(){rej(new Error("That image couldn't be opened."))};
      img.onload=function(){
        var sc=Math.min(1,1400/Math.max(img.width,img.height)),W=Math.round(img.width*sc),H=Math.round(img.height*sc);
        var cv=document.createElement("canvas");cv.width=W;cv.height=H;var g=cv.getContext("2d");g.drawImage(img,0,0,W,H);
        var id=g.getImageData(0,0,W,H),d=id.data,lum=new Float32Array(W*H),hist=new Array(256).fill(0);
        for(var i=0;i<W*H;i++){var L=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];lum[i]=L;hist[Math.min(255,Math.round(L))]++}
        var acc=0,bg=230;for(var k=255;k>=0;k--){acc+=hist[k];if(acc>W*H*0.5){bg=k;break}}
        var hi=bg-18,lo=bg-110,minX=W,minY=H,maxX=0,maxY=0,ink=[0,0,0],cnt=0;
        for(var j=0;j<W*H;j++){var a=lum[j]>=hi?0:lum[j]<=lo?1:(hi-lum[j])/(hi-lo);
          if(a>0.5){ink[0]+=d[j*4];ink[1]+=d[j*4+1];ink[2]+=d[j*4+2];cnt++;var x=j%W,y=(j/W)|0;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}
          d[j*4+3]=Math.round(a*255)}
        if(!cnt)return rej(new Error("No signature found in that image. Use dark ink on plain white paper."));
        var cr=Math.max(0,Math.min(255,ink[0]/cnt*0.8)),cg=Math.max(0,Math.min(255,ink[1]/cnt*0.8)),cb=Math.max(0,Math.min(255,ink[2]/cnt*0.9));
        for(var m=0;m<W*H;m++){d[m*4]=cr;d[m*4+1]=cg;d[m*4+2]=cb}
        g.putImageData(id,0,0);
        var pad=8;minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(W-1,maxX+pad);maxY=Math.min(H-1,maxY+pad);
        var cw=maxX-minX+1,ch=maxY-minY+1,s2=Math.min(1,700/cw,300/ch),out=document.createElement("canvas");
        out.width=Math.max(1,Math.round(cw*s2));out.height=Math.max(1,Math.round(ch*s2));
        var og=out.getContext("2d");og.imageSmoothingQuality="high";og.drawImage(cv,minX,minY,cw,ch,0,0,out.width,out.height);
        var url=out.toDataURL("image/png");if(url.length>650000)return rej(new Error("That signature image is too large. Try a smaller photo."));
        res(url)};
      img.src=r.result};
    r.readAsDataURL(file)})}

  /* ---------- styles ---------- */
  function addCss(){if(document.getElementById("apcerts-css"))return;var s=document.createElement("style");s.id="apcerts-css";s.textContent=
    '.cx-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:4px 0 16px}'+
    '.cx-stat{background:var(--surface,#fff);border:1px solid var(--line,#d7e0e9);border-radius:14px;padding:12px 14px;display:flex;gap:10px;align-items:center}'+
    '.cx-dot{width:12px;height:12px;border-radius:50%;flex:none}.cx-stat b{font-size:1.3rem;display:block;line-height:1.1}.cx-stat span{font-size:.8rem;color:var(--muted,#5b6b80)}'+
    '.cx-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 12px}.cx-bar input{flex:1 1 220px;min-width:0}'+
    '.cx-chip{all:unset;cursor:pointer;padding:6px 12px;border-radius:999px;border:1px solid var(--line,#d7e0e9);font-size:.82rem;font-weight:600}.cx-chip[aria-pressed="true"]{background:var(--ink,#0b1a30);color:var(--surface,#fff);border-color:transparent}.cx-chip:focus-visible{outline:2px solid #2ed3bf}'+
    '.cx-row{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between}.cx-row .cx-main{min-width:0;flex:1 1 260px}.cx-row .actions{display:flex;flex-wrap:wrap;gap:6px}'+
    '.cx-id{font-family:var(--mono,monospace);font-size:.8rem}.cx-rev{opacity:.6}'+
    '.cx-sigs{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}.cx-sig{border:1px solid var(--line,#d7e0e9);border-radius:14px;padding:12px;background:var(--surface,#fff)}'+
    '.cx-sig .im{height:70px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:10px;border:1px dashed #c9d6df;margin-bottom:8px}.cx-sig .im img{max-height:62px;max-width:92%}'+
    '.cx-prev{width:100%;min-height:120px}.cx-sheet{max-width:980px!important;width:calc(100vw - 32px)!important}'+
    '.cx-types{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px}'+
    '.cx-type{all:unset;cursor:pointer;border-radius:16px;padding:14px 16px;color:#fff;display:flex;flex-direction:column;gap:4px;box-shadow:0 10px 24px -14px rgba(0,0,0,.5)}.cx-type:focus-visible{outline:3px solid #2ed3bf;outline-offset:2px}.cx-type b{font-size:1.02rem}.cx-type span{font-size:.8rem;opacity:.85}'+
    '.cx-mine{margin-top:16px}.cx-mine .cx-card{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;border:1px solid var(--line,#d7e0e9);border-radius:14px;padding:12px 14px;margin-top:10px;background:var(--surface,#fff)}';
    document.head.appendChild(s)}

  /* ---------- staff view ---------- */
  function typeLabel(t){return (T()[t]||{}).label||t}
  function filtered(){
    var q=CS.q.trim().toLowerCase();
    return Object.keys(C.certs).map(certOf).filter(function(c){
      if(CS.type!=="all"&&c.type!==CS.type)return false;
      if(!q)return true;var p=C.priv[c.id]||{};
      return [c.id,c.name,c.title,c.batch,p.phone,p.email].join(" ").toLowerCase().indexOf(q)>=0;
    }).sort(function(a,b){return String(b.createdAt||b.issued||"").localeCompare(String(a.createdAt||a.issued||""))});
  }
  function viewHTML(){
    addCss();watch();
    var TY=T(),all=Object.keys(C.certs).map(certOf),list=filtered().slice(0,200);
    var head0='<div class="head"><div><h1>Certificates</h1><p>Issue AlliedPath certificates with a unique ID, QR code and online verification. Students also find theirs on their portal home page.</p></div><div class="actions"><button class="btn" data-act="certBulk">Issue for a webinar list</button><button class="btn" data-act="certSigs">Signature profiles</button></div></div>';
    if(!window.APCert)return head0+'<section class="panel"><p>The certificate designer didn\'t load. Refresh the page.</p></section>';
    if(!C.ready)return head0+'<div class="empty"><b>Loading certificates…</b></div>';
    if(C.err)return head0+'<section class="panel"><h2>Certificates need one setup step</h2><p class="muted">The database is not yet allowing certificate records. Add the certificate rules in Firebase (Firestore → Rules) and refresh.</p></section>';
    var types='<div class="cx-types">'+["participation","completion","appreciation"].map(function(k){var t=TY[k];
      return '<button class="cx-type" data-act="certNew" data-arg="'+k+'" style="background:linear-gradient(135deg,'+t.band+','+t.band+'cc);border:2px solid '+t.mid+'"><b>+ '+e(t.label)+' certificate</b><span>Certificate '+e(t.sub)+' · '+(k==="participation"?"webinar attendees":k==="completion"?"course students":"speakers & resource persons")+'</span></button>'}).join("")+'</div>';
    var cnt=function(k){return all.filter(function(c){return c.type===k&&c.status!=="revoked"}).length};
    var stats='<div class="cx-stats">'+["participation","completion","appreciation"].map(function(k){return '<div class="cx-stat"><span class="cx-dot" style="background:'+TY[k].band+';box-shadow:0 0 0 3px '+TY[k].mid+'55"></span><div><b>'+cnt(k)+'</b><span>'+e(TY[k].label)+' certificates</span></div></div>'}).join("")+
      '<div class="cx-stat"><span class="cx-dot" style="background:#ad322b"></span><div><b>'+all.filter(function(c){return c.status==="revoked"}).length+'</b><span>Revoked</span></div></div></div>';
    var chips='<div class="cx-bar"><input id="certQ" type="search" placeholder="Search name, ID, webinar or course, phone…" value="'+e(CS.q)+'" aria-label="Search certificates">'+
      [["all","All"],["participation","Participants"],["completion","Students"],["appreciation","Speakers"]].map(function(x){return '<button class="cx-chip" data-act="certType" data-arg="'+x[0]+'" aria-pressed="'+(CS.type===x[0])+'">'+x[1]+'</button>'}).join("")+
      (list.length>1?'<button class="btn ghost" data-act="certDlAll">Download these ('+Math.min(list.length,60)+') as one PDF</button>':'')+'</div>';
    var rows=list.length?'<div class="list">'+list.map(function(c){var p=C.priv[c.id]||{},rev=c.status==="revoked";
      return '<div class="li cx-row'+(rev?" cx-rev":"")+'"><div class="cx-main"><div class="t">'+e(c.name)+' <span class="pill '+(TONE[c.type]||"")+'">'+e(typeLabel(c.type))+'</span>'+(rev?' <span class="pill red">Revoked</span>':'')+'</div>'+
        '<div class="d">'+e(c.title||"")+(c.date||c.endDate?' · '+e(APCert.fmt(c.date||c.endDate)):"")+'</div><div class="d cx-id">'+e(c.id)+(p.phone?' · '+e(p.phone):"")+'</div></div>'+
        '<div class="actions"><button class="btn ghost" data-act="certView" data-arg="'+e(c.id)+'">View</button><button class="btn ghost" data-act="certPdf" data-arg="'+e(c.id)+'">PDF</button>'+
        (p.phone?'<button class="btn ghost" data-act="certWa" data-arg="'+e(c.id)+'">WhatsApp</button>':'')+
        '<button class="btn ghost" data-act="certCopy" data-arg="'+e(c.id)+'">Copy link</button>'+
        (adminOk()?'<button class="btn ghost" data-act="certRevoke" data-arg="'+e(c.id)+'">'+(rev?"Restore":"Revoke")+'</button>':'')+'</div></div>'}).join("")+'</div>'
      :'<div class="empty"><b>'+(all.length?"No certificates match":"No certificates yet")+'</b><span>'+(all.length?"Try another search or filter.":"Choose a certificate type above to issue the first one.")+'</span></div>';
    return head0+types+stats+'<section class="panel">'+chips+rows+'</section>';
  }

  /* ---------- forms ---------- */
  function sigOpts(blank){return [["",blank||"No signature"]].concat(Object.keys(C.sigs).map(function(k){var s=C.sigs[k];return [k,s.name+(s.designation?" — "+s.designation:"")]}).sort(function(a,b){return a[1].localeCompare(b[1])}))}
  function studentOpts(){try{return optStudents("Not linked to a portal student")}catch(x){return [["","Not linked"]]}}
  function batchOpts(){try{return [["","No batch"]].concat(vals("batches").map(function(b){return [b.code||b.name||b.id,(b.code?b.code+" — ":"")+(b.name||"")]}))}catch(x){return [["","No batch"]]}}
  function leftFrom(sigId,role,type){if(!sigId||!C.sigs[sigId])return null;return {name:C.sigs[sigId].name,role:(role||"").trim()||T()[type].leftRole,sig:sigId}}
  function nameFor(v){var n=(v.name||"").trim();if(!n&&v.sid&&S.students[v.sid])n=S.students[v.sid].name||"";if(!n)throw new Error("Enter the name to print on the certificate.");if(n.length>70)throw new Error("That name is too long for the certificate.");return n}
  function contactFor(v){var p={phone:(v.phone||"").trim(),email:(v.email||"").trim()};if(v.sid&&S.students[v.sid]){var s=S.students[v.sid];if(!p.phone)p.phone=s.phone||"";if(!p.email)p.email=s.email||""}return p}
  function need(v,k,msg){if(!String(v[k]||"").trim())throw new Error(msg)}

  ACT.certNew=function(type){
    var t=T()[type];if(!t)return;var f=[];
    var intro='<p class="small muted" style="margin:-6px 0 12px">Certificate '+e(t.sub)+'. A unique ID and QR code are added automatically. Your signature is always printed on the right.</p>';
    if(type==="participation")f=[
      {key:"name",label:"Participant's name (as on certificate)",full:true,placeholder:"e.g. Ayesha Khan"},
      {key:"sid",label:"Portal student (optional)",type:"select",options:studentOpts(),full:true,hint:"Link it and the student sees it in their portal. Leave the name blank to use theirs."},
      {key:"phone",label:"WhatsApp number",type:"tel",placeholder:"98xxxxxx10"},{key:"email",label:"Email",type:"email"},
      {key:"title",label:"Webinar title",required:true,full:true},{key:"date",label:"Webinar date",type:"date",required:true,value:todayISO()},
      {key:"sig",label:"Speaker (left signature)",type:"select",options:sigOpts("No speaker signature")},
      {key:"speaker",label:"Delivered by (shown in the text)",full:true,placeholder:"e.g. Dr. A. Sharma, Professor, XYZ University",hint:"Leave blank to use the speaker profile's name and designation."}];
    else if(type==="completion")f=[
      {key:"sid",label:"Portal student",type:"select",options:studentOpts(),full:true,hint:"Leave the name below blank to use the student's name."},
      {key:"name",label:"Student's name (as on certificate)",full:true},
      {key:"phone",label:"WhatsApp number",type:"tel"},{key:"email",label:"Email",type:"email"},
      {key:"title",label:"Course title",required:true,full:true},
      {key:"hours",label:"Duration (hours)",type:"number"},{key:"score",label:"Final assessment score (%)",type:"number"},
      {key:"startDate",label:"Course start",type:"date"},{key:"endDate",label:"Course end",type:"date",value:todayISO()},
      {key:"batch",label:"Batch ID",type:"select",options:batchOpts()},
      {key:"sig",label:"Course faculty (left signature)",type:"select",options:sigOpts("No faculty signature")}];
    else f=[
      {key:"name",label:"Speaker's name (as on certificate)",required:true,full:true,placeholder:"e.g. Dr. A. Sharma"},
      {key:"designation",label:"Designation & institution",full:true,placeholder:"e.g. Professor, Dept. of Anaesthesiology, XYZ Medical College"},
      {key:"phone",label:"WhatsApp number",type:"tel"},{key:"email",label:"Email",type:"email"},
      {key:"title",label:"Webinar title",required:true,full:true},{key:"date",label:"Webinar date",type:"date",required:true,value:todayISO()},
      {key:"sig",label:"Coordinator (left signature)",type:"select",options:sigOpts("No coordinator signature")},
      {key:"role",label:"Coordinator's title",placeholder:"Webinar Coordinator"}];
    openForm({title:"Issue "+t.label.toLowerCase()+" certificate",intro:intro,fields:f,submit:"Issue certificate",onSubmit:async function(v){
      var c={type:type,name:nameFor(v),title:(v.title||"").trim()};need(v,"title","Enter the "+(type==="completion"?"course":"webinar")+" title.");
      if(c.title.length>140)throw new Error("Keep the title under 140 characters.");
      if(v.sid)c.sid=v.sid;
      if(type==="participation"){need(v,"date","Choose the webinar date.");c.date=v.date;var L=leftFrom(v.sig,"",type);if(L)c.left=L;
        c.speaker=(v.speaker||"").trim()||(L?L.name+(C.sigs[v.sig].designation?", "+C.sigs[v.sig].designation:""):"")}
      else if(type==="completion"){c.hours=v.hours?String(v.hours):"";c.score=v.score!==""&&v.score!=null?String(v.score):"";c.startDate=v.startDate||"";c.endDate=v.endDate||"";c.batch=v.batch||"";
        if(!c.batch&&v.sid&&S.students[v.sid]&&S.students[v.sid].batchId&&S.batches[S.students[v.sid].batchId])c.batch=S.batches[S.students[v.sid].batchId].code||"";
        var L2=leftFrom(v.sig,"",type);if(L2)c.left=L2}
      else{need(v,"date","Choose the webinar date.");c.date=v.date;c.designation=(v.designation||"").trim();var L3=leftFrom(v.sig,v.role,type);if(L3)c.left=L3}
      var id=await issue(c,contactFor(v));say("Certificate "+id+" issued");setTimeout(function(){showCert(id)},120);
    }});
  };

  ACT.certBulk=function(){
    openForm({title:"Certificates for a whole webinar",intro:'<p class="small muted" style="margin:-6px 0 12px">Issues a Participant certificate to everyone on the list. Paste one person per line: <b>Name, WhatsApp number, email</b> (number and email optional). You can paste straight from Excel, Google Sheets or Zoom/Meet attendance.</p>',
      fields:[{key:"title",label:"Webinar title",required:true,full:true},{key:"date",label:"Webinar date",type:"date",required:true,value:todayISO()},
        {key:"sig",label:"Speaker (left signature)",type:"select",options:sigOpts("No speaker signature")},
        {key:"speaker",label:"Delivered by (shown in the text)",placeholder:"Optional"},
        {key:"list",label:"Attendees",type:"textarea",rows:8,required:true,full:true,placeholder:"Ayesha Khan, 9876543210, ayesha@gmail.com\nRahul Verma, 9123456780"},
        {key:"file",label:"…or a CSV / text file",type:"file",accept:".csv,.txt,text/csv,text/plain",full:true}],
      submit:"Issue certificates",onSubmit:async function(v){
        need(v,"title","Enter the webinar title.");need(v,"date","Choose the webinar date.");
        var txt=String(v.list||"");if(v.file&&v.file.text)txt+="\n"+(await v.file.text());
        var seen={},people=txt.split(/\r?\n/).map(function(l){return l.split(/\t|,|;/).map(function(x){return x.trim().replace(/^"|"$/g,"")})})
          .filter(function(p){return p[0]&&!/^(name|full name|participant)$/i.test(p[0])&&p[0].length<=70})
          .map(function(p){var ph="",em="";p.slice(1).forEach(function(x){if(/@/.test(x))em=x;else if(/\d{6,}/.test(x.replace(/\D/g,"")))ph=x});return {name:p[0],phone:ph,email:em}})
          .filter(function(p){var k=p.name.toLowerCase()+"|"+p.phone.replace(/\D/g,"");if(seen[k])return false;seen[k]=1;return true});
        if(!people.length)throw new Error("Add at least one name.");if(people.length>300)throw new Error("Issue at most 300 at a time.");
        var L=leftFrom(v.sig,"","participation"),speaker=(v.speaker||"").trim()||(L?L.name+(C.sigs[v.sig].designation?", "+C.sigs[v.sig].designation:""):""),ids=[];
        var btn=document.querySelector('#modal [data-act="formSubmit"]');
        for(var i=0;i<people.length;i++){if(btn)btn.textContent="Issuing "+(i+1)+" of "+people.length+"…";
          var c={type:"participation",name:people[i].name,title:v.title.trim(),date:v.date,speaker:speaker};if(L)c.left=L;
          ids.push(await issue(c,{phone:people[i].phone,email:people[i].email}))}
        say(ids.length+" certificates issued");CS.q=v.title.trim();CS.type="participation";setTimeout(function(){bulkDone(ids)},120);
      }});
  };
  function bulkDone(ids){
    var m=document.getElementById("modal");
    m.innerHTML='<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="cxT"><h2 id="cxT">'+ids.length+' certificates issued</h2><p class="muted">IDs '+e(ids[0])+(ids.length>1?' to '+e(ids[ids.length-1]):'')+'. They are listed under Certificates, filtered to this webinar, where you can send each one on WhatsApp.</p>'+
      '<div class="sheetfoot"><span class="right"><button class="btn" data-act="closeModal">Close</button><button class="btn primary" data-cxdl="'+e(ids.join(","))+'">Download all as one PDF</button></span></div></div>';m.hidden=false;
  }

  /* ---------- signature profiles ---------- */
  ACT.certSigs=function(){
    addCss();var m=document.getElementById("modal"),ks=Object.keys(C.sigs).sort(function(a,b){return (C.sigs[a].name||"").localeCompare(C.sigs[b].name||"")});
    m.innerHTML='<div class="sheet cx-sheet" role="dialog" aria-modal="true" aria-labelledby="cxS"><h2 id="cxS">Signature profiles</h2><p class="small muted" style="margin:-6px 0 12px">Save each speaker\'s or faculty member\'s signature once, then pick them when issuing. Upload a photo of the signature in dark ink on plain white paper: the background is removed automatically. Your own signature is built in.</p>'+
      (ks.length?'<div class="cx-sigs">'+ks.map(function(k){var s=C.sigs[k];return '<div class="cx-sig"><div class="im">'+(s.data?'<img src="'+e(s.data)+'" alt="Signature of '+e(s.name)+'">':'<span class="muted small">No image</span>')+'</div><b>'+e(s.name)+'</b><div class="small muted">'+e(s.designation||"")+'</div><div class="actions" style="margin-top:8px"><button class="btn ghost" data-act="certSigEdit" data-arg="'+e(k)+'">Edit</button>'+(adminOk()?'<button class="btn ghost" data-act="certSigDel" data-arg="'+e(k)+'">Delete</button>':'')+'</div></div>'}).join("")+'</div>':'<div class="empty"><b>No signature profiles yet</b><span>Add your faculty and regular speakers.</span></div>')+
      '<div class="sheetfoot"><span class="right"><button class="btn" data-act="closeModal">Close</button><button class="btn primary" data-act="certSigEdit">Add signature profile</button></span></div></div>';
    m.hidden=false;
  };
  ACT.certSigEdit=function(id){
    var s=id&&C.sigs[id]||{};
    openForm({title:id?"Edit signature profile":"Add signature profile",intro:'<p class="small muted" style="margin:-6px 0 12px">Shown on certificates as the left signature with this name.</p>',
      fields:[{key:"name",label:"Name as printed",required:true,full:true,value:s.name||"",placeholder:"e.g. Ms. Antony Jennert Linu J"},
        {key:"designation",label:"Designation & institution",full:true,value:s.designation||"",placeholder:"e.g. Asst Prof AOTT, CMR University"},
        {key:"file",label:s.data?"Replace signature photo":"Signature photo",type:"file",accept:"image/*",full:true,hint:"Dark ink on white paper. Cropped and cleaned automatically."}],
      submit:"Save profile",onSubmit:async function(v){
        need(v,"name","Enter the name.");var data=s.data||"";if(v.file&&v.file.size)data=await cleanSignature(v.file);if(!data)throw new Error("Add a signature photo.");
        var ref=id?fsdb().doc("certsigs/"+id):fsdb().collection("certsigs").doc();
        await ref.set({name:v.name.trim(),designation:(v.designation||"").trim(),data:data,updatedAt:nowI()});
        C.sigs[ref.id]={name:v.name.trim(),designation:(v.designation||"").trim(),data:data};say("Signature profile saved");setTimeout(function(){ACT.certSigs()},120);
      }});
  };
  ACT.certSigDel=function(id){var s=C.sigs[id];if(!s)return;
    openForm({title:"Delete this signature profile?",intro:'<p>'+e(s.name)+'\'s signature will no longer appear on certificates you download, including ones already issued with it.</p>',fields:[],submit:"Delete profile",
      onSubmit:async function(){await fsdb().doc("certsigs/"+id).delete();delete C.sigs[id];say("Signature profile deleted")}})};

  /* ---------- view / share ---------- */
  function waNumber(p){var d=String(p||"").replace(/\D/g,"");if(d.length===10)d="91"+d;if(d.length===11&&d[0]==="0")d="91"+d.slice(1);return d.length>=11?d:""}
  function waText(c){var t=T()[c.type]||{};return "Dear "+c.name+",\n\nCongratulations! Your AlliedPath Certificate "+(t.sub||"")+" for “"+c.title+"” is ready.\n\nView and download it here:\n"+APCert.verifyUrl(c.id)+"\n\nCertificate ID: "+c.id+"\n\nTeam AlliedPath · Teach · Mentor · Guide"}
  function showCert(id){
    var c=certOf(id);if(!c)return;addCss();var p=C.priv[id]||{},m=document.getElementById("modal");
    m.innerHTML='<div class="sheet cx-sheet" role="dialog" aria-modal="true" aria-labelledby="cxV"><h2 id="cxV">'+e(c.name)+' <span class="pill '+(TONE[c.type]||"")+'">'+e(typeLabel(c.type))+'</span></h2><p class="small muted cx-id" style="margin:-6px 0 10px">'+e(id)+' · '+e(APCert.verifyUrl(id))+'</p>'+
      '<div class="cx-prev" id="cxPrev"><div class="empty"><b>Drawing the certificate…</b></div></div>'+
      '<div class="sheetfoot" style="flex-wrap:wrap;gap:8px"><button class="btn" data-act="closeModal">Close</button><span class="right" style="display:flex;flex-wrap:wrap;gap:8px">'+
      '<button class="btn" data-cxpng="'+e(id)+'">Image</button>'+(p.phone?'<button class="btn" data-act="certWa" data-arg="'+e(id)+'">WhatsApp</button>':'')+
      '<button class="btn" data-act="certCopy" data-arg="'+e(id)+'">Copy link</button><button class="btn primary" data-act="certPdf" data-arg="'+e(id)+'">Download PDF</button></span></div></div>';
    m.hidden=false;var box=document.getElementById("cxPrev");APCert.mount(box,c,sigMap()).catch(function(x){box.innerHTML='<p class="formerr">'+e(x.message||"Couldn't draw the certificate.")+'</p>'});
  }
  async function busy(btn,label,fn){var t=btn&&btn.textContent;if(btn){btn.disabled=true;btn.textContent=label}try{await fn()}catch(x){say((x&&x.message)||"Something went wrong. Try again.")}finally{if(btn){btn.disabled=false;btn.textContent=t}}}
  ACT.certView=function(id){showCert(id)};
  ACT.certPdf=function(id,el){var c=certOf(id);if(c)busy(el,"Preparing PDF…",function(){return APCert.downloadPDF(c,sigMap())})};
  ACT.certCopy=function(id){var u=APCert.verifyUrl(id);if(navigator.clipboard)navigator.clipboard.writeText(u).then(function(){say("Verify link copied")},function(){prompt("Copy this link",u)});else prompt("Copy this link",u)};
  ACT.certWa=function(id){var c=certOf(id),p=C.priv[id]||{},n=waNumber(p.phone);if(!c)return;window.open("https://wa.me/"+(n||"")+"?text="+encodeURIComponent(waText(c)),"_blank","noopener")};
  ACT.certType=function(t){CS.type=t;R()};
  ACT.certDlAll=function(_,el){var l=filtered().filter(function(c){return c.status!=="revoked"}).slice(0,60);if(l.length)busy(el,"Preparing "+l.length+" pages…",function(){return APCert.downloadMany(l,sigMap(),"AlliedPath-Certificates-"+todayISO()+".pdf")})};
  ACT.certRevoke=function(id){var c=C.certs[id];if(!c)return;var rev=c.status==="revoked";
    openForm({title:rev?"Restore this certificate?":"Revoke this certificate?",intro:'<p>'+(rev?"It will show as valid again on the verify page.":"The verify page will show it as revoked and new downloads carry a REVOKED stamp. You can restore it later.")+'</p>',fields:[],submit:rev?"Restore":"Revoke",
      onSubmit:async function(){await fsdb().doc("certificates/"+id).update({status:rev?"valid":"revoked",statusAt:nowI()});C.certs[id].status=rev?"valid":"revoked";if(c.sid&&typeof syncStudent==="function"){try{await syncStudent(c.sid)}catch(x){}}say(rev?"Certificate restored":"Certificate revoked")}})};

  document.addEventListener("click",function(ev){
    var t=ev.target;if(!t||!t.closest)return;var b;
    if((b=t.closest("[data-cxdl]"))){ev.preventDefault();var l=b.getAttribute("data-cxdl").split(",").map(certOf).filter(Boolean);busy(b,"Preparing "+l.length+" pages…",function(){return APCert.downloadMany(l,sigMap(),"AlliedPath-Certificates-"+todayISO()+".pdf")});return}
    if((b=t.closest("[data-cxpng]"))){ev.preventDefault();var c=certOf(b.getAttribute("data-cxpng"));if(c)busy(b,"Preparing…",function(){return APCert.downloadPNG(c,sigMap())});return}
    if((b=t.closest("[data-cxmine]"))){ev.preventDefault();var id=b.getAttribute("data-cxmine");busy(b,"Preparing PDF…",async function(){
      var d=await fsdb().doc("certificates/"+id).get();if(!d.exists)throw new Error("Certificate not found.");var c2=d.data();c2.id=id;var sg={};
      if(c2.left&&c2.left.sig){try{var s=await fsdb().doc("certsigs/"+c2.left.sig).get();if(s.exists)sg[c2.left.sig]=s.data().data}catch(x){}}
      await APCert.downloadPDF(c2,sg)});return}
  });
  document.addEventListener("input",function(ev){if(ev.target&&ev.target.id==="certQ"){CS.q=ev.target.value;R()}});

  /* ---------- student portal: "My certificates" on the home page ---------- */
  if(typeof window.summaryFor==="function"&&!window.summaryFor.__cx){
    var sf=window.summaryFor;window.summaryFor=function(sid){var o=sf.apply(this,arguments);try{
      o.certs=Object.keys(C.certs).filter(function(k){return C.certs[k].sid===sid&&C.certs[k].status!=="revoked"}).map(function(k){var c=C.certs[k];return {id:k,type:c.type,title:c.title||"",date:c.date||c.endDate||c.issued||""}}).sort(function(a,b){return String(b.date).localeCompare(String(a.date))}).slice(0,40)
    }catch(x){}return o};window.summaryFor.__cx=true;
    if(window.summaryFor.__idc===undefined&&sf.__idc)window.summaryFor.__idc=true;
  }
  function decorateStudent(){
    if(typeof role==="undefined"||role!=="student"||typeof SV==="undefined"||!SV||!Array.isArray(SV.certs)||!SV.certs.length)return;
    if(ui&&ui.sTab&&ui.sTab!=="home")return;var main=document.querySelector("#app main")||document.querySelector("#app .main");if(!main||main.querySelector(".cx-mine"))return;
    addCss();var sec=document.createElement("section");sec.className="section cx-mine";
    sec.innerHTML='<h2>My certificates</h2>'+SV.certs.map(function(c){var t=T()[c.type]||{};return '<div class="cx-card"><div style="min-width:0"><b>Certificate '+e(t.sub||"")+'</b><div class="small muted">'+e(c.title)+(c.date?' · '+e(APCert.fmt(c.date)):"")+'</div><div class="small muted cx-id">'+e(c.id)+'</div></div><div class="actions"><a class="btn ghost" href="'+e(APCert.verifyUrl(c.id))+'" target="_blank" rel="noopener">View</a><button class="btn primary" data-cxmine="'+e(c.id)+'">Download PDF</button></div></div>'}).join("");
    main.appendChild(sec);
  }

  /* ---------- wiring into the portal ---------- */
  function wire(){
    if(typeof VIEWS==="object"&&!VIEWS.certificates)VIEWS.certificates=viewHTML;
    if(typeof NAV==="object"&&Array.isArray(NAV)&&!NAV.some(function(n){return n[0]==="certificates"})){var i=NAV.findIndex(function(n){return n[0]==="settings"});NAV.splice(i<0?NAV.length:i,0,["certificates","Certificates"])}
    if(typeof window.render==="function"&&!window.render.__cx){var r=window.render;window.render=function(){var o=r.apply(this,arguments);try{if(staffOk())watch();decorateStudent()}catch(x){}return o};
      ["__idc","__fx"].forEach(function(k){if(r[k])window.render[k]=true});window.render.__cx=true;try{window.render()}catch(x){}}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){wire();setTimeout(wire,1600)});else{wire();setTimeout(wire,1600)}
})();
