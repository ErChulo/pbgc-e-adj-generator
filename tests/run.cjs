"use strict";
/* Unit tests for the E.Adj Generator (no DOM needed — vm sandbox).
   Usage: node tests/run.cjs */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "eadj-generator.html"), "utf-8");
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("no <script> block"); process.exit(1); }
const sandbox = { console, TextEncoder, Blob, URL, File, setTimeout };
vm.createContext(sandbox);
vm.runInContext(m[1], sandbox);
const EADJ = sandbox.EADJ;

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log("ok: " + label); }
  else { failed++; console.log("FAIL: " + label); }
}
function hasError(res, sub) {
  return res.errors.some((e) => e.indexOf(sub) >= 0);
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }

const demo = EADJ.DEMO;
const demoFile = JSON.parse(fs.readFileSync(path.join(ROOT, "samples", "eadj-demo.json"), "utf-8"));
ok(JSON.stringify(demo) === JSON.stringify(demoFile), "embedded demo matches samples/eadj-demo.json");
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "schema", "eadj.schema.json"), "utf-8"));
ok(schema.required.indexOf("caseData") >= 0 && schema.required.indexOf("sections") >= 0, "schema requires caseData + sections");

// prompt embedded
ok(typeof sandbox.EADJ_SCRAPER_PROMPT === "string" && sandbox.EADJ_SCRAPER_PROMPT.length > 1000,
  "scraper prompt embedded (" + sandbox.EADJ_SCRAPER_PROMPT.length + " chars)");
ok(sandbox.EADJ_SCRAPER_PROMPT.indexOf("Funded GL Ratio") >= 0, "prompt covers Funded GL Ratio");
ok(sandbox.EADJ_SCRAPER_PROMPT.indexOf("Table 6") >= 0, "prompt covers Table 6");

// validation: demo is valid
let res = EADJ.validate(demo);
ok(res.ok && res.errors.length === 0, "demo JSON validates (0 errors)");
ok(res.warnings.length === 0, "demo JSON has 0 warnings");

// §9 conclusion suggestion
ok(EADJ.suggestConclusion({ c91: false, c92: true, c93: false, c94: false, c95: false }) === "impacted", "§9: 9.2 checked -> impacted");
ok(EADJ.suggestConclusion({ c91: false, c92: false, c93: false, c94: false, c95: false }) === "notImpacted", "§9: none checked -> not impacted");
ok(EADJ.suggestConclusion({ c91: false, c92: false, c93: false, c94: false, c95: true, fundedGlRatio: 85 }) === "impacted", "§9: 9.5 + ratio 85 -> impacted");
ok(EADJ.suggestConclusion({ c91: false, c92: false, c93: false, c94: false, c95: true, fundedGlRatio: 80 }) === "impacted", "§9: 9.5 + ratio 80 -> impacted (boundary)");
ok(EADJ.suggestConclusion({ c91: false, c92: false, c93: false, c94: false, c95: true, fundedGlRatio: 79 }) === "notImpacted", "§9: 9.5 + ratio 79 -> not impacted");
ok(EADJ.suggestConclusion({ c91: false, c92: false, c93: false, c94: false, c95: true, fundedGlRatio: null }) === null, "§9: 9.5 + no ratio -> cannot compute");

