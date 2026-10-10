from app.db import supabase

POLICIES = [
    ("Leave Policy",
     "Every employee gets 18 days of paid annual leave per year. Leave must be "
     "requested at least 3 days in advance through your manager. Sick leave is "
     "12 days per year, and a medical certificate is needed for more than 2 "
     "consecutive days. Unused annual leave up to 5 days can be carried forward."),
    ("Working Hours",
     "Standard working hours are 9:30 AM to 6:30 PM, Monday to Friday, with a "
     "one hour lunch break. Core hours when everyone should be available are "
     "11 AM to 4 PM."),
    ("Work From Home Policy",
     "Employees may work from home up to 2 days per week after completing the "
     "first 30 days. Work from home must be approved by your manager and you "
     "must be reachable on Slack during working hours."),
    ("Probation Period",
     "The probation period is 3 months from the joining date. A performance "
     "review is held at the end of the probation. Confirmed employees receive a "
     "confirmation letter from HR."),
    ("Salary and Payroll",
     "Salary is credited on the last working day of each month. Payslips are "
     "available in the HR portal. Reimbursement claims must be submitted within "
     "30 days of the expense along with the bills."),
    ("IT and Security Policy",
     "Use only company-approved devices and software. Never share your password. "
     "Report lost devices or suspicious emails to the IT team immediately. "
     "Company data must not be copied to personal storage."),
]

supabase.table("policy_chunks").delete().neq("title", "").execute()

rows = [{"title": t, "content": c} for t, c in POLICIES]
supabase.table("policy_chunks").insert(rows).execute()

print(f"Loaded {len(rows)} policy chunks")