const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const db = require('../lib/db');
const requireAdmin = require('../middleware/requireAdmin');
const requireRole = require('../middleware/requireRole');

const { processAndSaveImage, UPLOADS_DIR } = require('../lib/image-processor');
const { getThemeSettings, saveThemeSettings, resetThemeSettings, PRESETS, DEFAULT_THEME, isThemeDark, ARCHETYPES } = require('../lib/theme');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, SVG, GIF, AVIF) are allowed'));
    }
  }
});

const router = express.Router();
router.use('/admin', requireAdmin);

function adminVars(req, extra) {
  return { adminName: req.session.adminName, adminRole: req.session.adminRole, ...extra };
}

async function logActivity(req, actionOrObj, entityType, entityId, summary) {
  if (!db) return;
  try {
    const hasTable = await db.schema.hasTable('activity_log');
    if (!hasTable) return;

    let payload = {};
    if (typeof actionOrObj === 'object' && actionOrObj !== null) {
      payload = {
        action: actionOrObj.action || 'update',
        entity_type: actionOrObj.entityType || actionOrObj.entity_type || 'general',
        entity_id: actionOrObj.entityId || actionOrObj.entity_id || null,
        summary: actionOrObj.summary || '',
      };
    } else {
      payload = {
        action: actionOrObj || 'update',
        entity_type: entityType || 'general',
        entity_id: entityId || null,
        summary: summary || '',
      };
    }

    await db('activity_log').insert({
      admin_user_id: req.session?.adminUserId || null,
      admin_name: req.session?.adminName || 'Admin',
      action: payload.action,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      summary: payload.summary,
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}

router.get('/admin', async (req, res) => {
  let productCount = { count: 0 };
  let publishedProductCount = { count: 0 };
  let categoryCount = { count: 0 };
  let projectCount = { count: 0 };
  let featuredProjectCount = { count: 0 };
  let leadCount = { count: 0 };
  let newLeadCount = { count: 0 };
  let contactedLeadCount = { count: 0 };
  let convertedLeadCount = { count: 0 };
  let serviceAreaCount = { count: 0 };
  let dedicatedAreaCount = { count: 0 };
  let faqCount = { count: 0 };
  let teamMemberCount = { count: 0 };
  let testimonialCount = { count: 0 };
  let mediaCount = 0;
  let recentLeads = [];
  let recentActivities = [];
  let activeTheme = null;

  if (db) {
    try {
      [productCount] = await db('products').count({ count: '*' });
      [publishedProductCount] = await db('products').where({ published: true }).count({ count: '*' });
      [categoryCount] = await db('categories').count({ count: '*' });
      [projectCount] = await db('projects').count({ count: '*' });
      [featuredProjectCount] = await db('projects').where({ featured: true }).count({ count: '*' });
      
      const hasServiceAreas = await db.schema.hasTable('service_areas');
      if (hasServiceAreas) {
        [serviceAreaCount] = await db('service_areas').count({ count: '*' });
        [dedicatedAreaCount] = await db('service_areas').where({ has_dedicated_page: true }).count({ count: '*' });
      }

      const hasFaqs = await db.schema.hasTable('faqs');
      if (hasFaqs) {
        [faqCount] = await db('faqs').count({ count: '*' });
      }

      const hasTeam = await db.schema.hasTable('team_members');
      if (hasTeam) {
        [teamMemberCount] = await db('team_members').count({ count: '*' });
      }

      const hasTestimonials = await db.schema.hasTable('testimonials');
      if (hasTestimonials) {
        [testimonialCount] = await db('testimonials').count({ count: '*' });
      }

      const hasLeads = await db.schema.hasTable('leads');
      if (hasLeads) {
        [leadCount] = await db('leads').count({ count: '*' });
        [newLeadCount] = await db('leads').where({ status: 'new' }).count({ count: '*' });
        [contactedLeadCount] = await db('leads').where({ status: 'contacted' }).count({ count: '*' });
        [convertedLeadCount] = await db('leads').where({ status: 'converted' }).count({ count: '*' });
        recentLeads = await db('leads').orderBy('created_at', 'desc').limit(8);
      }

      const hasActivity = await db.schema.hasTable('activity_log');
      if (hasActivity) {
        recentActivities = await db('activity_log').orderBy('created_at', 'desc').limit(6);
      }
    } catch (e) {
      console.error('Admin dashboard query error:', e.message);
    }
  }

  // Media files count
  try {
    if (fs.existsSync(UPLOADS_DIR)) {
      mediaCount = fs.readdirSync(UPLOADS_DIR).filter(f => !f.startsWith('.')).length;
    }
  } catch (err) {}

  // Active theme info
  try {
    activeTheme = await getThemeSettings();
    if (activeTheme) {
      activeTheme.is_dark = isThemeDark(activeTheme);
    }
  } catch (err) {}

  const totalLeads = leadCount?.count || 0;
  const converted = convertedLeadCount?.count || 0;
  const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

  res.render('admin/dashboard.njk', adminVars(req, {
    counts: {
      products: productCount?.count || 0,
      publishedProducts: publishedProductCount?.count || 0,
      categories: categoryCount?.count || 0,
      projects: projectCount?.count || 0,
      featuredProjects: featuredProjectCount?.count || 0,
      leads: totalLeads,
      newLeads: newLeadCount?.count || 0,
      contactedLeads: contactedLeadCount?.count || 0,
      convertedLeads: converted,
      conversionRate,
      serviceAreas: serviceAreaCount?.count || 64,
      dedicatedServiceAreas: dedicatedAreaCount?.count || 18,
      faqs: faqCount?.count || 22,
      teamMembers: teamMemberCount?.count || 14,
      testimonials: testimonialCount?.count || 3,
      mediaCount,
    },
    recentLeads,
    recentActivities,
    activeTheme,
    systemInfo: {
      nodeVersion: process.version,
      uptimeMinutes: Math.floor(process.uptime() / 60),
      env: process.env.NODE_ENV || 'production',
      serverTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  }));
});

router.post('/admin/leads/:id/quick-status', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database unavailable' });
  const { status } = req.body;
  try {
    await db('leads').where({ id: req.params.id }).update({
      status: status || 'new',
      updated_at: db.fn.now(),
    });
    await logActivity(req, {
      action: 'status_change',
      entityType: 'lead',
      entityId: req.params.id,
      summary: `Quick status set to "${status}" for Lead #${req.params.id}`
    });
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, status });
    }
    res.redirect('/admin');
  } catch (err) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(400).json({ error: err.message });
    }
    res.redirect('/admin?error=' + encodeURIComponent(err.message));
  }
});

