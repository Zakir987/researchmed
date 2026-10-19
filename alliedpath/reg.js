/* AlliedPath separate registration forms: student.html (data-ap="student") and faculty.html (data-ap="faculty").
   Sends to the same inbox as the main form (FormSubmit -> content/alliedpath.json email) and fires rmc:lead for visitor alerts. */
(function () {
  "use strict";
  var KIND = document.body.getAttribute("data-ap");
  var f = document.getElementById("reg-form");
  if (!f || (KIND !== "student" && KIND !== "faculty")) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var get = function (n) { return fetch("../content/" + n + ".json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }); };
  var VTZ = ""; try { VTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var S = {};

  Promise.all([get("alliedpath"), get("ap-programs")]).then(function (r) {
    S = r[0] || {};
    var progs = ((r[1] && r[1].items) || []).filter(function (p) { return !p.draft && p.title; }).map(function (p) { return p.title; });
    if (!progs.length) progs = ["Anaesthesia & Operation Theatre Technology"];
    var sel = $("select[name=program]", f);
    if (sel) sel.innerHTML = progs.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("") + "<option>Other allied health program</option>";
    var box = $("#prog-boxes", f);
    if (box) box.innerHTML = progs.concat(["Other allied health program"]).map(function (t, i) { return '<label><input type="checkbox" name="programs" value="' + esc(t) + '"' + (i ? "" : " checked") + "> " + esc(t) + "</label>"; }).join("");
  });
  var tz = $("#tz-note"); if (tz && VTZ) tz.textContent = "Times are in your own time zone (" + VTZ + ").";

  var all = function (name) { return [].slice.call(f.querySelectorAll('input[name="' + name + '"]:checked')).map(function (x) { return x.value; }).join(", ") || "-"; };
  var btn = $("button[type=submit]", f), st = $("#reg-status");

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var needOne = f.querySelector("[data-need-one]");
    if (needOne && !needOne.querySelector("input:checked")) { needOne.querySelector("input").setCustomValidity("Please choose at least one."); } else if (needOne) { needOne.querySelector("input").setCustomValidity(""); }
    if (!f.reportValidity()) return;
    var fd = new FormData(f); if (fd.get("_honey")) return;
    var d = {}; fd.forEach(function (v, k) { if (k !== "programs" && k !== "needs" && k !== "modes") d[k] = String(v).trim(); });
    var first = (d.name || "").split(/\s+/)[0] || "there";
    var ref = (KIND === "student" ? "APS-" : "APF-") + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    var payload, label, info;
    if (KIND === "student") {
      label = "student registration";
      info = "Student · " + (d.program || "") + (d.country ? " · " + d.country : "");
      payload = {
        "Reference": ref, "Registration": "Student", "Name": d.name, "WhatsApp": d.phone, "Country": d.country,
        "Program": d.program, "Course & year": d.level, "College / university": d.college || "-",
        "Wants help with": all("needs"), "Preferred class time": (d.slot || "-") + (VTZ ? " (" + VTZ + ")" : ""),
        "Heard about us": d.source || "-", "Message": d.message || "-", "Consent to contact": "Yes", "Sent from": location.href,
        email: d.email,
        _subject: "AlliedPath student registration " + ref + ": " + d.name + " · " + d.program,
        _autoresponse: "Dear " + first + ",\n\nThank you for registering with AlliedPath (reference " + ref + ").\n\nWe will contact you personally, usually within a day, with batch details and a free demo class.\n\nPlease note: AlliedPath provides teaching and mentoring only and does not issue certificates.\n\nWarm regards,\nAlliedPath by ResearchMed Connect\nhttps://researchmed.in/alliedpath/"
      };
    } else {
      label = "faculty application";
      info = "Faculty · " + (d.qualification || "") + (d.country ? " · " + d.country : "");
      payload = {
        "Reference": ref, "Registration": "Faculty", "Name": d.name, "WhatsApp": d.phone, "Country": d.country,
        "Highest qualification": d.qualification, "Current role & institution": d.current, "Years of experience": d.years,
        "Can teach (programs)": all("programs"), "Subjects": d.subjects, "Would like to": all("modes"),
        "Hours per week": d.hours || "-", "Teaching languages": d.languages || "-", "LinkedIn / CV link": d.link || "-",
        "Short bio": d.bio || "-", "Consent to contact": "Yes", "Sent from": location.href,
        email: d.email,
        _subject: "AlliedPath faculty application " + ref + ": " + d.name + " · " + d.qualification,
        _autoresponse: "Dear " + first + ",\n\nThank you for applying to teach with AlliedPath (reference " + ref + ").\n\nWe will review your details and contact you personally to talk about subjects, schedule and next steps.\n\nWarm regards,\nAlliedPath by ResearchMed Connect\nhttps://researchmed.in/alliedpath/"
      };
    }
    payload._template = "table"; payload._captcha = "false";
    var to = S.email || "info@researchmed.in";
    btn.disabled = true; var bl = btn.textContent; btn.textContent = "Sending…"; st.hidden = true;
    fetch("https://formsubmit.co/ajax/" + to, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || String(j.success) !== "true") throw new Error("send failed"); }); })
      .then(function () {
        document.dispatchEvent(new CustomEvent("rmc:lead", { detail: { kind: "AlliedPath " + label, info: info, name: first } }));
        [].slice.call(f.querySelectorAll("input,select,textarea,button")).forEach(function (el) { el.disabled = true; });
        st.className = "status ok";
        st.innerHTML = "<strong>Thank you, " + esc(first) + "!</strong> " + (KIND === "student" ? "Your registration has reached us" : "Your application has reached us") + " (reference " + ref + "). We'll contact you personally soon, and a confirmation email is on its way.";
        st.hidden = false; btn.textContent = "Sent ✓"; st.scrollIntoView({ block: "nearest" });
      })
      .catch(function () {
        var wa = String(S.whatsapp || "").replace(/\D/g, "");
        st.className = "status err";
        st.innerHTML = "<strong>Sorry, that didn't go through.</strong> Please message us" + (wa ? ' on <a href="https://wa.me/' + wa + '">WhatsApp</a> or' : "") + ' at <a href="mailto:' + esc(to) + '?subject=AlliedPath%20' + encodeURIComponent(label) + '">' + esc(to) + "</a>.";
        st.hidden = false; btn.disabled = false; btn.textContent = bl;
      });
  });
})();
