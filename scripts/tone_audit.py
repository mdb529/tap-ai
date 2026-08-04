"""Tone audit for user-facing copy.

The reframe -- from "engineers guess" to "the expertise has no way in" -- has to
hold across every string a visitor can read, not just the headline. Easy to
regress on the next edit, so it is checked rather than remembered.

Only JSX text and string literals are scanned. Comments are skipped: several of
them legitimately explain what was removed and why.
"""
import pathlib, re, sys

BAD = [
  (r"\bengineers?\b[^.]{0,24}\b(guess|guessing|invent|inventing)\b", "frames engineers as the problem"),
  (r"\bstop letting\b",       "adversarial framing"),
  (r"\bnon-engineer",          "defines people by what they are not"),
  (r"\bnobody decided\b",     "implies negligence"),
  (r"\bincentive pool\b",     "removed concept"),
  (r"\btap budget\b",         "removed concept"),
  (r"\boverage\b",            "removed concept"),
  (r"\bbillable taps?\b",     "removed concept"),
]

def strip_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)   # block comments
    text = re.sub(r"^\s*//.*$", "", text, flags=re.M)    # line comments
    text = re.sub(r"\{/\*.*?\*/\}", "", text, flags=re.S)  # jsx comments
    return text

hits = []
ROOTS = [pathlib.Path("src"), pathlib.Path("site/src")]
for f in sorted(f for r in ROOTS if r.exists() for f in r.rglob("*.ts*")):
    body = strip_comments(f.read_text())
    for pat, why in BAD:
        for m in re.finditer(pat, body, re.I):
            ctx = " ".join(body[max(0, m.start() - 60):m.end() + 60].split())
            hits.append(f"{f}  [{why}]\n      ...{ctx}...")

print("tone audit (user-facing strings across the MVP and the site)")
if hits:
    print(f"\n{len(hits)} issue(s):")
    for h in hits:
        print("  ! " + h)
    sys.exit(1)
print("  clean")
