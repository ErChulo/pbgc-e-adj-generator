# How it works — E.Adj Generator v0.1.0

End-to-end mechanics, in plain words. One HTML file, opened with
`file://`. No server, no fetch, no install.

## The five steps

### 1. Case header

You type the memo header: TO (EBLS, Auditor, Serco), FROM (actuary,
section, contract actuary, firm), CC (Benefits Specialist Supervisor),
memo date, PBGC case number, plan name, BPD, DOPT, DOTR. Case number
is text — leading zeros are kept.

Type names only in the TO/FROM/CC fields. The app adds the role text
(for example, `, CSD Branch 2A` after the EBLS name). Type the ASD
section code only (for example, `D` — the app renders `ASD/D`).

### 2. Scraper prompt

Download `eadj-scraper-prompt.md`. Feed it, with the plan documents
and the associated documents, to your LLM (Microsoft Copilot in the
office, any LLM at home). The prompt covers all 9 sections, the §3.1–
3.4 selector with IPS numbers, the §6.2 screening answers, the §7 PC3
flags, the §8 counts and Tables 1–6 rows, and the §9 checkboxes with
the Funded GL Ratio. Citations are required. No guessing: a missing
answer is returned as missing, never invented.

Do not attach the DEL or the E.Adm memo. They are not E.Adj inputs.

### 3. JSON import

Paste or upload the JSON the LLM returns. The app checks it against
`schema/eadj.schema.json` and against the E.Adj rules:

- Every section present (§1–§9).
- §2 yes needs event dates. §3.4 needs at least one limit (b/c/d/e).
  §3.2–3.4 need an IPS number.
- §4 yes needs the forms listed; §4 Q2 yes needs an IPS location.
- §5 yes needs the offset types and a description.
- §6.2 needs all six screening answers No (or N/A for the owner
  questions). §6.3 needs at least one Yes, an IPS number, and whether
  the plan is a successor.
- §7 Q2 yes should have a PC3 analysis done.
- §8 counts must be integers, 0 or more. Table rows need SSN, name,
  and monthly benefit. A count above 0 with an empty table warns.
- §9: 9.3 checked needs A or B. 9.5 checked needs a Funded GL Ratio.

Errors block review. Warnings do not — they are shown, and you decide.

### 4. Review

Nine sections, one card each. Each card shows a summary, the facts,
the citation, and (for §8) Tables 1–6. Approve each section to
continue. Nothing is approved by default.

§9 shows the app's suggested conclusion next to the checkboxes:

- Impacted by assets if one or more of 9.1–9.4 is checked, or 9.5
  applies and the Funded GL Ratio is 80% or higher.
- Not impacted if none of 9.1–9.4 is checked, or 9.5 applies and the
  ratio is below 80%.

You choose the final box. The memo shows the box you chose. If 9.5
applies and no ratio is given, the app cannot suggest — you must
enter the ratio first (Step 3 flags it as an error).

### 5. Download

- `<case>EAdj.docx` — the filled memo from the 2024 template.
- `<case>-eadj-inputs.json` — the approved inputs, for the record.
- `<case>-eadj-audit.log` — every action, with time stamps.

## The memo it writes

The 2024 template, version of 11/25/2024, reproduced exactly:

- MEMORANDUM header, TO/FROM/CC/DATE/SUBJECT, case block (case
  number, plan name, BPD, DOPT, DOTR), Purpose.
- §1–§9 with the template's own wording, references, and guidance.
  Only the selected §3 outcome (3.1–3.4) and the selected §6 outcome
  (6.1–6.3) appear; the others are deleted, as the template instructs.
- §6.2 screening table (6 questions, Yes/No/N/A) with the rule note.
- Tables 1–6 with the template's exact column headers and column
  widths. Table 6 sits in §9, as in the template.
- §9 checkboxes (☒/☐), the conclusion with the chosen box checked,
  the Funded GL Ratio line when given.
- CONCURRENCE block — signature line, Name/Title, Date. The app does
  not fill it. A human signs.
- Footer: "Estimated Benefits Adjustment Analysis Memo", page number,
  "Version of 11/25/2024".

## What the app never does

- No network calls. No server. No fetch. No CDN.
- No LLM in the generation path. The LLM only proposes JSON.
- No benefit calculation. The app copies the actuary's numbers into
  the memo; it does not compute them.
- No data stored on a server. Inputs stay in your browser until you
  download them. The app does not persist case data (only a theme
  preference, if storage works — and it still loads when storage is
  blocked, as on an opaque origin).
