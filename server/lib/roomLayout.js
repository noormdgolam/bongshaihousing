// Shared room/floor layout maths for product detail pages.
//
// Extracted from liveSiteSync.js so the dedicated per-model templates
// (bh-*.njk) can render the same DB-driven, auto-summing floor plan the
// generic product-detail.njk already does - previously every one of those
// ~128 pages had its room tables, floor subtotals and building total
// hardcoded, so an admin edit to a room area never changed the live number
// and the totals never recalculated.
//
// groupRoomsByFloor(rooms):
//   rooms - ordered product_rooms rows for ONE variant. A row with
//   is_total_row + no area and matching /building/i is treated as an
//   explicit building total; is_total_row + no area otherwise starts a new
//   floor group (its section text is the floor label); is_total_row + an
//   area sets that group's total explicitly; anything else is a normal room.
//   Returns { groups: [{label, total, rows}], buildingTotal } with every
//   missing total summed from its rows and the building total summed from
//   the groups (or the explicit building-total row when present).

function groupRoomsByFloor(rooms) {
  const groups = [];
  let current = { label: null, rows: [], total: null };
  let explicitBuildingTotal = null;
  for (const r of rooms) {
    const text = (r.section || '').trim();
    const hasArea = r.area_sqft !== null && r.area_sqft !== undefined && r.area_sqft !== '';
    if (r.is_total_row && !hasArea) {
      if (current.label !== null || current.rows.length) groups.push(current);
      current = { label: text, rows: [], total: null };
    } else if (r.is_total_row && hasArea && /building/i.test(text)) {
      explicitBuildingTotal = r.area_sqft;
    } else if (r.is_total_row && hasArea) {
      current.total = r.area_sqft;
    } else {
      current.rows.push(r);
    }
  }
  groups.push(current);
  for (const g of groups) {
    if (g.total == null) {
      const sum = g.rows.reduce((s, r) => s + (Number(r.area_sqft) || 0), 0);
      g.total = sum || null;
    }
  }
  const buildingTotal = explicitBuildingTotal != null
    ? explicitBuildingTotal
    : groups.length > 1
      ? groups.reduce((s, g) => s + (Number(g.total) || 0), 0)
      : (groups[0] && groups[0].total) || null;
  return { groups, buildingTotal };
}

function roomIcon(section) {
  const s = (section || '').toLowerCase();
  if (/wall|stair/.test(s)) return '';
  if (/bath|toilet|washroom/.test(s)) return '🚿';
  if (/kitchen/.test(s)) return '🍳';
  if (/bed/.test(s)) return '🛏️';
  if (/living|drawing|dining|family/.test(s)) return '🛋️';
  if (/veranda|varanda|porch|balcony/.test(s)) return '🌤️';
  if (/store|storage/.test(s)) return '📦';
  if (/garage|parking/.test(s)) return '🚗';
  return '🏠';
}

// Attaches roomGroups / roomGroupsBuildingTotal / totalArea / bed-bath chips
// to each variant, exactly as liveSiteSync's product-detail path builds them,
// so a dedicated template can `{% include "partials/product-floor-plan.njk" %}`
// and get an identical render. `rooms` is a flat array of all product_rooms
// for these variants; it's split by product_variant_id here.
function decorateVariants(variants, rooms, product) {
  const roomsByVariant = new Map();
  for (const room of rooms || []) {
    if (!roomsByVariant.has(room.product_variant_id)) roomsByVariant.set(room.product_variant_id, []);
    roomsByVariant.get(room.product_variant_id).push(room);
  }
  for (const v of variants) {
    v.rooms = roomsByVariant.get(v.id) || [];
    const { groups, buildingTotal } = groupRoomsByFloor(v.rooms);
    v.roomGroups = groups.map((g) => ({
      label: g.label,
      total: g.total,
      rows: g.rows.map((r) => ({
        ...r,
        icon: roomIcon(r.section),
        barPct: g.total ? Math.min(100, Math.round(((Number(r.area_sqft) || 0) / g.total) * 100)) : 0,
      })),
    }));
    v.roomGroupsBuildingTotal = buildingTotal;
    const totalRow = v.rooms.find((r) => r.section && /total building area/i.test(r.section));
    v.totalArea = (totalRow && totalRow.area_sqft) || v.area_sqft;
    if (product) {
      v.estimatedPrice = product.fixed_price || (product.price_per_sqft ? Math.round(v.totalArea * product.price_per_sqft) : null);
    }
  }
  return variants;
}

module.exports = { groupRoomsByFloor, roomIcon, decorateVariants };
