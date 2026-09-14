# Bite

Family nutrition tracker for busy parents and caregivers. Snap meals, clarify in vernacular language, and see a shared household dashboard.

## Features

- **Onboarding** — set up parents + children with allergies and languages
- **Rich profiles** — age, preferences, allergies, foods to avoid, nutrition goals
- **Photo meal logging** — estimates for calories, protein, carbs, fat, fibre, sugar, weight, fruit/veg
- **Clarifying questions** + **voice/text correction** (Hindi / English / Hinglish)
- **Caregiver notes** — “ate only half”, “asked for seconds”, etc.
- **Daily dashboard** — missing meals, allergies, notes, encouraging tips, water
- **Insights** — weekly patterns + individual nutrition timeline
- **Meal ideas** — practical suggestions from gaps and local cooking
- **Settings (admin)** — Permissions, Alerts, Privacy, Household activity

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional live AI

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`. Without a key, Bite uses a realistic demo analyzer.

### Optional accounts & cloud sync

With **Clerk** keys and a **Vercel Blob** token, caregivers sign in and household data (profiles, meals, notes — not raw photos) syncs to the cloud. Without those env vars, Bite runs in **local-only** mode like before.

Copy `.env.example` to `.env.local` and fill in values. On Vercel, add the same variables for Production (and Preview if you want auth on preview URLs).

## Privacy note

Local-only mode keeps data in the browser. Signed-in mode stores household JSON in your Blob store; meal analysis still uses your OpenAI key when configured. Nutritional values are estimates only — Bite is not a substitute for a doctor or qualified dietitian.
