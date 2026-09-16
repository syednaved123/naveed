# ✦ Muse — how to use it (no tech knowledge needed)

This folder contains **`muse.html`** — that single file *is* the app. You don't
install anything. You just open it in your web browser.

## Step 1 — Open the app

Double-click **`muse.html`**. It opens in your web browser (Chrome, Edge,
Safari, or Firefox) and shows a **Welcome to Muse** screen.

## Step 2 — Get your Claude key (one time, ~3 minutes)

Muse thinks using **Claude** (made by Anthropic). Claude is a paid service, so
you need a personal key. It's pay-as-you-go and typically costs a few cents per
conversation.

1. Go to **https://console.anthropic.com/settings/keys** and sign in (or make a
   free account).
2. Add a small amount of billing credit: **Settings → Billing** (e.g. $5 is
   plenty to start).
3. Click **Create Key**, then **copy** it (it starts with `sk-ant-`).

## Step 3 — Paste the key into Muse

Back in the Welcome screen, paste your key into the box, pick a model
(**Sonnet 5** is the recommended, cheaper option), and click
**Start using Muse**.

That's it — you can now chat. 🎉

## What Muse can do

Just type a question. Muse automatically uses tools when helpful:

- 🔎 **Searches the web** for current facts, news, and prices
- 📄 **Reads web pages** you paste a link to
- 🧮 **Does exact math**
- 🕐 **Knows the current date & time** anywhere in the world

Try the suggestion buttons on the welcome screen to see it in action.

## Good to know

- **Your key stays on your computer.** It's saved in your browser and sent only
  to Anthropic (the makers of Claude) — never to us or anyone else.
- **Your chats are saved** on this device and come back when you reopen the file.
  Click **New chat** to start fresh.
- **Change your key or model** any time with the **⚙ (gear)** button, top right.
- **Stop a reply** mid-answer with the ■ button.
- Keep `muse.html` anywhere you like (Desktop is handy) and double-click it
  whenever you want Muse.

## If something doesn't work

- **"Your API key was rejected"** → open ⚙ and re-paste the key carefully.
- **"Your account needs credit"** → add billing credit at
  console.anthropic.com, then try again.
- **"Couldn't reach Claude"** → check your internet. If it persists, try
  opening the file in Chrome, Edge, or Safari.

---

*There is also a fuller developer version of Muse in the `muse/` folder (a
Next.js app) for anyone who wants to host it on a website — but you don't need
that to use the app above.*
