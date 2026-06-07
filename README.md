# ☘ Dublin Startup

**Funding intelligence for Irish founders.** Never miss a grant, fund or tax credit you
qualify for — plus a free weekly briefing on funding, events and jobs across the Dublin
tech scene.

Live domain: **dublinstartup.ie** · A [websitemakers.ie](https://websitemakers.ie) venture.

---

## What this is

A lean, three-layer business designed to solve a real, expensive problem for Irish founders
(missed funding) and to be **run largely on autopilot by Claude**:

1. **The Dublin Startup Briefing** — free weekly email (audience).
2. **Funding Radar** — €39/mo personalised grant matching + deadline alerts (recurring core).
3. **Done-for-you** — grant-application drafting & founder websites (high-ticket).

See **[`STRATEGY.md`](STRATEGY.md)** for the full business case, pricing and 90-day plan,
and **[`AUTOMATION.md`](AUTOMATION.md)** for how Claude runs the weekly engine.

## Repo contents

| Path | What it is |
|------|-----------|
| `index.html` / `styles.css` / `main.js` | The landing page + waitlist (static, no build step) |
| `data/funding-sources.json` | Seed dataset of Irish funding supports — the Funding Radar engine |
| `STRATEGY.md` | Business strategy, revenue model, go-to-market |
| `AUTOMATION.md` | Weekly/monthly operating playbook (Claude + human roles) |
| `automation/briefing-prompt.md` | Spec to generate a weekly briefing issue |
| `automation/radar-match.md` | Spec to match a founder profile to funding |

## Run locally

It's a static site — just open `index.html`, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Go live (pick one — all free tiers work)

- **Cloudflare Pages / Netlify / Vercel:** connect this repo, no build command, output = root.
- **GitHub Pages:** Settings → Pages → deploy from branch root.

Then point `dublinstartup.ie` DNS at the host.

## Capture real emails (2-minute setup)

The waitlist works out of the box (stores locally for demo). To collect emails for real:

1. Create a form at [Formspree](https://formspree.io) (or use Beehiiv/ConvertKit/MailerLite).
2. Open `main.js`, set `FORM_ENDPOINT` to your endpoint URL.
3. Redeploy. Done.

## Next steps

See the checklist at the bottom of [`STRATEGY.md`](STRATEGY.md#9-immediate-next-steps).

---

*Disclaimer: Funding information is signposting, not regulated financial advice. Always
verify amounts, criteria and deadlines against the official source before applying.*