// ---- Leads / Inquiries ----

router.get('/admin/leads', async (req, res) => {
  const status = req.query.status || 'all';
  const search = (req.query.q || '').trim();
  let leads = [];

  if (db) {
    try {
      const hasLeads = await db.schema.hasTable('leads');
      if (hasLeads) {
        let query = db('leads').orderBy('created_at', 'desc');
        if (status && status !== 'all') query = query.where({ status });
        if (search) {
          query = query.where((builder) => {
            builder.where('name', 'like', `%${search}%`)
              .orWhere('phone', 'like', `%${search}%`)
              .orWhere('email', 'like', `%${search}%`)
              .orWhere('district', 'like', `%${search}%`);
          });
        }
        leads = await query;
      }
    } catch (e) {
      console.error('Admin leads list error:', e.message);
    }
  }

  res.render('admin/leads/list.njk', adminVars(req, { leads, status, search }));
});

router.get('/admin/leads/export/csv', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  try {
    const status = req.query.status || 'all';
    const search = (req.query.q || '').trim();
    let query = db('leads').orderBy('created_at', 'desc');
    if (status && status !== 'all') query = query.where({ status });
    if (search) {
      query = query.where((builder) => {
        builder.where('name', 'like', `%${search}%`)
          .orWhere('phone', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('district', 'like', `%${search}%`);
      });
    }
    const leads = await query;

    const headers = ['ID', 'Date', 'Name', 'Phone', 'Email', 'District', 'Upazila', 'Model', 'Floor Area (sqft)', 'Bedrooms', 'Status', 'Message', 'Admin Notes'];
    const rows = leads.map(l => [
      l.id,
      `"${(l.created_at ? new Date(l.created_at).toISOString().replace('T', ' ').slice(0, 19) : '').replace(/"/g, '""')}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.district || '').replace(/"/g, '""')}"`,
      `"${(l.upazila || '').replace(/"/g, '""')}"`,
      `"${(l.model || '').replace(/"/g, '""')}"`,
      `"${(l.floor_area || '').replace(/"/g, '""')}"`,
      `"${(l.bedrooms || '').replace(/"/g, '""')}"`,
      `"${(l.status || '').replace(/"/g, '""')}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${(l.admin_notes || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const filename = `bongshai-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csvContent);
  } catch (e) {
    res.status(500).send('Export error: ' + e.message);
  }
});

router.get('/admin/leads/:id', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  try {
    const lead = await db('leads').where({ id: req.params.id }).first();
    if (!lead) return res.status(404).send('Lead not found');
    res.render('admin/leads/detail.njk', adminVars(req, { lead }));
  } catch (e) {
    res.status(500).send('Database error: ' + e.message);
  }
});

router.post('/admin/leads/:id', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  const { status, admin_notes } = req.body;
  try {
    await db('leads').where({ id: req.params.id }).update({
      status: status || 'new',
      admin_notes: admin_notes || null,
      updated_at: db.fn.now(),
    });
    await logActivity(req, { action: 'status_change', entityType: 'lead', entityId: req.params.id, summary: `Lead #${req.params.id} status set to "${status || 'new'}"` });
    res.redirect(`/admin/leads/${req.params.id}`);
  } catch (e) {
    res.status(400).send('Update error: ' + e.message);
  }
});

router.post('/admin/leads/:id/delete', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  try {
    await db('leads').where({ id: req.params.id }).del();
    await logActivity(req, { action: 'delete', entityType: 'lead', entityId: req.params.id, summary: `Deleted lead #${req.params.id}` });
    res.redirect('/admin/leads');
  } catch (e) {
    res.status(400).send('Delete error: ' + e.message);
  }
});

// ---- Products ----

router.get('/admin/products', async (req, res) => {
  const categoryId = req.query.category ? Number(req.query.category) : null;
  const search = (req.query.q || '').trim();

  let query = db('products').join('categories', 'products.category_id', 'categories.id')
    .select('products.*', 'categories.name as category_name')
    .orderBy('products.category_id').orderBy('products.model_number');
  if (categoryId) query = query.where('products.category_id', categoryId);
  if (search) query = query.where('products.title', 'like', `%${search}%`);

  const products = await query;
  const categories = await db('categories').orderBy('sort_order');
  res.render('admin/products/list.njk', adminVars(req, { products, categories, categoryId, search }));
});

router.get('/admin/products/new', async (req, res) => {
  const categories = await db('categories').orderBy('sort_order');
  res.render('admin/products/form.njk', adminVars(req, { product: null, categories, error: null }));
});

router.post('/admin/products', upload.single('main_image_file'), async (req, res) => {
  const { category_id, model_number, slug, title, description, price_per_sqft, price_currency, main_image, published } = req.body;
  try {
    const finalImage = req.file ? await processAndSaveImage(req.file.buffer, req.file.originalname) : (main_image || null);
    const [id] = await db('products').insert({
      category_id, model_number, slug, title, description,
      price_per_sqft: price_per_sqft || null,
      price_currency: price_currency || 'BDT',
      main_image: finalImage,
      published: published === 'on' || published === true || published === 'true',
    });
    res.redirect(`/admin/products/${id}/edit`);
  } catch (err) {
    const categories = await db('categories').orderBy('sort_order');
    res.status(400).render('admin/products/form.njk', adminVars(req, { product: req.body, categories, error: err.message }));
  }
});

router.get('/admin/products/:id/edit', async (req, res) => {
  const product = await db('products').where({ id: req.params.id }).first();
  if (!product) return res.status(404).send('Not found');
  const categories = await db('categories').orderBy('sort_order');
  const specs = await db('product_specs').where({ product_id: product.id }).orderBy('sort_order');
  const variants = await db('product_variants').where({ product_id: product.id }).orderBy('sort_order');
  for (const v of variants) {
    v.rooms = await db('product_rooms').where({ product_variant_id: v.id }).orderBy('sort_order');
  }
  res.render('admin/products/form.njk', adminVars(req, { product, categories, specs, variants, error: null }));
});

