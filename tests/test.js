// Node unit tests for parking-log-bd. Run: node tests/test.js
var assert = require("assert");
var L = require("../js/logic.js");
var passed = 0;
function check(name, fn) { fn(); passed++; console.log("ok - " + name); }

var T0 = Date.UTC(2026, 10, 3, 8, 0, 0); // 2026-11-03 08:00 UTC
var H = 3600000;

check("toBnDigits converts 0-9", function () {
  assert.strictEqual(L.toBnDigits("2026"), "২০২৬");
  assert.strictEqual(L.toBnDigits("৳1,250"), "৳১,২৫০");
});

check("fmtMoney groups thousands, bn digits in bn mode", function () {
  assert.strictEqual(L.fmtMoney(1250, "en"), "৳1,250");
  assert.strictEqual(L.fmtMoney(1250, "bn"), "৳১,২৫০");
  assert.strictEqual(L.fmtMoney(0, "en"), "৳0");
});

check("normalizePlate trims, uppercases, collapses spaces", function () {
  assert.strictEqual(L.normalizePlate("  dhaka  metro-ga  12-3456 "), "DHAKA METRO-GA 12-3456");
});

check("isValidPhone: optional, BD mobile 01[3-9] + 8 digits", function () {
  assert.strictEqual(L.isValidPhone(""), true);
  assert.strictEqual(L.isValidPhone("01712345678"), true);
  assert.strictEqual(L.isValidPhone("01712 345678"), true);
  assert.strictEqual(L.isValidPhone("01212345678"), false);
  assert.strictEqual(L.isValidPhone("0171234567"), false);
  assert.strictEqual(L.isValidPhone("abc"), false);
});

check("validateCheckin: happy path + each failure", function () {
  var parked = [];
  var good = { plate: "GA 12-3456", type: "car", entryMs: T0, phone: "" };
  assert.deepStrictEqual(L.validateCheckin(good, parked, T0 + H), []);
  assert.ok(L.validateCheckin({ plate: " ", type: "car", entryMs: T0 }, parked, T0 + H).indexOf("plate-required") !== -1);
  assert.ok(L.validateCheckin({ plate: "x".repeat(21), type: "car", entryMs: T0 }, parked, T0 + H).indexOf("plate-too-long") !== -1);
  assert.ok(L.validateCheckin({ plate: "A", type: "rocket", entryMs: T0 }, parked, T0 + H).indexOf("bad-type") !== -1);
  assert.ok(L.validateCheckin({ plate: "A", type: "car", entryMs: NaN }, parked, T0 + H).indexOf("bad-entry-time") !== -1);
  assert.ok(L.validateCheckin({ plate: "A", type: "car", entryMs: T0 + 2 * H }, parked, T0 + H).indexOf("entry-in-future") !== -1);
  assert.ok(L.validateCheckin({ plate: "A", type: "car", entryMs: T0, phone: "123" }, parked, T0 + H).indexOf("bad-phone") !== -1);
  var parked2 = [{ plate: "ga 12-3456", type: "car", entryMs: T0 }];
  assert.ok(L.validateCheckin(good, parked2, T0 + H).indexOf("duplicate-parked") !== -1);
});

check("validateExit: before-entry, future, bad", function () {
  assert.deepStrictEqual(L.validateExit(T0, T0 + H, T0 + 2 * H), []);
  assert.ok(L.validateExit(T0, T0 - H, T0 + H).indexOf("exit-before-entry") !== -1);
  assert.ok(L.validateExit(T0, T0 + 3 * H, T0 + 2 * H).indexOf("exit-in-future") !== -1);
  assert.ok(L.validateExit(T0, NaN, T0 + H).indexOf("bad-exit-time") !== -1);
  assert.deepStrictEqual(L.validateExit(T0, T0, T0 + H), []); // zero-length stay allowed
});

check("billedHours: ceil, minimum 1, null on bad", function () {
  assert.strictEqual(L.billedHours(T0, T0), 1);
  assert.strictEqual(L.billedHours(T0, T0 + 60000), 1);
  assert.strictEqual(L.billedHours(T0, T0 + H + 60000), 2);
  assert.strictEqual(L.billedHours(T0, T0 + 3 * H), 3);
  assert.strictEqual(L.billedHours(T0, T0 - H), null);
  assert.strictEqual(L.billedHours(T0, NaN), null);
});

check("calcFee: hours x rate, rate 0 -> 0", function () {
  assert.strictEqual(L.calcFee(T0, T0 + 2 * H + 60000, 50), 150);
  assert.strictEqual(L.calcFee(T0, T0 + 30 * 60000, 0), 0);
  assert.strictEqual(L.calcFee(T0, T0 - H, 50), null);
});

check("formatDuration: minutes, hours+minutes", function () {
  assert.strictEqual(L.formatDuration(0), "0m");
  assert.strictEqual(L.formatDuration(25 * 60000), "25m");
  assert.strictEqual(L.formatDuration(3 * H + 25 * 60000), "3h 25m");
  assert.strictEqual(L.formatDuration(2 * H), "2h 0m");
});

