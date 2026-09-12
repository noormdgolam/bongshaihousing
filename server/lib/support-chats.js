// Persistence for support conversations.
//
// Kept separate from lib/leads.js on purpose: a chat is not a lead. It is an
// enquiry with a name and a number attached, which may or may not become one.
// Storing it either way is what turns WhatsApp-style conversations into
// something the business can follow up on and count.
const { isValidBdPhone } = require('./leads');

let db;
try {
  db = require('./db');
} catch (e) {
  db = null;
}

let tablesReady = null;
async function haveTables() {
  if (tablesReady !== null) return tablesReady;
  try {
    tablesReady = !!db
      && (await db.schema.hasTable('support_chats'))
      && (await db.schema.hasTable('support_chat_messages'));
  } catch (e) {
    tablesReady = false;
  }
  return tablesReady;
}

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

/**
 * Validates the details the widget collects before the first message.
 * Returns { ok, name, phone, phoneKey, error }.
 */
function validateIdentity(rawName, rawPhone) {
  const name = clean(rawName, 255);
  const phone = clean(rawPhone, 40);
  if (name.length < 2) {
    return { ok: false, error: 'name' };
  }
  const phoneKey = isValidBdPhone(phone);
  if (!phoneKey) {
    return { ok: false, error: 'phone' };
  }
  return { ok: true, name, phone, phoneKey };
}

/**
 * Finds the conversation for this browser session, or starts one. Identity is
 * required - there are no anonymous transcripts.
 */
async function openChat({ sessionToken, name, phone, phoneKey, pageUrl, modelInterest, language }) {
  if (!(await haveTables())) return null;
  const token = clean(sessionToken, 64);
  if (!token) return null;

  const existing = await db('support_chats').where({ session_token: token }).first();
  if (existing) return existing;

  const row = {
    session_token: token,
    name,
    phone,
    phone_key: phoneKey,
    page_url: clean(pageUrl, 255) || null,
    model_interest: clean(modelInterest, 60) || null,
    language: language === 'en' ? 'en' : 'bn',
  };
  const [id] = await db('support_chats').insert(row);
  return db('support_chats').where({ id }).first();
}

/**
 * Appends one message and keeps the conversation's counters current, so the
 * dashboard can sort by genuine activity without counting rows every time.
 */
async function addMessage(chatId, role, content) {
  if (!chatId || !(await haveTables())) return;
  const text = clean(content, 4000);
  if (!text) return;
  await db('support_chat_messages').insert({
    chat_id: chatId,
    role: role === 'assistant' ? 'assistant' : 'user',
    content: text,
  });
  await db('support_chats').where({ id: chatId }).update({
    message_count: db.raw('message_count + 1'),
    last_message_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
}

/**
 * District is asked mid-conversation rather than in the opening form, so it
 * arrives later than everything else. Only fills a blank - never overwrites
 * something a human has already corrected in the dashboard.
 */
async function noteLocation(chatId, district, upazila) {
  if (!chatId || !(await haveTables())) return;
  const patch = {};
  if (district) patch.district = clean(district, 120);
  if (upazila) patch.upazila = clean(upazila, 120);
  if (!Object.keys(patch).length) return;

  const row = await db('support_chats').where({ id: chatId }).first();
  if (!row) return;
  const update = {};
  if (patch.district && !row.district) update.district = patch.district;
  if (patch.upazila && !row.upazila) update.upazila = patch.upazila;
  if (Object.keys(update).length) {
    await db('support_chats').where({ id: chatId }).update({ ...update, updated_at: db.fn.now() });
  }
}

module.exports = { validateIdentity, openChat, addMessage, noteLocation, haveTables };