router.post('/admin/products/:id', upload.single('main_image_file'), async (req, res) => {
  const { category_id, model_number, slug, title, description, price_per_sqft, price_currency, main_image, published } = req.body;
  const finalImage = req.file ? await processAndSaveImage(req.file.buffer, req.file.originalname) : (main_image || null);
  await db('products').where({ id: req.params.id }).update({
    category_id, model_number, slug, title, description,
    price_per_sqft: price_per_sqft || null,
    price_currency: price_currency || 'BDT',
    main_image: finalImage,
    published: published === 'on' || published === true || published === 'true',
    updated_at: db.fn.now(),
  });
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

router.post('/admin/products/:id/delete', async (req, res) => {
  const p = await db('products').where({ id: req.params.id }).first();
  await db('products').where({ id: req.params.id }).del();
  await logActivity(req, { action: 'delete', entityType: 'product', entityId: req.params.id, summary: `Deleted product ${p ? p.model_number : req.params.id}` });
  res.redirect('/admin/products');
});

// ---- Product Specs (Building Specifications key/value rows) ----

router.post('/admin/products/:id/specs', async (req, res) => {
  const { spec_key, spec_value } = req.body;
  if (spec_key && spec_value) {
    const [{ maxSort }] = await db('product_specs').where({ product_id: req.params.id }).max('sort_order as maxSort');
    await db('product_specs').insert({ product_id: req.params.id, spec_key, spec_value, sort_order: (maxSort ?? -1) + 1 });
  }
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

router.post('/admin/products/:id/specs/:specId', async (req, res) => {
  const { spec_key, spec_value } = req.body;
  await db('product_specs').where({ id: req.params.specId, product_id: req.params.id }).update({ spec_key, spec_value });
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

router.post('/admin/products/:id/specs/:specId/delete', async (req, res) => {
  await db('product_specs').where({ id: req.params.specId, product_id: req.params.id }).del();
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

// ---- Product Variants (floor-area tiers) + their room breakdowns ----

router.post('/admin/products/:id/variants', async (req, res) => {
  const { area_sqft, area_label, bed, bath, kitchen, living, drawing, dining } = req.body;
  const [{ maxSort }] = await db('product_variants').where({ product_id: req.params.id }).max('sort_order as maxSort');
  await db('product_variants').insert({
    product_id: req.params.id,
    area_sqft: area_sqft || null,
    area_label: area_label || area_sqft || null,
    bed: bed || null, bath: bath || null, kitchen: kitchen || null, living: living || null,
    drawing: drawing || null, dining: dining || null,
    sort_order: (maxSort ?? -1) + 1,
  });
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

router.post('/admin/products/:id/variants/:variantId', async (req, res) => {
  const { area_sqft, area_label, bed, bath, kitchen, living, drawing, dining } = req.body;
  await db('product_variants').where({ id: req.params.variantId, product_id: req.params.id }).update({
    area_sqft: area_sqft || null, area_label: area_label || area_sqft || null,
    bed: bed || null, bath: bath || null, kitchen: kitchen || null, living: living || null,
    drawing: drawing || null, dining: dining || null,
  });
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

router.post('/admin/products/:id/variants/:variantId/delete', async (req, res) => {
  await db('product_variants').where({ id: req.params.variantId, product_id: req.params.id }).del();
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

router.post('/admin/products/:id/variants/:variantId/rooms', async (req, res) => {
  const { floor_label, section, area_sqft, length_ft, width_ft } = req.body;
  if (section) {
    const [{ maxSort }] = await db('product_rooms').where({ product_variant_id: req.params.variantId }).max('sort_order as maxSort');
    await db('product_rooms').insert({
      product_variant_id: req.params.variantId,
      floor_label: floor_label || null, section,
      area_sqft: area_sqft || null, length_ft: length_ft || null, width_ft: width_ft || null,
      is_total_row: /total/i.test(section),
      sort_order: (maxSort ?? -1) + 1,
    });
  }
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

router.post('/admin/products/:id/variants/:variantId/rooms/:roomId', async (req, res) => {
  const { floor_label, section, area_sqft, length_ft, width_ft } = req.body;
  await db('product_rooms').where({ id: req.params.roomId, product_variant_id: req.params.variantId }).update({
    floor_label: floor_label || null, section,
    area_sqft: area_sqft || null, length_ft: length_ft || null, width_ft: width_ft || null,
    is_total_row: /total/i.test(section || ''),
  });
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

router.post('/admin/products/:id/variants/:variantId/rooms/:roomId/delete', async (req, res) => {
  await db('product_rooms').where({ id: req.params.roomId, product_variant_id: req.params.variantId }).del();
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

// ---- Categories ----

router.get('/admin/categories', async (req, res) => {
  const categories = await db('categories').orderBy('sort_order');
  res.render('admin/categories/list.njk', adminVars(req, { categories }));
});

router.get('/admin/categories/new', (req, res) => {
  res.render('admin/categories/form.njk', adminVars(req, { category: null, error: null }));
});

router.post('/admin/categories', upload.single('hero_image_file'), async (req, res) => {
  const { slug, name, landing_page_slug, description, hero_image, sort_order } = req.body;
  const finalImage = req.file ? `images/uploads/${req.file.filename}` : (hero_image || null);
  try {
    const [id] = await db('categories').insert({
      slug, name, landing_page_slug: landing_page_slug || null,
      description: description || null, hero_image: finalImage,
      sort_order: sort_order || 0
    });
    res.redirect(`/admin/categories/${id}/edit`);
  } catch (err) {
    res.status(400).render('admin/categories/form.njk', adminVars(req, { category: req.body, error: err.message }));
  }
});

router.get('/admin/categories/:id/edit', async (req, res) => {
  const category = await db('categories').where({ id: req.params.id }).first();
  if (!category) return res.status(404).send('Not found');
  res.render('admin/categories/form.njk', adminVars(req, { category, error: null }));
});

router.post('/admin/categories/:id', upload.single('hero_image_file'), async (req, res) => {
  const { slug, name, landing_page_slug, description, hero_image, sort_order } = req.body;
  const finalImage = req.file ? `images/uploads/${req.file.filename}` : (hero_image || null);
  await db('categories').where({ id: req.params.id }).update({
    slug, name, landing_page_slug: landing_page_slug || null, description: description || null,
    hero_image: finalImage, sort_order: sort_order || 0, updated_at: db.fn.now(),
  });
  res.redirect(`/admin/categories/${req.params.id}/edit`);
});

router.post('/admin/categories/:id/delete', async (req, res) => {
  const inUse = await db('products').where({ category_id: req.params.id }).first();
  if (inUse) return res.status(400).send('Cannot delete a category that still has products. Reassign or delete them first.');
  const c = await db('categories').where({ id: req.params.id }).first();
  await db('categories').where({ id: req.params.id }).del();
  await logActivity(req, { action: 'delete', entityType: 'category', entityId: req.params.id, summary: `Deleted category ${c ? c.name : req.params.id}` });
  res.redirect('/admin/categories');
});

// ---- Projects ----

router.get('/admin/projects', async (req, res) => {
  const projects = await db('projects').orderBy('sort_order');
  res.render('admin/projects/list.njk', adminVars(req, { projects }));
});

router.get('/admin/projects/new', (req, res) => {
  res.render('admin/projects/form.njk', adminVars(req, { project: null, error: null }));
});

router.post('/admin/projects', upload.single('image_file'), async (req, res) => {
  const { slug, title, location, description, image, status_label, published, sort_order } = req.body;
  try {
    const finalImage = req.file ? await processAndSaveImage(req.file.buffer, req.file.originalname) : (image || null);
    const [id] = await db('projects').insert({
      slug, title, location: location || null, description: description || null,
      image: finalImage,
      status_label: status_label || 'Completed Project',
      published: published === 'on' || published === true || published === 'true',
      sort_order: sort_order || 0,
    });
    res.redirect(`/admin/projects/${id}/edit`);
  } catch (err) {
    res.status(400).render('admin/projects/form.njk', adminVars(req, { project: req.body, error: err.message }));
  }
});

router.get('/admin/projects/:id/edit', async (req, res) => {
  const project = await db('projects').where({ id: req.params.id }).first();
  if (!project) return res.status(404).send('Not found');
  res.render('admin/projects/form.njk', adminVars(req, { project, error: null }));
});

router.post('/admin/projects/:id', upload.single('image_file'), async (req, res) => {
  const { slug, title, location, description, image, status_label, published, sort_order } = req.body;
  const finalImage = req.file ? await processAndSaveImage(req.file.buffer, req.file.originalname) : (image || null);
  await db('projects').where({ id: req.params.id }).update({
    slug, title, location: location || null, description: description || null,
    image: finalImage,
    status_label: status_label || 'Completed Project',
    published: published === 'on' || published === true || published === 'true',
    sort_order: sort_order || 0,
    updated_at: db.fn.now(),
  });
  res.redirect(`/admin/projects/${req.params.id}/edit`);
});

// Generic Image Upload API (JSON Response with WebP Conversion)
router.post('/admin/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  try {
    const relativePath = await processAndSaveImage(req.file.buffer, req.file.originalname);
    res.json({
      success: true,
      url: relativePath,
      filename: path.basename(relativePath),
      size: req.file.size,
      mimetype: 'image/webp',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admin/projects/:id/delete', async (req, res) => {
  const p = await db('projects').where({ id: req.params.id }).first();
  await db('projects').where({ id: req.params.id }).del();
  await logActivity(req, { action: 'delete', entityType: 'project', entityId: req.params.id, summary: `Deleted project ${p ? p.title : req.params.id}` });
  res.redirect('/admin/projects');
});

// ---- Service Areas (Nationwide 64 Districts Coverage) ----

const BD_DIVISIONS = [
  'Dhaka Division',
  'Chattogram Division',
  'Rajshahi Division',
  'Khulna Division',
  'Barishal Division',
  'Sylhet Division',
  'Rangpur Division',
  'Mymensingh Division',
];

router.get('/admin/service-areas', async (req, res) => {
  let serviceAreas = [];
  const search = (req.query.q || '').trim();
  const divisionFilter = req.query.division || 'all';

  if (db) {
    try {
      let query = db('service_areas').orderBy('division', 'asc').orderBy('district', 'asc');
      if (divisionFilter && divisionFilter !== 'all') {
        query = query.where({ division: divisionFilter });
      }
      if (search) {
        query = query.where((builder) => {
          builder.where('district', 'like', `%${search}%`)
            .orWhere('division', 'like', `%${search}%`)
            .orWhere('page_slug', 'like', `%${search}%`);
        });
      }
      serviceAreas = await query;
    } catch (err) {
      console.error('Service areas list query error:', err.message);
    }
  }

  const dedicatedCount = serviceAreas.filter(s => s.has_dedicated_page || s.page_slug).length;

  res.render('admin/service-areas/list.njk', adminVars(req, {
    serviceAreas,
    divisions: BD_DIVISIONS,
    search,
    divisionFilter,
    totalCount: serviceAreas.length,
    dedicatedCount,
  }));
});

router.get('/admin/service-areas/new', (req, res) => {
  res.render('admin/service-areas/form.njk', adminVars(req, { area: {}, divisions: BD_DIVISIONS, error: null }));
});

router.post('/admin/service-areas', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  const { district, division, has_dedicated_page, page_slug } = req.body;
  try {
    if (!district || !district.trim()) throw new Error('District name is required');
    const cleanSlug = page_slug ? page_slug.trim().replace(/^\//, '') : null;
    const hasDedicated = has_dedicated_page === 'on' || has_dedicated_page === true || Boolean(cleanSlug);

    await db('service_areas').insert({
      district: district.trim(),
      division: division || 'Dhaka Division',
      has_dedicated_page: hasDedicated,
      page_slug: cleanSlug,
    });
    res.redirect('/admin/service-areas');
  } catch (e) {
    res.render('admin/service-areas/form.njk', adminVars(req, {
      area: req.body,
      divisions: BD_DIVISIONS,
      error: e.message,
    }));
  }
});

router.get('/admin/service-areas/:id/edit', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  try {
    const area = await db('service_areas').where({ id: req.params.id }).first();
    if (!area) return res.status(404).send('Service area not found');
    res.render('admin/service-areas/form.njk', adminVars(req, { area, divisions: BD_DIVISIONS, error: null }));
  } catch (e) {
    res.status(500).send('Database error: ' + e.message);
  }
});

router.post('/admin/service-areas/:id', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  const { district, division, has_dedicated_page, page_slug } = req.body;
  try {
    if (!district || !district.trim()) throw new Error('District name is required');
    const cleanSlug = page_slug ? page_slug.trim().replace(/^\//, '') : null;
    const hasDedicated = has_dedicated_page === 'on' || has_dedicated_page === true || Boolean(cleanSlug);

    await db('service_areas').where({ id: req.params.id }).update({
      district: district.trim(),
      division: division || 'Dhaka Division',
      has_dedicated_page: hasDedicated,
      page_slug: cleanSlug,
      updated_at: db.fn.now(),
    });
    res.redirect('/admin/service-areas');
  } catch (e) {
    res.render('admin/service-areas/form.njk', adminVars(req, {
      area: { ...req.body, id: req.params.id },
      divisions: BD_DIVISIONS,
      error: e.message,
    }));
  }
});

router.post('/admin/service-areas/:id/delete', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  try {
    const sa = await db('service_areas').where({ id: req.params.id }).first();
    await db('service_areas').where({ id: req.params.id }).del();
    await logActivity(req, { action: 'delete', entityType: 'service_area', entityId: req.params.id, summary: `Deleted service area ${sa ? sa.district : req.params.id}` });
    res.redirect('/admin/service-areas');
  } catch (e) {
    res.status(400).send('Delete error: ' + e.message);
  }
});

// ---- Frequently Asked Questions (FAQ) Management ----

const DEFAULT_FAQ_CATEGORIES = [
  'General',
  'Products & Models',
  'Pricing & Financing',
  'Construction Process',
  'Quality & Getting Started',
];

router.get('/admin/faqs', async (req, res) => {
  let faqs = [];
  const search = (req.query.q || '').trim();
  const categoryFilter = req.query.category || 'all';
  const statusFilter = req.query.status || 'all';

  if (db) {
    try {
      let query = db('faqs').orderBy('category', 'asc').orderBy('sort_order', 'asc');
      if (categoryFilter && categoryFilter !== 'all') {
        query = query.where({ category: categoryFilter });
      }
      if (statusFilter === 'published') {
        query = query.where({ published: true });
      } else if (statusFilter === 'draft') {
        query = query.where({ published: false });
      }
      if (search) {
        query = query.where((builder) => {
          builder.where('question', 'like', `%${search}%`)
            .orWhere('answer', 'like', `%${search}%`)
            .orWhere('category', 'like', `%${search}%`);
        });
      }
      faqs = await query;
    } catch (err) {
      console.error('FAQs list query error:', err.message);
    }
  }

  // Get list of existing unique categories
  let categories = [...DEFAULT_FAQ_CATEGORIES];
  if (db) {
    try {
      const dbCats = await db('faqs').distinct('category').whereNotNull('category');
      const catNames = dbCats.map(c => c.category).filter(Boolean);
      categories = Array.from(new Set([...DEFAULT_FAQ_CATEGORIES, ...catNames]));
    } catch (e) {}
  }

  const publishedCount = faqs.filter(f => f.published).length;

  res.render('admin/faqs/list.njk', adminVars(req, {
    faqs,
    categories,
    search,
    categoryFilter,
    statusFilter,
    totalCount: faqs.length,
    publishedCount,
  }));
});

router.get('/admin/faqs/new', async (req, res) => {
  let categories = [...DEFAULT_FAQ_CATEGORIES];
  if (db) {
    try {
      const dbCats = await db('faqs').distinct('category').whereNotNull('category');
      const catNames = dbCats.map(c => c.category).filter(Boolean);
      categories = Array.from(new Set([...DEFAULT_FAQ_CATEGORIES, ...catNames]));
    } catch (e) {}
  }
  res.render('admin/faqs/form.njk', adminVars(req, { faq: { published: true, sort_order: 0 }, categories, error: null }));
});

router.post('/admin/faqs', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  const { question, answer, category, published, sort_order } = req.body;
  try {
    if (!question || !question.trim()) throw new Error('Question text is required');
    if (!answer || !answer.trim()) throw new Error('Answer text is required');

    let finalSort = parseInt(sort_order, 10);
    if (isNaN(finalSort)) {
      const [{ maxSort }] = await db('faqs').max('sort_order as maxSort');
      finalSort = (maxSort ?? -1) + 1;
    }

    await db('faqs').insert({
      question: question.trim(),
      answer: answer.trim(),
      category: category && category.trim() ? category.trim() : 'General',
      published: published === 'on' || published === true || published === 'true',
      sort_order: finalSort,
    });
    res.redirect('/admin/faqs');
  } catch (e) {
    let categories = [...DEFAULT_FAQ_CATEGORIES];
    try {
      const dbCats = await db('faqs').distinct('category').whereNotNull('category');
      categories = Array.from(new Set([...DEFAULT_FAQ_CATEGORIES, ...dbCats.map(c => c.category).filter(Boolean)]));
    } catch (err) {}
    res.render('admin/faqs/form.njk', adminVars(req, {
      faq: req.body,
      categories,
      error: e.message,
    }));
  }
});

router.get('/admin/faqs/:id/edit', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  try {
    const faq = await db('faqs').where({ id: req.params.id }).first();
    if (!faq) return res.status(404).send('FAQ item not found');

    let categories = [...DEFAULT_FAQ_CATEGORIES];
    const dbCats = await db('faqs').distinct('category').whereNotNull('category');
    categories = Array.from(new Set([...DEFAULT_FAQ_CATEGORIES, ...dbCats.map(c => c.category).filter(Boolean)]));

    res.render('admin/faqs/form.njk', adminVars(req, { faq, categories, error: null }));
  } catch (e) {
    res.status(500).send('Database error: ' + e.message);
  }
});

router.post('/admin/faqs/:id', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  const { question, answer, category, published, sort_order } = req.body;
  try {
    if (!question || !question.trim()) throw new Error('Question text is required');
    if (!answer || !answer.trim()) throw new Error('Answer text is required');

    let finalSort = parseInt(sort_order, 10);
    if (isNaN(finalSort)) finalSort = 0;

    await db('faqs').where({ id: req.params.id }).update({
      question: question.trim(),
      answer: answer.trim(),
      category: category && category.trim() ? category.trim() : 'General',
      published: published === 'on' || published === true || published === 'true',
      sort_order: finalSort,
      updated_at: db.fn.now(),
    });
    res.redirect('/admin/faqs');
  } catch (e) {
    let categories = [...DEFAULT_FAQ_CATEGORIES];
    try {
      const dbCats = await db('faqs').distinct('category').whereNotNull('category');
      categories = Array.from(new Set([...DEFAULT_FAQ_CATEGORIES, ...dbCats.map(c => c.category).filter(Boolean)]));
    } catch (err) {}
    res.render('admin/faqs/form.njk', adminVars(req, {
      faq: { ...req.body, id: req.params.id },
      categories,
      error: e.message,
    }));
  }
});

router.post('/admin/faqs/:id/delete', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  try {
    await db('faqs').where({ id: req.params.id }).del();
    res.redirect('/admin/faqs');
  } catch (e) {
    res.status(400).send('Delete error: ' + e.message);
  }
});

// ---- Team Members & Department Leadership Management ----

const TEAM_DEPARTMENTS = [
  { slug: 'senior-management', label: 'Senior Management', page: 'team-senior-management.html' },
  { slug: 'engineering', label: 'Engineering Team', page: 'team-engineering.html' },
  { slug: 'marketing-sales', label: 'Marketing & Sales', page: 'team-marketing-sales.html' },
  { slug: 'quality-control', label: 'Quality Control', page: 'team-quality-control.html' },
  { slug: 'skilled-workers', label: 'Skilled Workers', page: 'team-skilled-workers.html' },
  { slug: 'client-service', label: 'Client Service', page: 'team-client-service.html' },
];

router.get('/admin/team-members', async (req, res) => {
  let members = [];
  const search = (req.query.q || '').trim();
  const deptFilter = req.query.dept || 'all';
  const statusFilter = req.query.status || 'all';

  if (db) {
    try {
      let query = db('team_members').orderBy('department', 'asc').orderBy('sort_order', 'asc');
      if (deptFilter && deptFilter !== 'all') {
        query = query.where({ department: deptFilter });
      }
      if (statusFilter === 'published') {
        query = query.where({ published: true });
      } else if (statusFilter === 'draft') {
        query = query.where({ published: false });
      }
      if (search) {
        query = query.where((builder) => {
          builder.where('name', 'like', `%${search}%`)
            .orWhere('role', 'like', `%${search}%`)
            .orWhere('bio', 'like', `%${search}%`);
        });
      }
      members = await query;
    } catch (err) {
      console.error('Team members list query error:', err.message);
    }
  }

  const publishedCount = members.filter(m => m.published).length;

  res.render('admin/team-members/list.njk', adminVars(req, {
    members,
    departments: TEAM_DEPARTMENTS,
    search,
    deptFilter,
    statusFilter,
    totalCount: members.length,
    publishedCount,
  }));
});

router.get('/admin/team-members/new', (req, res) => {
  res.render('admin/team-members/form.njk', adminVars(req, {
    member: { published: true, sort_order: 0, photo: 'images/about-team.webp', department: 'senior-management' },
    departments: TEAM_DEPARTMENTS,
    error: null,
  }));
});

router.post('/admin/team-members', upload.single('photo_file'), async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  const { name, role, bio, photo, department, published, sort_order } = req.body;
  try {
    if (!name || !name.trim()) throw new Error('Full Name is required');
    if (!role || !role.trim()) throw new Error('Role / Designation is required');

    let photoPath = photo ? photo.trim().replace(/^\/+/, '') : 'images/about-team.webp';
    if (req.file) {
      photoPath = await processAndSaveImage(req.file.buffer, req.file.originalname, { maxWidth: 800 });
    }

    let finalSort = parseInt(sort_order, 10);
    if (isNaN(finalSort)) {
      const [{ maxSort }] = await db('team_members').where({ department: department || 'senior-management' }).max('sort_order as maxSort');
      finalSort = (maxSort ?? -1) + 1;
    }

    await db('team_members').insert({
      name: name.trim(),
      role: role.trim(),
      bio: bio ? bio.trim() : '',
      photo: photoPath,
      department: department || 'senior-management',
      published: published === 'on' || published === true || published === 'true',
      sort_order: finalSort,
    });

    logActivity(req, 'create', 'team_member', null, `Added team member: ${name.trim()} (${role.trim()})`);
    res.redirect('/admin/team-members');
  } catch (e) {
    res.render('admin/team-members/form.njk', adminVars(req, {
      member: req.body,
      departments: TEAM_DEPARTMENTS,
      error: e.message,
    }));
  }
});

router.get('/admin/team-members/:id/edit', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  try {
    const member = await db('team_members').where({ id: req.params.id }).first();
    if (!member) return res.status(404).send('Team member not found');

    res.render('admin/team-members/form.njk', adminVars(req, {
      member,
      departments: TEAM_DEPARTMENTS,
      error: null,
    }));
  } catch (e) {
    res.status(500).send('Database error: ' + e.message);
  }
});

router.post('/admin/team-members/:id', upload.single('photo_file'), async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  const { name, role, bio, photo, department, published, sort_order } = req.body;
  try {
    if (!name || !name.trim()) throw new Error('Full Name is required');
    if (!role || !role.trim()) throw new Error('Role / Designation is required');

    let photoPath = photo ? photo.trim().replace(/^\/+/, '') : 'images/about-team.webp';
    if (req.file) {
      photoPath = await processAndSaveImage(req.file.buffer, req.file.originalname, { maxWidth: 800 });
    }

    let finalSort = parseInt(sort_order, 10);
    if (isNaN(finalSort)) finalSort = 0;

    await db('team_members').where({ id: req.params.id }).update({
      name: name.trim(),
      role: role.trim(),
      bio: bio ? bio.trim() : '',
      photo: photoPath,
      department: department || 'senior-management',
      published: published === 'on' || published === true || published === 'true',
      sort_order: finalSort,
      updated_at: db.fn.now(),
    });

    logActivity(req, 'update', 'team_member', req.params.id, `Updated team member: ${name.trim()}`);
    res.redirect('/admin/team-members');
  } catch (e) {
    res.render('admin/team-members/form.njk', adminVars(req, {
      member: { ...req.body, id: req.params.id },
      departments: TEAM_DEPARTMENTS,
      error: e.message,
    }));
  }
});

router.post('/admin/team-members/:id/delete', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  try {
    const member = await db('team_members').where({ id: req.params.id }).first();
    await db('team_members').where({ id: req.params.id }).del();
    logActivity(req, 'delete', 'team_member', req.params.id, `Deleted team member: ${member ? member.name : req.params.id}`);
    res.redirect('/admin/team-members');
  } catch (e) {
    res.status(400).send('Delete error: ' + e.message);
  }
});

// ---- WordPress-Style Themes Directory & Theme Customizer (Admin Only) ----

const pageRegistry = require('../page-registry.json');

router.get('/admin/themes', requireRole('admin', 'superadmin'), async (req, res) => {
  const currentTheme = await getThemeSettings();
  if (currentTheme) {
    currentTheme.is_dark = isThemeDark(currentTheme);
  }
  const activatedSlug = req.query.theme;
  const activatedPreset = activatedSlug && PRESETS[activatedSlug];
  res.render('admin/themes/index.njk', adminVars(req, {
    presets: PRESETS,
    currentTheme,
    activated: req.query.activated === '1',
    activatedThemeName: activatedPreset ? activatedPreset.name : null,
  }));
});

router.post('/admin/themes/activate/:slug', requireRole('admin', 'superadmin'), async (req, res) => {
  const { slug } = req.params;
  const preset = PRESETS[slug];
  if (!preset) {
    return res.status(404).send('Theme preset not found');
  }
  try {
    const currentTheme = await getThemeSettings();
    const newTheme = {
      ...currentTheme,
      ...preset,
      name: preset.name,
      archetype: preset.archetype || 'catalog-first',
      is_dark: isThemeDark(preset),
    };
    await saveThemeSettings(newTheme);
    logActivity(req, 'update', 'theme', null, `Activated theme: "${preset.name}" (${preset.archetype || 'catalog-first'})`);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, message: `Theme "${preset.name}" activated!` });
    }
    res.redirect(`/admin/themes?activated=1&theme=${encodeURIComponent(slug)}`);
  } catch (err) {
    console.error('Failed to activate theme:', err);
    res.status(500).send('Theme activation failed: ' + err.message);
  }
});

router.get('/admin/theme-editor', requireRole('admin', 'superadmin'), async (req, res) => {
  let theme = await getThemeSettings();
  const presetParam = req.query.preset;
  if (presetParam && PRESETS[presetParam]) {
    theme = { ...theme, ...PRESETS[presetParam] };
  }
  const pagesList = Object.keys(pageRegistry).sort();
  res.render('admin/theme-editor.njk', adminVars(req, {
    theme,
    presets: PRESETS,
    pagesList,
    defaultTheme: DEFAULT_THEME,
    saved: req.query.saved === '1',
    reset: req.query.reset === '1',
    initialPreset: presetParam || null,
  }));
});

router.post('/admin/theme-editor', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const rawData = req.body;
    // Format checkboxes and values
    const newSettings = {
      ...rawData,
      show_announcement: rawData.show_announcement === 'on' || rawData.show_announcement === true || rawData.show_announcement === 'true',
      navbar_sticky: rawData.navbar_sticky === 'on' || rawData.navbar_sticky === true || rawData.navbar_sticky === 'true',
      navbar_blur: rawData.navbar_blur === 'on' || rawData.navbar_blur === true || rawData.navbar_blur === 'true',
    };
    await saveThemeSettings(newSettings);
    logActivity(req, 'update', 'theme', null, `Published visual theme customization updates`);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, message: 'Theme saved successfully!' });
    }
    res.redirect('/admin/theme-editor?saved=1');
  } catch (err) {
    console.error('Failed to save theme settings:', err);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(400).json({ success: false, error: err.message });
    }
    res.redirect('/admin/theme-editor?error=1');
  }
});

router.post('/admin/theme-editor/reset', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    await resetThemeSettings();
    logActivity(req, 'update', 'theme', null, `Reset theme to Bongshai Housing defaults`);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, message: 'Theme reset to defaults!' });
    }
    res.redirect('/admin/theme-editor?reset=1');
  } catch (err) {
    res.status(500).send('Reset failed: ' + err.message);
  }
});

