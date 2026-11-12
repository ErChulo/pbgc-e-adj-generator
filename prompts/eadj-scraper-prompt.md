# E.Adj — Estimated Benefits Adjustment Analysis Scraper Prompt

Use this prompt with an LLM of your choice. Attach the plan documents
**and** the other associated documents — plan document, amendments,
restatements, union contracts, the R5 Preliminary Plan Summary, the PF
factor sets per era, the §436 Evaluation (with its IPS number),
participant data (SPECTRUM download from TRMD), the estimated asset
figure from the auditor, the NRAD Pension Information Profile (Funded
GL Ratio), the Earnings Offsets Summary if any, the Employee
Contributions Processing Evaluation (TP 36) if any, and the Successor
Plan Determination (TP 61) if any — together with this prompt. The LLM
must return **only** the JSON payload described below. That JSON is a
*proposal*: it is fed back into the E.Adj Generator app, validated
against `schema/eadj.schema.json`, reviewed by a human section by
section, and only approved JSON is used to write the Estimated Benefits
Adjustment Analysis memo. The LLM never fills the memo and never
decides an ambiguous answer on its own.

Do **not** attach the DEL or the E.Adm memo. They are not E.Adj inputs.
The 4022(c) amount is never paid as an estimated benefit — do not
return it as an input to estimated benefits.

## Your task

You are preparing the Estimated Benefits Adjustment Analysis memo for a
terminated defined-benefit pension plan. For each of the 9 sections
below, find the answer in the documents, state the facts and
circumstances, and give the citation (document, section, page) where
each answer comes from. Return the answers as JSON matching the schema
in `schema/eadj.schema.json` (also summarised in "Output format" below).

## Rules

- **Summarise, do not copy verbatim — ASD STE 100 minimal style.**
  Every facts text must be the **smallest string that conveys the
  meaning**: a noun phrase or short clause, never a full paragraph,
  one idea per line. Keep ages, service years, percentages, dollar
  amounts, and dates **exact**. Standard abbreviations: `yr`/`yrs`,
  `mo`, `hrs`, `%`, `§`, `excl.`, `equiv.`, `avg comp`, `svc`
  (service). If stripping verbiage would lose meaning (a condition,
  an exception, a date), keep the longer form and say why in `note`.
  A longer value that is still true beats a minimal value that is
  wrong.
- **One entry per section.** Every one of the 9 sections must be
  present in `sections`. Do not omit a section.
- **Yes/No answers.** Sections 1, 2, 4, 5, 7 take `yes` or `no`.
  Section 3 takes one outcome: `3.1`, `3.2`, `3.3`, or `3.4`.
  Section 6 takes one outcome: `6.1`, `6.2`, or `6.3`. Section 9
  takes true/false for each of 9.1–9.5.
- **Citation for every answer**: document name, page number, and plan
  section number in the JSON `citation` object. No citation, no
  answer. The app renders it as a minimal code, e.g. `D1 §2.1 p3`
  (D1 = first document, § = plan section, p = page) — the full
  document name lives once in the sources list, never repeated in a
  cell.
- **Tables 1–6 rows: SSN and name exactly as in the participant data
  you were given.** The memo's tables have SSN as the first column
  and Participant Name as the second. Copy both exactly from the
  SPECTRUM participant data. Do not invent a participant, do not
  invent a name, and do not complete a masked or partial SSN — if the
  SSN is masked in your source, return the masked form as given and
  say so in `note`. Money is a number (dollars, monthly), no currency
  symbol, no commas. Dates are ISO format `YYYY-MM-DD`.
- **Dates are ISO format `YYYY-MM-DD`. Case number is text, with
  leading zeros preserved (never a number).**
- **Do not guess.** A missing or ambiguous answer is a correct
  answer. A guessed value is an error. If you cannot find an answer,
  set the section to `no` with facts "Not found in the documents
  provided" and say so in `note` — do not invent a provision.
- **Never return a full masked value** (no full SSN, no full account
  number) beyond what the participant data you were given already
  contains.

## Section 1 — Plan Termination during Bankruptcy (Policy 5.14-1)

