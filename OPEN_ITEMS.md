# Open items — E.Adj Generator v0.1.0

Nothing invented. Where a PBGC source is missing, the item stays open
here. Full research: `~/workspace/pbgc_review/eadj/EADJ_Reference_Inventory_DRAFT.md`.

## Gaps from the research (not blocking the build)

1. **TP 14, TP 51, TP 61 — no standalone files found.** The template
   cites them; the Book of Job has no separate TP text files. The app
   follows the template's own wording and rules. Herick has never seen
   TP text — he works from the templates/policies.
2. **Policy 5.11-2 and 5.13-1 — texts not found.** Cited by guidance;
   not in the Book of Job copies searched.
3. **Actuarial Technical Manual and Policy Bulletin 00-3 — not found.**
4. **No filled E.Adj example file.** No completed memo to compare
   against. The demo is synthetic.
5. **Deck says 8 sections, template has 9.** The template wins: the
   app covers all 9 sections.
6. **"Ask OPD" vs "Ask PPD" unresolved.** The template says "contact
   Ask OPD". The app keeps the template's words.
7. **§9 conclusion branches overlap as written.** Resolved by decision
   (below): the app suggests, the actuary chooses.
8. **Tables 1–6 carry SSN as the first column.** Demo and test rows
   use clearly synthetic SSNs (000-00-0001 style) and synthetic names
   only. Real case data comes from the user's own upload, never stored
   in the repo.
9. **§6.3 with all screening answers No.** The template says complete
   a determination if 6.1 or 6.2 do not apply. The app treats all-No
   as 6.2 (not needed) and requires at least one Yes for 6.3.
10. **Template table runs use MS Gothic in places.** The document
    defaults are Times New Roman 11pt. The generator uses Times New
    Roman throughout, per the document defaults.

## Decisions made in this build

- **§9 conclusion:** the app computes a suggestion — impacted if any
  of 9.1–9.4 is checked, or 9.5 applies and the Funded GL Ratio is
  80% or higher; else not impacted. The actuary chooses the final box
  in review. The memo shows the chosen box checked.
- **§6.2 screening:** a determination is needed if any answer is Yes;
  N/A counts as not-Yes. N/A is allowed only for the substantial-owner
  and majority-owner questions.
- **Header fields take names only.** The app adds the role text (for
  example, `, CSD Branch 2A`). The ASD section field takes the code
  only (for example, `D`).
- **4022(c) amount is never paid as an estimated benefit.** The app
  never asks for it and the prompt says so.
- **§3 is the §436 Evaluation's outcome, not a re-derivation.** The
  app records the outcome and the IPS number.
- **§5 earnings offsets are recorded only.** PBGC does not apply
  earnings offsets in estimated benefits (Policy 6.2-1 §B).

## Layout notes (deviations from the template, layout only)

- **Table header rows repeat across pages.** The template does not set
  this. Added so a table split across pages keeps its headers.
- **Data rows do not split across pages.** Added so a participant row
  never breaks mid-row.
- **Tables 1–6 are 10416 dxa wide**, the template's own widths — wider
  than the 9360 text width, as in the template.

## Not yet done

- **Not run against a real LLM.** The demo JSON is hand-written
  synthetic data. A real Copilot/LLM round-trip is untested.
- **Not opened in a desktop browser.** jsdom tests pass; a real
  file:// open on the office desktop is still to do.
- **Office test pending.** Run a real plan end to end and report what
  breaks.