router.get('/admin/theme-editor/export', requireRole('admin', 'superadmin'), async (req, res) => {
  const theme = await getThemeSettings();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="bongshai-theme-settings.json"');
  res.send(JSON.stringify(theme, null, 2));
});

// ---- Admin Users (role-gated: only 'admin' role can manage accounts) ----

const bcrypt = require('bcryptjs');

router.get('/admin/users', requireRole('admin', 'superadmin'), async (req, res) => {
  const users = await db('admin_users').select('id', 'email', 'name', 'role', 'last_login_at', 'created_at').orderBy('created_at');
  res.render('admin/users/list.njk', adminVars(req, { users }));
});

router.get('/admin/users/new', requireRole('admin', 'superadmin'), (req, res) => {
  res.render('admin/users/form.njk', adminVars(req, { user: null, error: null }));
});

router.post('/admin/users', requireRole('admin', 'superadmin'), async (req, res) => {
  const { email, name, role, password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).render('admin/users/form.njk', adminVars(req, { user: req.body, error: 'Password must be at least 8 characters.' }));
  }
  try {
    const password_hash = await bcrypt.hash(password, 12);
    const [id] = await db('admin_users').insert({ email, name, role: role || 'editor', password_hash });
    await logActivity(req, { action: 'create', entityType: 'user', entityId: id, summary: `Created user ${email} (${role || 'editor'})` });
    res.redirect(`/admin/users/${id}/edit`);
  } catch (err) {
    res.status(400).render('admin/users/form.njk', adminVars(req, { user: req.body, error: err.message }));
  }
});