Rule: if a plan terminates while the sponsor is in bankruptcy, and the
sponsor filed on or after 09/16/2006, PPA 2006 requires the Bankruptcy
Petition Date (BPD) to be treated as the Date of Plan Termination
(DOPT) for (1) the benefits PBGC guarantees, and (2) the amount of
benefits in priority category 3 (PC3).

Answer two questions, yes or no each:

- `q1`: Did the plan sponsor file for bankruptcy on or after
  09/16/2006?
- `q2`: Did the plan terminate while the company was in bankruptcy?

If yes to both: use BPD for guarantees and PC3 allocation. State the
facts and circumstances, including the date of the event(s). If no to
either: no further action is required — say so in `facts`.

## Section 2 — Shutdown or other Unpredictable Contingent Event Benefits, UCEBs (Policy 5.14-3)

Rule: benefit increases from a shutdown or other unpredictable
contingent event are phased in as if a plan amendment had been adopted
on the date the event occurred. In plans with "creep provisions", the
phase-in date is the end of the creep period. UCEB payment may be
further limited by IRC §436, addressed in Section 3.

Question: does the plan provide shutdown, supplemental, unreduced, or
other early retirement benefits due to an unpredictable contingent
event (for example, permanent shutdown, permanent lay-off, etc.) that
occurred on or after 07/27/2005?

- If yes: give the date(s) of the event(s) in `eventDates` and state
  the facts.
- If no: state the facts and circumstances.

## Section 3 — Benefit Restrictions for Underfunded Pension Plans, IRC §436 Limitations (Policy 5.14-2, TP 14)

Rule: IRC §436 places restrictions on certain benefit accruals and
payments based on the adjusted funding target attainment percentage
(AFTAP) for a plan's year beginning with PY2008 for most plans. These
limitations may affect the calculation, valuation, and/or payment of
benefits by PBGC.

Read the §436 Evaluation and select the most applicable outcome.
Delete the others (the app keeps only the one you select):

- `3.1`: DOPT was before FD-PY2008. IRC §436 did not apply.
- `3.2`: Based on the §436 Evaluation, IPS # (give the number), the
  plan did not provide benefits that were potentially subject to the
  §436 limitations.
- `3.3`: Based on the §436 Evaluation, IPS # (give the number), none
  of the §436 limitations were applicable.
- `3.4`: Based on the §436 Evaluation, IPS # (give the number), the
  following §436 limitations were applicable — list only those that
  apply in `limitations`: `b` (UCEB), `c` (plan amendments increasing
  plan liabilities), `d` (prohibited payments), `e` (benefit
  accruals).

Do not re-derive §436. The §436 Evaluation is the source; record its
outcome and its IPS number.

## Section 4 — Payee Data Review for Future Changes in Benefits (Process 9.6)

Question 1: does the plan provide for any non-level benefits or other
benefit forms that may require future benefit adjustments at a certain
date? Examples include:

- Benefit forms with step-downs, such as those providing a Social
  Security offset starting at age 62.
- Benefit forms with step-up increases on a certain date.
- Disability benefits that convert at early or normal retirement
  dates.
- Remainders of period-certain benefits being paid to beneficiaries,
  such as five-year certain & continuous (5C&C) benefits, that will
  end on a certain date.
- Temporary or other supplements (see Policy 6.2-1 and TP 51).
- Temporary recoupments instituted by the prior plan sponsor before
  DOPT for overpayments.

- If yes: list each form in `forms` and state the facts. Continue to
  Question 2.
- If no: state the facts and circumstances.

Question 2: are any participants receiving benefits in the forms
referenced in Question 1? (Consult EBLS or field office as required.)

- If yes: give the IPS location of the documentation in
  `ipsLocation`, and confirm in `spectrumConfirmed` whether EBLS or
  the field office has entered end-dates in Spectrum as required for
  non-level benefits.
- If no: state the facts and circumstances.

## Section 5 — Offsets from Another Plan or a Partial Payment of Benefits

Question: does this plan contain offsets to be applied to benefits?
Examples include, but are not limited to:

- Black Lung Benefits
- Disability benefits from another plan
- Earnings offsets applicable to supplemental benefits (see Policy
  6.2-1 and TP 51)
