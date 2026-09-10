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
  let current = null;

  for (const r of rooms || []) {
    // Ignore any legacy marker rows if present
    if (r.is_total_row) continue;

    const floorLabel = (r.floor_label || '').trim() || 'Ground Floor Layout';
    if (!current || current.label !== floorLabel) {
      if (current) groups.push(current);
      current = { label: floorLabel, rows: [], total: 0 };
    }
    current.rows.push(r);
    current.total += (Number(r.area_sqft) || 0);
  }
  if (current) {
    groups.push(current);
  }

  const buildingTotal = groups.length > 0
    ? groups.reduce((sum, g) => sum + (Number(g.total) || 0), 0)
    : null;

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
      rows: g.rows.map((r) => {
        const areaVal = (r.area_sqft != null && r.area_sqft !== '') ? (isNaN(Number(r.area_sqft)) ? r.area_sqft : Number(r.area_sqft)) : null;
        const lenVal = (r.length_ft != null && r.length_ft !== '') ? (isNaN(Number(r.length_ft)) ? String(r.length_ft).trim() : String(Number(r.length_ft))) : null;
        const widVal = (r.width_ft != null && r.width_ft !== '') ? (isNaN(Number(r.width_ft)) ? String(r.width_ft).trim() : String(Number(r.width_ft))) : null;
        return {
          ...r,
          area_sqft: areaVal,
          length_ft: lenVal,
          width_ft: widVal,
          icon: roomIcon(r.section),
          barPct: g.total ? Math.min(100, Math.round(((Number(r.area_sqft) || 0) / g.total) * 100)) : 0,
        };
      }),
    }));
    v.roomGroupsBuildingTotal = buildingTotal;
    v.totalArea = buildingTotal || v.area_sqft;
    if (product) {
      v.estimatedPrice = product.fixed_price || (product.price_per_sqft ? Math.round(v.totalArea * product.price_per_sqft) : null);
    }
  }
  return variants;
}

module.exports = { groupRoomsByFloor, roomIcon, decorateVariants };
