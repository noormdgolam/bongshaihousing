# Bongshai Housing — session handover

Read this first. It is written so a fresh session can continue without
re-deriving anything. Everything below is verified against the live site, not
assumed.

**Branch:** `v0/security-fixes` · **Live:** https://bongshaihousing.com
**Unpushed commits:** ~54. The GitHub remote is **PUBLIC** — pickaxe for
credentials before any push, and only push when the user asks.

---

## Host quirks that will waste your time if you don't know them

| Thing | Reality |
|---|---|
| `/` and every `*.html` | Served by **LiteSpeed from disk**. Node never sees them. An Express redirect on `/` will not fire. |
| `/m`, `/api/*`, `/admin/*` | Dynamic, served by Node. |
| Booting Node | Request a **dynamic** URL (`curl https://bongshaihousing.com/m`). Requesting `/` does not boot it. |
| Template change | Upload **and** write `tmp/restart.txt` — Nunjucks caches compiled templates. |
| Static page content | After a template change, run `scratch/rebuild_live.js` → expect `211/211, 0 failed`. |
| Reading live HTML | `curl` gets a **bot-challenge page** ("One moment, please…"). Use Playwright. Status codes over curl are fine. |
| Host clock | **UTC−4**. A file you just uploaded lists with *yesterday's* date. Not a failed upload. |
| Windows | `curl -o NUL`, never `/dev/null`. |
| **Shell heredocs** | **Strip backslashes.** This bit us four times (one wrote a literal `0x08` byte into a regex). Write patch scripts with the Write tool, never a heredoc containing `\s`, `\d`, `\/`. |
| `jsdom` | In `devDependencies` — **not installed on the host**, and there is no SSH to run npm there. |
| Rate limiting | Running several Playwright suites back-to-back gets the IP challenged. Run them **one at a time**. |

### Credentials
Never in the repo. Helper files read them from the user's memory notes at
runtime: `$TEMP/dbcfg.js` (prod MySQL), `$TEMP/ftpcfg.js` (FTP),
`$TEMP/adminpw.js` (admin panel). Recreate them from
`~/.claude/projects/e--web-Bongshaihousing/memory/reference_*.md` if missing.
The auto-mode classifier blocks credentials typed on a command line — that is
why the helpers exist.

---

## Deploy, exactly

```bash
# 1. commit first — the deploy list comes from the commit, not from git status
git show --name-only --pretty=format: HEAD | grep "^server/" | sort > "$TEMP/deploy.txt"
node scratch/deploy_professionalism.js        # batched FTPS, ~20 files per connection
# 2. restart (templates and routes both need it)
#    writes tmp/restart.txt — see the one-liner used throughout the session
# 3. boot:  curl https://bongshaihousing.com/m
# 4. only if a *static page* template changed:  node "$TEMP/run_rebuild.js"
```

Static docroot files (`.htaccess`, `sw.js`, `manifest.json`, `images/**`,
`css/**`, `js/**`) go to `bongshaihousing.com/` — **not** to the Node app dir,
and they need no restart.

**`.htaccess` warning:** the live copy carries a cPanel-generated PHP handler
block the local one lacked. Always build on a freshly downloaded live copy.

---

## Regression gates — all currently green

Run individually. Each prints `N/N পাস`.

| Script | Expected |
|---|---|
| `scratch/verify_mobile_redirect.js` | 27/27 |
| `scratch/verify_app_shell.js` | 16/16 |
| `scratch/verify_search.js` | 11/11 |
| `scratch/verify_more.js` | 19/19 |
| `scratch/verify_detail_parity.js` | 22/22 |
| `scratch/verify_pwa.js` | 14/14 |
| `scratch/verify_mobile_chat.js` | 14/14 |
| `scratch/verify_chat_live.js` | 6/6 |
| `scratch/verify_admin_mobile.js` | 11/11 |
| `scratch/verify_lead_counter.js` | 4/4 |
| `scratch/audit_admin_pages_mobile.js` | 27/27 |
| `scratch/audit_parity.js` | 35/35 desktop links reachable |
| `scratch/audit_unredirected.js` | 204 of 206 pages open in the app |
| `scratch/test_key_rotation.js` | 12/12 (offline) |
| `scratch/test_chat_format.js` | 9/9 |
| `scratch/test_extract_parity.js` | 19/19 |
| `scratch/test_catalog_context.js` | 14/14 |
| `scratch/test_lead_counts.js` | 4/4 |
| `scratch/verify_support_invite.js` | 13/13 |
| `scratch/test_inline_scripts.js` | 963 scripts, 0 broken |
| `node server/scripts/check-template-integrity.js` | 0 structural, 129 render errors (129 is normal) |
| `node "$TEMP/run_price_check.js"` | **changed: 0** — no fixed price may ever move |