- Partial cash-outs
- Pension benefits from another plan, whether from the same or a
  related plan sponsor or by a union such as the United Mine Workers
  of America (UMWA)
- Purchased annuities
- SSA benefits
- Workers' Compensation
- Plan loans
- Fiduciary Breaches, as determined by OGC

- If yes: list the offset types present in `offsetTypes`, describe
  the offset(s) in `description`, and provide guidance for benefit
  administration.
- If no: state the facts and circumstances.

Note: PBGC does **not** apply earnings offsets in estimated benefits
(Policy 6.2-1 §B). Section 5 only identifies the offsets.

## Section 6 — Successor Plan Determination (TP 61)

Rule: a plan trusteed by PBGC may be a successor to an earlier plan (a
predecessor plan). A successor plan is a continuation of the
predecessor plan. PBGC treats the successor and predecessor plans as a
single plan in calculating and valuing benefits under the successor
plan.

Select one outcome:

- `6.1`: Earlier Plan Not Identified. No determination is needed
  because no evidence of an earlier plan was found in plan records,
  PBGC records, and/or other available information.
- `6.2`: Successor Plan Determination Not Needed — Benefits Would Not
  Be Affected. Based on the answers to the screening questions, a
  determination is not needed because benefits in the current plan
  would not be affected.
- `6.3`: Results of Successor Plan Determination. Give the Successor
  Plan Determination IPS number in `ipsNumber` and say in
  `isSuccessor` whether the plan is a successor to the prior plan.

Screening questions (answer all six when the outcome is 6.2 or 6.3).
Would the determination affect:

- `mgb`: the maximum guaranteeable benefit (MGB) limitation for any
  participant?
- `phaseInNonOwner`: phase-in for a participant who is not a
  substantial or majority owner?
- `phaseInSubstantial`: phase-in for a substantial owner's benefit
  (plan had a NOIT or NOD before 1/1/2006)? Answer `na` if no benefit
  was provided under the plan for a substantial owner.
- `phaseInMajority`: phase-in for a majority owner's benefit (plan
  had a NOIT or NOD on or after 1/1/2006)? Answer `na` if no benefit
  was provided under the plan for a majority owner.
- `pc3`: allocation of assets to PC3?
- `section436g`: the §436(g) exception to the §436(b), (c), or (e)
  limitations for a plan in effect less than 5 plan years, in
  aggregate with any predecessor plan?

Rule: no determination is needed if all answers are "No". A
determination is needed if one or more answers is "Yes".

## Section 7 — Estimated Asset Allocation and Funding for PC3 (Process 10.3)

Question 1: are there participants in pay status subject to benefit
adjustments?

Question 2: if yes to Question 1, are any of those participants
retired or eligible to retire on DOPT-3 (use BPD-3 for PPA 2006
bankruptcy plans)?

- If yes to Question 2, a PC3 analysis is performed for consideration
  when determining benefit adjustments. Say in `pc3Done` whether it
  was performed.
- Give the estimated asset figure from the auditor in
  `estimatedAssets` (dollars, number) when known.
- State the facts and circumstances.

## Section 8 — Review Benefits Currently in Pay and Identify Payees for Benefit Adjustments (Process 10)

Give the data basis and source: estimated guaranteed benefits for
retired participants were calculated based on `dataBasis` data
obtained from `dataSource` (for example, SPECTRUM participant data as
of DOPT, obtained from the TRMD SPECTRUM download).

Counts (integers, 0 or more):

- `supplements`: retirees receiving supplements as of DOPT (Table 1).
- `ucebPhaseIn`: retirees receiving supplements subject to phase-in
  of UCEBs under PPA 2006 as of DOPT (or BPD for bankruptcy plans).
- `disabled`: participants who are persons with disabilities
  recognized by the plan.
- `shouldReduce`: retirees who recently attained an age at which a
  change in benefit (for example, SSA benefit offsets, non-level
  annuity forms, or offsets from other plans) should have been
  implemented but was not (Table 2).
