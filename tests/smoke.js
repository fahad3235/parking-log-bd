// Headless-Chrome smoke test for parking-log-bd via raw CDP.
// Run: node tests/smoke.js   (uses the stock Playwright headless_shell binary)
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const BIN = process.env.HOME + "/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell";
const PAGE = "file://" + path.resolve(__dirname, "..", "index.html");
const PORT = 9333;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function getWsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch("http://127.0.0.1:" + PORT + "/json/version");
      const j = await res.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch (e) { /* not up yet */ }
    await sleep(200);
  }
  throw new Error("CDP endpoint never came up");
}

async function main() {
  const proc = spawn(BIN, [
    "--headless", "--no-sandbox", "--disable-gpu",
    "--remote-debugging-port=" + PORT, "--remote-debugging-address=127.0.0.1",
    "about:blank"
  ], { stdio: "ignore" });
  const errors = [];
  let ws, nextId = 1;
  const pending = new Map();
  let sessionId = null;
  try {
    const url = await getWsUrl();
    ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.method === "Runtime.exceptionThrown") {
        errors.push("exception: " + JSON.stringify(msg.params.exceptionDetails.exception));
      }
      if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        errors.push("console.error: " + JSON.stringify(msg.params.args));
      }
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      }
      if (msg.method === "Page.loadEventFired" && loadWaiter) {
        const w = loadWaiter; loadWaiter = null; w();
      }
    };
    let loadWaiter = null;
    const send = (method, params, sess) => new Promise((res, rej) => {
      const id = nextId++;
      pending.set(id, { res, rej });
      const payload = { id, method, params: params || {} };
      if (sess) payload.sessionId = sess;
      ws.send(JSON.stringify(payload));
    });
    const waitLoad = () => new Promise((r) => { loadWaiter = r; });

    await send("Target.createTarget", { url: PAGE });
    // Find the target id via Target.getTargets
    const targets = await send("Target.getTargets");
    const pageTarget = targets.targetInfos.find((t) => t.url === PAGE);
    if (!pageTarget) throw new Error("page target not found");
    const attached = await send("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true });
    sessionId = attached.sessionId;
    await send("Runtime.enable", {}, sessionId);
    await send("Page.enable", {}, sessionId);
    await send("Page.navigate", { url: PAGE }, sessionId);
    await waitLoad();
    await sleep(500);

    // Fresh state: clear storage, reload, then run the flow.
    await send("Runtime.evaluate", { expression: "localStorage.clear()", returnByValue: true }, sessionId);
    await send("Page.navigate", { url: PAGE }, sessionId);
    await waitLoad();
    await sleep(500);

    const flow = `(function(){
      var out = [];
      function ok(name, cond){ out.push((cond ? 'PASS' : 'FAIL') + ': ' + name); }
      function $(id){ return document.getElementById(id); }
      ok('title mentions Parking Log', document.title.indexOf('Parking Log') !== -1);
      $('lang-toggle').click();
      ok('lang toggle switches title to Bangla', $('app-title').textContent === 'পার্কিং লগ বিডি');
      $('lang-toggle').click();
      ok('lang toggle back to English', $('app-title').textContent === 'Parking Log BD');
      $('in-plate').value = 'METRO-GA 12-3456';
      $('in-type').value = 'car';
      $('in-entry').value = '2026-11-03T10:00';
      $('btn-checkin').click();
      ok('check-in adds parked card', $('parked-list').textContent.indexOf('METRO-GA 12-3456') !== -1);
      ok('dashboard parked = 1', $('dash-parked').textContent.trim() === '1');
      $('in-plate').value = 'metro-ga 12-3456';
      $('in-type').value = 'car';
      $('in-entry').value = '2026-11-03T10:00';
      $('btn-checkin').click();
      ok('duplicate plate rejected with error', $('checkin-err').textContent.length > 0);
      $('parked-list').querySelector('.exit-btn').click();
      var zone = $('parked-list').querySelector('.exit-zone');
      ok('exit form opens', !!zone && zone.style.display === 'block');
      zone.querySelector('.exit-time').value = '2026-11-03T12:30';
      zone.querySelector('.exit-time').dispatchEvent(new Event('change', { bubbles: true }));
      ok('fee preview shows taka amount', zone.querySelector('.fee-line').textContent.indexOf('৳') !== -1);
      zone.querySelector('.confirm-btn').click();
      ok('history lists the exited plate', $('history-list').textContent.indexOf('METRO-GA 12-3456') !== -1);
      ok('dashboard parked back to 0', $('dash-parked').textContent.trim() === '0');
      ok('dashboard exits today = 1', $('dash-exits').textContent.trim() === '1');
      ok('history shows fee', $('history-list').textContent.indexOf('৳') !== -1);
      return JSON.stringify(out);
    })()`;

    const evalRes = await send("Runtime.evaluate", { expression: flow, returnByValue: true }, sessionId);
    if (evalRes.exceptionDetails) {
      console.log("FLOW EXCEPTION: " + JSON.stringify(evalRes.exceptionDetails, null, 1).slice(0, 2000));
      process.exitCode = 1;
      return;
    }
    const lines = JSON.parse(evalRes.result.value);
    lines.forEach((l) => console.log(l));
    const failed = lines.filter((l) => l.startsWith("FAIL"));
    console.log("page errors: " + errors.length);
    errors.forEach((e) => console.log("  ERR " + e));
    if (failed.length || errors.length) {
      console.log("SMOKE FAILED");
      process.exitCode = 1;
    } else {
      console.log("SMOKE PASSED (" + lines.length + " checks, 0 page errors)");
    }
  } finally {
    try { ws && ws.close(); } catch (e) {}
    proc.kill("SIGKILL");
  }
}
main().catch((e) => { console.error("smoke harness error:", e.message); process.exit(1); });
