// Parking Log BD — pure logic (no DOM, no Date.now()).
// Unit-tested by tests/test.js. In the browser this exposes window.ParkLogic.
(function (root) {
  var TYPES = ["motorcycle", "car", "cng", "bus"];

  var BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

  function toBnDigits(value) {
    return String(value).replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  }

  function fmtNum(n, lang) {
    var s = String(Math.trunc(n));
    var neg = s.charAt(0) === "-";
    if (neg) s = s.slice(1);
    var out = "";
    while (s.length > 3) { out = "," + s.slice(-3) + out; s = s.slice(0, -3); }
    out = s + out;
    if (neg) out = "-" + out;
    return lang === "bn" ? toBnDigits(out) : out;
  }

  function fmtMoney(n, lang) {
    return "৳" + fmtNum(n, lang);
  }

  function normalizePlate(plate) {
    return String(plate || "").trim().replace(/\s+/g, " ").toUpperCase();
  }

  function isValidPhone(phone) {
    if (!phone) return true; // optional field
    var digits = String(phone).replace(/[^0-9]/g, "");
    return /^01[3-9][0-9]{8}$/.test(digits);
  }

  // Validate a check-in. parked = currently-parked records (for duplicate check).
  // Returns an array of error keys (empty = valid).
  function validateCheckin(input, parked, nowMs) {
    var errors = [];
    var plate = normalizePlate(input.plate);
    if (!plate) errors.push("plate-required");
    else if (plate.length > 20) errors.push("plate-too-long");
    if (TYPES.indexOf(input.type) === -1) errors.push("bad-type");
    if (!input.entryMs || isNaN(input.entryMs)) errors.push("bad-entry-time");
    else if (input.entryMs > nowMs) errors.push("entry-in-future");
    if (!isValidPhone(input.phone)) errors.push("bad-phone");
    if (plate && parked.some(function (r) { return normalizePlate(r.plate) === plate; })) {
      errors.push("duplicate-parked");
    }
    return errors;
  }

  // Validate an exit. Returns error keys.
  function validateExit(entryMs, exitMs, nowMs) {
    var errors = [];
    if (!exitMs || isNaN(exitMs)) errors.push("bad-exit-time");
    else {
      if (exitMs < entryMs) errors.push("exit-before-entry");
      if (exitMs > nowMs) errors.push("exit-in-future");
    }
    return errors;
  }

  // Billed hours: whole hours rounded UP, minimum 1. Returns null on bad input.
  function billedHours(entryMs, exitMs) {
    if (!entryMs || !exitMs || isNaN(entryMs) || isNaN(exitMs)) return null;
    if (exitMs < entryMs) return null;
    return Math.max(1, Math.ceil((exitMs - entryMs) / 3600000));
  }

  // Fee = billed hours x hourly rate (rate 0 means "not set" -> fee 0).
  function calcFee(entryMs, exitMs, rate) {
    var h = billedHours(entryMs, exitMs);
    if (h === null) return null;
    return h * (rate || 0);
  }

  // "3h 25m" / "25m" / "0m" (digits converted by caller for Bangla).
  function formatDuration(ms) {
    if (ms < 0) ms = 0;
    var totalMin = Math.floor(ms / 60000);
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    if (h === 0) return m + "m";
    return h + "h " + m + "m";
  }

  function sameLocalDay(aMs, bMs) {
    var a = new Date(aMs), b = new Date(bMs);
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function todayStats(parked, history, nowMs) {
    var todayExits = history.filter(function (r) { return sameLocalDay(r.exitMs, nowMs); });
    var revenue = 0;
    todayExits.forEach(function (r) { revenue += r.fee || 0; });
    var longest = null;
    parked.forEach(function (r) {
      if (!longest || r.entryMs < longest.entryMs) longest = r;
    });
    return {
      parkedNow: parked.length,
      exitsToday: todayExits.length,
      revenueToday: revenue,
      longest: longest
    };
  }

  function filterParked(parked, query, typeFilter) {
    var q = normalizePlate(query);
    return parked.filter(function (r) {
      if (typeFilter && typeFilter !== "all" && r.type !== typeFilter) return false;
      if (q && normalizePlate(r.plate).indexOf(q) === -1) return false;
      return true;
    });
  }

  function filterHistory(history, query, dateStr) {
    var q = normalizePlate(query);
    return history.filter(function (r) {
      if (q && normalizePlate(r.plate).indexOf(q) === -1) return false;
      if (dateStr) {
        var d = new Date(r.exitMs);
        var iso = d.getFullYear() + "-" +
          String(d.getMonth() + 1).padStart(2, "0") + "-" +
          String(d.getDate()).padStart(2, "0");
        if (iso !== dateStr) return false;
      }
      return true;
    });
  }

  function sortParked(parked) {
    return parked.slice().sort(function (a, b) { return a.entryMs - b.entryMs; });
  }

  function sortHistory(history) {
    return history.slice().sort(function (a, b) { return b.exitMs - a.exitMs; });
  }

  function validateRates(rates) {
    var errors = [];
    TYPES.forEach(function (t) {
      var v = rates[t];
      if (v === undefined || v === null || v === "" || isNaN(+v) ||
          !isFinite(+v) || Math.floor(+v) !== +v || +v < 0) {
        errors.push("bad-rate-" + t);
      }
    });
    return errors;
  }

  function isRecordValid(r, needExit) {
    if (!r || typeof r !== "object") return false;
    if (typeof r.plate !== "string" || !normalizePlate(r.plate)) return false;
    if (TYPES.indexOf(r.type) === -1) return false;
    if (typeof r.entryMs !== "number" || isNaN(r.entryMs)) return false;
    if (needExit) {
      if (typeof r.exitMs !== "number" || isNaN(r.exitMs) || r.exitMs < r.entryMs) return false;
      if (typeof r.fee !== "number" || isNaN(r.fee) || r.fee < 0) return false;
    }
    if (r.phone !== undefined && r.phone !== null && typeof r.phone !== "string") return false;
    if (r.note !== undefined && r.note !== null && typeof r.note !== "string") return false;
    return true;
  }

  // Strict import: { version: 1, parked: [...], history: [...], rates: {...} }
  function parseImport(text) {
    var data;
    try { data = JSON.parse(text); } catch (e) { return { ok: false, error: "invalid-json" }; }
    if (!data || typeof data !== "object" || data.version !== 1) {
      return { ok: false, error: "bad-format" };
    }
    if (!Array.isArray(data.parked) || !Array.isArray(data.history)) {
      return { ok: false, error: "bad-format" };
    }
    if (!data.parked.every(function (r) { return isRecordValid(r, false); })) {
      return { ok: false, error: "bad-parked" };
    }
    if (!data.history.every(function (r) { return isRecordValid(r, true); })) {
      return { ok: false, error: "bad-history" };
    }
    if (!data.rates || validateRates(data.rates).length) {
      return { ok: false, error: "bad-rates" };
    }
    var seen = {};
    for (var i = 0; i < data.parked.length; i++) {
      var p = normalizePlate(data.parked[i].plate);
      if (seen[p]) return { ok: false, error: "duplicate-parked" };
      seen[p] = true;
    }
    return { ok: true, data: data };
  }

  var api = {
    TYPES: TYPES, toBnDigits: toBnDigits, fmtNum: fmtNum, fmtMoney: fmtMoney,
    normalizePlate: normalizePlate, isValidPhone: isValidPhone,
    validateCheckin: validateCheckin, validateExit: validateExit,
    billedHours: billedHours, calcFee: calcFee, formatDuration: formatDuration,
    sameLocalDay: sameLocalDay, todayStats: todayStats,
    filterParked: filterParked, filterHistory: filterHistory,
    sortParked: sortParked, sortHistory: sortHistory,
    validateRates: validateRates, parseImport: parseImport
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  else { root.ParkLogic = api; }
})(typeof window !== "undefined" ? window : globalThis);