check("sameLocalDay + todayStats", function () {
  var parked = [{ plate: "A", type: "car", entryMs: T0 }];
  var history = [
    { plate: "B", type: "car", entryMs: T0 - H, exitMs: T0 + H, fee: 100 },
    { plate: "C", type: "car", entryMs: T0 - 26 * H, exitMs: T0 - 25 * H, fee: 50 }
  ];
  var s = L.todayStats(parked, history, T0 + 2 * H);
  assert.strictEqual(s.parkedNow, 1);
  assert.strictEqual(s.exitsToday, 1);
  assert.strictEqual(s.revenueToday, 100);
  assert.strictEqual(s.longest.plate, "A");
  assert.strictEqual(L.todayStats([], [], T0).longest, null);
});

check("filterParked: query (case/space-insensitive) + type", function () {
  var p = [
    { plate: "GA 12-3456", type: "car", entryMs: T0 },
    { plate: "DHAKA METRO-B 99", type: "motorcycle", entryMs: T0 }
  ];
  assert.strictEqual(L.filterParked(p, "", "all").length, 2);
  assert.strictEqual(L.filterParked(p, "ga 12", "all").length, 1);
  assert.strictEqual(L.filterParked(p, "", "motorcycle").length, 1);
  assert.strictEqual(L.filterParked(p, "zzz", "all").length, 0);
});

check("filterHistory: query + exit-date filter", function () {
  var d = new Date(T0 + H);
  var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  var h = [
    { plate: "GA 12", type: "car", entryMs: T0, exitMs: T0 + H, fee: 50 },
    { plate: "GA 99", type: "car", entryMs: T0 - 48 * H, exitMs: T0 - 47 * H, fee: 50 }
  ];
  assert.strictEqual(L.filterHistory(h, "", iso).length, 1);
  assert.strictEqual(L.filterHistory(h, "ga 99", "").length, 1);
  assert.strictEqual(L.filterHistory(h, "", "2000-01-01").length, 0);
});

check("sortParked oldest-first, sortHistory newest-first", function () {
  var p = [{ plate: "B", entryMs: T0 + H }, { plate: "A", entryMs: T0 }];
  assert.strictEqual(L.sortParked(p)[0].plate, "A");
  var h = [{ plate: "A", exitMs: T0 }, { plate: "B", exitMs: T0 + H }];
  assert.strictEqual(L.sortHistory(h)[0].plate, "B");
});

check("validateRates: integers >= 0 only", function () {
  var good = { motorcycle: 20, car: 50, cng: 30, bus: 100 };
  assert.deepStrictEqual(L.validateRates(good), []);
  assert.ok(L.validateRates({ motorcycle: -1, car: 50, cng: 30, bus: 100 }).length);
  assert.ok(L.validateRates({ motorcycle: 20.5, car: 50, cng: 30, bus: 100 }).length);
  assert.ok(L.validateRates({ motorcycle: 20, car: 50, cng: 30 }).length); // missing bus
  assert.ok(L.validateRates({ motorcycle: "abc", car: 50, cng: 30, bus: 100 }).length);
});

check("parseImport: valid round-trip + each rejection", function () {
  var good = JSON.stringify({ version: 1,
    parked: [{ plate: "GA 1", type: "car", entryMs: T0 }],
    history: [{ plate: "GA 2", type: "car", entryMs: T0, exitMs: T0 + H, fee: 50 }],
    rates: { motorcycle: 20, car: 50, cng: 30, bus: 100 } });
  var res = L.parseImport(good);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.data.parked.length, 1);
  assert.strictEqual(L.parseImport("not json").error, "invalid-json");
  assert.strictEqual(L.parseImport("{}").error, "bad-format");
  assert.strictEqual(L.parseImport(JSON.stringify({ version: 2, parked: [], history: [], rates: {} })).error, "bad-format");
  var badParked = JSON.stringify({ version: 1, parked: [{ plate: "X", type: "rocket", entryMs: T0 }], history: [], rates: { motorcycle: 0, car: 0, cng: 0, bus: 0 } });
  assert.strictEqual(L.parseImport(badParked).error, "bad-parked");
  var badHist = JSON.stringify({ version: 1, parked: [], history: [{ plate: "X", type: "car", entryMs: T0 + H, exitMs: T0, fee: 5 }], rates: { motorcycle: 0, car: 0, cng: 0, bus: 0 } });
  assert.strictEqual(L.parseImport(badHist).error, "bad-history");
  var dup = JSON.stringify({ version: 1, parked: [{ plate: "GA 1", type: "car", entryMs: T0 }, { plate: "ga 1", type: "car", entryMs: T0 }], history: [], rates: { motorcycle: 0, car: 0, cng: 0, bus: 0 } });
  assert.strictEqual(L.parseImport(dup).error, "duplicate-parked");
});

console.log("ALL " + passed + " TESTS PASSED");
