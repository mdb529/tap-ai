"""Generate org/employees.csv -- the IdP directory mirror.

Lives under org/ because conceptually this is what Okta/Azure AD would hand us
(identity + department + manager + authority). It is CSV rather than YAML only
because it is 36 flat rows that a person may want to edit in a spreadsheet.
"""
import csv, pathlib

# email_local, name, title, department, authority, manager_local, domains_owned
ROWS = [
    # --- Executive -----------------------------------------------------------
    ("ewhitfield", "Elena Whitfield", "chief executive officer",   "Executive",           "cxo",      None,          ""),
    ("rmarsh",     "Robert Marsh",    "chief financial officer",   "Finance",             "cxo",      "ewhitfield",  "finance.revenue"),
    ("avoss",      "Adaeze Voss",     "chief operating officer",   "Clinical Operations", "cxo",      "ewhitfield",  "clinical.encounters"),
    ("mgrant",     "Miriam Grant",    "chief compliance officer",  "Compliance",          "cxo",      "ewhitfield",  "compliance.phi"),
    ("dpalmer",    "Devon Palmer",    "vice president of data",    "Data Platform",       "vp",       "ewhitfield",  "platform.pipelines"),

    # --- Finance -------------------------------------------------------------
    ("tchen",      "Theresa Chen",    "director of revenue cycle finance", "Finance",     "director", "rmarsh",      "finance.claims_ar"),
    ("pahmadi",    "Parisa Ahmadi",   "finance manager",           "Finance",             "manager",  "tchen",       ""),
    ("gwallace",   "Grant Wallace",   "senior financial analyst",  "Finance",             "lead",     "pahmadi",     ""),
    ("bnovak",     "Bela Novak",      "financial analyst",         "Finance",             "ic",       "pahmadi",     ""),
    ("cortiz",     "Camila Ortiz",    "financial analyst",         "Finance",             "ic",       "pahmadi",     ""),
    ("fdelacruz",  "Fidel Dela Cruz", "reimbursement analyst",     "Finance",             "ic",       "tchen",       ""),

    # --- Revenue Cycle -------------------------------------------------------
    ("jokafor",    "Joy Okafor",      "director of coding",        "Revenue Cycle",       "director", "rmarsh",      "rcm.coding"),
    ("lbrennan",   "Liam Brennan",    "denials manager",           "Revenue Cycle",       "manager",  "rmarsh",      "rcm.denials"),
    ("ysong",      "Yuna Song",       "lead medical coder",        "Revenue Cycle",       "lead",     "jokafor",     ""),
    ("rpatel",     "Rohan Patel",     "medical coder",             "Revenue Cycle",       "ic",       "ysong",       ""),
    ("mdiallo",    "Mariam Diallo",   "medical coder",             "Revenue Cycle",       "ic",       "ysong",       ""),
    ("thoffman",   "Tobias Hoffman",  "denials specialist",        "Revenue Cycle",       "ic",       "lbrennan",    ""),
    ("nabara",     "Nkechi Abara",    "denials specialist",        "Revenue Cycle",       "ic",       "lbrennan",    ""),
    ("kobrien",    "Kate O'Brien",    "charge capture analyst",    "Revenue Cycle",       "ic",       "jokafor",     ""),

    # --- Clinical Operations -------------------------------------------------
    ("sramirez",   "Sofia Ramirez",   "director of quality",       "Clinical Operations", "director", "avoss",       "clinical.quality"),
    ("kmoreau",    "Kwame Moreau",    "manager of capacity planning", "Clinical Operations","manager", "avoss",      "ops.capacity"),
    ("hlindqvist", "Hanna Lindqvist", "clinical informatics lead", "Clinical Operations",  "lead",     "sramirez",    ""),
    ("jmwangi",    "James Mwangi",    "quality analyst",           "Clinical Operations",  "ic",       "sramirez",    ""),
    ("apereira",   "Ana Pereira",     "quality analyst",           "Clinical Operations",  "ic",       "sramirez",    ""),
    ("dschultz",   "Dana Schultz",    "nurse informaticist",       "Clinical Operations",  "ic",       "hlindqvist",  ""),
    ("obayo",      "Olu Bayo",        "capacity analyst",          "Clinical Operations",  "ic",       "kmoreau",     ""),
    ("iharlow",    "Ines Harlow",     "throughput analyst",        "Clinical Operations",  "ic",       "kmoreau",     ""),

    # --- Compliance ----------------------------------------------------------
    ("vosei",      "Vera Osei",       "privacy manager",           "Compliance",          "manager",  "mgrant",      ""),
    ("bkoval",     "Boris Koval",     "compliance analyst",        "Compliance",          "ic",       "vosei",       ""),
    ("rsantos",    "Rita Santos",     "health information manager","Compliance",          "manager",  "mgrant",      ""),

    # --- Data Platform -------------------------------------------------------
    ("hyusuf",     "Hana Yusuf",      "analytics engineering manager","Data Platform",    "manager",  "dpalmer",     ""),
    ("mkeller",    "Marcus Keller",   "senior analytics engineer", "Data Platform",       "lead",     "hyusuf",      ""),
    ("swhitaker",  "Simone Whitaker", "analytics engineer",        "Data Platform",       "ic",       "hyusuf",      ""),
    ("ptran",      "Phong Tran",      "analytics engineer",        "Data Platform",       "ic",       "hyusuf",      ""),
    ("egarrido",   "Elias Garrido",   "data engineer",             "Data Platform",       "ic",       "hyusuf",      ""),

    # --- Growth --------------------------------------------------------------
    ("nfarrell",   "Nora Farrell",    "director of growth",        "Growth",              "director", "ewhitfield",  "growth.acquisition"),
    ("cadeyemi",   "Chidi Adeyemi",   "marketing analyst",         "Growth",              "ic",       "nfarrell",    ""),
    ("lberger",    "Lena Berger",     "referral operations lead",  "Growth",              "lead",     "nfarrell",    ""),
]

DOMAIN = "northharbor.health"
out = pathlib.Path("org/employees.csv")
with out.open("w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["employee_id","email","full_name","title","department",
                "authority_level","manager_email","domains_owned","slack_handle","active"])
    for i, (local, name, title, dept, auth, mgr, domains) in enumerate(ROWS, start=1):
        w.writerow([
            f"EMP{i:03d}",
            f"{local}@{DOMAIN}",
            name,
            title,
            dept,
            auth,
            f"{mgr}@{DOMAIN}" if mgr else "",
            domains,
            f"@{local}",
            "true",
        ])
print(f"wrote {out} with {len(ROWS)} employees")
