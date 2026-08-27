// The real Bongshai Housing agent/distributor application is a formal
// business form (business registration, NID, TIN, trade license,
// territory proposal, funding source, and 5 supporting documents) - not
// the simple name/phone/district signup this table originally had.
// Expanding in place rather than a new table since every field belongs
// to exactly one applicant, same one-to-one shape as the original.
exports.up = function (knex) {
  return knex.schema.alterTable('agents', (table) => {
    table.string('business_name', 255).nullable();
    table.string('contact_address', 500).nullable();
    table.string('landline_phone', 32).nullable();
    table.string('nid_number', 50).nullable();
    table.string('current_business_types', 500).nullable();
    table.text('current_business_address').nullable();
    table.text('permanent_address').nullable();
    table.string('thana', 100).nullable();
    table.string('tin_number', 50).nullable();
    table.string('trade_license_number', 100).nullable();
    table.string('funding_own_fund', 255).nullable();
    table.string('funding_bank', 255).nullable();
    // Document uploads - stored outside any publicly-served static
    // directory (see server.js/agent-auth.js), paths only, admin-only
    // access via an authenticated streaming route.
    table.string('doc_application_letter', 255).nullable();
    table.string('doc_passport_photo', 255).nullable();
    table.string('doc_trade_license', 255).nullable();
    table.string('doc_tin_certificate', 255).nullable();
    table.string('doc_nid_copy', 255).nullable();
    table.boolean('certification_agreed').notNullable().defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('agents', (table) => {
    table.dropColumn('business_name');
    table.dropColumn('contact_address');
    table.dropColumn('landline_phone');
    table.dropColumn('nid_number');
    table.dropColumn('current_business_types');
    table.dropColumn('current_business_address');
    table.dropColumn('permanent_address');
    table.dropColumn('thana');
    table.dropColumn('tin_number');
    table.dropColumn('trade_license_number');
    table.dropColumn('funding_own_fund');
    table.dropColumn('funding_bank');
    table.dropColumn('doc_application_letter');
    table.dropColumn('doc_passport_photo');
    table.dropColumn('doc_trade_license');
    table.dropColumn('doc_tin_certificate');
    table.dropColumn('doc_nid_copy');
    table.dropColumn('certification_agreed');
  });
};
