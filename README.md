# Lead Pipeline & Dashboard

A shared lead-capture pipeline and a minimal internal dashboard for the owner
and a few agents. Small and boring on purpose: no CRM framework, no chart
library, no new database.

## Architecture

**System of record is the existing `leads` MySQL table** (already live before
this feature, feeding agent-referral commission attribution and customer
portal auto-provisioning - see `server/routes/contact.js`), extended by two
migrations rather than a parallel Google Sheets store. Every entry point calls
one shared function, `recordLead()` in `server/lib/leads.js`, so "every form
that collects a phone number writes to the same place" is true by
construction:

- The contact form and both cost calculators already POST to
  `/send_email.php` (`server/routes/contact.js`), which now also runs the
  shared dedup/followup-scheduling logic before its existing insert.
- Agent signup (`server/routes/agent-auth.js`) calls `recordLead()` directly.
- `POST /api/leads` (`server/routes/leads.js`) is the minimal ingest endpoint
  for anything else - the chatbot's contact recommendation, and any future
  form on this site or a sister site (bongshaisteel.com,
  bongshaiengineering.com, bongshai.com all just need this same code adapted
  into their own repos and pointed at their own `leads` table, or at this
  endpoint if they should share one).

## Environment variables

None are required for the dashboard or the DB-backed pipeline to work - they
run with sensible defaults. These are optional, and each one gates a single
feature that degrades gracefully (falls back or logs a warning) if unset:

| Variable | Purpose | If unset |
|---|---|---|
| `WHATSAPP_TOKEN` | Meta Cloud API access token | Falls back to email notify |
| `WHATSAPP_PHONE_NUMBER_ID` | Cloud API sender phone number ID | Falls back to email notify |
| `WHATSAPP_TEMPLATE_NAME` | Name of your approved template | Falls back to email notify |
| `WHATSAPP_TEMPLATE_LANG` | Template language code | Defaults to `bn` |
| `OWNER_WHATSAPP` | Where the WhatsApp notify is sent | Defaults to `+8801781636613` |
| `OWNER_NOTIFY_EMAIL` | Where the email fallback is sent | Defaults to `MAIL_TO_SALES`, then `sales@bongshai.com` |

### Setting up WhatsApp Cloud API notify (optional)

1. Create a Meta Business app with the WhatsApp product enabled, and note its
   **Phone Number ID** and a permanent **access token**.
2. Submit a message template for approval (Business Manager → WhatsApp
   Manager → Message Templates). It must declare **exactly 4 body variables**,
   in this order: name, phone, district, product. For example:
   > 🔔 নতুন লিড: {{1}}, ফোন {{2}}, জেলা {{3}}, চাহিদা {{4}}
3. Set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and
   `WHATSAPP_TEMPLATE_NAME` (the template's exact name, not its display label)
   in `server/.env`.
4. Restart the app. If any of the three are missing, `server/lib/whatsapp.js`
   logs a warning and every new-lead notify falls back to email instead -
   nothing breaks, it just uses the other channel.

Until this is configured, every notification goes out by email - this is the
expected, safe default, not a broken state.

## Dashboard

Reuses the existing agent login (`/agent/login.html`) rather than a new auth
system - `agents.role` is `admin` or `agent`. Admin sees every lead; an agent
sees only leads with `assigned_to` set to them. Logging in lands on
`/agent/today` ("আজকের কাজ"), sorted by urgency: overdue followups, quoted
leads with no followup logged, then untouched new leads. `/agent/all-leads`
has filters, inline status editing, and CSV export/import.

The one-time migration that adds `role` to `agents` and extends `leads` also
seeds (or promotes an existing agent matching the phone number to) one
`role=admin` account for `+8801781636613`, printing a temporary password to
the migration's console output *only* - it is never written to any file.
Change it on first login.

### Editable settings

`/agent/settings` (admin only) holds the monthly Facebook ad-spend figure used
for the "cost per lead" stat, and the three WhatsApp follow-up templates
(supports `{{নাম}}`, `{{জেলা}}`, `{{তারিখ}}` placeholders). Stored in the
existing `theme_settings` key/value table under the key
`lead_dashboard_settings` - no new table for this.

## UTM attribution

`js/utm-capture.js` captures `utm_source`/`utm_medium`/`utm_campaign`/
`gclid`/`fbclid` from the landing URL into a first-party cookie (30 days,
last-touch), included site-wide via `server/views/layout.njk`. Every
lead-submitting form reads `window.BHUtm.source()` and attaches it as the
lead's source (falling back to `'direct'`, or a form-specific label like
`contact_form` when no campaign data exists at all).

## Known limitation

Comparing a SQL `DATE` column against `NOW()`/`last_touch_at` across MySQL's
DATE and DATETIME types works correctly, but **reading** a `DATE` column back
through `mysql2` without `dateStrings` silently shifts it by the server's UTC
offset when serialized (e.g. `.toISOString()`, `JSON.stringify()`) - a
followup date correctly stored as `2026-09-06` was observed reading back as
`2026-09-05T18:00:00.000Z`. Fixed by scoping `dateStrings: ['DATE']` in
`server/db/knexfile.js` (only the `DATE` type - `DATETIME`/`TIMESTAMP` columns
elsewhere in the app are unaffected). Worth remembering if a future `DATE`
column is added anywhere in this codebase.