// validation errors
let bad = clone(demo); delete bad.sections.s3;
ok(!EADJ.validate(bad).ok && hasError(EADJ.validate(bad), "sections.s3 is required"), "error: missing s3");
bad = clone(demo); bad.sections.s3.outcome = "3.4"; bad.sections.s3.limitations = [];
ok(hasError(EADJ.validate(bad), "s3.limitations is required"), "error: 3.4 without limitations");
bad = clone(demo); bad.sections.s3.outcome = "3.2"; bad.sections.s3.ipsNumber = null;
ok(hasError(EADJ.validate(bad), "s3.ipsNumber is required"), "error: 3.2 without IPS number");
bad = clone(demo); bad.sections.s3.outcome = "3.1"; bad.sections.s3.ipsNumber = null;
ok(EADJ.validate(bad).ok, "ok: 3.1 needs no IPS number");
bad = clone(demo); bad.sections.s2.answer = "yes"; bad.sections.s2.eventDates = null;
ok(hasError(EADJ.validate(bad), "s2.eventDates is required"), "error: §2 yes without event dates");
bad = clone(demo); bad.sections.s4.forms = [];
ok(hasError(EADJ.validate(bad), "s4.forms is required"), "error: §4 yes without forms");
bad = clone(demo); bad.sections.s4.q2 = "yes"; bad.sections.s4.ipsLocation = null;
ok(hasError(EADJ.validate(bad), "s4.ipsLocation is required"), "error: §4 q2 yes without IPS location");
bad = clone(demo); bad.sections.s5.description = null;
ok(hasError(EADJ.validate(bad), "s5.description is required"), "error: §5 yes without description");
bad = clone(demo); bad.sections.s6.screening.mgb = "yes";
ok(hasError(EADJ.validate(bad), "outcome 6.2 requires all screening answers No"), "error: §6.2 with a Yes answer");
bad = clone(demo); bad.sections.s6.outcome = "6.3"; bad.sections.s6.ipsNumber = null;
ok(hasError(EADJ.validate(bad), "s6.ipsNumber is required"), "error: §6.3 without IPS number");
bad = clone(demo); bad.sections.s6.outcome = "6.3"; bad.sections.s6.isSuccessor = null; bad.sections.s6.screening.mgb = "yes";
ok(hasError(EADJ.validate(bad), "s6.isSuccessor"), "error: §6.3 without isSuccessor");
bad = clone(demo); bad.sections.s6.outcome = "6.3";
ok(hasError(EADJ.validate(bad), "outcome 6.3 requires at least one screening answer Yes"), "error: §6.3 with all screening No");
bad = clone(demo); bad.sections.s6.outcome = "6.3"; bad.sections.s6.screening.mgb = "yes"; bad.sections.s6.ipsNumber = "IPS 9C #1"; bad.sections.s6.isSuccessor = "yes";
ok(EADJ.validate(bad).ok, "ok: §6.3 with one Yes + IPS + isSuccessor");
bad = clone(demo); bad.sections.s9.c93ab = null;
ok(hasError(EADJ.validate(bad), "s9.c93ab"), "error: §9 9.3 checked without A/B");
bad = clone(demo); bad.sections.s9.fundedGlRatio = null;
ok(hasError(EADJ.validate(bad), "s9.fundedGlRatio is required"), "error: §9 9.5 without Funded GL Ratio");
bad = clone(demo); bad.sections.s8.tables.t1[0].ssn = "";
ok(hasError(EADJ.validate(bad), "s8.tables.t1 row 1: ssn is required"), "error: Table 1 row without SSN");
bad = clone(demo); bad.sections.s8.counts.supplements = -1;
ok(hasError(EADJ.validate(bad), "s8.counts.supplements must be an integer"), "error: negative count");
bad = clone(demo); bad.caseData.dopt = "30/06/2024";
ok(hasError(EADJ.validate(bad), "caseData.dopt is required"), "error: non-ISO DOPT");
bad = clone(demo); bad.caseData.caseNumber = "87654321";
ok(EADJ.validate(bad).ok, "ok: case number kept as text");

// warnings (not errors)
bad = clone(demo); bad.sections.s8.tables.t1 = [];
res = EADJ.validate(bad);
ok(res.ok && res.warnings.length > 0 && res.warnings.some((w) => w.indexOf("Table 1 is empty") >= 0),
  "warning: supplements count > 0 but Table 1 empty");
bad = clone(demo); bad.sections.s7.pc3Done = "no";
res = EADJ.validate(bad);
ok(res.ok && res.warnings.some((w) => w.indexOf("PC3 analysis is required") >= 0),
  "warning: §7 q2 yes but PC3 not done");

