// Default construction stages seeded onto every new order. Admin can still
// edit/reorder per-order later if a project needs a custom stage, but most
// prefab steel builds follow this same sequence, so start everyone here
// instead of asking the admin to type out 8 rows by hand every time.
const DEFAULT_MILESTONES = [
  'Order Confirmed',
  'Site Survey Scheduled',
  'Contract & Payment Terms Finalized',
  'Foundation Work',
  'Steel Frame Erection',
  'Roofing & Cladding',
  'Electrical, Plumbing & Finishing',
  'Handover',
];

async function seedDefaultMilestones(db, orderId) {
  const rows = DEFAULT_MILESTONES.map((title, i) => ({
    order_id: orderId,
    title,
    status: i === 0 ? 'done' : 'pending',
    sort_order: i,
    completed_at: i === 0 ? db.fn.now() : null,
  }));
  await db('order_milestones').insert(rows);
}

module.exports = { DEFAULT_MILESTONES, seedDefaultMilestones };
