# TTB Label Review System

An AI-powered prototype for alcohol beverage label compliance review, built for the TTB (Alcohol and Tobacco Tax and Trade Bureau).

**Live Demo:** <!-- Add your Vercel URL here after deployment -->

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Venkat10gitty/ttb-label-review&env=ANTHROPIC_API_KEY&envDescription=Your+Anthropic+API+key+for+Claude+vision+analysis&envLink=https://console.anthropic.com/settings/api-keys)

[![CI](https://github.com/Venkat10gitty/ttb-label-review/actions/workflows/ci.yml/badge.svg)](https://github.com/Venkat10gitty/ttb-label-review/actions/workflows/ci.yml)

---

## What It Does

Compliance agents upload a label image and enter the application data. Claude (Anthropic's AI) reads the label, extracts every TTB-required field, and compares it against the application — flagging mismatches, applying judgment where appropriate, and surfacing critical issues instantly.

The result is a field-by-field compliance report with confidence scores, a final recommendation (Approved / Flagged / Rejected), and the ability for the agent to override the AI decision and add reviewer notes.

---

## Setup & Run

### Prerequisites
- Node.js 18+ (or use nvm: `nvm use 22`)
- An Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

### Steps

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd ttb-label-review

# 2. Install dependencies
npm install

# 3. Add your API key
cp .env.local.example .env.local
# Edit .env.local and replace the placeholder with your actual key

# 4. Start the development server
npm run dev
# App runs at http://localhost:3000
```

### First time: Load demo data

Click **"Load Demo Data"** on the dashboard to pre-populate 4 sample applications with different outcomes (approved, flagged, rejected, pending) — no images or API calls needed to explore the UI.

---

## Architecture & Technical Decisions

### Stack
| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack in one repo; API routes + React UI; easy Vercel deploy |
| Language | TypeScript | Catches bugs at compile time; makes the data model explicit |
| Styling | Tailwind CSS | Fast iteration; no context-switching between files |
| AI | Claude claude-sonnet-4-6 (Anthropic) | Best vision model for document understanding; handles imperfect photos |
| Storage | In-memory (global Map) | Appropriate for a prototype; swap for Postgres/Redis in production |

### Why Claude for this?

The scanning vendor pilot failed because it hit ML endpoints blocked by the government firewall. This app calls only `api.anthropic.com` over standard HTTPS — indistinguishable from any other HTTPS traffic, no special firewall rules needed.

Claude's vision handles:
- Photos taken at angles or with glare (Jenny's use case)
- Mixed fonts, overlapping elements, small print
- Context-aware reading (knows "45% Alc./Vol. (90 Proof)" means 45% ABV)

### Matching Logic

Not everything should be an exact match — Dave's "STONE'S THROW" vs "Stone's Throw" example was built into the system:

| Match Type | Applied To | Logic |
|---|---|---|
| **Exact** | Government Warning text | Character-for-character — TTB requires word-for-word precision |
| **Smart** | Brand name, class/type | Case-insensitive + strips punctuation differences + Levenshtein similarity |
| **Numeric** | ABV, net contents | Extracts the number — `40%`, `40.0% ALC/VOL`, and `40% Alc. by Vol.` all resolve to `40` |
| **Fuzzy** | Bottler name, address | Expands abbreviations (`Co.` → `company`, `St.` → `street`) before comparing |
| **Presence** | Sulfite declaration | Checks it exists; exact wording varies |

### Government Warning

Per 27 CFR 16.21, the warning must be:
- Present on label
- Word-for-word exact
- `GOVERNMENT WARNING:` header in **all caps** and **bold**

The system checks all four conditions separately and shows which ones fail, not just "mismatch."

---

## Features

### Single Label Review
- Upload label image (JPG, PNG, WebP — even imperfect photos)
- Enter application data via form
- Click "Run AI Analysis" → Claude extracts all TTB fields and generates a compliance report
- Field-by-field table: what the application says vs. what the label actually shows
- Agent can Approve / Flag / Reject with reviewer notes (overrides AI decision)

### Batch Processing
- Upload a JSON metadata file + multiple images at once
- Processes up to 3 labels concurrently with automatic queuing
- Live progress dashboard updates every 2 seconds
- Built for the 200–300 application peak-season scenario

### Dashboard
- Stats bar: Pending / Approved / Flagged / Rejected counts
- Search by brand name, applicant, or product type
- Filter by status
- CSV export of all applications

### Image Quality Handling
- Claude reports an image quality score (0–100%)
- If glare, blur, or angle affects confidence, it flags which fields may be unreliable
- Suggests re-submission with better photo when quality is too low

---

## Beverage Types Supported

Each type has its own required field set per TTB regulations:

| Type | Key Differences |
|---|---|
| **Distilled Spirits** (27 CFR Part 5) | ABV mandatory; class/type designation |
| **Wine** (27 CFR Part 4) | Vintage date, sulfite declaration, appellation |
| **Malt Beverage / Beer** (27 CFR Part 7) | ABV optional but must be accurate if stated |

---

## Assumptions & Trade-offs

**Assumptions made:**
- Agents submit one image per application (not multi-page PDFs)
- The prototype does not integrate with COLA — it's standalone, as Marcus requested
- "Country of Origin" is optional for domestic products; flagged only if the field differs when both are provided

**Trade-offs:**
- **In-memory storage** resets on server restart — a production version would use a database (Postgres recommended) and S3/Azure Blob for image storage
- **Analysis takes 3–10 seconds** — within or close to Sarah's 5-second target; a production optimization would pre-cache common label patterns
- **No authentication** — appropriate for this prototype scope; production would need role-based access given PII considerations Marcus raised
- **No COLA integration** — explicitly descoped per Marcus; the data model is designed to make future integration straightforward

---

## Deployment

### Option A — One-click (fastest, no CLI needed)

Click the **Deploy with Vercel** button at the top of this README.  
It will ask for your `ANTHROPIC_API_KEY` and deploy automatically.

### Option B — GitHub Actions auto-deploy (every push deploys)

Every push to `main` triggers the CI workflow (type check + build). To also auto-deploy to Vercel:

**Step 1 — Create a Vercel account and link the project**

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **Add New Project** → import `ttb-label-review`
3. Add `ANTHROPIC_API_KEY` under Environment Variables → click **Deploy**
4. Note the URL — your app is live

**Step 2 — Get your Vercel token**

Go to [vercel.com/account/tokens](https://vercel.com/account/tokens) → create a new token → copy it.

**Step 3 — Add GitHub Secrets**

In your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Where to find it |
|---|---|
| `VERCEL_TOKEN` | The token you just created |

That's it. The deploy workflow uses the token and reads project settings from `vercel.json`. Every push to `main` now deploys automatically.

### Option C — Railway (best for persistent data)

Railway runs the app as a persistent process so the in-memory store never resets:

1. Go to [railway.app](https://railway.app) → sign in with GitHub
2. **New Project → Deploy from GitHub repo** → select `ttb-label-review`
3. Add `ANTHROPIC_API_KEY` under Variables
4. Railway auto-detects Next.js and deploys — you get a public URL

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── review/[id]/page.tsx        # Single application review
│   ├── batch/page.tsx              # Batch upload
│   └── api/
│       ├── applications/           # CRUD for applications
│       │   └── [id]/analyze/       # Triggers Claude vision analysis
│       ├── batch/                  # Bulk submission + async processing
│       └── demo/                   # Seeds sample data for evaluation
├── components/
│   ├── ComplianceReport.tsx        # Field-by-field comparison table
│   ├── LabelViewer.tsx             # Zoomable image with quality indicators
│   ├── BatchUploader.tsx           # Drag-drop bulk upload with live progress
│   └── ...
└── lib/
    ├── label-analyzer.ts           # Claude API integration + prompt
    ├── matching.ts                 # Smart/fuzzy/numeric matching logic
    ├── ttb-rules.ts                # Required fields per beverage type
    └── store.ts                    # In-memory data store
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key from console.anthropic.com |

---

## Running Tests (Manual)

1. Load demo data from the dashboard → confirms UI renders correctly
2. Submit a new application with an image → triggers live Claude analysis
3. Try the batch upload with the sample JSON template (download from the Batch page)
4. Test the "Stone's Throw" case: enter brand name as `Stone's Throw` on the form, use a label with `STONE'S THROW` — should show "Smart Match" not "Mismatch"
