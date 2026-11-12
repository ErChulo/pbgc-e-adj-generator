"use strict";
/* Browser tests for the E.Adj Generator (jsdom, file:// URL).
   Covers: app mounts, demo load -> validate -> review -> approve all,
   opaque-origin storage-throwing regression (DEL bug), 0 external refs.
   Usage: node tests/browser.cjs */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "eadj-generator.html"), "utf-8");

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log("ok: " + label); }
  else { failed++; console.log("FAIL: " + label); }
}

async function main() {
  // 1. Normal load from a file:// URL
  const dom = new JSDOM(html, {
    url: "file:///eadj-generator.html",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true
  });
  await new Promise((r) => dom.window.addEventListener("load", r));
  const doc = dom.window.document;
  ok(doc.querySelector("h1") && doc.querySelector("h1").textContent === "E.Adj Generator",
    "app mounts: h1 E.Adj Generator");
  ok(!doc.getElementById("step-1").hidden, "step 1 visible on load");
  ok(doc.querySelectorAll("script[src]").length === 0, "no external scripts");
  ok(doc.querySelectorAll("link").length === 0, "no link elements");

  // 2. Demo flow: load demo -> validate -> review -> approve all
  doc.getElementById("btn-load-demo").click();
  const valText = doc.getElementById("validation-result").textContent;
  ok(valText.indexOf("Valid") >= 0, "demo validates in browser (" + valText.slice(0, 40) + ")");
  ok(!doc.getElementById("btn-to-review").disabled, "review button enabled after valid JSON");
  ok(doc.getElementById("f-caseNumber").value === "87654321", "case header filled from demo (87654321)");
  ok(doc.getElementById("f-planName").value === "Maplewood Fabricators Pension Plan", "plan name filled from demo");
  doc.getElementById("btn-to-review").click();
  const secs = doc.querySelectorAll("#review-list .review-sec");
  ok(secs.length === 9, "review renders 9 sections (got " + secs.length + ")");
  ok(doc.getElementById("btn-to-download").disabled, "download blocked until all approved");
  doc.querySelectorAll("#review-list .approve-row input[type=checkbox]").forEach((cb) => {
    cb.checked = true;
    cb.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
  ok(!doc.getElementById("btn-to-download").disabled, "download enabled after all 9 approved");
  // §9 conclusion radio follows the suggestion (impacted for the demo)
  const s9 = doc.getElementById("review-s9");
  const checkedRadio = s9.querySelector("input[name=s9-conclusion]:checked");
  ok(checkedRadio && checkedRadio.value === "impacted", "§9 conclusion defaults to suggested impacted");
  // tables render in §8 review
  const s8 = doc.getElementById("review-s8");
  ok(s8.querySelectorAll("table.data").length === 6, "§8 review shows Tables 1-6");
  ok(s8.textContent.indexOf("000-00-0001") >= 0, "§8 review shows synthetic SSN");

  // 3. Opaque origin: localStorage throws SecurityError (DEL bug regression)
  let threw = false;
  let dom2 = null;
  try {
    dom2 = new JSDOM(html, {
      url: "about:blank",
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true
    });
    await new Promise((r) => dom2.window.addEventListener("load", r));
  } catch (e) { threw = true; console.log("opaque-origin load threw: " + e.message); }
  ok(!threw, "opaque origin (about:blank) does not throw");
  if (dom2) {
    ok(dom2.window.document.querySelector("h1") && dom2.window.document.querySelector("h1").textContent === "E.Adj Generator",
      "app mounts on opaque origin");
    ok(!dom2.window.document.getElementById("step-1").hidden, "step 1 visible on opaque origin");
  }

  // 4. Storage that throws on every call (beforeParse hook)
  let threw2 = false;
  let dom3 = null;
  try {
    dom3 = new JSDOM(html, {
      url: "file:///eadj-generator.html",
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
      beforeParse(window) {
        const bad = {
          getItem() { throw new Error("storage blocked"); },
          setItem() { throw new Error("storage blocked"); },
          removeItem() { throw new Error("storage blocked"); }
        };
        Object.defineProperty(window, "localStorage", { value: bad, configurable: true });
      }
    });
    await new Promise((r) => dom3.window.addEventListener("load", r));
  } catch (e) { threw2 = true; console.log("storage-throwing load threw: " + e.message); }
  ok(!threw2, "throwing localStorage does not kill the app");
  if (dom3) {
    ok(dom3.window.document.querySelector("h1").textContent === "E.Adj Generator",
      "app mounts with throwing storage");
  }

  // 5. Invalid JSON shows errors, review stays blocked
  const dom4 = new JSDOM(html, {
    url: "file:///eadj-generator.html",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true
  });
  await new Promise((r) => dom4.window.addEventListener("load", r));
  const d4 = dom4.window.document;
  d4.getElementById("json-input").value = '{"caseData": {}}';
  d4.getElementById("btn-validate").click();
  ok(d4.getElementById("validation-result").textContent.indexOf("error") >= 0,
    "invalid JSON shows errors");
  ok(d4.getElementById("btn-to-review").disabled, "review stays blocked on invalid JSON");

  console.log("\n" + passed + " passed, " + failed + " failed");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error("browser test crashed: " + e.message); process.exit(1); });
