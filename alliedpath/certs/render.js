/* AlliedPath certificates — shared renderer.
   Draws the final "classic" certificate (Participant / Student / Speaker themes) as HTML,
   and turns it into an A4 landscape PDF. Used by the portal (certs.js) and the public verify page. */
(function(){
  "use strict";
  var SIGSVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="36 34 1278 964"><path fill="#1B3A9E" fill-rule="evenodd" d="M416 989c-2-1-7-1-9-3c-2-2-6-3-4-9c2-6-2-5 17-27c19-22 63-70 98-106c35-35 94-88 113-107c20-19 4-5 4-8c0-3 6 2-3-10c-10-12-34-39-54-59c-20-20-53-53-66-63c-13-11-8-2-12 1c-4 3-7 10-14 17c-7 6-21 18-26 21c-6 4-6 2-9 1c-3-1-7 2-8-5c0-6 0-11 7-34c6-23 25-76 32-102c6-25 5-29 7-50c2-22 3-59 3-78c0-20-2-27-4-37c-2-10-3-13-8-22c-4-9-8-20-18-31c-11-11-24-23-44-34c-20-11-34-16-76-32c-41-15-141-50-172-60c-32-10-12-3-14-2c-2 1-3 4 0 10c2 6 8 16 14 25c7 9 9 4 28 29c18 26 67 100 84 124c17 24 11 10 18 20c7 10 17 28 24 37c7 9 16 15 19 19c3 5 2 7 1 8c-2 2-4 4-7 1c-3-3-8-14-12-18c-3-4-2 2-9-5c-6-7-26-30-32-38c-6-9 4 1-4-10c-8-12-36-48-45-60c-8-12 14 14-5-14c-19-27-84-120-110-151c-25-32-34-26-46-37c-12-12-20-24-25-30c-5-6-3-6-3-8c0-2 0-4 2-5c3-1 4-6 12-1c7 5 25 21 35 31c9 10 11 19 21 27c11 9 31 20 40 26c10 6 3 4 20 10c17 6 64 21 82 28c19 6 12 7 26 12c14 4 48 12 58 16c11 3-4 0 7 5c11 4 40 11 58 20c18 9 41 26 52 33c11 8 9 8 14 15c5 6 13 16 18 25c4 10 8 16 11 30c3 13 6 33 7 50c1 18 0 41-1 57c-1 16-2 25-5 41c-3 16-6 37-11 56c-6 20-18 51-21 62c-2 12 0 7 3 6c4-2 12-9 16-14c3-6 3-13 5-16c3-4 7-2 10-4c3-2-4 6 11-9c14-15 66-62 78-81c12-20-5-26-6-36c-1-10-1-17 2-28c3-10 10-27 15-34c5-7 7-5 15-8c8-2 24-7 32-7c7 1 6 3 12 11c6 9 19 34 25 41c6 8 6 4 9 3c3 0 8-3 10-6c2-2 2-5 2-8c0-4 3-4-2-13c-5-9-20-33-28-45c-9-11-19-18-23-25c-4-6-4-9-4-13c0-3 3-5 5-7c1-2 2-3 6-2c3 0 7-1 13 5c6 5 17 22 23 28c5 6 8 9 11 8c3-1 6-5 9-16c3-10 7-40 11-50c4-9 11-5 14-5c3-1 4 2 6 4c1 2 4 0 2 9c-2 9-12 35-14 44c-2 8-4 4 1 7c5 4 19 10 28 12c8 1 16 0 22-1c6-1 10 0 12-5c3-5 13-7 6-23c-7-17-38-63-46-77c-8-14-2-7-2-10c0-3 1-7 4-7c2-1 7 0 12 3c5 3 9 8 15 15c6 7 15 15 21 25c6 10 11 28 14 35c3 6 4 2 6 2c3 0 6-1 8-3c2-2 4-2 5-8c1-6 3-24 3-31c-1-6-2-7-6-10c-3-2-11-1-14-4c-4-4-7-8-8-14c0-7 0-17 2-23c2-6 6-12 10-14c3-2 8-2 12 1c5 4 10 19 16 21c7 1 19-11 25-13c6-1 10-1 14 2c4 2 6 5 7 13c1 8-2 26-2 33c1 6 3 6 7 5c4-1 11-6 19-11c7-5 10-7 24-21c13-13 44-51 57-61c13-10 16 1 23-1c6-3 11-8 17-11c6-3 13-5 19-6c7-1 14-2 22-1c9 2 22 5 30 9c9 5 16 10 22 16c6 6 13 15 17 18c4 3-5 8 7 2c11-6 46-28 60-36c15-8 18-10 27-11c9-2 23-2 30 0c7 2 11 6 14 9c3 4 5 7 6 9c1 2 2 7-2 6c-4 0-14-9-21-10c-7-1-12-1-22 2c-9 3-25 11-38 19c-13 7-32 20-38 28c-5 6-3 3 3 14c7 10 29 36 37 49c9 14 13 19 16 31c3 12 3 28 2 38c-2 11-6 20-11 24c-5 4-9 7-17 3c-9-3-26-21-32-26c-6-4-3-1-4 0c-2 1-4 3-4 7c0 3 4 9 4 15c0 6 1 14-1 19c-2 6-6 12-13 12c-7-1-18-3-30-12c-11-10-31-34-37-42c-5-9 2-7 4-9c2-1 3-5 10-1c7 4 23 19 30 23c7 4 10 4 11 1c2-3 1-9-1-17c-2-8-11-26-13-33c-2-7 0-7 1-9c1-2 3-4 7-4c3 0 7 1 12 4c5 2 7 4 16 12c10 7 31 30 38 35c8 6 7 3 9-2c2-5 6-19 4-29c-2-10-6-20-15-33c-8-14-27-39-35-49c-8-10-9-9-13-10c-3-2 2-4-6 1c-7 6-15 11-41 31c-26 21-90 73-115 91c-25 19-28 17-36 19c-9 3-13-2-18-5c-4-2-6-6-9-12c-3-6-6-11-7-22c-2-11-1-36-2-43c-2-8-1-3-5-2c-4 2-15 10-21 12c-6 1-11 1-15-2c-4-3-6-9-7-17c0-7 2-21 2-26c-1-5-3-4-4-5c-1-1-3-2-5 0c-2 2-7 3-8 11c-2 9 1 32-1 42c-1 11-4 16-7 21c-3 5-8 7-13 10c-4 3-10 1-16 8c-6 6-15 24-20 30c-4 5-5 4-10 5c-4 1-8 2-18 2c-10-1-31-5-39-6c-8-1-7-1-11 1c-3 2-6 7-7 11c-1 3-1 7 1 11c1 4 3 8 7 13c4 6 15 15 17 19c3 4 3 7 0 8c-3 2-14-2-20 1c-6 2-13 11-18 13c-4 3-4 2-8 3c-5 0-13 0-18-2c-5-1-9-8-12-10c-3-1-4-1-6 0c-1 2-4 4-6 10c-2 7-2 23-4 30c-3 7-6 8-10 11c-4 4-8 8-15 10c-7 2-16-4-28 3c-11 7-27 25-40 38c-12 13-28 30-35 38c-6 9-4 7-4 10c0 4-8-1 2 10c11 12 48 45 61 59c13 14 6 11 17 23c10 12 35 40 45 48c10 7 6 0 12-4c6-4 13-9 24-20c11-11 37-39 43-48c7-10 4 0-2-7c-6-7-20-23-32-33c-11-11-28-24-35-30c-6-7-3-7-3-10c0-2 1-5 4-6c2 0 0-7 12 2c12 9 47 45 59 53c12 9 9 1 13-1c4-2 10-10 14-12c3-2-2-9 10-1c11 8 49 40 61 48c12 9 8 3 10 3c2 0 3-2 4-4c0-1 2 0-1-6c-2-6-11-22-14-30c-3-7 0-7-4-14c-3-7-13-20-15-26c-2-7 1-11 3-12c2-2 3-8 12 0c8 8 32 38 42 47c10 9 11 6 15 6c4 0 5-2 6-7c1-5 1-14 0-20c-1-6-1-11-6-18c-5-6-18-12-21-18c-4-7-2-16-1-22c1-5 5-7 7-10c3-2 3-6 8-2c4 3 15 20 20 24c6 5 5 2 12 2c7-1 24-3 29-7c5-4 4-13 1-19c-3-5-15-10-19-14c-3-5-4-7-4-12c0-4 1-9 3-14c3-4 7-9 10-12c4-3 7-4 10-4c3-1 5-3 8 2c3 5 6 22 12 26c8 5 24 3 30 2c6-1 4-1 6-6c1-4 1-14 4-24c3-10 11-25 15-32c4-8 6-10 10-14c4-3 10-5 15-6c4-1 5-5 12 0c8 6 27 26 34 32c6 5 4 1 6 1c3-1 6 1 8-4c2-5 6-17 3-27c-3-9-14-25-19-32c-5-6-8-3-11-8c-2-4-4-12-5-16c0-4 1-7 3-9c2-1 7-1 11 0c3 1 3 0 10 9c6 8 23 33 29 44c6 10 2 10 6 16c4 6 17 14 21 18c4 5 3 8 3 10c-1 3-1 5-6 5c-5-1-17-8-25-6c-6 3-8 17-17 21c-9 3-26-9-35 0c-8 8-12 41-16 51c-5 10-8 7-12 10c-5 3-13 0-18 7c-4 8-5 27-9 36c-4 9-12 17-16 20c-4 3-5 0-6-2c-1-2-3-2-1-10c1-8 8-31 10-40c1-8 1-9-1-13c-2-4-6-8-11-9c-6-1-18-2-22 2c-5 3-6 7-6 20c0 13 4 43 3 56c0 12-4 17-7 21c-3 4-7 5-10 4c-3 0-7 1-8-7c-1-7 4-28 4-36c0-7-1-7-3-10c-3-2-7-3-11-4c-5 0-11 1-14 3c-3 2-5 2-5 9c-1 8 3 24 3 34c0 9-2 18-5 24c-4 6-8 9-15 10c-7 1-22-9-26-4c-4 4 4 24 3 32c-1 8-6 11-9 13c-4 3-7 2-12 1c-4-2-8-3-17-9c-9-6-24-22-35-28c-11-6-23-7-28-7c-6 1-5 6-5 8c0 3-4-1 3 8c7 9 26 30 36 46c11 16 23 39 30 50c7 10 10 10 12 13c2 3 0 5-1 6c-1 2-3 2-5 1c-1 0 8 13-4-3c-13-16-57-76-71-93c-13-17-7-8-10-10c-3-1 6-10-7 1c-14 11-59 54-71 67c-12 12-3 5-4 8c-1 3-1 4 1 8c1 4 2 6 9 14c7 8 25 26 32 34c6 8 6 11 8 15c1 4 0 10-1 11c-1 2-3 4-6 0c-4-5-7-16-14-26c-8-10-24-26-31-34c-7-7-8-7-11-8c-4-1 4-11-10 1c-15 12-52 45-80 73c-28 27-70 73-90 94c-19 21-18 23-24 33c-6 10-5 22-11 28c-6 7-20 10-23 12ZM693 141c-4-1-18-1-24-3c-6-1-9-4-11-8c-2-5-2-11 0-17c1-6 8-14 11-19c4-4 5-7 9-9c4-2 6-5 14-4c9 1 29 6 36 10c6 4 4 9 4 13c0 5-2 11-5 16c-4 6-9 13-15 16c-6 3-16 4-19 5ZM695 126c3-3 16-11 19-14c3-3 2-5 2-7c-1-2-2-5-6-6c-3-1-13-3-18-2c-4 2-9 6-11 11c-3 4-3 10-1 14c3 2 13 3 15 4ZM967 336c3-1-10 12 16-6c26-19 110-84 137-106c28-21 24-17 28-22c4-6 0-7-3-12c-3-4-10-11-16-16c-5-5-11-10-18-13c-7-2-13-5-25-3c-11 2-31 9-44 16c-12 6-19 11-32 23c-13 12-35 34-46 49c-10 15-14 32-17 42c-3 10-2 14-2 20c1 6 2 13 3 18c2 4 4 7 8 8c3 2 9 1 11 2ZM615 452c2-2 11-6 15-10c5-3 8-3 10-11c2-8 2-29 0-37c-1-8-5-11-8-12c-4-1-9 0-13 4c-4 4-8 11-9 20c-2 10-2 29-2 36c0 7 1 5 2 7c1 2 4 2 5 3ZM1023 500c1-1 6-1 8-7c3-6 5-20 7-29c1-9 1-20 1-25c-1-5-3-6-5-6c-2-1-5-2-8 5c-4 6-11 23-13 33c-2 10-2 20-1 25c2 5 9 3 11 4Z"/></svg>';
  var VERIFY="https://researchmed.in/alliedpath/verify/";
  var UDYAM="UDYAM-JK-20-0018521";
  var FOUNDER={name:"",role:"Founder, AlliedPath",sig:"data:image/svg+xml,"+encodeURIComponent(SIGSVG)};
  var RMLOGO="https://researchmed.in/media/brand/researchmed-logo.webp";
  var TYPES={
    participation:{code:"WEB",label:"Participant",badge:"Participant",sub:"of Participation",lead:"This is to certify that",leftRole:"Resource Person",
      band:"#0B4F4E",hi:"#E9EEF2",mid:"#97A4B0",lo:"#D3DAE0",acc:"#0B6E6C",under:"#AEB8C2",ring:"#F6F9FB",r1:"#14A3A0",r2:"#0B4F4E"},
    completion:{code:"CRS",label:"Student",badge:"Student",sub:"of Completion",lead:"This is to certify that",leftRole:"Course Faculty",
      band:"#0F2A4A",hi:"#E7C66B",mid:"#B8892B",lo:"#E2BD5C",acc:"#8A6516",under:"#C9B27A",ring:"#FFF6DA",r1:"#0B6E6C",r2:"#0F2A4A"},
    appreciation:{code:"SPK",label:"Speaker",badge:"Resource Person",sub:"of Appreciation",lead:"This certificate is proudly presented to",leftRole:"Webinar Coordinator",
      band:"#5A1A2B",hi:"#E7C66B",mid:"#B8892B",lo:"#E2BD5C",acc:"#8A6516",under:"#C9B27A",ring:"#FFF6DA",r1:"#5A1A2B",r2:"#0F2A4A"}
  };
  var e=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  function fmt(iso){if(!iso)return "";var d=new Date(String(iso).length>10?iso:iso+"T00:00:00");return isNaN(d)?String(iso):d.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
  function okImg(s){return typeof s==="string"&&/^data:image\/(png|jpe?g|webp|svg\+xml);base64,[A-Za-z0-9+\/=]+$/.test(s)}

  /* ---------- fonts ---------- */
  var fontsP=null;
  function loadFonts(){
    if(fontsP)return fontsP;
    if(!document.getElementById("apc-fonts")){var l=document.createElement("link");l.id="apc-fonts";l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Inter:wght@400;500;600;700&display=swap";document.head.appendChild(l)}
    fontsP=Promise.all(["700 50px Cinzel","italic 600 60px 'Cormorant Garamond'","500 20px 'Cormorant Garamond'","italic 500 20px 'Cormorant Garamond'","400 12px Inter","600 12px Inter","700 12px Inter"].map(function(f){return document.fonts&&document.fonts.load?document.fonts.load(f).catch(function(){}):null}))
      .then(function(){return document.fonts&&document.fonts.ready}).catch(function(){});
    return fontsP;
  }

  /* ---------- QR ---------- */
  var qrP=null;
  function loadQR(){if(window.qrcode)return Promise.resolve();if(qrP)return qrP;qrP=new Promise(function(res,rej){var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";s.onload=res;s.onerror=function(){qrP=null;rej(new Error("QR library failed to load"))};document.head.appendChild(s)});return qrP}
  function qrSvg(text){
    try{var q=window.qrcode(0,"M");q.addData(text);q.make();var n=q.getModuleCount(),p="";
      for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))p+="M"+c+" "+r+"h1v1h-1z";
      return '<svg width="54" height="54" style="display:block" viewBox="-1 -1 '+(n+2)+' '+(n+2)+'" shape-rendering="crispEdges" aria-hidden="true"><rect x="-1" y="-1" width="'+(n+2)+'" height="'+(n+2)+'" fill="#fff"/><path d="'+p+'" fill="#0b1a30"/></svg>';
    }catch(x){return ""}
  }
  function verifyUrl(id){return VERIFY+"?id="+encodeURIComponent(id)}

  /* ---------- star seal ---------- */
  function starPts(){var o=[];for(var i=0;i<48;i++){var r=i%2?56:66,a=Math.PI*2*i/48-Math.PI/2;o.push((r*Math.cos(a)).toFixed(1)+","+(r*Math.sin(a)).toFixed(1))}return o.join(" ")}
  var STAR=starPts();

  /* ---------- certificate HTML (1123 × 794 px, A4 landscape) ---------- */
  function body(c,T){
    var t='<span style="font-weight:600;font-style:italic;color:#0F2A4A">“'+e(c.title)+'”</span>';
    if(c.type==="completion"){
      var bits=[];if(c.hours)bits.push(e(c.hours)+" hours");if(c.startDate||c.endDate)bits.push(e(fmt(c.startDate))+(c.startDate&&c.endDate?" – ":"")+e(fmt(c.endDate)));
      var s="has successfully completed the AlliedPath online course "+t+(bits.length?" ("+bits.join(", ")+")":"");
      s+=(c.score!==""&&c.score!=null)?" and passed the final assessment with a score of "+e(c.score)+"%.":".";
      return s;
    }
    if(c.type==="appreciation")
      return (c.designation?'<span style="font-style:italic">'+e(c.designation)+'</span>, ':"")+"in grateful recognition of the valuable contribution as Resource Person for the AlliedPath webinar "+t+(c.date?", held online on "+e(fmt(c.date)):"")+".";
    return "has participated in the AlliedPath online webinar "+t+(c.speaker?", delivered by "+e(c.speaker):"")+(c.date?", held on "+e(fmt(c.date)):"")+".";
  }
  function html(c,sigs){
    var T=TYPES[c.type]||TYPES.participation,id=String(c.id||"AP-PREVIEW"),year=String(c.issued||c.date||"").slice(0,4)||String(new Date().getFullYear());
    var G="apg"+Math.random().toString(36).slice(2,8);
    var grad='<linearGradient id="'+G+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+T.hi+'"/><stop offset="0.5" stop-color="'+T.mid+'"/><stop offset="1" stop-color="'+T.lo+'"/></linearGradient>';
    var L=c.left||{},lsig=L.sig&&sigs&&okImg(sigs[L.sig])?sigs[L.sig]:(okImg(L.sigData)?L.sigData:"");
    var left=L.name?'<div style="display:flex;flex-direction:column;align-items:center;width:250px">'+
        (lsig?'<img src="'+lsig+'" alt="" style="height:64px;max-width:220px;width:auto;object-fit:contain;display:block;margin-top:-10px">':'<div style="height:54px"></div>')+
        '<div style="width:220px;height:1px;background:#0F2A4A;margin-top:6px"></div>'+
        '<div style="margin-top:6px;font-family:Inter,sans-serif;font-size:13px;font-weight:700;color:#0F2A4A;text-align:center">'+e(L.name)+'</div>'+
        '<div style="font-family:Inter,sans-serif;font-size:11.5px;color:#4A5A6B;text-align:center">'+e(L.role||T.leftRole)+'</div></div>'
      :'<div style="width:250px"></div>';
    var qr=window.qrcode?qrSvg(verifyUrl(id)):"";
    var batch=c.type==="completion"&&c.batch?'<div style="margin-top:6px;font-family:Inter,sans-serif;font-size:12px;color:#4A5A6B">Batch ID: '+e(c.batch)+'</div>':"";
    var revoked=c.status==="revoked"?'<div style="position:absolute;left:0;top:0;width:1123px;height:794px;display:flex;align-items:center;justify-content:center;pointer-events:none"><div style="transform:rotate(-18deg);border:6px solid #ad322b;color:#ad322b;font-family:Inter,sans-serif;font-weight:800;font-size:72px;letter-spacing:10px;padding:10px 40px;opacity:.55">REVOKED</div></div>':"";
    return '<div class="apcert" style="width:1123px;height:794px;box-sizing:border-box;position:relative;overflow:hidden;background:#FDFBF6;font-family:\'Cormorant Garamond\',Georgia,serif;color:#1E2A38;text-align:left">'+
      '<svg width="1123" height="794" viewBox="0 0 1123 794" style="position:absolute;left:0;top:0" aria-hidden="true"><defs>'+grad+
        '<pattern id="'+G+'p" width="24" height="34" patternUnits="userSpaceOnUse"><rect width="24" height="34" fill="'+T.band+'"/><path d="M0 17 C6 5, 18 5, 24 17 C18 29, 6 29, 0 17 Z" fill="none" stroke="#2BC4BE" stroke-opacity="0.55" stroke-width="0.8"/><path d="M-12 17 C-6 9, 6 9, 12 17 C18 25, 30 25, 36 17" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="0.7"/><path d="M-12 17 C-6 25, 6 25, 12 17 C18 9, 30 9, 36 17" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="0.7"/></pattern>'+
        '<radialGradient id="'+G+'r" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F6F1E6"/></radialGradient></defs>'+
        '<rect x="0" y="0" width="1123" height="794" fill="url(#'+G+'r)"/>'+
        '<path fill-rule="evenodd" fill="url(#'+G+'p)" d="M18 18 H1105 V776 H18 Z M52 52 V742 H1071 V52 Z"/>'+
        '<rect x="18" y="18" width="1087" height="758" fill="none" stroke="url(#'+G+')" stroke-width="3"/>'+
        '<rect x="52" y="52" width="1019" height="690" fill="none" stroke="url(#'+G+')" stroke-width="3"/>'+
        '<rect x="62" y="62" width="999" height="670" fill="none" stroke="'+T.mid+'" stroke-opacity="0.6" stroke-width="1"/>'+
        '<g fill="url(#'+G+')"><path d="M35 23 L47 35 L35 47 L23 35 Z"/><path d="M1088 23 L1100 35 L1088 47 L1076 35 Z"/><path d="M35 747 L47 759 L35 771 L23 759 Z"/><path d="M1088 747 L1100 759 L1088 771 L1076 759 Z"/></g>'+
        '<g fill="none" stroke="'+T.mid+'" stroke-width="1.2"><path d="M62 102 C82 102, 102 82, 102 62"/><path d="M62 92 C76 92, 92 76, 92 62"/><path d="M1061 102 C1041 102, 1021 82, 1021 62"/><path d="M1061 92 C1047 92, 1031 76, 1031 62"/><path d="M62 692 C82 692, 102 712, 102 732"/><path d="M62 702 C76 702, 92 718, 92 732"/><path d="M1061 692 C1041 692, 1021 712, 1021 732"/><path d="M1061 702 C1047 702, 1031 718, 1031 732"/></g>'+
        '<g opacity="0.035" transform="translate(436 285)" fill="#14A3A0"><rect x="94" y="0" width="62" height="250" rx="12"/><rect x="0" y="94" width="250" height="62" rx="12"/></g>'+
      '</svg>'+
      '<div style="position:absolute;left:62px;top:62px;width:999px;height:670px;box-sizing:border-box;padding:20px 70px 92px;display:flex;flex-direction:column;align-items:center">'+
        '<div style="display:flex;flex-direction:row;align-items:center;gap:12px">'+
          '<svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#0b1a30"/><path fill="#2ed3bf" d="M24 9h16a3 3 0 0 1 3 3v12h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H43v12a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3V40H9a3 3 0 0 1-3-3V27a3 3 0 0 1 3-3h12V12a3 3 0 0 1 3-3z"/><path d="M15 50c10-3 15-12 20-22s9-14 13-16" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M42 8l10 2-5 8z" fill="#fff"/></svg>'+
          '<div style="display:flex;flex-direction:column;gap:1px"><div style="font-family:Inter,sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.4px;line-height:1"><span style="color:#0F2A4A">Allied</span><span style="color:#0B6E6C">Path</span></div>'+
          '<div style="font-family:Inter,sans-serif;font-size:10px;font-weight:500;color:#4A5A6B;letter-spacing:2px;text-transform:uppercase">Teach · Mentor · Guide</div></div></div>'+
        '<div style="margin-top:12px;padding:5px 16px;border-radius:999px;background:'+T.band+';border:1.5px solid '+T.mid+';font-family:Inter,sans-serif;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:3px;text-transform:uppercase">'+e(T.badge)+'</div>'+
        '<div style="margin-top:12px;font-family:Cinzel,Georgia,serif;font-size:50px;font-weight:700;color:#0F2A4A;letter-spacing:6px;line-height:1">CERTIFICATE</div>'+
        '<div style="margin-top:8px;display:flex;flex-direction:row;align-items:center;gap:14px">'+
          '<svg width="90" height="12" viewBox="0 0 90 12" aria-hidden="true"><path d="M0 6 H74" stroke="'+T.mid+'" stroke-width="1.2"/><path d="M80 1 L85 6 L80 11 L75 6 Z" fill="'+T.mid+'"/></svg>'+
          '<div style="font-size:26px;font-style:italic;font-weight:600;color:'+T.acc+';letter-spacing:0.5px">'+e(T.sub)+'</div>'+
          '<svg width="90" height="12" viewBox="0 0 90 12" aria-hidden="true"><path d="M16 6 H90" stroke="'+T.mid+'" stroke-width="1.2"/><path d="M10 1 L15 6 L10 11 L5 6 Z" fill="'+T.mid+'"/></svg></div>'+
        '<div style="margin-top:18px;font-size:19px;font-style:italic;color:#4A5A6B">'+e(T.lead)+'</div>'+
        '<div style="margin-top:2px;font-size:'+(String(c.name||"").length>30?48:58)+'px;font-style:italic;font-weight:600;color:#0F2A4A;line-height:1.15;min-width:560px;max-width:860px;text-align:center;padding-bottom:2px;border-bottom:1px solid '+T.under+'">'+e(c.name)+'</div>'+
        '<div style="margin-top:12px;max-width:780px;font-size:20px;line-height:1.5;color:#2C3A49;text-align:center">'+body(c,T)+'</div>'+batch+
        '<div style="flex-grow:1"></div>'+
        '<div style="width:100%;display:flex;flex-direction:row;justify-content:space-between;align-items:flex-end">'+left+
          '<svg width="128" height="143" viewBox="0 0 150 168" aria-hidden="true" style="flex:none"><defs>'+grad.replace('id="'+G+'"','id="'+G+'s"')+'</defs>'+
            '<path d="M48 104 L30 166 L50 154 L62 168 L76 112 Z" fill="'+T.r1+'"/><path d="M102 104 L120 166 L100 154 L88 168 L74 112 Z" fill="'+T.r2+'"/>'+
            '<g transform="translate(75 75)"><polygon points="'+STAR+'" fill="url(#'+G+'s)"/><circle r="46" fill="none" stroke="'+T.ring+'" stroke-width="1.2"/><circle r="40" fill="'+T.band+'"/><circle r="36" fill="none" stroke="'+T.hi+'" stroke-width="1"/>'+
            '<rect x="-5" y="-22" width="10" height="30" rx="2" fill="#2BC4BE"/><rect x="-15" y="-12" width="30" height="10" rx="2" fill="#2BC4BE"/>'+
            '<text x="0" y="25" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" font-weight="700" letter-spacing="2" fill="'+T.hi+'">'+e(year)+'</text></g></svg>'+
          '<div style="display:flex;flex-direction:column;align-items:center;width:250px">'+
            '<img src="'+FOUNDER.sig+'" alt="" style="height:84px;width:auto;display:block;margin-bottom:-2px;margin-top:-24px">'+
            '<div style="width:220px;height:1px;background:#0F2A4A;margin-top:6px"></div>'+
            '<div style="margin-top:6px;font-family:Inter,sans-serif;font-size:13px;font-weight:700;color:#0F2A4A">'+e(FOUNDER.role)+'</div></div></div>'+
        '<div style="position:absolute;left:58px;right:58px;bottom:14px;display:flex;flex-direction:row;justify-content:space-between;align-items:center;font-family:Inter,sans-serif">'+
          '<div style="display:flex;flex-direction:row;align-items:center;gap:10px">'+
            '<div style="width:62px;height:62px;flex:none;box-sizing:border-box;padding:3px;background:#FFFFFF;border:1px solid #DCE5EB;border-radius:4px;display:flex;align-items:center;justify-content:center">'+qr+'</div>'+
            '<div style="display:flex;flex-direction:column;gap:2px;font-size:10.5px;color:#4A5A6B">'+
              '<div><span style="font-weight:600;color:#0F2A4A">Certificate ID:</span> '+e(id)+'</div>'+
              '<div><span style="font-weight:600;color:#0F2A4A">Issued:</span> '+e(fmt(c.issued)||"—")+' · <span style="font-weight:600;color:#0F2A4A">Udyam:</span> '+UDYAM+'</div>'+
              '<div>Verify at researchmed.in/alliedpath/verify</div></div></div>'+
          '<div style="display:flex;flex-direction:row;align-items:center;gap:8px"><div style="font-size:9.5px;font-weight:600;color:#4A5A6B;letter-spacing:1.5px;text-transform:uppercase">Powered by</div>'+
            '<img src="'+RMLOGO+'" alt="ResearchMed.in" style="height:38px;width:auto;display:block"></div></div>'+
      '</div>'+revoked+'</div>';
  }

  /* ---------- preview (scaled to fit a box) ---------- */
  async function mount(box,c,sigs){
    await loadFonts();try{await loadQR()}catch(x){}
    var w=box.clientWidth||600,s=Math.min(1,w/1123);
    box.innerHTML='<div style="width:'+Math.round(1123*s)+'px;height:'+Math.round(794*s)+'px;overflow:hidden;border-radius:6px;box-shadow:0 10px 30px -12px rgba(11,26,48,.45)"><div style="transform:scale('+s+');transform-origin:0 0;width:1123px;height:794px">'+html(c,sigs)+'</div></div>';
  }

  /* ---------- PDF ---------- */
  var libsP=null;
  function addScript(src){return new Promise(function(res,rej){var s=document.createElement("script");s.src=src;s.onload=res;s.onerror=function(){rej(new Error("Couldn't load "+src.split("/").pop()))};document.head.appendChild(s)})}
  function loadLibs(){
    if(window.html2canvas&&window.jspdf)return Promise.resolve();
    if(libsP)return libsP;
    libsP=Promise.all([window.html2canvas?null:addScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
      window.jspdf?null:addScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")]).catch(function(x){libsP=null;throw x});
    return libsP;
  }
  async function canvasOf(c,sigs){
    await Promise.all([loadFonts(),loadLibs(),loadQR().catch(function(){})]);
    var host=document.createElement("div");host.setAttribute("aria-hidden","true");
    host.style.cssText="position:fixed;left:-20000px;top:0;width:1123px;height:794px;z-index:-1;pointer-events:none";
    host.innerHTML=html(c,sigs);document.body.appendChild(host);
    var imgs=[].slice.call(host.querySelectorAll("img"));
    await Promise.all(imgs.map(function(i){return i.complete?null:new Promise(function(r){i.onload=i.onerror=r})}));
    try{return await window.html2canvas(host.firstChild,{scale:2.2,backgroundColor:"#FDFBF6",useCORS:true,logging:false,width:1123,height:794,windowWidth:1400})}
    finally{host.remove()}
  }
  function fileName(c){return "AlliedPath-Certificate-"+String(c.id||"preview")+"-"+String(c.name||"").replace(/[^A-Za-z0-9]+/g,"_").slice(0,40)+".pdf"}
  async function pdfDoc(list,sigs){
    var J=window.jspdf.jsPDF,doc=new J({orientation:"landscape",unit:"mm",format:"a4",compress:true});
    for(var i=0;i<list.length;i++){var cv=await canvasOf(list[i],sigs);if(i)doc.addPage("a4","landscape");doc.addImage(cv.toDataURL("image/jpeg",0.93),"JPEG",0,0,297,210,undefined,"FAST")}
    doc.setProperties({title:list.length===1?"AlliedPath certificate "+(list[0].id||""):"AlliedPath certificates",author:"AlliedPath",creator:"AlliedPath portal"});
    return doc;
  }
  async function downloadPDF(c,sigs){await loadLibs();var doc=await pdfDoc([c],sigs);doc.save(fileName(c))}
  async function downloadMany(list,sigs,name){await loadLibs();var doc=await pdfDoc(list,sigs);doc.save(name||"AlliedPath-Certificates.pdf")}
  async function downloadPNG(c,sigs){var cv=await canvasOf(c,sigs);var a=document.createElement("a");a.href=cv.toDataURL("image/png");a.download=fileName(c).replace(/\.pdf$/,".png");document.body.appendChild(a);a.click();a.remove()}

  window.APCert={TYPES:TYPES,html:html,mount:mount,downloadPDF:downloadPDF,downloadMany:downloadMany,downloadPNG:downloadPNG,verifyUrl:verifyUrl,fmt:fmt,loadFonts:loadFonts,loadQR:loadQR,FOUNDER:FOUNDER};
})();