router.get('/admin/users/:id/edit', requireRole('admin', 'superadmin'), async (req, res) => {
  const user = await db('admin_users').where({ id: req.params.id }).first();
  if (!user) return res.status(404).send('Not found');
  res.render('admin/users/form.njk', adminVars(req, { user, error: null }));
});

router.post('/admin/users/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  const { email, name, role, password } = req.body;
  const update = { email, name, role: role || 'editor', updated_at: db.fn.now() };
  if (password && password.length > 0) {
    if (password.length < 8) {
      const user = await db('admin_users').where({ id: req.params.id }).first();
      return res.status(400).render('admin/users/form.njk', adminVars(req, { user: { ...user, ...req.body }, error: 'Password must be at least 8 characters.' }));
    }
    update.password_hash = await bcrypt.hash(password, 12);
  }
  await db('admin_users').where({ id: req.params.id }).update(update);
  await logActivity(req, { action: 'update', entityType: 'user', entityId: req.params.id, summary: `Updated user ${email} (role: ${role || 'editor'}${update.password_hash ? ', password reset' : ''})` });
  res.redirect(`/admin/users/${req.params.id}/edit`);
});

router.post('/admin/users/:id/delete', requireRole('admin', 'superadmin'), async (req, res) => {
  if (Number(req.params.id) === req.session.adminUserId) {
    return res.status(400).send('You cannot delete your own account while logged in as it.');
  }
  const [{ count }] = await db('admin_users').count({ count: '*' });
  if (Number(count) <= 1) {
    return res.status(400).send('Cannot delete the last remaining admin account.');
  }
  const u = await db('admin_users').where({ id: req.params.id }).first();
  await db('admin_users').where({ id: req.params.id }).del();
  await logActivity(req, { action: 'delete', entityType: 'user', entityId: req.params.id, summary: `Deleted user ${u ? u.email : req.params.id}` });
  res.redirect('/admin/users');
});

