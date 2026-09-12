// Support chat capture.
//
// Every conversation is kept, whether or not it ever becomes a lead. That is
// the point: the business currently has one row in `leads` while the real
// enquiries happen in chat and WhatsApp, so there is nothing to follow up on
// and nothing to measure. A stored transcript with a name and a number is a
// contactable enquiry even when the customer never filled in a form.
//
// Name and phone are collected BEFORE the first message (the widget gates on
// it), so there is no such thing as an anonymous transcript here. District is
// deliberately NOT collected up front - it is asked later in conversation, only
// when it actually matters (delivery distance, site visit), because front-
// loading a form is what makes people abandon the chat.
exports.up = async function (knex) {
  await knex.schema.createTable('support_chats', (table) => {
    table.increments('id').primary();

    // Identifies the browser session so follow-up messages append to the same
    // conversation instead of starting a new one on every send.
    table.string('session_token', 64).notNullable().unique();

    table.string('name', 255).notNullable();
    table.string('phone', 40).notNullable();
    // Normalised BD number (isValidBdPhone's local form), so the same person
    // chatting twice can be recognised and matched against leads.
    table.string('phone_key', 20).notNullable().index();

    // Asked mid-conversation rather than up front.
    table.string('district', 120).nullable();
    table.string('upazila', 120).nullable();

    // What they were looking at when they opened the chat.
    table.string('page_url', 255).nullable();
    table.string('model_interest', 60).nullable();
    table.string('language', 5).notNullable().defaultTo('bn');

    // Set if this conversation was converted into a lead. Nullable on purpose:
    // a chat is worth keeping on its own.
    table.integer('lead_id').unsigned().nullable()
      .references('id').inTable('leads').onDelete('SET NULL');

    table.enu('status', ['open', 'contacted', 'converted', 'closed']).notNullable().defaultTo('open');
    table.text('admin_notes').nullable();

    table.integer('message_count').notNullable().defaultTo(0);
    table.timestamp('last_message_at').nullable();
    table.timestamps(true, true);

    table.index(['status', 'last_message_at']);
  });

  await knex.schema.createTable('support_chat_messages', (table) => {
    table.increments('id').primary();
    table.integer('chat_id').unsigned().notNullable()
      .references('id').inTable('support_chats').onDelete('CASCADE');
    table.enu('role', ['user', 'assistant']).notNullable();
    table.text('content').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['chat_id', 'id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('support_chat_messages');
  await knex.schema.dropTableIfExists('support_chats');
};
