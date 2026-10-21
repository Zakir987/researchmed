/* AlliedPath portal: turn website sign-ups (the "leads" collection) into student enquiries.
   Runs whenever an owner or faculty member has the portal open. Each lead becomes one enquiry, then the lead is removed. */
(function(){
  "use strict";
  var WANTS={interest:"Registered interest",demo:"Asked for a free demo class",seat:"Asked to reserve a seat",doubt:"Asked a doubt"};
  var busy={},started=false;
  function localDate(iso){var d=new Date(iso);if(isNaN(d))d=new Date();return d.toLocaleDateString("en-CA")}
  function toStudent(L){
    var lines=["From the website form: "+(WANTS[L.want]||"Registered interest")+"."];
    if(L.batch)lines.push("Batch: "+L.batch);
    if(L.slot)lines.push("Preferred demo time: "+L.slot);
    if(L.message)lines.push("Message: "+L.message);
    var at=L.at||new Date().toISOString();
    return {name:L.name||"Website enquiry",phone:L.phone||"",email:L.email||"",
      qualification:[L.role,L.level].filter(Boolean).join(" · "),city:"",country:L.country||"India",
      program:L.program||"",status:"enquiry",source:"website",enquiryDate:localDate(at),
      notes:lines.join("\n"),createdAt:at,updatedAt:new Date().toISOString()};
  }
  async function handle(fs,doc){
    var id=doc.id;if(busy[id])return;busy[id]=true;
    try{
      var sid="web-"+id,L=doc.data()||{};
      if(!(S.students&&S.students[sid])){
        var ref=fs.doc("students/"+sid),cur=await ref.get();
        if(!cur.exists){await ref.set(toStudent(L));try{toast("New website enquiry: "+(L.name||"someone"))}catch(e){}}
      }
      await fs.doc("leads/"+id).delete();
    }catch(e){busy[id]=false}
  }
  function start(){
    if(started)return;
    try{if(typeof isStaff!=="function"||!isStaff()||typeof db==="undefined"||!db||typeof loaded==="undefined"||loaded<expected)return}catch(e){return}
    started=true;
    var fs=firebase.firestore();
    fs.collection("leads").onSnapshot(function(snap){snap.docs.forEach(function(d){handle(fs,d)})},function(){started=false});
  }
  setInterval(start,3000);
})();
