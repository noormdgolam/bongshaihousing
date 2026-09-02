exports.up = async function (knex) {
  // 1. Agent Program Settings (tunable business rules: commission rates, tiers, tranches, protection days)
  const hasSettings = await knex.schema.hasTable('agent_settings');
  if (!hasSettings) {
    await knex.schema.createTable('agent_settings', (table) => {
      table.string('setting_key', 100).primary();
      table.text('setting_value').notNullable();
      table.timestamps(true, true);
    });

    // Seed default tunable business parameters
    await knex('agent_settings').insert([
      { setting_key: 'commission_default_rate', setting_value: '2.00' },
      { setting_key: 'tier_silver_min_deals', setting_value: '0' },
      { setting_key: 'tier_silver_rate', setting_value: '2.00' },
      { setting_key: 'tier_gold_min_deals', setting_value: '3' },
      { setting_key: 'tier_gold_rate', setting_value: '2.50' },
      { setting_key: 'tier_platinum_min_deals', setting_value: '6' },
      { setting_key: 'tier_platinum_rate', setting_value: '3.00' },
      { setting_key: 'tranche_1_name', setting_value: 'Agreement & Advance' },
      { setting_key: 'tranche_1_pct', setting_value: '40' },
      { setting_key: 'tranche_2_name', setting_value: 'Fabrication & Delivery' },
      { setting_key: 'tranche_2_pct', setting_value: '40' },
      { setting_key: 'tranche_3_name', setting_value: 'Handover & Erection' },
      { setting_key: 'tranche_3_pct', setting_value: '20' },
      { setting_key: 'lead_protection_days', setting_value: '90' },
      { setting_key: 'payout_min_amount', setting_value: '5000' },
      {
        setting_key: 'whatsapp_share_template',
        setting_value: 'বংশাই হাউজিং-এর প্রি-ফেব স্টিল ডুপ্লেক্স ও ইন্ডাস্ট্রিয়াল শেড সম্পর্কে বিস্তারিত জানতে এবং স্পেশাল ডিসকাউন্টে বুকিং করতে নিচের লিংকে ভিজিট করুন:\n{{referral_link}}\n\nঅথবা সরাসরি যোগাযোগ করুন: {{phone}}',
      },
    ]);
  }

  // 2. Expand agents table with referral_code and tier
  const hasAgents = await knex.schema.hasTable('agents');
  if (hasAgents) {
    const hasReferralCode = await knex.schema.hasColumn('agents', 'referral_code');
    if (!hasReferralCode) {
      await knex.schema.alterTable('agents', (table) => {
        table.string('referral_code', 50).nullable().unique();
        table.enu('tier', ['silver', 'gold', 'platinum']).notNullable().defaultTo('silver');
      });
    }
  }

  // 3. Expand agent_leads with product_id, deal_value, commission_rate, estimated_commission,
  // commission_status, milestone_stage, and protection_expires_at
  const hasAgentLeads = await knex.schema.hasTable('agent_leads');
  if (hasAgentLeads) {
    const hasProductId = await knex.schema.hasColumn('agent_leads', 'product_id');
    if (!hasProductId) {
      await knex.schema.alterTable('agent_leads', (table) => {
        table.integer('product_id').unsigned().nullable()
          .references('id').inTable('products').onDelete('SET NULL');
        table.decimal('deal_value', 14, 2).notNullable().defaultTo(0.00);
        table.decimal('commission_rate', 5, 2).notNullable().defaultTo(2.00);
        table.decimal('estimated_commission', 14, 2).notNullable().defaultTo(0.00);
        table.enu('commission_status', ['pending', 'approved', 'partial_paid', 'paid']).notNullable().defaultTo('pending');
        table.enu('milestone_stage', ['site_visit', 'design_boq', 'agreement_advance', 'fabrication', 'handover_commission']).notNullable().defaultTo('site_visit');
        table.date('protection_expires_at').nullable();
      });
    }
  }

  // 4. Create agent_payouts table (Commission Payout Ledger)
  const hasPayouts = await knex.schema.hasTable('agent_payouts');
  if (!hasPayouts) {
    await knex.schema.createTable('agent_payouts', (table) => {
      table.increments('id').primary();
      table.integer('agent_id').unsigned().notNullable()
        .references('id').inTable('agents').onDelete('CASCADE');
      table.integer('agent_lead_id').unsigned().nullable()
        .references('id').inTable('agent_leads').onDelete('SET NULL');
      table.decimal('amount', 14, 2).notNullable();
      table.enu('payment_method', ['bank_transfer', 'bkash', 'nagad', 'cheque', 'cash']).notNullable().defaultTo('bank_transfer');
      table.string('reference_no', 100).nullable();
      table.integer('tranche_number').nullable().defaultTo(1);
      table.text('notes').nullable();
      table.string('created_by', 100).nullable();
      table.timestamp('paid_at').notNullable().defaultTo(knex.fn.now());
      table.timestamps(true, true);
    });
  }

  try {
    await knex.raw('ALTER TABLE `agent_settings` ENGINE=InnoDB');
    await knex.raw('ALTER TABLE `agent_payouts` ENGINE=InnoDB');
  } catch (e) {
    // SQLite or ignore engine specification
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('agent_payouts');
  await knex.schema.dropTableIfExists('agent_settings');

  const hasAgentLeads = await knex.schema.hasTable('agent_leads');
  if (hasAgentLeads) {
    await knex.schema.alterTable('agent_leads', (table) => {
      table.dropForeign(['product_id']);
      table.dropColumn('product_id');
      table.dropColumn('deal_value');
      table.dropColumn('commission_rate');
      table.dropColumn('estimated_commission');
      table.dropColumn('commission_status');
      table.dropColumn('milestone_stage');
      table.dropColumn('protection_expires_at');
    });
  }

  const hasAgents = await knex.schema.hasTable('agents');
  if (hasAgents) {
    await knex.schema.alterTable('agents', (table) => {
      table.dropColumn('referral_code');
      table.dropColumn('tier');
    });
  }
};
