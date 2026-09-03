# Bongshai Housing - AI Agent Guidelines (AGENTS.md)

Welcome! This file provides guidelines and context for autonomous agents interacting with this repository.

## 1. Context & Niche
- **Industry:** Pre-Engineered Steel Buildings (PEB), Steel Composite Buildings, and EPC Real Estate.
- **Location:** Bangladesh (Dhaka HQ).
- **Target Audience:** B2B industrial clients (factory sheds) and B2C residential clients (villas, duplexes, container homes).
- **Language Support:** English and Bangla (Banglish).

## 2. Translation & Tone Rules
- **Strict Adherence to Standard Bengali Grammar:** When generating Bangla copy, use standard NCTB grammar rules (ধ্বনিতত্ত্ব, সন্ধি, সমাস, কারক ও বিভক্তি).
- **Civil Engineering Context:** Always ensure Bangla translations strictly align with the construction, civil engineering, and EPC real estate niche context. Avoid generic dictionary literals that produce highly inappropriate or unprofessional meanings in a construction context (e.g., "Story" must be translated as building floor "তলা", "Fabrication" as manufacturing/construction "ফেব্রিকেশন" rather than a "Made-up lie").

## 3. Web Development Rules
- **Responsive Layouts:** Whenever modifying UI elements, HTML structure, or CSS styles, you MUST consider and verify the impact on BOTH desktop (PC) and mobile layouts. Ensure elements do not overflow, overlap, or become unclickable on mobile screens. Update shared components respecting `@media` queries.
- **Server-rendered, not a heavy client framework:** The site is now an Express + Nunjucks app (`server/`), not the original static HTML tree — see `server/page-registry.json` + `server/scripts/convert-pages.js` for how pages are templated, and `server/redirects.json` for `.htaccess`-parity URL redirects. The "no React/Next, no heavy client-side framework" spirit of the old "Static First" rule still applies (server-rendered HTML, content parseable without JS, same as before) — the change is *how* the HTML gets generated, not what ships to the browser. Do not introduce a client-side framework or unnecessary runtime libraries. When editing a converted page's content, edit the `.njk` template under `server/views/pages/`, not the original `.html` file in the repo root (those are the pre-conversion source the templates were generated from, kept for reference/diffing, not what's served).
- **AEO Foundations:** Do not modify `robots.txt` to block AI crawlers (`GPTBot`, `ClaudeBot`, `PerplexityBot`, etc.) without explicit permission. Ensure all new core pages are listed in `llms.txt`.
- **Aesthetics & Performance:** Maintain modern web design standards (vibrant colors, glassmorphism, dynamic animations) while keeping page loads fast and images lazy-loaded (`loading="lazy"`).

## 4. Git Operations
- **Always Automatically Push:** After successfully applying, fixing, or completing requested code edits or tasks, automatically run `git add .`, `git commit` with a descriptive message, and `git push` to sync changes without waiting for user prompting.
- **Exception — `server/` (the Node app):** `main` auto-deploys straight to the live, revenue-generating site via GitHub Actions FTP on every push, with no build/test gate in between. Node app work happens on its own branch (currently `node-app-phase1`) and gets deployed separately, by hand, to the `test.bongshaihousing.com` staging app via FTP + a `tmp/restart.txt` touch (see `server/scripts/generate-redirects.js`'s and `server/scripts/verify-redirects.js`'s doc comments, and the project's Node-hosting-quirks notes) — never auto-push `server/` changes to `main` until the Node app is the thing actually serving production traffic.

## 5. AI Architecture & Sales Assistant Guidelines
- **No Local LLMs on Shared Hosting:** Due to CloudLinux memory limits (~512MB RAM) on cPanel shared hosting, do not attempt to run heavy local LLMs (e.g. Ollama, PyTorch, llama.cpp) or multi-tier Python microservices.
- **Node.js + Groq/Cloud API Stack:** Implement AI features directly inside the Express server (`server/routes/ai-chat.js` and `server/lib/ai-assistant.js`) calling fast, low-latency APIs (such as Groq LPU `llama-3.3-70b-versatile`) with dynamic product context queried from MySQL.
- **Sales Conversion Mandate:** Every AI response must provide direct, concise answers (<45 words), give realistic price estimates in BDT per sq.ft., recommend specific building models (e.g., BH-SB, BH-CB, LCV, PEB factory sheds), and provide an actionable call-to-action (direct WhatsApp link `+8801781636613` or quote request button) to convert visitors into booked consultations.

## 6. Migration Priority Order
- **Content First:** Customer-facing content, dynamic catalog pages, pricing calculators, and lead capture tools always take precedence over back-office admin tooling.

## 7. Scope Exclusions
- **No Career / Job Application System:** The career portal, job application forms, resumes, career listings seed, and admin career routes have been permanently removed per final user decision. Do not recreate or suggest reintroducing `/career.html`, `career_listings`, or career-related endpoints.
