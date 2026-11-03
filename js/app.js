// Parking Log BD — DOM wiring + i18n. Pure math lives in js/logic.js.
(function () {
  var L = window.ParkLogic;
  var KEY = "parking-log-bd-v1";
  var LANG_KEY = "parking-log-bd-lang";

  var TYPE_BN = {
    motorcycle: "মোটরসাইকেল", car: "গাড়ি",
    cng: "সিএনজি / অটোরিকশা", bus: "বাস / ট্রাক"
  };
  var TYPE_EN = {
    motorcycle: "Motorcycle", car: "Car",
    cng: "CNG / Auto-rickshaw", bus: "Bus / Truck"
  };

  var I18N = {
    en: {
      title: "Parking Log BD", subtitle: "A simple offline log for small parking lots & garages",
      dashboard: "Today at a glance", parkedNow: "Parked now", exitsToday: "Exited today",
      revenueToday: "Collected today", longestParked: "Longest parked",
      noneYet: "—", ratesHint: "Tip: set your hourly rates in Settings below — fees are calculated from YOUR rates only. No default prices are assumed.",
      checkin: "Check-in a vehicle", plate: "Number plate *", platePh: "e.g. DHAKA METRO-GA 12-3456",
      type: "Vehicle type *", entryTime: "Entry time *", phone: "Driver phone (optional)",
      phonePh: "01XXXXXXXXX", note: "Note (optional)", notePh: "e.g. Near gate",
      checkinBtn: "Check in", checkedIn: "Checked in.",
      parked: "Currently parked", searchPlate: "Search plate…", allTypes: "All types",
      exit: "Exit", exitTime: "Exit time", confirmExit: "Confirm exit", cancel: "Cancel",
      feePreview: "Fee", billed: "billed", rateNotSet: "Rate not set for this type — fee will be ৳0. Set it in Settings.",
      exited: "Exited. Fee collected: ", history: "Exit history", filterDate: "Filter by exit date",
      clearDate: "Clear", settings: "Hourly rates (BDT)", ratesDesc: "Your rates, per vehicle type. Fees use these rates only — change them any time.",
      perHour: "/hour", saveRates: "Save rates", ratesSaved: "Rates saved.",
      data: "Your data", exportBtn: "Export JSON", importBtn: "Import JSON",
      importOk: "Imported.", erase: "Erase everything", eraseHint: "Type DELETE and press Erase to clear all vehicles, history and rates.",
      eraseBtn: "Erase", erased: "All data erased.", emptyParked: "No vehicles parked right now. Check one in above.",
      emptyHistory: "No exits recorded yet.", disclaimer: "Personal log tool — not affiliated with any parking authority. All rates are entered by you.",
      err: {
        "plate-required": "Enter a number plate.", "plate-too-long": "Plate is too long (max 20 characters).",
        "bad-type": "Pick a vehicle type.", "bad-entry-time": "Pick a valid entry time.",
        "entry-in-future": "Entry time cannot be in the future.", "bad-phone": "Phone must be a Bangladeshi mobile like 01XXXXXXXXX.",
        "duplicate-parked": "This plate is already parked.", "bad-exit-time": "Pick a valid exit time.",
        "exit-before-entry": "Exit time cannot be before entry.", "exit-in-future": "Exit time cannot be in the future.",
        "invalid-json": "That file is not valid JSON.", "bad-format": "That file is not a Parking Log BD export.",
        "bad-parked": "The parked list in that file is invalid.", "bad-history": "The history in that file is invalid.",
        "bad-rates": "The rates in that file are invalid.", "bad-rate": "Rates must be whole BDT amounts of 0 or more."
      }
    },
    bn: {
      title: "পার্কিং লগ বিডি", subtitle: "ছোট পার্কিং লট ও গ্যারেজের জন্য সহজ অফলাইন লগ",
      dashboard: "আজকের চিত্র", parkedNow: "এখন পার্ক করা", exitsToday: "আজ বের হয়েছে",
      revenueToday: "আজ আদায়", longestParked: "সবচেয়ে বেশি সময় পার্ক করা",
      noneYet: "—", ratesHint: "পরামর্শ: নিচে Settings-এ আপনার ঘণ্টাপ্রতি রেট বসান — ফি শুধু আপনার রেট থেকেই হিসাব হবে। কোনো ডিফল্ট দাম ধরা হয় না।",
      checkin: "গাড়ি প্রবেশ করান", plate: "নম্বর প্লেট *", platePh: "যেমন: DHAKA METRO-GA 12-3456",
      type: "গাড়ির ধরন *", entryTime: "প্রবেশের সময় *", phone: "চালকের ফোন (ঐচ্ছিক)",
      phonePh: "01XXXXXXXXX", note: "নোট (ঐচ্ছিক)", notePh: "যেমন: গেটের কাছে",
      checkinBtn: "প্রবেশ করান", checkedIn: "প্রবেশ করানো হয়েছে।",
      parked: "বর্তমানে পার্ক করা", searchPlate: "প্লেট খুঁজুন…", allTypes: "সব ধরন",
      exit: "বের করুন", exitTime: "বের হওয়ার সময়", confirmExit: "বের হওয়া নিশ্চিত করুন", cancel: "বাতিল",
      feePreview: "ফি", billed: "বিলকৃত", rateNotSet: "এই ধরনের রেট বসানো হয়নি — ফি হবে ৳০। Settings-এ বসান।",
      exited: "বের হয়েছে। আদায়কৃত ফি: ", history: "বের হওয়ার ইতিহাস", filterDate: "বের হওয়ার তারিখ দিয়ে ছাঁকুন",
      clearDate: "মুছুন", settings: "ঘণ্টাপ্রতি রেট (টাকা)", ratesDesc: "আপনার রেট, প্রতি গাড়ির ধরন অনুযায়ী। ফি শুধু এই রেট থেকেই হিসাব হবে — যেকোনো সময় বদলাতে পারবেন।",
      perHour: "/ঘণ্টা", saveRates: "রেট সংরক্ষণ করুন", ratesSaved: "রেট সংরক্ষিত হয়েছে।",
      data: "আপনার ডেটা", exportBtn: "JSON এক্সপোর্ট", importBtn: "JSON ইমপোর্ট",
      importOk: "ইমপোর্ট হয়েছে।", erase: "সব মুছে ফেলুন", eraseHint: "সব গাড়ি, ইতিহাস ও রেট মুছতে DELETE লিখে Erase চাপুন।",
      eraseBtn: "মুছুন", erased: "সব ডেটা মুছে ফেলা হয়েছে।", emptyParked: "এখন কোনো গাড়ি পার্ক করা নেই। উপরে একটি প্রবেশ করান।",
      emptyHistory: "এখনো কোনো বের হওয়ার রেকর্ড নেই।", disclaimer: "ব্যক্তিগত লগ টুল — কোনো পার্কিং কর্তৃপক্ষের সঙ্গে সম্পৃক্ত নয়। সব রেট আপনিই বসিয়েছেন।",
      err: {
        "plate-required": "নম্বর প্লেট লিখুন।", "plate-too-long": "প্লেট অনেক লম্বা (সর্বোচ্চ ২০ অক্ষর)।",
        "bad-type": "গাড়ির ধরন বেছে নিন।", "bad-entry-time": "সঠিক প্রবেশের সময় বেছে নিন।",
        "entry-in-future": "প্রবেশের সময় ভবিষ্যতে হতে পারবে না।", "bad-phone": "ফোন হতে হবে বাংলাদেশি মোবাইল, যেমন 01XXXXXXXXX।",
        "duplicate-parked": "এই প্লেট ইতিমধ্যে পার্ক করা আছে।", "bad-exit-time": "সঠিক বের হওয়ার সময় বেছে নিন।",
        "exit-before-entry": "বের হওয়ার সময় প্রবেশের আগে হতে পারবে না।", "exit-in-future": "বের হওয়ার সময় ভবিষ্যতে হতে পারবে না।",
        "invalid-json": "ফাইলটি সঠিক JSON নয়।", "bad-format": "ফাইলটি Parking Log BD এক্সপোর্ট নয়।",
        "bad-parked": "ফাইলের পার্ক করা তালিকাটি সঠিক নয়।", "bad-history": "ফাইলের ইতিহাসটি সঠিক নয়।",
        "bad-rates": "ফাইলের রেটগুলো সঠিক নয়।", "bad-rate": "রেট হতে হবে ০ বা তার বেশি পূর্ণ টাকা।"
      }
    }
  };

  var state = load();
  var lang = localStorage.getItem(LANG_KEY) || "en";
  if (lang !== "en" && lang !== "bn") lang = "en";

  function defaultState() {
    return { parked: [], history: [], rates: { motorcycle: 0, car: 0, cng: 0, bus: 0 } };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      var res = L.parseImport(raw);
      if (!res.ok) return defaultState();
      return { parked: res.data.parked, history: res.data.history, rates: res.data.rates };
    } catch (e) { return defaultState(); }
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify({
      version: 1, parked: state.parked, history: state.history, rates: state.rates
    }));
  }
  function t(k) { return I18N[lang][k]; }
  function typeName(ty) { return lang === "bn" ? TYPE_BN[ty] : TYPE_EN[ty]; }
  function n(v) { return lang === "bn" ? L.toBnDigits(v) : String(v); }
  function money(v) { return L.fmtMoney(v, lang); }
  function dur(ms) {
    var s = L.formatDuration(ms);
    return lang === "bn" ? L.toBnDigits(s) : s;
  }
  function fmtDT(ms) {
    var d = new Date(ms);
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var hh = d.getHours(), ap = hh >= 12 ? "PM" : "AM";
    var h12 = hh % 12 === 0 ? 12 : hh % 12;
    var s = d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear() + ", " +
      h12 + ":" + String(d.getMinutes()).padStart(2, "0") + " " + ap;
    return lang === "bn" ? L.toBnDigits(s) : s;
  }
  function toLocalInput(ms) {
    var d = new Date(ms);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0") + "T" +
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  function $(id) { return document.getElementById(id); }

  function renderStatic() {
    $("app-title").textContent = t("title");
    $("app-subtitle").textContent = t("subtitle");
    $("dashboard-h").textContent = t("dashboard");
    $("checkin-h").textContent = t("checkin");
    $("parked-h").textContent = t("parked");
    $("history-h").textContent = t("history");
    $("settings-h").textContent = t("settings");
    $("data-h").textContent = t("data");
    $("disclaimer").textContent = t("disclaimer");
    $("lang-toggle").textContent = lang === "en" ? "বাংলা" : "English";
    $("label-plate").textContent = t("plate");
    $("label-type").textContent = t("type");
    $("label-entry").textContent = t("entryTime");
    $("label-phone").textContent = t("phone");
    $("label-note").textContent = t("note");
    $("in-plate").placeholder = t("platePh");
    $("in-phone").placeholder = t("phonePh");
    $("in-note").placeholder = t("notePh");
    $("btn-checkin").textContent = t("checkinBtn");
    $("in-parked-search").placeholder = t("searchPlate");
    $("in-history-search").placeholder = t("searchPlate");
    $("label-history-date").textContent = t("filterDate");
    $("btn-clear-date").textContent = t("clearDate");
    $("rates-desc").textContent = t("ratesDesc");
    $("btn-save-rates").textContent = t("saveRates");
    $("btn-export").textContent = t("exportBtn");
    $("btn-import").textContent = t("importBtn");
    $("erase-h").textContent = t("erase");
    $("erase-hint").textContent = t("eraseHint");
    $("btn-erase").textContent = t("eraseBtn");
    $("rates-hint").textContent = t("ratesHint");
    $("label-parked-now").textContent = t("parkedNow");
    $("label-exits-today").textContent = t("exitsToday");
    $("label-revenue-today").textContent = t("revenueToday");
    $("label-longest").textContent = t("longestParked");
    // Type selects
    ["in-type", "in-parked-type"].forEach(function (id) {
      var sel = $(id);
      var keep = sel.value;
      sel.innerHTML = "";
      if (id === "in-parked-type") {
        var o = document.createElement("option");
        o.value = "all"; o.textContent = t("allTypes"); sel.appendChild(o);
      }
      L.TYPES.forEach(function (ty) {
        var op = document.createElement("option");
        op.value = ty; op.textContent = typeName(ty); sel.appendChild(op);
      });
      sel.value = keep || (id === "in-parked-type" ? "all" : "motorcycle");
    });
    // Rate labels
    L.TYPES.forEach(function (ty) {
      $("label-rate-" + ty).textContent = typeName(ty) + " (" + t("perHour") + ")";
      $("in-rate-" + ty).value = state.rates[ty];
    });
  }

  function renderDashboard() {
    var s = L.todayStats(state.parked, state.history, Date.now());
    $("dash-parked").textContent = n(s.parkedNow);
    $("dash-exits").textContent = n(s.exitsToday);
    $("dash-revenue").textContent = money(s.revenueToday);
    $("dash-longest").textContent = s.longest
      ? s.longest.plate + " · " + dur(Date.now() - s.longest.entryMs)
      : t("noneYet");
  }

  function renderParked() {
    var list = $("parked-list");
    var rows = L.sortParked(L.filterParked(state.parked, $("in-parked-search").value, $("in-parked-type").value));
    list.innerHTML = "";
    $("parked-empty").style.display = rows.length ? "none" : "block";
    $("parked-empty").textContent = t("emptyParked");
    var now = Date.now();
    rows.forEach(function (r) {
      var card = document.createElement("div");
      card.className = "card";
      var elapsed = dur(now - r.entryMs);
      card.innerHTML =
        "<div class='row'><strong class='plate'></strong><span class='badge'></span></div>" +
        "<div class='meta'></div><div class='meta'></div>" +
        "<div class='exit-zone' style='display:none'></div>" +
        "<button class='btn exit-btn'></button>";
      card.querySelector(".plate").textContent = r.plate;
      card.querySelector(".badge").textContent = typeName(r.type);
      var metas = card.querySelectorAll(".meta");
      metas[0].textContent = t("entryTime") + ": " + fmtDT(r.entryMs) + " · " + elapsed;
      metas[1].textContent = (r.phone ? r.phone + " · " : "") + (r.note || "");
      var exitBtn = card.querySelector(".exit-btn");
      exitBtn.textContent = t("exit");
      var zone = card.querySelector(".exit-zone");
      exitBtn.addEventListener("click", function () {
        zone.style.display = "block";
        exitBtn.style.display = "none";
        zone.innerHTML =
          "<label>" + t("exitTime") + "</label>" +
          "<input type='datetime-local' class='exit-time' value='" + toLocalInput(Date.now()) + "'>" +
          "<div class='fee-line'></div><div class='form-err'></div>" +
          "<button class='btn primary confirm-btn'></button> " +
          "<button class='btn cancel-btn'></button>";
        var feeLine = zone.querySelector(".fee-line");
        var errBox = zone.querySelector(".form-err");
        function preview() {
          var exitMs = new Date(zone.querySelector(".exit-time").value).getTime();
          var errs = L.validateExit(r.entryMs, exitMs, Date.now());
          if (errs.length) { feeLine.textContent = ""; errBox.textContent = t("err")[errs[0]]; return; }
          errBox.textContent = "";
          var h = L.billedHours(r.entryMs, exitMs);
          var fee = L.calcFee(r.entryMs, exitMs, state.rates[r.type]);
          feeLine.textContent = t("feePreview") + ": " + money(fee) + " (" + n(h) + "h " + t("billed") + ")";
          if (!state.rates[r.type]) feeLine.textContent += " — " + t("rateNotSet");
        }
        zone.querySelector(".exit-time").addEventListener("change", preview);
        zone.querySelector(".exit-time").addEventListener("input", preview);
        preview();
        zone.querySelector(".confirm-btn").textContent = t("confirmExit");
        zone.querySelector(".cancel-btn").textContent = t("cancel");
        zone.querySelector(".cancel-btn").addEventListener("click", function () {
          zone.style.display = "none"; exitBtn.style.display = "";
        });
        zone.querySelector(".confirm-btn").addEventListener("click", function () {
          var exitMs = new Date(zone.querySelector(".exit-time").value).getTime();
          var errs = L.validateExit(r.entryMs, exitMs, Date.now());
          if (errs.length) { errBox.textContent = t("err")[errs[0]]; return; }
          var fee = L.calcFee(r.entryMs, exitMs, state.rates[r.type]);
          state.parked = state.parked.filter(function (x) { return x !== r; });
          state.history.push({ plate: r.plate, type: r.type, entryMs: r.entryMs,
            exitMs: exitMs, fee: fee, phone: r.phone || "", note: r.note || "" });
          save(); renderAll();
          $("history-msg").textContent = t("exited") + money(fee);
        });
      });
      list.appendChild(card);
    });
  }

  function renderHistory() {
    var list = $("history-list");
    var rows = L.sortHistory(L.filterHistory(state.history, $("in-history-search").value, $("in-history-date").value));
    list.innerHTML = "";
    $("history-empty").style.display = rows.length ? "none" : "block";
    $("history-empty").textContent = t("emptyHistory");
    rows.forEach(function (r) {
      var card = document.createElement("div");
      card.className = "card";
      card.innerHTML = "<div class='row'><strong class='plate'></strong><span class='badge'></span></div><div class='meta'></div><div class='meta'></div>";
      card.querySelector(".plate").textContent = r.plate;
      card.querySelector(".badge").textContent = typeName(r.type);
      var metas = card.querySelectorAll(".meta");
      metas[0].textContent = t("entryTime") + ": " + fmtDT(r.entryMs);
      metas[1].textContent = t("exitTime") + ": " + fmtDT(r.exitMs) + " · " +
        dur(r.exitMs - r.entryMs) + " · " + t("feePreview") + ": " + money(r.fee);
      list.appendChild(card);
    });
  }

  function renderAll() {
    renderStatic(); renderDashboard(); renderParked(); renderHistory();
  }

  function init() {
    $("in-entry").value = toLocalInput(Date.now());
    $("btn-checkin").addEventListener("click", function () {
      var entryMs = new Date($("in-entry").value).getTime();
      var input = { plate: $("in-plate").value, type: $("in-type").value,
        entryMs: entryMs, phone: $("in-phone").value };
      var errs = L.validateCheckin(input, state.parked, Date.now());
      if (errs.length) {
        $("checkin-err").textContent = t("err")[errs[0]];
        $("checkin-msg").textContent = "";
        return;
      }
      state.parked.push({ plate: L.normalizePlate(input.plate), type: input.type,
        entryMs: entryMs, phone: input.phone.trim(), note: $("in-note").value.trim() });
      save(); renderAll();
      $("checkin-err").textContent = "";
      $("checkin-msg").textContent = t("checkedIn");
      $("in-plate").value = ""; $("in-phone").value = ""; $("in-note").value = "";
      $("in-entry").value = toLocalInput(Date.now());
    });
    $("in-parked-search").addEventListener("input", renderParked);
    $("in-parked-type").addEventListener("change", renderParked);
    $("in-history-search").addEventListener("input", renderHistory);
    $("in-history-date").addEventListener("change", renderHistory);
    $("btn-clear-date").addEventListener("click", function () {
      $("in-history-date").value = ""; renderHistory();
    });
    $("btn-save-rates").addEventListener("click", function () {
      var rates = {};
      L.TYPES.forEach(function (ty) { rates[ty] = $("in-rate-" + ty).value; });
      var errs = L.validateRates(rates);
      if (errs.length) { $("rates-msg").textContent = t("err")["bad-rate"]; return; }
      L.TYPES.forEach(function (ty) { state.rates[ty] = +rates[ty]; });
      save(); renderAll();
      $("rates-msg").textContent = t("ratesSaved");
    });
    $("btn-export").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify({ version: 1, parked: state.parked,
        history: state.history, rates: state.rates }, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "parking-log-bd.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });
    $("btn-import").addEventListener("click", function () { $("in-import-file").click(); });
    $("in-import-file").addEventListener("change", function (ev) {
      var f = ev.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var res = L.parseImport(rd.result);
        if (!res.ok) { $("import-msg").textContent = t("err")[res.error]; return; }
        state = { parked: res.data.parked, history: res.data.history, rates: res.data.rates };
        save(); renderAll();
        $("import-msg").textContent = t("importOk");
      };
      rd.readAsText(f);
      ev.target.value = "";
    });
    $("btn-erase").addEventListener("click", function () {
      if ($("in-erase").value !== "DELETE") {
        $("erase-msg").textContent = t("eraseHint");
        return;
      }
      state = defaultState(); save(); renderAll();
      $("in-erase").value = "";
      $("erase-msg").textContent = t("erased");
    });
    $("lang-toggle").addEventListener("click", function () {
      lang = lang === "en" ? "bn" : "en";
      localStorage.setItem(LANG_KEY, lang);
      renderAll();
    });
    // Dashboard only: re-rendering the parked list would collapse an open exit form.
    setInterval(function () { renderDashboard(); }, 30000);
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
