exports.up = async function (knex) {
  // Sync fixed_price for any product that has price_per_sqft and total_floor_area but no fixed_price
  const products = await knex('products')
    .whereNull('fixed_price')
    .whereNotNull('price_per_sqft')
    .whereNotNull('total_floor_area');
    
  for (const p of products) {
    const calc = Math.round(p.price_per_sqft * p.total_floor_area);
    if (calc > 0) {
      await knex('products')
        .where('id', p.id)
        .update({ fixed_price: calc });
    }
  }
};

exports.down = async function (knex) {
  // Irreversible semantic sync - no-op down
};
