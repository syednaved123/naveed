# Prompt spec — Funding Radar matching

Use this to match a founder's profile against `data/funding-sources.json` and produce their
personalised funding matches + deadline alerts.

---

## Founder profile (collected at signup)

```json
{
  "company_name": "",
  "stage": "idea | pre-seed | early-revenue | growth | scaling",
  "sector": "e.g. fintech, healthtech, saas, manufacturing, services",
  "employees": 0,
  "months_trading": 0,
  "doing_rnd": true,
  "exporting": false,
  "female_led": false,
  "location": "Dublin City | DLR | South Dublin | Fingal | other",
  "needs": ["capital", "wages", "online", "research", "fundraising", "export"],
  "alert_window_days": 30
}
```

## Matching logic

For each entry in `data/funding-sources.json`:

1. **Stage** — include if `profile.stage` is in the entry's `stage` array.
2. **Sector** — include if entry `sectors` contains `"any"` or the profile's sector.
3. **Hard gates** — respect obvious eligibility:
   - LEO grants: `employees <= 10`.
   - Priming: `months_trading < 18`; Business Expansion: `months_trading >= 18`.
   - R&D credit: `doing_rnd == true`.
   - Female-led supports: `female_led == true`.
   - Export supports (TAME): `exporting == true` or export intent in `needs`.
4. **Needs boost** — rank matches higher when entry `match_tags` overlap `profile.needs`.
5. **Verify** — confirm amount/deadline against `source_url` before presenting.

## Output (per founder)

```
Hi <name> — here are your funding matches this week:

🎯 STRONG FITS
1. <Programme> — <amount>
   Why you: <one line tying to their profile>
   Deadline: <date/rolling>  ·  Apply: <source_url>

📋 WORTH A LOOK
- <Programme> — <amount> — <one line>

⏰ ALERT: <Programme> closes in <N> days. <one line + link>

Want us to draft the application with you? Reply "DFY".
```

## Rules

- Never overstate eligibility — use "likely eligible" / "worth checking" language.
- Always link the official source. Flag anything unverifiable.
- The **Trading Online Voucher** and any website-related need is a natural handoff to
  websitemakers.ie — surface the done-for-you website option when relevant.
- Keep it short and actionable. One found grant should feel worth far more than €39/mo.
