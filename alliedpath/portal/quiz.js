/* AlliedPath portal: smart question import for tests.
   Accepts questions pasted from Word, PDF, ChatGPT, WhatsApp, Excel/Google Sheets, or a .docx/.txt/.csv file,
   shows a live preview, and lets faculty tap the correct option to fix anything it could not work out. */
(function(){
  "use strict";
  var L="ABCDEF";

  /* ---------- cleaning ---------- */
  function clean(t){
    return String(t||"").replace(/\r\n?/g,"\n").replace(/[   ]/g," ").replace(/[‘’ʼ]/g,"'").replace(/[“”]/g,'"')
      .replace(/[–—−]/g,"-").replace(/…/g,"...").replace(/\*\*|__/g,"").replace(/\*([^*\n]+)\*/g,"$1").replace(/^#{1,6}\s+/gm,"").replace(/\t+$/gm,"");
  }
  var tidy=function(s){return String(s||"").replace(/\s+/g," ").trim()};
  var norm=function(s){return tidy(s).toLowerCase().replace(/[^a-z0-9%]+/g," ").trim()};
  var MARK=/\s*(?:\(\s*(?:correct|right|ans(?:wer)?)\s*\)|\[\s*(?:correct|right|ans(?:wer)?)\s*\]|[✓✔✅☑]|\s\*+)\s*$/i;
  var MARK_LEAD=/^\s*(?:[✓✔✅☑]|\*+)\s*/;
  var BULLET=/^\s*(?:[•●○◦▪▫■□➢➤►▶·]|-(?=\s))\s*/;

  /* ---------- answer value → option index ---------- */
  function answerIndex(val,opts){
    var v=tidy(val).replace(/^(?:is|=|:|-)\s*/i,"");if(!v)return -1;
    var m=v.match(/^(?:option\s*)?[\(\[]?([a-f])[\)\]\.:,]?(?:\s|$)/i);if(m)return L.indexOf(m[1].toUpperCase());
    m=v.match(/^(?:option\s*)?[\(\[]?([1-6])[\)\]\.:,]?(?:\s|$)/i);if(m&&opts.length>=Number(m[1]))return Number(m[1])-1;
    var nv=norm(v);if(!nv)return -1;
    for(var i=0;i<opts.length;i++)if(norm(opts[i])===nv)return i;
    for(i=0;i<opts.length;i++){var no=norm(opts[i]);if(no&&(nv.indexOf(no)===0||no.indexOf(nv)===0))return i}
    return -1;
  }

  /* ---------- spreadsheet rows (Excel / Google Sheets / CSV) ---------- */
  function splitCSV(line){var out=[],cur="",q=false;for(var i=0;i<line.length;i++){var c=line[i];if(q){if(c=='"'&&line[i+1]=='"'){cur+='"';i++}else if(c=='"')q=false;else cur+=c}else if(c=='"')q=true;else if(c==","){out.push(cur);cur=""}else cur+=c}out.push(cur);return out}
  function tableRows(lines){
    var tabbed=lines.filter(function(l){return (l.match(/\t/g)||[]).length>=2}).length;
    var csv=!tabbed&&lines.length>1&&/question/i.test(lines[0])&&lines[0].split(",").length>=4;
    if(!(tabbed>=Math.max(1,lines.length*0.6))&&!csv)return null;
    var rows=lines.map(function(l){return (csv?splitCSV(l):l.split("\t")).map(tidy)}).filter(function(r){return r.some(Boolean)});
    if(!rows.length)return null;
    var head=rows[0].map(function(c){return c.toLowerCase()}),hasHead=head.some(function(c){return /question|option|answer|correct|explan/.test(c)})||(head.indexOf("a")>=0&&head.indexOf("b")>=0);
    var qi=0,ai=-1,ei=-1,oi=[];
    if(hasHead){head.forEach(function(c,i){if(/question|^q$/.test(c))qi=i;else if(/answer|correct|key/.test(c))ai=i;else if(/explan|rationale|reason|solution/.test(c))ei=i;else if(/^(option|opt)|^[a-f]$|^\(?[a-f]\)$/.test(c))oi.push(i)});rows=rows.slice(1)}
    var out=[];
    rows.forEach(function(r,n){
      var o,a=-1,e="";
      if(hasHead&&oi.length){o=oi.map(function(i){return r[i]||""}).filter(Boolean);a=ai>=0?answerIndex(r[ai],o):-1;e=ei>=0?(r[ei]||""):""}
      else{var cells=r.slice(0);if(/^(?:q(?:uestion)?\s*)?\d+[\.\)]?$/i.test(cells[0])&&cells.length>3)cells.shift();
        var q0=cells[0];o=[];var rest=cells.slice(1);
        for(var i=0;i<rest.length;i++){var c=rest[i];if(o.length>=2&&a<0&&answerIndex(c,o)>=0&&(c.length<=3||i>=rest.length-2)){a=answerIndex(c,o);e=rest.slice(i+1).filter(Boolean).join(" ");break}if(c)o.push(c)}
        return out.push({q:q0,opts:o,ans:a,exp:e,line:n+1});}
      out.push({q:r[qi]||"",opts:o,ans:a,exp:e,line:n+1});
    });
    return out.filter(function(x){return x.q});
  }

  /* ---------- the main parser ---------- */
  function smartParse(text){
    var lines=clean(text).split("\n");
    var nonEmpty=lines.filter(function(l){return l.trim()});
    var t=tableRows(nonEmpty);if(t&&t.length)return finalize(t,[]);

    var out=[],cur=null,last=null,gap=false,keyMode=false,keys={};
    function start(q,ln){finish();cur={q:q,opts:[],ans:-1,exp:"",line:ln,parts:[q]};last="q"}
    function finish(){if(cur){out.push(cur)}cur=null;last=null}
    function addOpt(txt){var s=txt;if(MARK.test(s)||MARK_LEAD.test(s)){s=s.replace(MARK,"").replace(MARK_LEAD,"");cur.ans=cur.opts.length}cur.opts.push(tidy(s));last="o"}
    function inlineOpts(s){
      var re=/(?:^|\s)[\(\[]?([a-fA-F])[\)\]\.:]\s+/g,m,hits=[];
      while((m=re.exec(s))){var idx=m.index+(m[0].match(/^\s/)?1:0);hits.push({l:m[1].toUpperCase(),i:idx,e:re.lastIndex})}
      var seq=[];for(var k=0;k<hits.length;k++){if(hits[k].l===L[seq.length])seq.push(hits[k])}
      if(seq.length<2)return null;
      return {head:s.slice(0,seq[0].i).trim(),opts:seq.map(function(h,j){return s.slice(h.e,j+1<seq.length?seq[j+1].i:s.length).trim()})};
    }
    function readKeys(s){var re=/(\d{1,3})\s*[\.\)\-:=]?\s*\(?([a-fA-F])\)?(?![a-z])/g,m,n=0;while((m=re.exec(s))){keys[Number(m[1])]=L.indexOf(m[2].toUpperCase());n++}return n}

    lines.forEach(function(raw,ix){
      var ln=ix+1,l=raw.replace(BULLET,"").trim();
      if(!l){gap=true;return}
      var m;
      if(/^(?:answer\s*key|answers?\s*(?:key|sheet)?|key|solutions?)\s*[:\-]?\s*$/i.test(l)){finish();keyMode=true;return}
      if(keyMode){if(readKeys(l))return;keyMode=false}
      if(/^(?:answers?|key)\s*[:\-]\s*\d/i.test(l)&&readKeys(l.replace(/^[^:\-]*[:\-]/,""))>=2){finish();return}

      /* answer line */
      if((m=l.match(/^(?:the\s+)?(?:correct\s+|right\s+)?(?:ans(?:wer)?s?|correct(?:\s*option)?|key)\b\.?\s*(?:is)?\s*[:.\-=)]*\s*(.+)$/i))&&cur){
        var a=answerIndex(m[1],cur.opts);
        if(a>=0){cur.ans=a;var after=tidy(m[1]).replace(/^(?:is\s+)?(?:option\s*)?[\(\[]?[a-f1-6][\)\]\.:,]?\s*/i,"");if(cur.opts[a]&&norm(after).indexOf(norm(cur.opts[a]))===0)after=after.slice(cur.opts[a].length);after=after.replace(/^[\s\-:,.)]+/,"");if(after&&/because|as |since|explan/i.test(after)){after=after.replace(/^(?:explanation|because)\s*[:\-]?\s*/i,"");cur.exp=after.charAt(0).toUpperCase()+after.slice(1)}}
        else cur.pendingAns=m[1];
        last="a";gap=false;return;
      }
      /* explanation */
      if((m=l.match(/^(?:exp(?:l(?:anation)?)?|rationale|reason(?:ing)?|solution|why)\s*[:.\-]\s*(.*)$/i))&&cur){cur.exp=m[1];last="e";gap=false;return}

      /* numbered question */
      if((m=l.match(/^(?:q(?:ues(?:tion)?)?\s*\.?\s*)?\(?(\d{1,3})\s*[\.\):\-]\s*(.+)$/i))||(m=l.match(/^q(?:ues(?:tion)?)?\s*\.?\s*(\d{1,3})\s+(.+)$/i))){
        var body=m[2].replace(/\s*[\(\[]\s*\d+\s*marks?\s*[\)\]]\s*$/i,"");
        var io=inlineOpts(body);
        start(io&&io.head?io.head:body,ln);
        if(io&&io.head)io.opts.forEach(addOpt);
        gap=false;return;
      }
      if((m=l.match(/^q(?:uestion)?\s*[:.\-]\s*(.+)$/i))){start(m[1],ln);gap=false;return}

      /* option */
      if(cur&&(m=l.match(/^(?:option|opt)?\s*[\(\[]?([a-fA-F])[\)\]\.:\-]\s*(.+)$/))&&L.indexOf(m[1].toUpperCase())===cur.opts.length&&(cur.opts.length>0||/^[\(\[]?[aA][\)\]\.:\-]/.test(l)||/^(option|opt)/i.test(l))){
        var io2=inlineOpts(l);if(io2&&io2.opts.length>1&&!io2.head){io2.opts.forEach(addOpt)}else addOpt(m[2]);gap=false;return;
      }
      if(cur&&(m=l.match(/^(?:option|opt)\s*([1-6])\s*[\.\):\-]?\s*(.+)$/i))&&Number(m[1])===cur.opts.length+1){addOpt(m[2]);gap=false;return}
      if(cur&&(m=l.match(/^\(?(i{1,3}|iv|v|vi)\)\s+(.+)$/i))){addOpt(m[2]);gap=false;return}
      if(cur&&cur.opts.length===0){var io3=inlineOpts(l);if(io3&&!io3.head){io3.opts.forEach(addOpt);gap=false;return}}

      /* new unnumbered question after a finished one */
      if(!cur||(gap&&(cur.opts.length>=2||(cur.opts.length===0&&cur.parts.length>=3)))||(cur.opts.length>=2&&cur.ans>=0&&last!=="e")){start(l,ln);gap=false;return}

      /* continuation */
      if(last==="q"){cur.parts.push(l)}
      else if(last==="o"){if(gap&&cur.opts.length>=2){start(l,ln)}else cur.opts[cur.opts.length-1]+=" "+l}
      else if(last==="e"||last==="a")cur.exp+=(cur.exp?" ":"")+l;
      gap=false;
    });
    finish();
    return finalize(out,keys);
  }

  function finalize(list,keys){
    var qs=list.map(function(c,i){
      var parts=c.parts||[c.q],opts=c.opts.slice(),ans=c.ans;
      if(!opts.length&&parts.length>=3){
        var qi=-1;for(var k=0;k<parts.length-2;k++)if(/[?:]\s*$/.test(parts[k]))qi=k;
        if(qi<0)qi=0;var cand=parts.slice(qi+1);
        if(cand.length>=2&&cand.length<=6){opts=cand.map(function(s){var t=s;if(MARK.test(t)||MARK_LEAD.test(t)){t=t.replace(MARK,"").replace(MARK_LEAD,"");ans=cand.indexOf(s)}return tidy(t)});parts=parts.slice(0,qi+1)}
      }
      var q={q:parts.map(tidy).join("\n").trim(),opts:opts.map(tidy).filter(Boolean).slice(0,6),ans:ans,exp:tidy(c.exp),line:c.line};
      if(q.ans<0&&c.pendingAns)q.ans=answerIndex(c.pendingAns,q.opts);
      if(q.ans<0&&keys&&keys[i+1]!=null)q.ans=keys[i+1];
      if(q.ans>=q.opts.length)q.ans=-1;
      return q;
    }).filter(function(q){
      if(!q.q&&!q.opts.length)return false;
      if(!q.opts.length&&q.ans<0&&(/^(section|part|unit|chapter|mcqs?|multiple choice|questions?|answer (the|all)|choose the|select the|instructions?|test|quiz)\b/i.test(q.q)||(/:$/.test(q.q)&&q.q.length<80)))return false;
      return true;
    });
    return qs;
  }

  function problems(qs){var p=[];qs.forEach(function(q,i){if(q.opts.length<2)p.push({i:i,kind:"opts",msg:"Question "+(i+1)+" needs at least two options"});else if(q.ans<0)p.push({i:i,kind:"ans",msg:"Question "+(i+1)+" needs the correct answer"})});return p}
  function toText(qs){return qs.map(function(q,i){return (i+1)+". "+q.q+"\n"+q.opts.map(function(o,j){return L[j]+") "+o}).join("\n")+"\nAnswer: "+(q.ans>=0?L[q.ans]:"")+(q.exp?"\nExplanation: "+q.exp:"")}).join("\n\n")}

  /* ---------- replace the portal's parser ---------- */
  window.AP_smartParse=smartParse;
  window.parseQuestions=function(text){
    var qs=smartParse(text);
    if(!qs.length)throw new Error("No questions found. Paste your questions with their options and answers.");
    if(qs.length>100)throw new Error("Keep a test to 100 questions or fewer.");
    var p=problems(qs);if(p.length)throw new Error(p.slice(0,3).map(function(x){return x.msg}).join(". ")+(p.length>3?" (and "+(p.length-3)+" more)":"")+". Fix them in the preview below the box.");
    return qs;
  };

  /* ---------- live preview inside the Create / Edit test form ---------- */
  var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var css='.qp{grid-column:1/-1;margin-top:-4px;border:1px solid var(--line);border-radius:14px;background:var(--bg);overflow:hidden}'+
    '.qp-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--line);background:var(--surface)}'+
    '.qp-sum{font-weight:600;font-size:.9rem;display:flex;align-items:center;gap:8px}.qp-sum i{width:10px;height:10px;border-radius:50%;background:var(--green);flex:none}.qp-sum.bad i{background:var(--amber)}.qp-sum.none i{background:var(--line)}'+
    '.qp-tools{display:flex;flex-wrap:wrap;gap:6px}.qp-tools .btn{font-size:.82rem;padding:5px 10px}'+
    '.qp-list{max-height:340px;overflow-y:auto;padding:8px 12px 12px;display:flex;flex-direction:column;gap:10px}'+
    '.qp-q{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 12px}.qp-q.warn{border-color:var(--amber);box-shadow:0 0 0 3px var(--amber-soft)}'+
    '.qp-t{font-weight:600;font-size:.92rem;white-space:pre-wrap;margin-bottom:6px}.qp-n{color:var(--muted);margin-right:4px}'+
    '.qp-o{display:flex;flex-direction:column;gap:5px}.qp-o button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;gap:8px;align-items:flex-start;padding:5px 8px;border-radius:9px;border:1px solid var(--line);font-size:.86rem;background:var(--bg)}'+
    '.qp-o button:hover{border-color:var(--scrub)}.qp-o button b{flex:none;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:.72rem;background:var(--sunk)}'+
    '.qp-o button.ok{border-color:var(--green);background:var(--green-soft)}.qp-o button.ok b{background:var(--green);color:var(--surface)}'+
    '.qp-o button:focus-visible{outline:2px solid var(--scrub);outline-offset:1px}'+
    '.qp-w{font-size:.8rem;color:var(--amber);font-weight:600;margin-top:6px}.qp-e{font-size:.8rem;color:var(--muted);margin-top:6px}'+
    '.qp-help{font-size:.8rem;color:var(--muted);padding:0 12px 10px}.qp-help summary{cursor:pointer;color:var(--scrub);font-weight:600}.qp-help pre{white-space:pre-wrap;font-family:var(--mono);font-size:.76rem;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:8px;margin:6px 0 0}';
  function addCss(){if(document.getElementById("qp-css"))return;var s=document.createElement("style");s.id="qp-css";s.textContent=css;document.head.appendChild(s)}

  var state={qs:[],ta:null,box:null,timer:0};
  function render(){
    var box=state.box,ta=state.ta;if(!box||!ta)return;
    var qs=[];try{qs=smartParse(ta.value)}catch(e){qs=[]}
    state.qs=qs;var p=problems(qs),bad={};p.forEach(function(x){bad[x.i]=x});
    var sum=!ta.value.trim()?'<span class="qp-sum none"><i></i>Paste your questions above. Any common format works.</span>'
      :!qs.length?'<span class="qp-sum bad"><i></i>No questions found yet</span>'
      :p.length?'<span class="qp-sum bad"><i></i>'+qs.length+' question'+(qs.length===1?"":"s")+' found · '+p.length+' need'+(p.length===1?"s":"")+' your attention</span>'
      :'<span class="qp-sum"><i></i>'+qs.length+' question'+(qs.length===1?"":"s")+' ready</span>';
    var list=qs.map(function(q,i){var w=bad[i];
      return '<div class="qp-q'+(w?" warn":"")+'"><div class="qp-t"><span class="qp-n">'+(i+1)+'.</span>'+esc(q.q||"(question text missing)")+'</div><div class="qp-o">'+
        q.opts.map(function(o,j){return '<button type="button" data-qp="'+i+'" data-qo="'+j+'" class="'+(q.ans===j?"ok":"")+'" aria-pressed="'+(q.ans===j)+'" title="Mark as the correct answer"><b>'+L[j]+'</b><span>'+esc(o)+'</span></button>'}).join("")+'</div>'+
        (w?'<div class="qp-w">'+(w.kind==="ans"?"Tap the correct option to set the answer.":"Add at least two options under this question.")+'</div>':"")+
        (q.exp?'<div class="qp-e">Explanation: '+esc(q.exp)+'</div>':"")+'</div>'}).join("");
    box.innerHTML='<div class="qp-head">'+sum+'<span class="qp-tools"><button type="button" class="btn" data-qptidy>Tidy the format</button><button type="button" class="btn" data-qpfile>Upload Word / text / CSV</button><input type="file" accept=".docx,.txt,.csv,.tsv,text/plain,text/csv" hidden data-qpin></span></div>'+
      (qs.length?'<div class="qp-list">'+list+'</div>':"")+
      '<details class="qp-help"><summary>Formats it understands</summary><pre>1. What is the normal SpO2?\nA) 70-80%   B) 95-100%   C) 50%   D) 85%\nAnswer: B\nExplanation: Healthy adults read 95-100%.\n\nQ2) Which gas is stored in a black cylinder with white shoulders?\n(a) Oxygen\n(b) Nitrous oxide\n(c) Carbon dioxide\n(d) Air\nAns: (a)\n\nWhich drug reverses opioids?\nNaloxone *\nAtropine\nNeostigmine\n\nAnswer key: 1-B 2-A 3-C\n\nOr copy rows from Excel / Google Sheets:\nQuestion | A | B | C | D | Answer | Explanation</pre>Numbers, letters (A/a/(a)/a.), "Ans", "Correct answer", the option text itself, a * or ✓ after the right option, or an answer key at the end all work.</details>';
  }
  function schedule(){clearTimeout(state.timer);state.timer=setTimeout(render,220)}
  function writeBack(qs){var ta=state.ta;if(!ta)return;ta.value=toText(qs);ta.dispatchEvent(new Event("input",{bubbles:true}));render()}

  function loadScript(src){return new Promise(function(res,rej){if(window.mammoth)return res();var s=document.createElement("script");s.src=src;s.onload=res;s.onerror=function(){rej(new Error("Couldn't load the Word reader. Copy and paste the questions instead."))};document.head.appendChild(s)})}
  async function readFile(f){
    if(/\.docx$/i.test(f.name)){await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");var r=await window.mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()});return r.value}
    if(/\.(pdf|doc|xlsx?)$/i.test(f.name))throw new Error("That file type can't be read here. Open it, copy the questions, and paste them into the box.");
    return await f.text();
  }

  function attach(){
    var ta=document.getElementById("f_qtext");
    if(!ta||ta.__qp)return;ta.__qp=true;addCss();
    var label=ta.closest("label.field"),hint=label&&label.querySelector("small");
    if(hint)hint.textContent=(hint.textContent.indexOf("already taken")>=0?"Students have already taken this test; changing answers won't re-score them. ":"")+"Paste questions in any format: from Word, PDF, ChatGPT, WhatsApp or Excel. Check the preview below, then tap the right option wherever an answer is missing.";
    ta.setAttribute("placeholder","Paste your questions here, for example:\n\n1. Which gas is used as the carrier gas?\nA) Oxygen  B) Nitrogen  C) Helium  D) Argon\nAns: A");
    var box=document.createElement("div");box.className="qp";box.setAttribute("aria-live","polite");
    (label||ta).insertAdjacentElement("afterend",box);
    state.ta=ta;state.box=box;
    ta.addEventListener("input",schedule);
    ta.addEventListener("paste",function(){setTimeout(render,30)});
    box.addEventListener("click",function(e){
      var o=e.target.closest("[data-qo]");
      if(o){e.preventDefault();var qs=smartParse(ta.value),i=Number(o.getAttribute("data-qp")),j=Number(o.getAttribute("data-qo"));if(qs[i]){qs[i].ans=j;writeBack(qs)}return}
      if(e.target.closest("[data-qptidy]")){e.preventDefault();var q2=smartParse(ta.value);if(q2.length)writeBack(q2);return}
      if(e.target.closest("[data-qpfile]")){e.preventDefault();box.querySelector("[data-qpin]").click();return}
    });
    box.addEventListener("change",async function(e){
      var inp=e.target.closest("[data-qpin]");if(!inp||!inp.files||!inp.files[0])return;
      try{var txt=await readFile(inp.files[0]);ta.value=(ta.value.trim()?ta.value.trim()+"\n\n":"")+txt;var qs=smartParse(ta.value);if(qs.length)writeBack(qs);else render()}
      catch(err){try{toast(err.message||"Couldn't read that file.")}catch(x){}}
      inp.value="";
    });
    render();
  }
  var mo=new MutationObserver(function(){if(document.getElementById("f_qtext"))attach()});
  function boot(){var m=document.getElementById("modal");if(m)mo.observe(m,{childList:true,subtree:true});else setTimeout(boot,500)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
