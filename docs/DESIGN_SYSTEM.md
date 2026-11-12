# Design system — E.Adj Generator v0.1.0

PBGC Design System v1.1.0 DRAFT (ErChulo/pbgc-design-system,
`docs/DESIGN.md`). DRAFT for COLA/Section 508 review, NOT approved.
Tokens file: `docs/tokens.json` (SHA 49e4c3c9 — unchanged since E.Adm).

## Tokens used

| Token | Value | Use |
| --- | --- | --- |
| Navy | #002D72 | Header, table header rows |
| Blue | #005BAA | Buttons, active nav |
| Light blue | #D6E8F5 | Links, lede text |
| Gold | #FFB81C | Focus outline, current step |
| Black | #000000 | Page background |
| White | #FFFFFF | Text, logo, inputs |
| Gray 100 | #F5F5F5 | — |
| Gray 300 | #CCCCCC | Input borders, badges |
| Gray 600 | #666666 | Borders, muted text |
| Gray 700 | #333333 | — |
| Red | #C00000 | Error notices |
| Green | #2E7D32 | OK notices, done steps |
| Sans | Helvetica Neue, Arial | All GUI text |
| Serif | Times New Roman | Memo body (Word doc) |
| Radius | 4px | Cards, buttons |

## Page

Dark page #000 (same decision as DEL and E.Adm). White PBGC logo on
the blue header, 52px desktop, 44px under 640px. Logo is the same
embedded asset as E.Adm (white horizontal logo, base64 in the file).

## Memo (Word doc)

Times New Roman 11pt, Letter, 1-inch margins — the template's own
defaults. Section heads: shaded 1×1 tables, fill E6E6E6. Data tables:
Table Grid, header row shaded D9D9D9, template column widths.

## Gaps found while building

None in the design system itself. The E.Adj memo needs no new
component beyond what E.Adm already used. No change suggested.
