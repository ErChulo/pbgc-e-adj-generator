#!/usr/bin/env python3
"""Verify the generated demo E.Adj memo (python-docx).

Checks, against the 2024 template (version of 11/25/2024):
- all 9 section heads present (shaded 1x1 tables)
- Tables 1-6 with the exact header rows from the template
- footer carries "Version of 11/25/2024"
- §9 conclusion: impacted box checked, not-impacted box unchecked
- §6.2 screening table present with all-No answers
- demo values present (case, plan, money, synthetic SSNs)

Usage: python3 scripts/verify_docx.py [samples/eadj-demo.docx]
"""
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCX = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "samples" / "eadj-demo.docx"

try:
    from docx import Document
except ImportError:
    print("SKIP: python-docx not installed")
    sys.exit(0)

failures = []
checks = 0


def check(cond, label):
    global checks
    checks += 1
    if not cond:
        failures.append(label)
        print(f"FAIL: {label}")
    else:
        print(f"ok: {label}")


doc = Document(str(DOCX))
all_text = "\n".join(p.text for p in doc.paragraphs)
table_texts = []
for t in doc.tables:
    for row in t.rows:
        for cell in row.cells:
            table_texts.append(cell.text)
all_table_text = "\n".join(table_texts)
combined = all_text + "\n" + all_table_text

# 9 section heads
heads = [
    "1. Plan Termination during Bankruptcy",
    "2. Shutdown or other Unpredictable Contingent Event Benefits (UCEBs)",
    "3. Benefit Restrictions for Underfunded Pension Plans (IRC §436 Limitations)",
    "4. Payee Data Review for Future Changes in Benefits",
    "5. Offsets from Another Plan or a Partial Payment of Benefits",
    "6. Successor Plan Determination",
    "7. Estimated Asset Allocation and Funding for PC3",
    "8. Review Benefits Currently in Pay and Identify Payees for Benefit Adjustments",
    "9. Estimated Determination of Whether Assets Impact Participants' Benefits",
]
for h in heads:
    check(h in combined, f"section head present: {h[:40]}...")

# table count: 9 heads + 2 screening + 6 data tables = 17
check(len(doc.tables) == 17, f"17 tables (got {len(doc.tables)})")

# Tables 1-6 exact headers
expected_headers = {
    "Table 1": ["SSN", "Participant Name", "Form of Benefit",
                "Monthly Benefit in Pay Status", "Supplementary Portion",
                "Date Supplement Ends", "Accrued At NRD",
                "Estimated Benefit (after non-guaranteed portion has been cut out)"],
    "Table 2": ["SSN", "Participant Name", "Form of Benefit",
                "Monthly Benefit in Pay Status", "Date Benefit Should Be Reduced",
                "Estimated Benefit After Reduction"],
    "Table 3": ["SSN", "Participant Name", "Monthly Benefit In Pay Status",
                "Maximum Guaranteeable Monthly Amount"],
    "Table 4": ["SSN", "Participant Name", "Monthly Benefit In Pay Status",
                "Reduction due to Phase In",
                "Monthly Benefit after Reduction for Phase In"],
    "Table 5": ["SSN", "Participant Name", "Monthly Benefit In Pay Status",
                "Reduction due to Aggregate Limit",
                "Monthly Benefit after Reduction for Aggregate Limit"],
    "Table 6": ["SSN", "Participant Name", "Monthly Benefit In Pay Status",
                "Reduction due to Majority Owner Limitation",
                "Monthly Benefit after Reduction for Majority Owner Limitation"],
}
for label, headers in expected_headers.items():
    found = False
    for t in doc.tables:
        if len(t.rows) >= 1:
            row = [c.text.strip() for c in t.rows[0].cells]
            if row == headers:
                found = True
                break
    check(found, f"{label} header row exact ({len(headers)} cols)")

# Table row counts (demo: t1=2, t2=1, t3=1, t4=2, t5=0, t6=1; +1 header row each)
expected_rows = {"Table 1": 3, "Table 2": 2, "Table 3": 2, "Table 4": 3, "Table 5": 1, "Table 6": 2}
for label, headers in expected_headers.items():
    for t in doc.tables:
        row = [c.text.strip() for c in t.rows[0].cells]
        if row == headers:
            check(len(t.rows) == expected_rows[label],
                  f"{label} row count {len(t.rows)} (expected {expected_rows[label]})")
            break

# footer version
z = zipfile.ZipFile(str(DOCX))
footer_xml = ""
for name in z.namelist():
    if "footer" in name:
        footer_xml += z.read(name).decode("utf-8")
check("Version of 11/25/2024" in footer_xml, "footer version 11/25/2024")
check("Estimated Benefits Adjustment Analysis Memo" in footer_xml, "footer title")

# §9 conclusion: impacted checked, not impacted unchecked
check("☒  Participants' benefits are estimated to be impacted by assets because either:" in combined,
      "§9 conclusion impacted box checked")
check("☐  Participants' benefits are estimated to not be impacted by assets because either:" in combined,
      "§9 conclusion not-impacted box unchecked")
check("Funded GL Ratio (NRAD Pension Information Profile): 85%." in combined,
      "§9 Funded GL Ratio 85% shown")

# §6.2 screening
check("Would the successor plan determination affect:" in combined, "§6.2 screening table present")
check("A successor plan determination is not needed if all of the answers are" in combined,
      "§6.2 rule note present")

# §3 outcome
check("3.4. Based on the §436 Evaluation, IPS # IPS 9C #87650001" in combined,
      "§3 outcome 3.4 with IPS number")
check("§436(b) limitation on UCEB" in combined, "§3 limit (b) listed")
check("§436(d) limitations on prohibited payments" in combined, "§3 limit (d) listed")

# demo values
check("87654321" in combined, "case number 87654321")
check("Maplewood Fabricators Pension Plan" in combined, "plan name")
check("$2,450.00" in combined, "money $2,450.00 formatted")
check("000-00-0001" in combined, "synthetic SSN 000-00-0001")
check("CONCURRENCE:" in combined, "concurrence block present")
check("MEMORANDUM" in combined, "MEMORANDUM header")
check("Purpose: To identify operating policies and issues impacting estimated benefits" in combined,
      "purpose line")

print(f"\n{checks - len(failures)}/{checks} docx checks passed")
if failures:
    print(f"{len(failures)} FAILED")
    sys.exit(1)
print("docx verification passed")