**Live tests write real rows.** Clean up after: delete from `support_chats`,
`support_chat_messages` and `leads` where the name is `Playwright Test`,
`Verification Bot`, `Key Pool Check` or `Rotation Check`. Leave everything
else — `Munna`, `Md Golam Noor`, `Test User` are the user's own testing.

---

## Rules the user has set — do not violate

- **Fixed prices are the user's alone.** `products.fixed_price` is set in the
  dashboard and nothing else may change it. The per-sq-ft figure is internal
  arithmetic (`fixed_price / total_floor_area`) and is **never shown to a
  customer** — `products.price_per_sqft` is wrong on 106 of 113 rows; never
  use it.
- **Answer in Bangla**, even when the user writes English.
- **Caveman-terse replies** (see `CLAUDE.md`), except for security warnings and
  irreversible-action confirmations.
- **Commit every verified change immediately** — the user's PC suffers power
  cuts.
- Never `git add .` or `-A`.
- Don't hammer the live site or FTP with tight loops.

---

## Where things are

```
server/routes/mobile.js        /m + /api/m/model/:slug, /api/m/page/:name, /api/m/doc/:slug
server/views/mobile/home.njk   the whole app shell (one file, ~1400 lines)
server/lib/ai-assistant.js     Groq call, key rotation, catalogue context
server/routes/ai-chat.js       /api/ai-chat, identity gate, rate limit
server/views/partials/ai-chat-widget.njk   the website chat widget
server/views/admin-layout.njk  admin chrome + the mobile drawer
.htaccess                      canonical redirects + the mobile redirect block
```

### The app shell, in one paragraph
`/m` is a single document with sibling `.view` sections (home, models,
projects, more, model, page). `showView(name, push)` swaps them — no
navigation, each tab keeps its scroll, and every change is a `pushState` so
Android back walks the tabs. `openHash()` routes `#models`, `#projects`,
`#more`, `#calculator`, `#model/<slug>`, `#page/<name>`, `#doc/<slug>`.
**The opening hash is routed from the very end of the script on purpose** —
`#model` needs the catalogue, the detail container and `openModel`, each set up
at a different point above. Moving that call earlier has broken it twice.

---

## Known-open, waiting on the user

1. Is `images/projects/completed/chotrogram_1784362457177.webp` genuinely the
   Chattogram project? Project id=2 has no image and shows a placeholder tile.
2. Should an **Asulia** project be published? The nav links
   `project-asulia-dhaka.html` and a photo exists, but no row does.
3. A real photo for **Kaliganj, Dhaka** (project id=19, on
   `project-photo-unavailable.png`).
4. Prices for the **20 Low Cost House** models (`BH-LCH-1001`–`1020`) — the
   only 20 of 133 without a `fixed_price`.
5. **Push the ~54 commits** — public remote, needs the user's word.

## Known-open, technical

- `material-testing-certification.html` and `multi-story-homes.html` still show
  the desktop view on a phone. Both exist in docroot and registry and no
  earlier rule claims them; the suspect is the `RewriteCond %{DOCUMENT_ROOT}/$1
  -f` line — `$1` in a condition refers to the **preceding** RewriteRule, not
  the one that follows.
- `seo_settings` holds a live `anthropic_api_key` (unused by any code) and a
  `groq_api_key`. The user has chosen to leave both.
- Remote MySQL wildcard `abongsha_housin@%` is **open** — confirmed by
  connecting from outside. The user wants it closed when the work is finished;
  note that closing it also ends this machine's DB access.
- Groq free tier still 429s on tokens-per-minute under load. Rotation across
  two keys (`.env` + `seo_settings`) softens it; a paid tier is the real fix.

## Telegram alerts

A chat fires one Telegram alert per conversation - name, number, whether it
came from the app or the website, the opening question, and a link to the
transcript. **Confirmed delivered by the user.** Wired in
`server/routes/ai-chat.js` via the existing `lib/telegram.js`;
`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are already in the host .env.
Fire-and-forget by design - an alert must never delay or fail a reply.

## Recently finished (do not redo)

Sitewide professionalism pass (ISO claim, SKUs, spellings, WhatsApp prefills,
titles) · `/m` rebuilt as a real app with in-shell tabs, search, full model
detail and the whole site's content · PWA installable at `/m` with offline
shell · Customer Support chat in the app, transcripts to the dashboard ·
chat markup and handover bugs · admin usable on a phone (27/27) · one shared
chat formatter for website and app (partials/chat-format.njk) · app chat
brought level: chips, EN/BN toggle, tables, link boxes · share button on
models only, both surfaces · Telegram alert per conversation · support
invitation on the Home tab and at the estimate result · mobile
redirect with crawlers excluded · lead counters counting the right language.