// document.xml content
const xml = EADJ.buildDocumentXml(demo, "impacted");
["1. Plan Termination during Bankruptcy",
 "2. Shutdown or other Unpredictable Contingent Event Benefits (UCEBs)",
 "3. Benefit Restrictions for Underfunded Pension Plans (IRC §436 Limitations)",
 "4. Payee Data Review for Future Changes in Benefits",
 "5. Offsets from Another Plan or a Partial Payment of Benefits",
 "6. Successor Plan Determination",
 "7. Estimated Asset Allocation and Funding for PC3",
 "8. Review Benefits Currently in Pay and Identify Payees for Benefit Adjustments",
 "9. Estimated Determination of Whether Assets Impact Participants' Benefits"
].forEach((h) => ok(xml.indexOf(h) >= 0, "doc contains section head: " + h.slice(0, 30) + "..."));
["Table 1: Participant(s) Receiving Supplements as of DOPT",
 "Table 2: Participants Receiving Benefits That Should Have Been Reduced",
 "Table 3: Participant(s) Whose Benefits Exceed the Maximum Guaranteed Benefit",
 "Table 4: Participant(s) Affected by Phase-In Limitations",
 "Table 5: Participant(s) Affected by the Aggregate Limit",
 "Table 6: Participant(s) Affected by Majority Owner Limitation"
].forEach((c) => ok(xml.indexOf(c) >= 0, "doc contains caption: " + c.slice(0, 30) + "..."));
ok(xml.indexOf("000-00-0001") >= 0, "doc contains synthetic SSN 000-00-0001");
ok(xml.indexOf("$2,450.00") >= 0, "doc contains formatted money $2,450.00");
ok(xml.indexOf("87654321") >= 0, "doc contains case number");
ok(xml.indexOf("Maplewood Fabricators Pension Plan") >= 0, "doc contains plan name");
ok(xml.indexOf("☒  Participants' benefits are estimated to be impacted by assets because either:") >= 0,
  "doc: impacted conclusion box checked");
ok(xml.indexOf("☐  Participants' benefits are estimated to not be impacted by assets because either:") >= 0,
  "doc: not-impacted conclusion box unchecked");
const xml2 = EADJ.buildDocumentXml(demo, "notImpacted");
ok(xml2.indexOf("☐  Participants' benefits are estimated to be impacted by assets because either:") >= 0,
  "doc: notImpacted flips the impacted box");
ok(xml2.indexOf("☒  Participants' benefits are estimated to not be impacted by assets because either:") >= 0,
  "doc: notImpacted flips the not-impacted box");
ok(xml.indexOf("CONCURRENCE:") >= 0, "doc contains concurrence block");
ok(xml.indexOf("Would the successor plan determination affect:") >= 0, "doc contains §6.2 screening table");
ok(xml.indexOf('w:w="10416"') >= 0, "doc uses template table width 10416 (Tables 1-6)");
ok(xml.indexOf("<w:tblHeader") >= 0, "doc repeats table header rows across pages");

// buildDocx: valid zip with footer
const bytes = EADJ.buildDocx(demo, "impacted");
ok(bytes[0] === 0x50 && bytes[1] === 0x4B, "docx starts with PK signature");
const asText = Buffer.from(bytes).toString("latin1");
ok(asText.indexOf("[Content_Types].xml") >= 0, "docx contains [Content_Types].xml");
ok(asText.indexOf("word/document.xml") >= 0, "docx contains word/document.xml");
ok(asText.indexOf("Version of 11/25/2024") >= 0, "docx footer carries version 11/25/2024");
ok(asText.indexOf("Times New Roman") >= 0, "docx uses Times New Roman");

// 0 fetch / 0 external refs (OOXML namespace URIs are identifiers, not fetches)
const script = m[1];
ok(script.indexOf("fetch(") < 0, "no fetch( in script");
ok(script.indexOf("XMLHttpRequest") < 0, "no XMLHttpRequest");
ok(html.indexOf("<script src") < 0 && html.indexOf("<link") < 0, "no <script src or <link");
const clean = html.replace(/http:\/\/schemas\.openxmlformats\.org\//g, "").replace(/http:\/\/purl\.org\/dc\/elements\/1\.1\//g, "");
ok(clean.indexOf("http://") < 0 && clean.indexOf("https://") < 0, "no external URLs in HTML");

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
