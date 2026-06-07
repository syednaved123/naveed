# Dublin Startup — Business Strategy

**Domain:** dublinstartup.ie
**Operator:** Syed Naved (also runs [websitemakers.ie](https://websitemakers.ie))
**One-liner:** Funding intelligence for Irish founders — never miss a grant, fund or tax credit you qualify for.

---

## 1. The problem (real, painful, valuable)

Ireland has one of the most generous startup-support landscapes in Europe — Enterprise
Ireland (HPSU, New Frontiers, Innovation Vouchers), the four Dublin Local Enterprise
Offices (Priming, Business Expansion, Trading Online), and the tax system (35% R&D tax
credit from 2026). Stacked together, an eligible founder can access **€10k–€500k+**.

**But the supports are scattered across a dozen websites, the criteria are dense, and the
deadlines move quietly.** Founders routinely discover the right grant *after* it closed —
or never at all. There is no single, personalised, always-current "what can I get and how
do I apply" service. That gap is the business.

## 2. The solution — three compounding layers

| # | Layer | What it is | Monetisation | Who it's for |
|---|-------|-----------|--------------|--------------|
| 1 | **Audience** | *The Dublin Startup Briefing* — free weekly email (funding rounds, grant deadlines, events, jobs) | Sponsorships, classifieds, job listings | Anyone in the Irish scene |
| 2 | **Recurring** ⭐ | *Funding Radar* — personalised grant/fund matching + deadline alerts + monthly report | €39/mo subscription | Active founders |
| 3 | **High-ticket** | *Done-for-you* — grant-application drafting + founder websites (via websitemakers.ie) | €300–€2,000/project | Funded/funding founders |

The funnel: the **free briefing** builds a trusted audience → a slice converts to **Funding
Radar** (recurring) → Radar surfaces founders who need **done-for-you** help (high-ticket,
routed through the existing agency). Each layer feeds the next.

## 3. Why now / why us

- **2026 tailwind:** R&D tax credit rose to 35% — funding is top-of-mind for founders.
- **Distribution edge:** websitemakers.ie already reaches Irish SMEs/founders — warm channel.
- **Automation edge:** the whole engine (research → match → write → send) is runnable by
  Claude on a schedule (see `AUTOMATION.md`), so it scales without proportional founder time.

## 4. Revenue model & realistic targets

Conservative ramp (the briefing is the growth flywheel):

| Month | Subscribers (free) | Radar (€39/mo) | Sponsors (€250/issue) | DFY projects | Est. MRR |
|-------|--------------------|----------------|-----------------------|--------------|----------|
| 1–2 | 0 → 300 | 0 | 0 | 0 | €0 (build audience) |
| 3 | 600 | 15 | 2/mo | 1 | ~€585 + ~€800 one-off |
| 6 | 1,500 | 50 | 4/mo | 2/mo | ~€1,950 + sponsor €1,000 + DFY ~€1,600 |
| 12 | 4,000 | 150 | weekly sponsor | 3/mo | **~€5,850 Radar + ~€2,000 sponsor + ~€2,400 DFY = ~€10k/mo** |

These are illustrative, not promises. The point: **Funding Radar's recurring €39/mo is the
durable core**, sponsorship is the audience monetiser, DFY is the cash spike. Reaching
~150 paying Radar members is a "decent money per month" milestone and is plausible within a
year given Dublin's founder density.

## 5. Go-to-market (first 90 days)

1. **Ship the landing page** (done) → drive waitlist signups.
2. **Seed the audience:** post the briefing concept in Irish founder communities — DogPatch
   Labs, NDRC alumni, r/irishpersonalfinance/startups, LinkedIn, local LEO networks,
   indie-hacker Slack/Discords. Offer the free briefing.
3. **Publish issue #1** of the briefing (Claude-drafted, human-approved) to the waitlist.
4. **Open Funding Radar** to the first cohort at a launch price (€19/mo founding members,
   then €39). Use scarcity ("first 50 members").
5. **Land 1–2 done-for-you projects** from existing websitemakers.ie leads to fund the build.
6. **Get one sponsor** for the briefing (a co-working space, accountancy firm, legal/IP
   firm, or fintech tool — all want founder eyeballs).

## 6. Moat / defensibility

- **Trust + audience:** an email list and a reputation for being *the* Irish funding source.
- **Proprietary, maintained funding dataset** (`data/funding-sources.json`) kept current.
- **Compounding content** that ranks for "Irish startup grants / Dublin funding" SEO.
- **Operator credibility** through the agency relationship.

## 7. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Accuracy of grant info (founders rely on it) | Always link & verify against official source; monthly re-check; clear disclaimer |
| Low conversion free → paid | Make Radar's value obvious (a single found grant pays for years of subscription) |
| Time to maintain | Automate via `AUTOMATION.md`; Claude drafts, operator approves |
| Competition (Built In, Failory) | They're jobs/news; we own *funding* — a sharper, higher-value wedge |
| Regulatory: not financial advice | Position as information/signposting, not regulated advice; add T&Cs |

## 8. What's in this repo

- `index.html`, `styles.css`, `main.js` — the live landing page + waitlist.
- `data/funding-sources.json` — seed funding dataset (the Radar engine's source of truth).
- `AUTOMATION.md` — the weekly operating playbook Claude follows.
- `automation/briefing-prompt.md` — the exact spec to generate a briefing issue.
- `automation/radar-match.md` — how to match a founder profile to funding.
- `README.md` — setup & deploy instructions.

## 9. Immediate next steps

- [ ] Point dublinstartup.ie DNS at a host (Netlify / Vercel / Cloudflare Pages / GitHub Pages).
- [ ] Add a form endpoint in `main.js` (Formspree/Beehiiv/ConvertKit) to capture real emails.
- [ ] Choose the email platform for the briefing (Beehiiv or MailerLite recommended).
- [ ] Run the first `automation/briefing-prompt.md` to draft issue #1.
- [ ] Set Stripe (or Stripe Payment Link) for Funding Radar subscriptions.
