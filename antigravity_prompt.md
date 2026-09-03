# Antigravity Agent Master Prompt (Bongshai Housing)

Welcome! This document defines the core architecture, operational standards, SEO/AEO guidelines, and behavioral rules for AI agents working in the **Bongshai Housing** repository.

---

## 1. Project Context & Niche
- **Organization:** Bongshai Housing Ltd. (Part of Bongshai Group, Dhaka, Bangladesh).
- **Core Industry:** Pre-Engineered Steel Buildings (PEB), Steel-Concrete Composite Buildings, Industrial Factory Sheds, and EPC Turnkey Real Estate.
- **Target Audience:**
  - **B2B Industrial:** Factory sheds, warehouses, industrial plants, cold storage.
  - **B2C Residential:** Duplexes, luxury villas, simplex homes, cottage houses, modular container homes.
- **Geographic Coverage:** Nationwide across Bangladesh (HQ in Uttara, Dhaka; hubs in Chattogram and Cumilla).

---

## 2. Technology Stack & Hosting Constraints
- **Server-Rendered Architecture:** Express.js + Nunjucks (`server/views/`), not a heavy client-side SPA (no React/Next.js). Content must be 100% crawlable without JavaScript execution.
- **Database:** MySQL via Knex.js query builder (`server/db/migrations/`).
- **cPanel / CloudLinux Shared Hosting:** ~512MB RAM memory limit per LVE. Do not run heavy local Python/LLM binaries (Ollama, PyTorch) on the server.
- **AI Integrations:** Cloud APIs (e.g. Groq LPU `llama-3.3-70b-versatile` / Gemini / Anthropic) with streaming and fallback protection.
- **Static Assets:** Optimized WebP images (`<picture>` / `srcset`), minified CSS, and vanilla JS.

---

## 3. Translation & Language Standards (Bangla Mastery)
- **Standard Bengali Grammar:** Strict adherence to NCTB and Bamandev Chakrabarti grammar rules (ধ্বনিতত্ত্ব, সন্ধি, সমাস, কারক ও বিভক্তি).
- **Civil Engineering Context:** Ensure translations strictly align with construction and EPC terminology:
  - *"Story"* ➔ Building floor (**তলা**), not a fairytale.
  - *"Fabrication"* ➔ Structural manufacturing/assembly (**ফেব্রিকেশন**), not a falsehood.
  - *"Erection"* ➔ Structural assembly on-site (**কাঠামো স্থাপন / ইরেকশন**).
  - *"Shed"* ➔ Industrial warehouse/plant structure (**ইন্ডাস্ট্রিয়াল শেড**).

---

## 4. AEO, GEO & WebMCP Standards (Mandatory)
Every page and new feature must satisfy Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO):
1. **Answer-First Openings:** Lead every core section with a direct, factual answer under 45 words.
2. **Natural-Language Headings:** Use question-based `<h2>` and `<h3>` tags (e.g. *"What is the cost of building a prefab steel house in Bangladesh?"*).
3. **Structured Schema:** Embed JSON-LD graphs (`LocalBusiness`, `GeneralContractor`, `FAQPage`, `HowTo`) on all public pages.
4. **Agent Discovery:** Maintain [robots.txt](file:///e:/web/Bongshaihousing/robots.txt) (allowing `GPTBot`, `ClaudeBot`, `PerplexityBot`) and [llms.txt](file:///e:/web/Bongshaihousing/llms.txt).
5. **WebMCP Action Bindings:** Interactive components and quote calculators must expose `data-mcp-action` attributes for AI agents.

---

## 5. Sales Conversion & Pricing Benchmarks (BDT)
AI assistant responses and sales copy must quote realistic Bangladesh market pricing:
- **Industrial PEB Sheds:** 850 – 1,600 BDT / sq.ft.
- **Prefab / Simplex Steel Composite:** 1,400 – 2,400 BDT / sq.ft.
- **Duplex / Luxury Villas:** 2,400 – 3,500+ BDT / sq.ft.
- **Turnkey Construction Timeline:** 45 – 90 days.
- **Call to Action (CTA):** Direct consultation via WhatsApp (`+8801781636613` / `+8801781636613`) or online quote request.

---

## 6. Admin Panel & Visitor Intelligence
- **Visitor Tracking:** Real-time logging of Client IP, Country, City, Device Type (Mobile/Desktop/Tablet/Bot), Browser, OS, Page Route, and Referrer.
- **Role-Based Access Control:** Superadmin, Admin, Editor, Sales roles for managing Inquiries, Products, Orders, Milestones, and SEO Automation.

---

## 7. Git & Deployment Workflows
- **Public Website:** `main` branch auto-deploys static root assets via GitHub Actions FTP.
- **Node.js Express App:** Develop and stage on branch `node-app-phase1` before production merge.
- **Automatic Git Operations:** Automatically commit and push working code with concise descriptive messages.
