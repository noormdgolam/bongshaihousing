// Moves the existing hero-subtitle and intro-paragraph copy off the 10 category
// templates and into the columns added by 20260904000002, so the dashboard has
// something to edit and the pages render identically on the first load after
// this runs.
//
// The templates keep the same strings as literal fallbacks, so a row that is
// somehow missed - or a DB outage on the render path - still produces the exact
// page that was there before. Matching is on landing_page_slug, with a bare-slug
// fallback, because that is how routes/pages.js and lib/liveSiteSync.js both
// resolve a category page to its row.
//
// Only fills rows that are still empty: re-running this must never clobber copy
// an admin has since edited in the dashboard.
const COPY = [
  {
    landing_page_slug: "apartment-building.html",
    hero_subtitle: "Two-floor steel-composite apartment buildings designed for multi-family or rental-style living — durable, expandable, and built for Bangladesh’s urban density.",
    intro_paragraph: "Bongshai Housing constructs robust, multi-story steel-composite apartment buildings designed for urban density in Bangladesh. Our EPC engineering ensures fast assembly, superior earthquake resistance, and cost-efficient residential scaling.",
  },
  {
    landing_page_slug: "concrete-building.html",
    hero_subtitle: "Steel-reinforced concrete structures built for maximum durability and load-bearing strength — from compact starter homes to expandable family residences.",
    intro_paragraph: "Bongshai Housing constructs robust, steel-reinforced concrete buildings engineered for maximum durability and load-bearing strength. Combining traditional concrete resilience with advanced steel-frame methodology, these composite structures offer superior longevity and safety across Bangladesh.",
  },
  {
    landing_page_slug: "container-house.html",
    hero_subtitle: "Modified steel shipping containers finished into full residential comfort — a fast, durable, and increasingly popular housing choice in Bangladesh.",
    intro_paragraph: "Bongshai Housing converts robust steel shipping containers into premium, fully-functional residential homes. Our container houses offer an eco-friendly, ultra-fast, and highly secure alternative to traditional construction, tailored perfectly for both urban and remote locations across Bangladesh.",
  },
  {
    landing_page_slug: "cottage-house.html",
    hero_subtitle: "Compact, charming pre-engineered steel cottage homes — built to last with warm aesthetics, quick assembly, and complete customisation to suit your lifestyle and budget.",
    intro_paragraph: "Bongshai Housing crafts beautifully designed, prefabricated steel cottage homes in Bangladesh. Our eco-friendly cottage houses combine rustic aesthetics with the supreme durability of pre-engineered steel for fast, cost-effective rural and suburban living.",
  },
  {
    landing_page_slug: "duplex-steel-building.html",
    hero_subtitle: "Private, two-floor steel-composite family homes — combining structural durability with fast, precision-engineered construction across Bangladesh.",
    intro_paragraph: "Bongshai Housing specializes in the design and construction of premium duplex steel-composite homes in Bangladesh. Our prefabricated residential solutions offer engineered, earthquake-resistant structural integrity, rapid assembly, and modern architectural aesthetics.",
  },
  {
    landing_page_slug: "low-cost-house.html",
    hero_subtitle: "Affordable and durable low cost housing options for all — durable, expandable, and built for Bangladesh’s urban density.",
    intro_paragraph: "Bongshai Housing constructs robust, multi-story steel-composite apartment buildings designed for urban density in Bangladesh. Our EPC engineering ensures fast assembly, superior earthquake resistance, and cost-efficient residential scaling.",
  },
  {
    landing_page_slug: "luxury-villa.html",
    hero_subtitle: "High-end, factory-built residences with premium materials, sophisticated designs, and smart technology — bringing international luxury living to Bangladesh.",
    intro_paragraph: "Bongshai Housing designs and builds exquisite luxury villas utilizing advanced steel-frame architecture. Our premium villas combine grand aesthetics, expansive open floor plans, and rapid, precision-engineered construction to create the ultimate sustainable living experience in Bangladesh.",
  },
  {
    landing_page_slug: "simplex-steel-building.html",
    hero_subtitle: "Single-story steel-composite homes built for speed and durability — a practical, cost-effective choice for families across Bangladesh.",
    intro_paragraph: "Bongshai Housing offers cost-effective, single-story simplex steel-composite homes designed for durability and rapid deployment across Bangladesh. Our turnkey prefab solutions provide a modern, earthquake-resistant alternative to traditional construction.",
  },
  {
    landing_page_slug: "steel-house.html",
    hero_subtitle: "Purpose-built steel-frame homes engineered for strength and speed — a modern, durable alternative to traditional brick-and-mortar construction.",
    intro_paragraph: "Bongshai Housing constructs resilient, purpose-built steel frame homes across Bangladesh. Our pre-engineered residential steel houses deliver maximum structural safety, superior earthquake resistance, and rapid assembly compared to traditional brick-and-mortar builds.",
  },
  {
    landing_page_slug: "tiny-house.html",
    hero_subtitle: "Compact, budget-friendly prefab homes built for single occupants, small families, and starter plots — without compromising on durability.",
    intro_paragraph: "Bongshai Housing engineers highly efficient, minimalist steel-frame tiny houses in Bangladesh. Designed for maximum space utilization and affordability, our tiny homes deliver the structural integrity of pre-engineered steel in a compact, rapid-assembly footprint.",
  },
  {
    landing_page_slug: "wooden-house.html",
    hero_subtitle: "Warm, natural-finish prefab homes combining aesthetic charm with the speed and durability of precision-engineered construction.",
    intro_paragraph: "Bongshai Housing crafts premium wooden prefab homes that blend timeless natural aesthetics with precision engineering. Ideal for eco-resorts, cottages, and luxury retreats, our wooden houses offer sustainable, rapid-assembly living spaces designed for the climate of Bangladesh.",
  },
];

exports.up = async function (knex) {
  for (const row of COPY) {
    const bare = row.landing_page_slug.replace(/\.html$/, '');
    const existing = await knex('categories')
      .where({ landing_page_slug: row.landing_page_slug })
      .orWhere({ landing_page_slug: bare })
      .orWhere({ slug: bare })
      .first();
    if (!existing) continue;                    // category absent in this environment
    const patch = {};
    if (!existing.hero_subtitle) patch.hero_subtitle = row.hero_subtitle;
    if (!existing.intro_paragraph) patch.intro_paragraph = row.intro_paragraph;
    if (Object.keys(patch).length) {
      await knex('categories').where({ id: existing.id }).update(patch);
    }
  }
};

exports.down = async function (knex) {
  // Only clear values that still match what this migration wrote - anything an
  // admin has edited since is theirs, and a rollback should not eat it.
  for (const row of COPY) {
    await knex('categories')
      .where({ hero_subtitle: row.hero_subtitle })
      .update({ hero_subtitle: null });
    await knex('categories')
      .where({ intro_paragraph: row.intro_paragraph })
      .update({ intro_paragraph: null });
  }
};
