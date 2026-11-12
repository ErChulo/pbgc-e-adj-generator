"use strict";
/* Generate the demo E.Adj memo using the HTML's own code.
   Usage: node scripts/gen_demo_docx.cjs [out.docx] */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const OUT = process.argv[2] || path.join(ROOT, "samples", "eadj-demo.docx");

const html = fs.readFileSync(path.join(ROOT, "eadj-generator.html"), "utf-8");
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("no <script> block"); process.exit(1); }
const sandbox = { console, TextEncoder, Blob, URL, File, setTimeout };
vm.createContext(sandbox);
vm.runInContext(m[1], sandbox);
const EADJ = sandbox.EADJ;
const demo = EADJ.DEMO;
const conclusion = EADJ.suggestConclusion(demo.sections.s9);
const bytes = EADJ.buildDocx(demo, conclusion);
fs.writeFileSync(OUT, Buffer.from(bytes));
console.log("Wrote " + OUT + " (" + bytes.length + " bytes, " + demo.caseData.caseNumber + "EAdj.docx, conclusion " + conclusion + ")");
