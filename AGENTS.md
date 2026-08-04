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
- **Static First:** This is a statically generated site. Do not introduce heavy JS frameworks or unnecessary runtime libraries. Ensure content is parseable without Javascript (for AEO and SEO purposes).
- **AEO Foundations:** Do not modify `robots.txt` to block AI crawlers (`GPTBot`, `ClaudeBot`, `PerplexityBot`, etc.) without explicit permission. Ensure all new core pages are listed in `llms.txt`.
- **Aesthetics & Performance:** Maintain modern web design standards (vibrant colors, glassmorphism, dynamic animations) while keeping page loads fast and images lazy-loaded (`loading="lazy"`).

## 4. Git Operations
- **Always Automatically Push:** After successfully applying, fixing, or completing requested code edits or tasks, automatically run `git add .`, `git commit` with a descriptive message, and `git push` to sync changes without waiting for user prompting.
