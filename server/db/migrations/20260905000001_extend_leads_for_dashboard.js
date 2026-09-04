// Extends the existing `leads` table (already live, already feeding agent
// referral attribution and portal auto-provisioning via server/routes/contact.js)
// into the system of record for the new internal lead dashboard, rather than
// introducing a parallel Google-Sheet-backed store. Also adds `role` to
// `agents` so the dashboard can reuse the existing agent login instead of a
// new auth system.
//
// While reading the current schema for this migration, found `leads.email` is
// NOT NULL - but the cost calculator's lead post (postLeadToCrm in both
// calculator templates) never collects an email at all. Its fetch() call
// silently swallows any error ("never block the WhatsApp handoff on this"),
// so every calculator-sourced lead has been failing server-side validation
// and never reaching this table - confirmed live: production has exactly 1
// row, source=contact_form, and 0 with source=calculator, despite the
// calculators having been live and working (WhatsApp-wise) all session.
// Making email nullable here is a real bug fix, not just schema tidying.
exports.up = async function (knex) {
  const hasRole = await knex.schema.hasColumn('agents', 'role');
  if (!hasRole) {
    await knex.schema.alterTable('agents', (table) => {
      table.enu('role', ['admin', 'agent']).notNullable().defaultTo('agent');
    });
  }

  await knex.schema.alterTable('leads', (table) => {
    table.string('email', 255).nullable().alter();
    table.string('phone_key', 20).nullable();
    table.string('budget', 100).nullable();
    table.integer('assigned_to').unsigned().nullable()
      .references('id').inTable('agents').onDelete('SET NULL');
    table.string('next_action', 255).nullable();
    table.date('followup_1_at').nullable();
    table.date('followup_2_at').nullable();
    table.date('followup_3_at').nullable();
    table.timestamp('quoted_at').nullable();
    table.decimal('quote_amount', 12, 2).nullable();
    table.string('lost_reason', 50).nullable();
    table.timestamp('last_touch_at').nullable();
    table.index(['phone_key', 'created_at'], 'leads_phone_key_created_idx');
    table.index(['status'], 'leads_status_idx');
    table.index(['assigned_to'], 'leads_assigned_to_idx');
  });

  // Backfill phone_key + translate the one pre-existing English status value
  // to the dashboard's Bangla funnel - trivial cost today (1 row live), still
  // correct if run against an environment with more historical rows.
  const { normalizePhone } = require('../../lib/customer-identity');
  const STATUS_MAP = { new: 'নতুন', contacted: 'যোগাযোগ হয়েছে', in_negotiation: 'আলোচনায়', closed: 'বিক্রি' };
  const rows = await knex('leads').select('id', 'phone', 'status');
  for (const row of rows) {
    const patch = { phone_key: normalizePhone(row.phone) };
    if (STATUS_MAP[row.status]) patch.status = STATUS_MAP[row.status];
    await knex('leads').where({ id: row.id }).update(patch);
  }

  // `lead_notes` is the "notes[]" array from the spec, as a real child table -
  // matches this codebase's existing pattern for per-row history (product_specs,
  // product_variants, edit_history) rather than a JSON blob column, so notes
  // stay individually queryable/orderable. created_by_name is denormalized
  // (same reasoning as activity_log/edit_history elsewhere in this codebase):
  // a note should still read sensibly if the agent who logged it is later
  // deleted.
  await knex.schema.createTable('lead_notes', (table) => {
    table.increments('id').primary();
    table.integer('lead_id').unsigned().notNullable()
      .references('id').inTable('leads').onDelete('CASCADE');
    table.text('note').notNullable();
    table.integer('created_by').unsigned().nullable()
      .references('id').inTable('agents').onDelete('SET NULL');
    table.string('created_by_name', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['lead_id', 'created_at'], 'lead_notes_lead_idx');
  });

  // Seed (or promote) exactly one admin-role agent for the owner, so "reuse
  // the existing agent login" has an admin account to actually log in with -
  // today every agents row is a referral-partner signup, none marked admin.
  const OWNER_PHONE = '+8801781636613';
  const { normalizePhone: np2 } = require('../../lib/customer-identity');
  const ownerKey = np2(OWNER_PHONE);
  const existing = await knex('agents').whereRaw(
    "REPLACE(REPLACE(REPLACE(phone, '+', ''), ' ', ''), '-', '') LIKE ?",
    [`%${ownerKey}`]
  ).first();

  if (existing) {
    await knex('agents').where({ id: existing.id }).update({ role: 'admin', status: 'active' });
    console.log(`[migration] promoted existing agent #${existing.id} (${existing.phone}) to role=admin`);
  } else {
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    const tempPassword = crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 12);
    const hash = await bcrypt.hash(tempPassword, 12);
    await knex('agents').insert({
      name: 'Bongshai Housing (Owner)',
      phone: OWNER_PHONE,
      email: null,
      district: 'Dhaka',
      password_hash: hash,
      status: 'active',
      role: 'admin',
    });
    // Printed once, at migration time only - never written to a file or log
    // that persists past this run. The operator must capture it now.
    console.log(`[migration] created owner admin agent, phone=${OWNER_PHONE}, TEMP PASSWORD=${tempPassword} - log in at /agent/login.html and change it immediately, this value is not stored anywhere else`);
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('lead_notes');
  await knex.schema.alterTable('leads', (table) => {
    table.dropColumn('phone_key');
    table.dropColumn('budget');
    table.dropColumn('assigned_to');
    table.dropColumn('next_action');
    table.dropColumn('followup_1_at');
    table.dropColumn('followup_2_at');
    table.dropColumn('followup_3_at');
    table.dropColumn('quoted_at');
    table.dropColumn('quote_amount');
    table.dropColumn('lost_reason');
    table.dropColumn('last_touch_at');
  });
  const hasRole = await knex.schema.hasColumn('agents', 'role');
  if (hasRole) {
    await knex.schema.alterTable('agents', (table) => {
      table.dropColumn('role');
    });
  }
};
