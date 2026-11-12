# E.Adj Generator — Estimated Benefits Adjustment Analysis

![version](https://img.shields.io/badge/version-0.1.0-blue)
![tests](https://img.shields.io/badge/tests-70%20unit%20%2B%2021%20browser-green)
![docx](https://img.shields.io/badge/docx--checks-39%2F39-green)
![network](https://img.shields.io/badge/network%20calls-0-green)
![template](https://img.shields.io/badge/template-11%2F25%2F2024-blue)
![office](https://img.shields.io/badge/office-single%20HTML%20file-green)
![design-system](https://img.shields.io/badge/design--system-v1.1.0%20DRAFT-yellow)

Writes the Estimated Benefits Adjustment Analysis memo (E.Adj).
One HTML file. Open it with `file://`. No server. No fetch. No install.

## What it does

The memo finds whose benefits change, and by how much. Nine sections:
Bankruptcy termination, UCEBs, §436 limitations, Payee data review,
Offsets, Successor plan determination, Asset allocation for PC3,
Benefits currently in pay (Tables 1–6), Whether assets impact benefits.

Workflow, five steps:

1. Case header (TO, FROM, CC, date, case number, plan name, BPD,
   DOPT, DOTR).
2. Download the scraper prompt.
3. Feed the prompt and the documents to an LLM (Microsoft Copilot in
   the office, any LLM at home). Upload the JSON it returns.
4. Review each of the 9 sections. Approve each one. Choose the §9
   conclusion (the app suggests one; you pick the final box).
5. Generate and download `<case>EAdj.docx` + inputs JSON + audit log.

The LLM proposes. You review and approve. Only approved JSON writes
the memo. The app never computes a benefit and never fetches PBGC
systems — participant data comes from your upload.

## Files

| File | What it is |
| --- | --- |
| `eadj-generator.html` | The app. Single file. |
| `prompts/eadj-scraper-prompt.md` | The prompt the LLM gets. |
| `schema/eadj.schema.json` | The JSON the LLM returns. |
| `samples/eadj-demo.json` | Synthetic demo (not a real case). |
| `docs/HOW_IT_WORKS.md` | Mechanics, in plain words. |
| `docs/DESIGN_SYSTEM.md` | Design tokens applied. |
| `OPEN_ITEMS.md` | Open questions and gaps. |

## Template

`Estimated Benefits Adjustment Analysis Memo - Updates 2024.docx`,
version of 11/25/2024. Plain memo, no `[[tags]]`. The app reproduces
its structure exactly: the same paragraphs, the same 16 tables, the
same footer. Fixed template text is the template's own words, verbatim.
Tables 1–6 use the template's own column widths. Header rows repeat
across pages, and data rows do not split across pages (small layout
help — see OPEN_ITEMS.md).

## Inputs (what the app guides you to upload)

- Plan documents, all eras.
- R5 Preliminary Plan Summary.
- PF factor sets, per era.
- §436 Evaluation, with its IPS number (§3).
- Participant data: SPECTRUM download from TRMD (upload as JSON).
- Estimated asset figure from the auditor (§7).
- NRAD Pension Information Profile, Funded GL Ratio (§9).
- Earnings Offsets Summary, if any (§5).
- Employee Contributions Processing Evaluation (TP 36), if any (§7).
- Successor Plan Determination (TP 61), if any (§6).

Not inputs: the DEL and the E.Adm memo. Do not attach them. The 4022(c)
amount is never paid as an estimated benefit.

## Rules

- Single HTML file, `file://`, 0 fetch.
- PBGC Design System v1.1.0 DRAFT for the GUI.
- ASD STE 100 minimal language.
- Synthetic data only. Never a live case.
- No LLM in the generation path. Human approval is a gate.
- Mandatory audit log.
- Tables 1–6 carry SSN + name, exactly as in the participant data.
  Demo rows use clearly synthetic SSNs (000-00-0001 style).

## End result

Open `eadj-generator.html`, load the demo (Maplewood Fabricators
Pension Plan, case 87654321), approve all 9 sections, download
`87654321EAdj.docx`: a 9-page memo from the 2024 template, with all 9
section heads, Tables 1–6, the §6.2 screening table, the §9 conclusion
(impacted by assets), and the footer "Version of 11/25/2024".

## Design system

PBGC Design System v1.1.0 DRAFT (COLA/Section 508 review, not
approved). Navy #002D72, blue #005BAA, gold #FFB81C, Helvetica
Neue/Arial, WCAG 2.2 AA. Dark page #000, white PBGC logo on the blue
header. See `docs/DESIGN_SYSTEM.md`.

## Test

```sh
npm test
```

Runs the unit tests (70), the browser tests (21, jsdom, file:// URL,
incl. the opaque-origin storage-throwing case), and the docx check
(39 checks, python-docx on the demo memo).

## Build

```sh
python3 scripts/build_single_file.py
```

Injects the scraper prompt into the HTML and runs the safety checks
(0 fetch, 0 script src, 0 link, 0 external URLs, logo embedded).