- `mgbExceeds`: pre-DOPT retirees whose monthly benefit is greater
  than their Maximum Guaranteeable Benefit (Table 3).
- `phaseInAffected`: participants affected by the phase-in limitation
  (Table 4).

`narrative`: describe briefly whether or not the supplements — in
whole or in part — are guaranteeable under the accrued-at-normal
limitation, and how the benefits of the participants are affected or
not affected by the Maximum Guaranteeable Benefits Limitation.
Consider the effects of PPA 2006 on UCEBs. Remember that participants
who became disabled between BPD and DOPT are subject to accrued-at-
normal limitations.

`aggregateLimit`: describe participants entitled to guaranteed
benefits from more than one PBGC-trusteed plan who are affected by
the Aggregate Limit, if known now — or note that this information is
not yet available (Table 5).

Tables 1–6: one row per participant, from the participant data and
the actuary's analysis. The app does not invent rows.

- Table 1 (supplements as of DOPT): SSN, name, form of benefit,
  monthly benefit in pay status, supplementary portion, date
  supplement ends, accrued at NRD, estimated benefit after the
  non-guaranteed portion has been cut out.
- Table 2 (benefits that should have been reduced): SSN, name, form
  of benefit, monthly benefit in pay status, date benefit should be
  reduced, estimated benefit after reduction.
- Table 3 (benefits exceed the MGB): SSN, name, monthly benefit in
  pay status, maximum guaranteeable monthly amount.
- Table 4 (phase-in limitations): SSN, name, monthly benefit in pay
  status, reduction due to phase-in, monthly benefit after reduction.
- Table 5 (aggregate limit): SSN, name, monthly benefit in pay
  status, reduction due to aggregate limit, monthly benefit after
  reduction.
- Table 6 (majority owner limitation): SSN, name, monthly benefit in
  pay status, reduction due to majority owner limitation, monthly
  benefit after reduction.

## Section 9 — Estimated Determination of Whether Assets Impact Participants' Benefits

Check all that apply (true/false each):

- `c91` (9.1): Mandatory or Voluntary Employee Contributions have
  been identified.
- `c92` (9.2): Based on completion of Section 7, an estimated
  Priority Category 3 analysis was completed.
- `c93` (9.3): Participants' benefits are estimated to be impacted
  by PBGC limitations. If true, say in `c93ab`: `A` — based on
  Section 8, one or more in-pay participants' benefits are impacted
  by one of PBGC's limitations; or `B` — no in-pay participants'
  benefits are impacted, but one or more deferred participants could
  have their benefit impacted by one of PBGC's limitations.
- `c94` (9.4): A Majority Owner has been identified and the plan was
  in effect for less than 10 years.
- `c95` (9.5): Participants' benefits are estimated to be limited by
  other limitations not defined in Sections 9.2 and 9.3, and the
  associated liabilities from those limitations are anticipated to be
  valued in Priority Category 6. Examples: death benefits in excess
  of the QPSA, lump-sum death benefits, and grow-ins.

Give the Funded GL Ratio from the most recent Pension Information
Profile completed by NRAD in `fundedGlRatio` (percent, number). It is
required when 9.5 applies.

State the facts and circumstances.

Conclusion: the app computes a suggestion from the checkboxes and the
Funded GL Ratio — impacted by assets if one or more of 9.1–9.4 is
checked, or 9.5 applies and the Funded GL Ratio is 80% or higher;
not impacted if none of 9.1–9.4 is checked, or 9.5 applies and the
Funded GL Ratio is less than 80%. The actuary confirms or changes it
in review. Leave `conclusion` null to accept the suggestion.

## Output format

Return **only** valid JSON, no markdown fences, no commentary, no
explanation. The JSON must have exactly these top-level keys:

