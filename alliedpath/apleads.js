/* AlliedPath: send a copy of each website sign-up to the portal (Students & admissions → enquiries).
   Runs alongside the existing email form; if this fails, the email still goes. */
(function(){
  "use strict";
  var KEY="AIzaSyAF0hjr_BWfVuDpYXGDMXcURXNyEvTHJtg";
  var URL="https://firestore.googleapis.com/v1/projects/alliedpath-portal/databases/(default)/documents/leads?documentId=";
  var sent={};
  function clip(s,n){return String(s==null?"":s).replace(/\s+/g," ").trim().slice(0,n)}
  function clipMsg(s,n){return String(s==null?"":s).trim().slice(0,n)}
  function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
  document.addEventListener("submit",function(e){
    var f=e.target;if(!f||f.id!=="ap-form")return;
    try{
      if(f.checkValidity&&!f.checkValidity())return;
      var fd=new FormData(f);if(fd.get("_honey"))return;
      var d={name:clip(fd.get("name"),80),phone:clip(fd.get("phone"),30),email:clip(fd.get("email"),120),country:clip(fd.get("country"),60),
        program:clip(fd.get("program"),120),role:clip(fd.get("role"),40),level:clip(fd.get("level"),80),want:clip(fd.get("want")||"interest",20),
        batch:clip(fd.get("batch"),120),slot:clip(fd.get("slot"),120),message:clipMsg(fd.get("message"),1500),page:clip(location.href,300),at:new Date().toISOString()};
      if(d.name.length<2)return;
      if(d.want!=="seat")d.batch="";
      if(d.want!=="demo")d.slot="";
      var id="w"+d.at.slice(0,10).replace(/-/g,"")+"-"+hash((d.name+"|"+d.phone+"|"+d.email+"|"+d.want).toLowerCase());
      if(sent[id])return;sent[id]=1;
      var fields={};Object.keys(d).forEach(function(k){if(d[k])fields[k]={stringValue:d[k]}});
      fetch(URL+encodeURIComponent(id)+"&key="+KEY,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fields:fields}),keepalive:true}).catch(function(){});
    }catch(err){}
  },true);
})();