// ---- Media Library ----
// Browses images/uploads/ (everything the admin panel's own file-upload
// widgets save to) and cross-references product/category/project image
// columns to flag which files are actually still referenced vs orphaned
// (safe to delete - e.g. after replacing a product's photo).

router.get('/admin/media', async (req, res) => {
  let files = [];
  try {
    files = fs.readdirSync(UPLOADS_DIR)
      .filter((f) => !f.startsWith('.'))
      .map((f) => {
        const stat = fs.statSync(path.join(UPLOADS_DIR, f));
        return { filename: f, path: `images/uploads/${f}`, size: stat.size, mtime: stat.mtime };
      })
      .sort((a, b) => b.mtime - a.mtime);
  } catch (err) {
    console.error('Media library read error:', err.message);
  }

  const [productImages, categoryImages, projectImages] = await Promise.all([
    db('products').whereNotNull('main_image').pluck('main_image'),
    db('categories').whereNotNull('hero_image').pluck('hero_image'),
    db('projects').whereNotNull('image').pluck('image'),
  ]);
  const inUse = new Set([...productImages, ...categoryImages, ...projectImages]);

  for (const f of files) {
    f.inUse = inUse.has(f.path);
  }

  res.render('admin/media/list.njk', adminVars(req, { files, unusedCount: files.filter((f) => !f.inUse).length }));
});