```json
{
  "caseData": {
    "toEbls": "string or null",
    "toAuditor": "string or null",
    "toSerco": "string or null",
    "fromActuary": "string or null",
    "fromSection": "string or null",
    "fromContractActuary": "string or null",
    "fromFirm": "string or null",
    "ccSupervisor": "string or null",
    "memoDate": "YYYY-MM-DD",
    "caseNumber": "string (text, leading zeros preserved)",
    "planName": "string",
    "bpd": "YYYY-MM-DD or null",
    "dopt": "YYYY-MM-DD",
    "dotr": "YYYY-MM-DD or null"
  },
  "sections": {
    "s1": {
      "q1": "yes | no",
      "q2": "yes | no",
      "facts": "string",
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s2": {
      "answer": "yes | no",
      "eventDates": "string or null",
      "facts": "string",
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s3": {
      "outcome": "3.1 | 3.2 | 3.3 | 3.4",
      "ipsNumber": "string or null",
      "limitations": ["b | c | d | e"],
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s4": {
      "q1": "yes | no",
      "forms": [{ "description": "string" }],
      "q2": "yes | no | null",
      "ipsLocation": "string or null",
      "spectrumConfirmed": "yes | no | null",
      "facts": "string",
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s5": {
      "answer": "yes | no",
      "offsetTypes": ["string"],
      "description": "string or null",
      "facts": "string",
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s6": {
      "outcome": "6.1 | 6.2 | 6.3",
      "screening": {
        "mgb": "yes | no",
        "phaseInNonOwner": "yes | no",
        "phaseInSubstantial": "yes | no | na",
        "phaseInMajority": "yes | no | na",
        "pc3": "yes | no",
        "section436g": "yes | no"
      },
      "ipsNumber": "string or null",
      "isSuccessor": "yes | no | null",
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s7": {
      "q1": "yes | no",
      "q2": "yes | no | null",
      "pc3Done": "yes | no | null",
      "estimatedAssets": "number or null",
      "facts": "string",
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s8": {
      "dataBasis": "string",
      "dataSource": "string",
      "counts": {
        "supplements": "integer",
        "ucebPhaseIn": "integer",
        "disabled": "integer",
        "shouldReduce": "integer",
        "mgbExceeds": "integer",
        "phaseInAffected": "integer"
      },
      "narrative": "string",
      "aggregateLimit": "string",
      "tables": {
        "t1": [{ "ssn": "string", "name": "string", "form": "string or null", "monthlyBenefit": "number", "supplementaryPortion": "number or null", "supplementEnds": "YYYY-MM-DD or null", "accruedAtNrd": "number or null", "estimatedBenefit": "number or null" }],
        "t2": [{ "ssn": "string", "name": "string", "form": "string or null", "monthlyBenefit": "number", "reduceDate": "YYYY-MM-DD or null", "estimatedBenefit": "number or null" }],
        "t3": [{ "ssn": "string", "name": "string", "monthlyBenefit": "number", "maxGuaranteeable": "number or null" }],
        "t4": [{ "ssn": "string", "name": "string", "monthlyBenefit": "number", "reduction": "number or null", "afterReduction": "number or null" }],
        "t5": [{ "ssn": "string", "name": "string", "monthlyBenefit": "number", "reduction": "number or null", "afterReduction": "number or null" }],
        "t6": [{ "ssn": "string", "name": "string", "monthlyBenefit": "number", "reduction": "number or null", "afterReduction": "number or null" }]
      },
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s9": {
      "c91": "boolean",
      "c92": "boolean",
      "c93": "boolean",
      "c93ab": "A | B | null",
      "c94": "boolean",
      "c95": "boolean",
      "fundedGlRatio": "number or null",
      "facts": "string",
      "conclusion": "impacted | notImpacted | null",
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    }
  },
  "sources": [
    { "name": "string", "format": "H | E | null", "used": "U | NU | null" }
  ]
}
```

Every one of the 9 sections must be present in `sections`. `sources`
lists every document you used, with format H (hard copy) or E
(electronic) and whether it was used (U) or not (NU).

## Workflow reminder (for the human, not the LLM)

1. Download this prompt from the E.Adj Generator app.
2. Feed the plan documents and associated documents + this prompt to
   your LLM (Microsoft Copilot in the office, any LLM at home).
3. Take the JSON the LLM returns and upload / paste it back into the
   E.Adj Generator app.
4. The app validates the JSON against the schema, flags missing /
   ambiguous / uncited items, and you review and approve each section.
5. Only approved JSON writes the filled memo Word document.
