/* AlliedPath FX layer. Decorates each render; never changes data or logic. Everything is wrapped so a failure here can't break the portal. */
(function(){
  "use strict";
  if(window.__apfx)return;window.__apfx=true;
  var RM=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var PERIOD=4000;
  var SV=function(p){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>'};
  var ICONS={
    dashboard:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    students:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .6 3.2 2.4 3.6 5.5"/>',
    fees:'<path d="M6 4h12M6 9h12M10 4c5 0 5 10 0 10H6l8 7"/>',
    classes:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    lms:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
    assessments:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 13l2 2 4-4"/>',
    interviews:'<rect x="3" y="6" width="12" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3z"/>',
    attendance:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    mentoring:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',
    placements:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    issues:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    notices:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    faculty:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'
  };
  var ECG='M0 16 H58 L64 16 L68 11 L72 16 L80 16 L85 2 L90 27 L94 11 L98 16 H128 L135 12 L142 16 H200';
  var ecgSvg=function(cls){return '<svg class="fx-ecg '+(cls||"")+'" viewBox="0 0 200 28" preserveAspectRatio="none" aria-hidden="true"><path d="'+ECG+'"/></svg>'};
  var CROSS='<svg viewBox="0 0 40 40"><path fill="currentColor" d="M15 4h10v11h11v10H25v11H15V25H4V15h11z"/></svg>';
  var SPARKS=[
    "Every great OT professional started exactly where you are today.",
    "Ask one question today that you were nervous to ask.",
    "Practise one skill until it feels easy. That is how mastery starts.",
    "Your patients won't see how hard you studied, but they will feel it.",
    "Show up, stay curious, keep notes.",
    "Confidence is preparation that people can see.",
    "A calm hand in theatre comes from many practice runs.",
    "Revise for 20 minutes today. Small steps add up.",
    "Teach a friend what you learned today. You'll remember it twice as well.",
    "Mistakes in practice are lessons. Make them here, not in the OT."
  ];
  var WORDS=["classes","notes","tests","mock interviews","mentoring","placements"];

  /* ---- ambient sky, created once outside #app ---- */
  function sky(){
    if(document.querySelector(".fx-sky"))return;
    var d=document.createElement("div");d.className="fx-sky";d.setAttribute("aria-hidden","true");
    var h='<i class="orb o1"></i><i class="orb o2"></i><i class="orb o3"></i>';
    var xs=[[6,24,0],[18,30,-7],[33,20,-15],[52,34,-3],[67,26,-11],[81,28,-19],[92,22,-5]];
    xs.forEach(function(x,i){h+='<span class="x" style="left:'+x[0]+'%;--d:'+x[1]+'s;--dl:'+x[2]+'s;width:'+(16+i%3*8)+'px;height:'+(16+i%3*8)+'px">'+CROSS+'</span>'});
    d.innerHTML=h;document.body.insertBefore(d,document.body.firstChild);
  }

  /* ---- phase lock: loops continue seamlessly across re-renders ---- */
  function phase(){document.documentElement.style.setProperty("--fx-p",(-(Date.now()%PERIOD))+"ms")}

  /* ---- number count-up for KPI values like 12, ₹4,500, 85% ---- */
  function countUp(el){
    var txt=(el.textContent||"").trim();var m=txt.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
    if(!m)return;var end=Number(m[2].replace(/,/g,""));if(!isFinite(end)||end===0||Math.abs(end)>1e9)return;
    var dec=(m[2].split(".")[1]||"").length,t0=performance.now(),dur=1000;
    var fmt=function(v){return m[1]+(dec?v.toFixed(dec):Math.round(v).toLocaleString("en-IN"))+m[3]};
    el.textContent=fmt(0);
    (function step(now){var k=Math.min(1,(now-t0)/dur);el.textContent=fmt(end*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step);else el.textContent=txt})(t0);
  }

  /* ---- after every render ---- */
  var lastBig=null,rotTimer=null;
  function decorate(){
    var app=document.getElementById("app");if(!app)return;
    var entered=app.classList.contains("enter");
    var staff=!!app.querySelector(".app .side"),student=!!app.querySelector(".sp-main"),sign=!!app.querySelector('[data-act="signIn"]');
    var b=document.body.classList;b.toggle("fx-staff",staff);b.toggle("fx-student",student&&!staff);b.toggle("fx-sign",sign);

    /* sidebar icons + heartbeat */
    app.querySelectorAll('.nav button[data-arg]').forEach(function(btn){
      var k=btn.getAttribute("data-arg"),s=btn.firstElementChild;
      if(ICONS[k]&&s&&!s.querySelector(".fx-ic"))s.insertAdjacentHTML("afterbegin",'<i class="fx-ic">'+SV(ICONS[k])+'</i>');
    });
    var brand=app.querySelector(".side .brand");
    if(brand&&!app.querySelector(".fx-side-ecg"))brand.insertAdjacentHTML("afterend",ecgSvg("fx-side-ecg"));

    /* greeting with time-of-day icon */
    var h1=app.querySelector(".head h1");
    if(h1&&/^Good (morning|afternoon|evening)/.test(h1.textContent)&&!h1.querySelector(".fx-tod")){
      var hr=new Date().getHours(),night=hr>=18||hr<5;
      var icon=night?SV('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="#f5c451" stroke="#e0a92e" stroke-width="1"/>')
        :SV('<circle cx="12" cy="12" r="4.5" fill="#f5b63c"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" stroke="#f5b63c" stroke-width="2" stroke-linecap="round"/>');
      h1.insertAdjacentHTML("afterbegin",'<span class="fx-tod '+(night?"moon":"sun")+'">'+icon+'</span>');
    }

    /* loading states get a heartbeat */
    app.querySelectorAll(".empty").forEach(function(e){
      var t=e.textContent||"";if(/^\s*(Loading|Opening)/.test(t)&&!e.querySelector(".fx-loader"))e.insertAdjacentHTML("afterbegin",'<svg class="fx-loader" viewBox="0 0 120 40" aria-hidden="true"><path d="M0 22 H34 L40 22 L44 16 L48 22 L54 22 L59 4 L64 36 L68 16 L72 22 H120"/></svg>');
    });

    /* sign-in screen */
    if(sign){
      var panel=app.querySelector(".splash .panel"),p=panel&&panel.querySelector("h2+p");
      var sb=panel&&panel.querySelector(".brand");
      if(sb&&!panel.querySelector(".fx-ecg"))sb.insertAdjacentHTML("afterend",'<div style="max-width:220px;margin:-8px auto 10px">'+ecgSvg()+'</div>');
      if(p&&!panel.querySelector(".fx-pitch")){
        p.insertAdjacentHTML("afterend",'<p class="fx-pitch">Your <span class="fx-rot">'+WORDS[0]+'</span>, all in one place.</p><div class="fx-feats"><span>Live classes</span><span>Notes &amp; videos</span><span>MCQ tests</span><span>Mock interviews</span><span>Progress</span></div>');
      }
      if(!rotTimer&&!RM){var i=0;rotTimer=setInterval(function(){var r=document.querySelector(".fx-rot");if(!r){clearInterval(rotTimer);rotTimer=null;return}i=(i+1)%WORDS.length;r.textContent=WORDS[i];r.classList.remove("flip");void r.offsetWidth;r.classList.add("flip")},2200)}
    }

    /* student hero: heartbeat across the hero + daily spark */
    var hero=app.querySelector(".hero");
    if(hero&&!hero.querySelector(".fx-ecg"))hero.insertAdjacentHTML("beforeend",ecgSvg());
    var heroText=hero&&hero.querySelector(".hero-in>div:first-child");
    if(heroText&&!heroText.querySelector(".fx-spark")&&app.querySelector(".idcard")){
      var day=Math.floor(Date.now()/864e5);
      heroText.insertAdjacentHTML("beforeend",'<div class="fx-spark"><b>&#10022;</b><span>'+SPARKS[day%SPARKS.length]+'</span></div>');
    }

    if(entered){
      app.querySelectorAll(".kpi .v").forEach(function(v){if(!RM&&!v.querySelector("[data-count]"))countUp(v)});
      app.querySelectorAll(".tablewrap tbody").forEach(function(tb){Array.prototype.forEach.call(tb.children,function(tr,i){tr.style.setProperty("--r",i)})});
      app.querySelectorAll(".list").forEach(function(l){Array.prototype.forEach.call(l.children,function(li,i){li.style.setProperty("--r",i)})});
      app.querySelectorAll(".cards").forEach(function(l){Array.prototype.forEach.call(l.children,function(c,i){c.style.setProperty("--r",i)})});
    }

    /* big celebration for an excellent test score */
    var done=app.querySelector(".done-check");
    if(done){var key=(app.textContent.match(/Your score\s*([\d\s\/]+)/)||[])[1]||"x";
      if(/Excellent work!/.test(app.textContent)&&lastBig!==key){lastBig=key;setTimeout(function(){confetti(220,true)},450)}}
    else lastBig=null;
  }

  /* ---- confetti ---- */
  var COLORS=["#2ed3bf","#14a096","#4f8df0","#f0b24f","#ffffff","#ee7f75"];
  function confetti(n,big){
    if(RM)return;
    var c=document.createElement("canvas");c.className="fx-confetti";document.body.appendChild(c);
    var dpr=Math.min(2,window.devicePixelRatio||1),W=innerWidth,H=innerHeight;c.width=W*dpr;c.height=H*dpr;
    var g=c.getContext("2d");g.scale(dpr,dpr);
    var ps=[],ox=W/2,oy=big?H*0.42:H-70;
    for(var i=0;i<n;i++){var a=big?Math.random()*Math.PI*2:(-Math.PI/2+(Math.random()-.5)*1.6),sp=(big?6:5)+Math.random()*(big?9:6);
      ps.push({x:ox,y:oy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(big?3:2),s:5+Math.random()*6,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:COLORS[i%COLORS.length],cross:i%5===0,life:0})}
    var t0=performance.now(),dur=big?2600:1700;
    (function frame(now){var k=(now-t0)/dur;g.clearRect(0,0,W,H);
      ps.forEach(function(p){p.vy+=.22;p.vx*=.985;p.vy*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;
        g.save();g.globalAlpha=Math.max(0,1-k*k);g.translate(p.x,p.y);g.rotate(p.r);g.fillStyle=p.c;
        if(p.cross){var u=p.s/3;g.fillRect(-u/2,-p.s/2,u,p.s);g.fillRect(-p.s/2,-u/2,p.s,u)}else g.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);g.restore()});
      if(k<1)requestAnimationFrame(frame);else c.remove()})(t0);
  }
  window.AP_confetti=confetti;

  /* ---- hook render and toast (global functions in the portal script) ---- */
  function hook(){
    if(typeof window.render==="function"&&!window.render.__fx){
      var r=window.render;window.render=function(){phase();var out=r.apply(this,arguments);try{decorate()}catch(e){}return out};window.render.__fx=true;
    }
    if(typeof window.toast==="function"&&!window.toast.__fx){
      var t=window.toast;window.toast=function(msg){var out=t.apply(this,arguments);try{
        var el=document.getElementById("toast"),s=String(msg||"");
        var ok=/(saved|added|approved|submitted|access given|recorded|imported|created|published|booked|sent|linked|updated|marked|copied|scheduled|paid)/i.test(s)&&!/(fail|error|couldn|can't|cannot|not |removed|cancel|delet|declin|reject)/i.test(s);
        if(el)el.classList.toggle("fx-ok",ok);
        if(ok&&/(approved|access given|linked|published|submitted|booked|paid|imported)/i.test(s))confetti(90,false);
      }catch(e){}return out};window.toast.__fx=true;
    }
  }

  /* ---- pointer effects: spotlight, tilt, ripple ---- */
  var SPOT=".kpi,.panel,.card,.hc,.lcard,.qcard,.sess,.fcard,.tablewrap";
  var tiltEl=null,raf=0,last=null;
  function onMove(e){last=e;if(raf)return;raf=requestAnimationFrame(function(){raf=0;var ev=last;if(!ev||!ev.target||!ev.target.closest)return;
    var sp=ev.target.closest(SPOT);if(sp){var r=sp.getBoundingClientRect();sp.style.setProperty("--mx",(ev.clientX-r.left)+"px");sp.style.setProperty("--my",(ev.clientY-r.top)+"px")}
    var t=RM?null:ev.target.closest(".idcard,.fcard");
    if(tiltEl&&tiltEl!==t){tiltEl.style.transform="";tiltEl.classList.remove("fx-tilting");tiltEl=null}
    if(t&&ev.pointerType!=="touch"){var q=t.getBoundingClientRect(),x=(ev.clientX-q.left)/q.width-.5,y=(ev.clientY-q.top)/q.height-.5,m=t.classList.contains("idcard")?12:8;
      t.classList.add("fx-tilting");t.style.transform="perspective(800px) rotateX("+(-y*m).toFixed(2)+"deg) rotateY("+(x*m).toFixed(2)+"deg) translateY(-4px)";tiltEl=t}
  })}
  function onLeave(){if(tiltEl){tiltEl.style.transform="";tiltEl.classList.remove("fx-tilting");tiltEl=null}}
  function onDown(e){if(RM||!e.target||!e.target.closest)return;var b=e.target.closest(".btn,.chip,.stabs button,.nav button,.opt,.slotbtn,.idcopy");if(!b||b.disabled)return;
    var r=b.getBoundingClientRect(),s=Math.max(r.width,r.height)*2.2,sp=document.createElement("span");sp.className="fx-ripple";
    sp.style.cssText="width:"+s+"px;height:"+s+"px;left:"+(e.clientX-r.left-s/2)+"px;top:"+(e.clientY-r.top-s/2)+"px";b.appendChild(sp);setTimeout(function(){sp.remove()},650)}

  function init(){
    try{sky();hook();phase();decorate()}catch(e){}
    document.addEventListener("pointermove",onMove,{passive:true});
    document.addEventListener("pointerleave",onLeave);
    document.addEventListener("pointerdown",onDown,{passive:true});
    setTimeout(hook,0);setTimeout(hook,1500);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