router.post('/admin/media/:filename/delete', async (req, res) => {
  const filename = path.basename(req.params.filename); // strip any path traversal
  const filePath = path.join(UPLOADS_DIR, filename);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Media delete error:', err.message);
  }
  await logActivity(req, { action: 'delete', entityType: 'media', summary: `Deleted upload ${filename}` });
  res.redirect('/admin/media');
});

// ---- Testimonials ----
// Homepage's client reviews (visible section + JSON-LD structured data)
// were hardcoded - and the company has essentially no independent
// third-party review presence to fall back on (confirmed via a direct
// web-search pass), so this is the actual social-proof source of truth
// now, not a nice-to-have.

router.get('/admin/testimonials', async (req, res) => {
  let testimonials = [];
  try {
    testimonials = await db('testimonials').orderBy('sort_order');
  } catch (err) {
    console.error('Testimonials list error:', err.message);
    return res.status(500).send('Database unavailable: ' + err.message);
  }
  res.render('admin/testimonials/list.njk', adminVars(req, { testimonials }));
});

router.get('/admin/testimonials/new', (req, res) => {
  res.render('admin/testimonials/form.njk', adminVars(req, { testimonial: null, error: null }));
});

router.post('/admin/testimonials', async (req, res) => {
  const { author_name, author_title, rating, review_text, published, sort_order } = req.body;
  try {
    const [id] = await db('testimonials').insert({
      author_name, author_title: author_title || null, rating: rating || 5, review_text,
      published: published === 'on', sort_order: sort_order || 0,
    });
    await logActivity(req, { action: 'create', entityType: 'testimonial', entityId: id, summary: `Added testimonial from ${author_name}` });
    res.redirect(`/admin/testimonials/${id}/edit`);
  } catch (err) {
    res.status(400).render('admin/testimonials/form.njk', adminVars(req, { testimonial: req.body, error: err.message }));
  }
});

