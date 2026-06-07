# Dublin Startup — Automation Playbook

This is the operating manual for running Dublin Startup **with Claude doing the weekly
work**. The goal: the business runs on a schedule even when the operator has no time.
Claude drafts; the operator approves and hits send (a 10-minute weekly review).

The environment this repo was built in exposes the automation rails:
**Apify** (web scraping), **Gmail** (drafting/sending), a **jobs/company-data** server,
and **GitHub** (hosting). The workflows below map to those rails.

---

## Weekly cadence (every Monday → Tuesday send)

### 1. Gather (Mon AM) — Claude + Apify / web search
Collect, for the past 7 days in the Irish/Dublin startup scene:
- **Funding rounds** — who raised, how much, lead investors (TechCrunch, Irish Times
  Business, Business Post, EU-Startups, Tech.eu, company press).
- **Grant deadlines** landing in the next 30 days — cross-check `data/funding-sources.json`
  against official LEO / Enterprise Ireland / Revenue pages.
- **Events** — DogPatch Labs First Fridays, NDRC, Dublin Tech Summit, meetups.
- **Jobs** — standout roles at Dublin startups (use the jobs server / Wellfound / Built In).

Output a raw research note in `automation/inbox/YYYY-MM-DD-research.md` (gitignored).

### 2. Draft (Mon PM) — Claude
Run `automation/briefing-prompt.md` against the research note to produce the issue.
Save to `automation/issues/issue-NNN.md`.

### 3. Review (Tue AM) — Operator (10 min)
Skim for accuracy, especially **any grant amount/deadline** (verify against source links).
Fix tone, approve.

### 4. Send (Tue) — Gmail / email platform
- For small lists: Gmail draft via the Gmail MCP tools, operator reviews & sends.
- At scale: paste into Beehiiv/MailerLite and broadcast.

### 5. Funding Radar alerts (continuous) — Claude
When `data/funding-sources.json` shows a deadline within a member's alert window **and** the
member's profile matches (`automation/radar-match.md`), draft a personalised alert email per
member. Operator approves the batch.

---

## Monthly cadence

- **Re-verify the dataset.** Walk every entry in `data/funding-sources.json`, confirm
  amounts/criteria/deadlines against the official `source_url`, add any new programmes.
  Update `_meta.disclaimer` "Last reviewed" date.
- **Funding Radar member reports.** For each paying member, generate a tailored
  "your funding landscape this month" PDF/email from their profile.
- **Metrics review.** Subscribers, open rate, free→paid conversion, churn, MRR, DFY pipeline.

---

## Roles: what Claude does vs what the human does

| Task | Claude | Human |
|------|:------:|:-----:|
| Research funding/news/events/jobs | ✅ | — |
| Draft the weekly briefing | ✅ | approve |
| Match founders → funding | ✅ | spot-check |
| Draft Radar alert emails | ✅ | approve send |
| Verify grant amounts/deadlines vs source | ✅ flag | ✅ final call |
| Draft grant applications (DFY) | ✅ | review & submit |
| Send money-handling / contracts | — | ✅ |
| Sponsor & client relationships | — | ✅ |

> **Guardrail:** Funding info drives real founder decisions. Claude must always cite the
> official `source_url` and flag anything it couldn't verify. The human owns the final
> send on anything involving money, deadlines, or commitments.

---

## Suggested scheduling

- Use this repo's CI (GitHub Actions) or a Claude Code scheduled session to fire the
  **Gather + Draft** steps every Monday, leaving a ready draft for Tuesday review.
- Keep `automation/inbox/` and `automation/issues/` working notes out of version control if
  they contain anything sensitive (see `.gitignore`).
