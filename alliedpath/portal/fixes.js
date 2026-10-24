/* AlliedPath portal: reliable sign-out on every device.
   - Sign-out no longer waits on the network: it finishes within ~2 seconds even on a weak mobile connection.
   - Staff and admin get a Sign out button in the phone header (the desktop sidebar footer is hidden on small screens). */
(function(){
  "use strict";
  var busy=false;
  function withTimeout(p,ms){return Promise.race([p,new Promise(function(r){setTimeout(r,ms)})])}
  async function signOutNow(){
    if(busy)return;busy=true;
    try{document.querySelectorAll('[data-act="signOut"]').forEach(function(b){b.textContent="Signing out…";b.setAttribute("aria-busy","true")})}catch(x){}
    try{var a=firebase.auth(),u=a.currentUser;
      if(u)withTimeout(firebase.firestore().doc("presence/"+u.uid).set({q:null,req:null},{merge:true}).catch(function(){}),1200);
      await withTimeout(a.signOut(),2500);
    }catch(x){}
    try{localStorage.removeItem("ap_q_"+((firebase.auth().currentUser||{}).uid||"x"))}catch(x){}
    setTimeout(function(){location.replace(location.pathname+"?signedout="+Date.now())},150);
  }
  window.AP_signOut=signOutNow;
  if(typeof ACT==="object")ACT.signOut=function(){signOutNow()};

  /* clean the address bar after a sign-out */
  try{if(/[?&]signedout=/.test(location.search))history.replaceState(null,"",location.pathname)}catch(x){}

  var css='.so-m{display:none}'+
    '@media (max-width:860px){.side{position:relative}.so-m{display:inline-flex;align-items:center;gap:8px;position:absolute;top:12px;right:max(16px,env(safe-area-inset-right,0px));z-index:3;font:inherit;font-size:.82rem;font-weight:600;color:var(--side-ink);background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:6px 12px 6px 6px;cursor:pointer}'+
    '.so-m img,.so-m i{width:24px;height:24px;border-radius:50%;flex:none;object-fit:cover;background:var(--scrub);color:var(--scrub-ink);display:grid;place-items:center;font-style:normal;font-size:.7rem;font-weight:700}'+
    '.so-m:focus-visible{outline:2px solid var(--brand-teal);outline-offset:2px}.side .brand{padding-right:120px}}'+
    '.sp-top [data-act="signOut"]{padding:8px 4px;min-height:32px}';
  function addCss(){if(document.getElementById("so-css"))return;var s=document.createElement("style");s.id="so-css";s.textContent=css;document.head.appendChild(s)}
  function decorate(){
    var side=document.querySelector("#app .side");if(!side||side.querySelector(".so-m"))return;addCss();
    var m=typeof me!=="undefined"&&me?me:null,ini=m&&m.name?m.name.split(/\s+/).map(function(w){return w[0]}).join("").slice(0,2).toUpperCase():"";
    var b=document.createElement("button");b.type="button";b.className="so-m";b.setAttribute("data-act","signOut");
    b.innerHTML=(m&&m.avatarUrl&&/^https:/.test(m.avatarUrl)?'<img src="'+m.avatarUrl.replace(/"/g,"")+'" alt="" referrerpolicy="no-referrer">':'<i>'+(ini||"•")+'</i>')+'Sign out';
    side.appendChild(b);
  }
  function hook(){
    if(typeof window.render==="function"&&!window.render.__so){var r=window.render;window.render=function(){var o=r.apply(this,arguments);try{decorate()}catch(x){}return o};
      ["__fx","__idc"].forEach(function(k){if(r[k])window.render[k]=true});window.render.__so=true;try{decorate()}catch(x){}}
  }
  addCss();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){hook();setTimeout(hook,1800)});else{hook();setTimeout(hook,1800)}
})();