router.get('/admin/testimonials/:id/edit', async (req, res) => {
  const testimonial = await db('testimonials').where({ id: req.params.id }).first();
  if (!testimonial) return res.status(404).send('Not found');
  res.render('admin/testimonials/form.njk', adminVars(req, { testimonial, error: null }));
});

router.post('/admin/testimonials/:id', async (req, res) => {
  const { author_name, author_title, rating, review_text, published, sort_order } = req.body;
  await db('testimonials').where({ id: req.params.id }).update({
    author_name, author_title: author_title || null, rating: rating || 5, review_text,
    published: published === 'on', sort_order: sort_order || 0, updated_at: db.fn.now(),
  });
  res.redirect(`/admin/testimonials/${req.params.id}/edit`);
});

router.post('/admin/testimonials/:id/delete', async (req, res) => {
  const t = await db('testimonials').where({ id: req.params.id }).first();
  await db('testimonials').where({ id: req.params.id }).del();
  await logActivity(req, { action: 'delete', entityType: 'testimonial', entityId: req.params.id, summary: `Deleted testimonial from ${t ? t.author_name : req.params.id}` });
  res.redirect('/admin/testimonials');
});

// ---- Activity Log ----

router.get('/admin/activity', async (req, res) => {
  let entries = [];
  try {
    entries = await db('activity_log').orderBy('created_at', 'desc').limit(200);
  } catch (err) {
    console.error('Activity log list error:', err.message);
    return res.status(500).send('Database unavailable: ' + err.message);
  }
  res.render('admin/activity/list.njk', adminVars(req, { entries }));
});

// ---- Analytics ----

router.get('/admin/analytics', async (req, res) => {
  const empty = {
    leadFunnel: [], leadTrend: [], topModels: [], leadSources: [],
    topPages: [], trafficTrend: [], totalViews30d: 0, totalLeads30d: 0,
  };
  if (!db) return res.render('admin/analytics.njk', adminVars(req, empty));

  try {
    const hasLeads = await db.schema.hasTable('leads');
    const hasViews = await db.schema.hasTable('page_views');

    const [leadFunnel, leadTrend, topModels, leadSources] = hasLeads ? await Promise.all([
      db('leads').select('status').count({ count: '*' }).groupBy('status'),
      db('leads').where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
        .select(db.raw('DATE(created_at) as day')).count({ count: '*' }).groupBy('day').orderBy('day'),
      db('leads').whereNotNull('model').where('model', '!=', '')
        .select('model').count({ count: '*' }).groupBy('model').orderBy('count', 'desc').limit(8),
      db('leads').select('source').count({ count: '*' }).groupBy('source').orderBy('count', 'desc'),
    ]) : [[], [], [], []];

    const [topPages, trafficTrend] = hasViews ? await Promise.all([
      db('page_views').where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
        .select('path').count({ count: '*' }).groupBy('path').orderBy('count', 'desc').limit(12),
      db('page_views').where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
        .select(db.raw('DATE(created_at) as day')).count({ count: '*' }).groupBy('day').orderBy('day'),
    ]) : [[], []];

    const totalViews30d = trafficTrend.reduce((sum, r) => sum + Number(r.count), 0);
    const totalLeads30d = leadTrend.reduce((sum, r) => sum + Number(r.count), 0);

    res.render('admin/analytics.njk', adminVars(req, {
      leadFunnel, leadTrend, topModels, leadSources, topPages, trafficTrend,
      totalViews30d, totalLeads30d,
    }));
  } catch (err) {
    console.error('Analytics query error:', err.message);
    res.render('admin/analytics.njk', adminVars(req, empty));
  }
});

module.exports = router;
