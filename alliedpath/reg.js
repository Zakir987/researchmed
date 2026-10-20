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

  var QS = new URLSearchParams(location.search);
  var WANTS = { interest: "Register interest", demo: "Book a free demo class", seat: "Reserve a seat in a batch", doubt: "Ask a doubt" };
  var HEADS = { interest: "Join AlliedPath as a student", demo: "Book your free demo class", seat: "Reserve your seat", doubt: "Ask an AlliedPath faculty member" };
  function wantNow() { var r = f.querySelector("input[name=want]:checked"); return r ? r.value : "interest"; }
  function syncWant() {
    var w = wantNow(), msg = f.querySelector("textarea[name=message]"), mt = f.querySelector(".msg-t"), h1 = document.getElementById("reg-h"), btn0 = f.querySelector("button[type=submit]");
    if (msg) { msg.required = w === "doubt"; msg.placeholder = w === "doubt" ? "Type your question here. Add the topic and your course/year if it helps." : ""; }
    if (mt) mt.innerHTML = w === "doubt" ? "Your doubt" : 'Anything else? <span class="opt">(optional)</span>';
    if (h1 && KIND === "student") h1.textContent = HEADS[w] || HEADS.interest;
    if (btn0 && !btn0.disabled) btn0.textContent = w === "demo" ? "Book my free demo" : w === "seat" ? "Reserve my seat" : w === "doubt" ? "Send my doubt" : "Register as a student";
  }
  if (KIND === "student") {
    var w0 = QS.get("want"); var r0 = w0 && f.querySelector('input[name=want][value="' + w0 + '"]'); if (r0) r0.checked = true;
    var bt = (QS.get("batch") || "").slice(0, 120), bn = f.querySelector(".batch-note"), bi = f.querySelector("input[name=batch]");
    if (bt && bi) { bi.value = bt; if (bn) { bn.textContent = "Batch: " + bt; bn.hidden = false; } }
    [].forEach.call(f.querySelectorAll("input[name=want]"), function (x) { x.addEventListener("change", syncWant); });
    syncWant();
  }
  Promise.all([get("alliedpath"), get("ap-programs")]).then(function (r) {
    S = r[0] || {};
    var progs = ((r[1] && r[1].items) || []).filter(function (p) { return !p.draft && p.title; }).map(function (p) { return p.title; });
    if (!progs.length) progs = ["Anaesthesia & Operation Theatre Technology"];
    var sel = $("select[name=program]", f);
    if (sel) sel.innerHTML = progs.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("") + "<option>Other allied health program</option>";
    var qp = QS.get("program"); if (sel && qp) { [].forEach.call(sel.options, function (o) { if (o.textContent.trim().toLowerCase() === qp.trim().toLowerCase()) sel.value = o.value; }); }
    var box = $("#prog-boxes", f);
    if (box) box.innerHTML = progs.concat(["Other allied health program"]).map(function (t, i) { return '<label><input type="checkbox" name="programs" value="' + esc(t) + '"' + (i ? "" : " checked") + "> " + esc(t) + "</label>"; }).join("");
  });
  var tz = $("#tz-note"); if (tz && VTZ) tz.textContent = "Times are in your own time zone (" + VTZ + ").";

  // faculty applications post as a normal upload (files can't go through the JSON endpoint) and come back here with ?sent=REF
  var back = new URLSearchParams(location.search);
  if (KIND === "faculty" && back.get("sent")) {
    var st0 = $("#reg-status"), who = (back.get("n") || "").slice(0, 40);
    if (st0) { st0.className = "status ok"; st0.innerHTML = "<strong>Thank you" + (who ? ", " + esc(who) : "") + "!</strong> Your application, photo and CV have reached us (reference " + esc(back.get("sent").slice(0, 30)) + "). We'll contact you personally soon, and a confirmation email is on its way."; st0.hidden = false; }
    [].slice.call(f.querySelectorAll("input,select,textarea,button")).forEach(function (el) { el.disabled = true; });
    f.classList.add("st-sent");
    setTimeout(function () { if (st0) st0.scrollIntoView({ block: "center" }); document.dispatchEvent(new CustomEvent("rmc:lead", { detail: { kind: "AlliedPath faculty application", info: "Faculty (with photo and CV)", name: who || "someone" } })); }, 2500);
  }
  var photo = f.querySelector("input[name=photo]"), prev = $("#photo-prev");
  if (photo && prev) photo.addEventListener("change", function () {
    var x = photo.files && photo.files[0];
    if (x && /^image\//.test(x.type)) { prev.querySelector("img").src = URL.createObjectURL(x); prev.hidden = false; } else prev.hidden = true;
  });
  var checkFile = function (inp, max, re, what) {
    if (!inp) return true;
    var x = inp.files && inp.files[0]; inp.setCustomValidity("");
    if (!x) return true;
    if (!re.test(x.name)) inp.setCustomValidity("Please choose a " + what + " file.");
    else if (x.size > max * 1048576) inp.setCustomValidity("This file is larger than " + max + " MB. Please choose a smaller one.");
    return true;
  };

  // step by step: each question appears once the one before it is answered
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var units = [], heads = [];
  [].slice.call(f.children).forEach(function (el) {
    if (el.tagName === "H3") { heads.push(el); return; }
    if (el.matches("input[name=_honey], .photo-prev, .status, button[type=submit]")) return;
    var parts = el.classList.contains("row") ? [].slice.call(el.children) : [el];
    parts.forEach(function (u) { units.push({ el: u, row: el !== u ? el : null, head: heads.shift() || null }); });
  });
  var submitBtn = f.querySelector("button[type=submit]");
  var ctrls = function (u) { return [].slice.call(u.el.querySelectorAll("input,select,textarea")); };
  var required = function (u) { return ctrls(u).some(function (c) { return c.required; }) || !!u.el.querySelector("[data-need-one]") || u.el.matches("fieldset:has([data-need-one])"); };
  var valid = function (u) {
    var cs = ctrls(u), need = u.el.querySelector("[data-need-one]");
    if (need && !need.querySelector("input:checked")) return false;
    return cs.every(function (c) { if (c.type === "file") { checkFile(c, c.name === "photo" ? 2 : 5, c.name === "photo" ? /\.(jpe?g|png)$/i : /\.(pdf|docx?)$/i, c.name === "photo" ? "JPG or PNG" : "PDF or Word"); } return c.checkValidity(); });
  };
  // a step counts as answered when it is valid and the person has acted on it
  // (typed and paused, left the field, pressed Enter, picked an option, or tapped OK / Skip)
  units.forEach(function (u, i) {
    u.done = false;
    var cs = ctrls(u), text = cs.some(function (c) { return /^(text|email|tel|url|number|)$/.test(c.type) && c.tagName !== "SELECT" || c.tagName === "TEXTAREA"; });
    var isConsent = u.el.classList.contains("check");
    if (!isConsent) {
      var ok = document.createElement("button"); ok.type = "button"; ok.className = "st-ok";
      ok.textContent = required(u) ? "OK ✓" : "Skip →";
      ok.addEventListener("click", function () { if (valid(u)) commit(i); else { var c = ctrls(u)[0]; f.reportValidity(); if (c) c.focus(); } });
      u.ok = ok; u.el.appendChild(ok);
      var relabel = function () { if (!required(u)) ok.textContent = ctrls(u).some(function (c) { return c.type === "checkbox" ? false : String(c.value || "").trim(); }) ? "OK ✓" : "Skip →"; };
      cs.forEach(function (c) { c.addEventListener("input", relabel); });
    }
    var t = null;
    cs.forEach(function (c) {
      c.addEventListener("input", function () { u.el.classList.toggle("st-good", valid(u)); clearTimeout(t); if (text && c.tagName !== "TEXTAREA" && valid(u) && c.type !== "email") t = setTimeout(function () { commit(i, true); }, 1400); if (c.type === "email" && valid(u) && /\.[a-z]{2,}$/i.test(c.value)) t = setTimeout(function () { commit(i, true); }, 1600); });
      c.addEventListener("change", function () { u.el.classList.toggle("st-good", valid(u)); if (valid(u) && (c.tagName === "SELECT" || c.type === "file" || c.type === "radio" || isConsent || (c.type !== "checkbox" && required(u)))) commit(i); });
      c.addEventListener("keydown", function (e) { if (e.key === "Enter" && c.tagName !== "TEXTAREA") { e.preventDefault(); if (valid(u)) commit(i); else f.reportValidity(); } });
    });
  });
  var bar = document.createElement("div"); bar.className = "st-bar"; bar.innerHTML = '<span class="st-txt"></span><i><b></b></i>';
  f.insertBefore(bar, f.firstChild);
  var total = units.length, shownTo = -1;
  function show(i, focus) {
    for (var k = 0; k <= Math.min(i, total - 1); k++) {
      var u = units[k]; if (!u.el.classList.contains("st-wait")) continue;
      u.el.classList.remove("st-wait"); if (u.row) u.row.classList.remove("st-wait"); if (u.head) u.head.classList.remove("st-wait");
      if (!REDUCE) { u.el.classList.add("st-in"); setTimeout(function (el) { el.classList.remove("st-in"); }.bind(null, u.el), 700); }
    }
    shownTo = Math.max(shownTo, i);
    var last = shownTo >= total - 1;
    submitBtn.classList.toggle("st-wait", !(last && units[total - 1].done));
    var doneN = units.filter(function (u) { return u.done; }).length;
    bar.querySelector("b").style.width = Math.round(doneN / total * 100) + "%";
    bar.querySelector(".st-txt").textContent = doneN >= total ? "All done. Press the button to send." : "Question " + Math.min(shownTo + 1, total) + " of " + total;
    if (focus && units[i] && i > 0) {
      var c = ctrls(units[i]).filter(function (x) { return x.type !== "checkbox" && x.type !== "file"; })[0];
      var r = units[i].el.getBoundingClientRect();
      if (r.bottom > innerHeight - 40) units[i].el.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "center" });
      if (c && !(window.matchMedia && matchMedia("(hover: none)").matches)) setTimeout(function () { try { c.focus({ preventScroll: true }); } catch (e) { c.focus(); } }, 250);
    }
  }
  function commit(i, quiet) {
    var u = units[i]; if (!valid(u)) return;
    u.done = true; u.el.classList.add("st-done");
    var nx = i + 1; while (nx < total && units[nx].done) nx++;
    if (nx >= total) { show(total - 1); submitBtn.classList.remove("st-wait"); if (!quiet) submitBtn.focus({ preventScroll: true }); return; }
    if (nx > shownTo) show(nx, !quiet || document.activeElement === null || u.el.contains(document.activeElement));
    else show(shownTo);
  }
  units.forEach(function (u, i) { if (i > 0) { u.el.classList.add("st-wait"); if (u.row && u.row.firstElementChild === u.el) u.row.classList.add("st-wait"); if (u.head) u.head.classList.add("st-wait"); } });
  if (units[0] && units[0].head) units[0].head.classList.remove("st-wait");
  submitBtn.classList.add("st-wait"); f.classList.add("stepped"); show(0);
  // arriving from a "Book a free demo" / "Reserve a seat" / "Ask a doubt" button: that question is already answered
  if (KIND === "student" && QS.get("want")) { var cw = f.querySelector("input[name=want]:checked"); if (cw) setTimeout(function () { cw.dispatchEvent(new Event("change", { bubbles: true })); }, 60); }
  var showAll = function () { units.forEach(function (u) { u.done = true; }); show(total - 1); submitBtn.classList.remove("st-wait"); };

  var all = function (name) { return [].slice.call(f.querySelectorAll('input[name="' + name + '"]:checked')).map(function (x) { return x.value; }).join(", ") || "-"; };
  var btn = $("button[type=submit]", f), st = $("#reg-status");

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var needOne = f.querySelector("[data-need-one]");
    if (needOne && !needOne.querySelector("input:checked")) { needOne.querySelector("input").setCustomValidity("Please choose at least one."); } else if (needOne) { needOne.querySelector("input").setCustomValidity(""); }
    checkFile(photo, 2, /\.(jpe?g|png)$/i, "JPG or PNG");
    checkFile(f.querySelector("input[name=cv]"), 5, /\.(pdf|docx?)$/i, "PDF or Word");
    if (!f.checkValidity()) { showAll(); f.reportValidity(); return; }
    var fd = new FormData(f); if (fd.get("_honey")) return;
    var d = {}; fd.forEach(function (v, k) { if (k !== "programs" && k !== "needs" && k !== "modes") d[k] = String(v).trim();
    if (KIND === "student" && !d.want) d.want = "interest"; });
    var first = (d.name || "").split(/\s+/)[0] || "there";
    var ref = (KIND === "student" ? "APS-" : "APF-") + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    var payload, label, info;
    if (KIND === "student") {
      var wl = WANTS[d.want] || WANTS.interest;
      label = d.want === "demo" ? "free demo request" : d.want === "seat" ? "seat reservation" : d.want === "doubt" ? "doubt" : "student registration";
      info = "Student · " + wl + " · " + (d.program || "") + (d.country ? " · " + d.country : "");
      payload = {
        "Reference": ref, "Registration": "Student", "Request": wl, "Batch": d.batch || "-", "Name": d.name, "WhatsApp": d.phone, "Country": d.country,
        "Program": d.program, "Course & year": d.level, "College / university": d.college || "-",
        "Wants help with": all("needs"), "Preferred class time": (d.slot || "-") + (VTZ ? " (" + VTZ + ")" : ""),
        "Heard about us": d.source || "-", "Message": d.message || "-", "Consent to contact": "Yes", "Sent from": location.href,
        email: d.email,
        _subject: "AlliedPath " + label + " " + ref + ": " + d.name + " · " + d.program,
        _autoresponse: "Dear " + first + ",\n\nThank you for contacting AlliedPath (" + wl.toLowerCase() + ", reference " + ref + ").\n\n" + (d.want === "doubt" ? "A faculty member will reply to your doubt personally, usually within a day." : d.want === "demo" ? "We will contact you personally, usually within a day, to fix a time for your free demo class." : d.want === "seat" ? "We will contact you personally, usually within a day, to confirm your seat and the batch details." : "We will contact you personally, usually within a day, with batch details and a free demo class.") + "\n\nPlease note: AlliedPath provides teaching and mentoring only and does not issue certificates.\n\nWarm regards,\nAlliedPath by ResearchMed Connect\nhttps://researchmed.in/alliedpath/"
      };
    } else {
      label = "faculty application";
      info = "Faculty · " + (d.qualification || "") + (d.country ? " · " + d.country : "");
      payload = {
        "Reference": ref, "Registration": "Faculty", "Name": d.name, "WhatsApp": d.phone, "Country": d.country,
        "Highest qualification": d.qualification, "Current role & institution": d.current, "Years of experience": d.years,
        "Can teach (programs)": all("programs"), "Subjects": d.subjects, "Would like to": all("modes"),
        "Hours per week": d.hours || "-", "Teaching languages": d.languages || "-", "LinkedIn": d.link || "-",
        "Short bio": d.bio || "-", "Consent to contact": "Yes", "Sent from": location.href,
        email: d.email,
        _subject: "AlliedPath faculty application " + ref + ": " + d.name + " · " + d.qualification + " (photo + CV attached)",
        _autoresponse: "Dear " + first + ",\n\nThank you for applying to teach with AlliedPath (reference " + ref + ").\n\nWe will review your details and contact you personally to talk about subjects, schedule and next steps.\n\nWarm regards,\nAlliedPath by ResearchMed Connect\nhttps://researchmed.in/alliedpath/"
      };
    }
    payload._template = "table"; payload._captcha = "false";
    var to = S.email || "info@researchmed.in";
    if (KIND === "faculty") {
      payload._next = location.origin + location.pathname + "?sent=" + encodeURIComponent(ref) + "&n=" + encodeURIComponent(first);
      var up = document.createElement("form");
      up.method = "POST"; up.enctype = "multipart/form-data"; up.action = "https://formsubmit.co/" + to; up.hidden = true;
      Object.keys(payload).forEach(function (k) { var h = document.createElement("input"); h.type = "hidden"; h.name = k; h.value = payload[k] == null ? "" : String(payload[k]); up.appendChild(h); });
      [["photo", "Passport photo"], ["cv", "CV"]].forEach(function (pair) { var inp = f.querySelector("input[name=" + pair[0] + "]"); if (inp) { inp.name = pair[1]; up.appendChild(inp); } });
      document.body.appendChild(up);
      btn.disabled = true; btn.textContent = "Uploading\u2026";
      up.submit();
      return;
    }
    btn.disabled = true; var bl = btn.textContent; btn.textContent = "Sending…"; st.hidden = true;
    fetch("https://formsubmit.co/ajax/" + to, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || String(j.success) !== "true") throw new Error("send failed"); }); })
      .then(function () {
        document.dispatchEvent(new CustomEvent("rmc:lead", { detail: { kind: "AlliedPath " + label, info: info, name: first } }));
        [].slice.call(f.querySelectorAll("input,select,textarea,button")).forEach(function (el) { el.disabled = true; });
        st.className = "status ok";
        st.innerHTML = "<strong>Thank you, " + esc(first) + "!</strong> " + (KIND === "student" ? (d.want === "doubt" ? "Your doubt has reached us" : d.want === "demo" ? "Your free demo request has reached us" : d.want === "seat" ? "Your seat request has reached us" : "Your registration has reached us") : "Your application has reached us") + " (reference " + ref + "). We'll contact you personally soon, and a confirmation email is on its way.";
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
