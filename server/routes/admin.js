const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const db = require('../lib/db');
const requireAdmin = require('../middleware/requireAdmin');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'images', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

router.get('/admin', async (req, res) => {
  let productCount = { count: 0 };
  let categoryCount = { count: 0 };
  let projectCount = { count: 0 };
  let leadCount = { count: 0 };
  let newLeadCount = { count: 0 };
  let recentLeads = [];

  if (db) {
    try {
      [productCount] = await db('products').count({ count: '*' });
      [categoryCount] = await db('categories').count({ count: '*' });
      [projectCount] = await db('projects').count({ count: '*' });
      
      const hasLeads = await db.schema.hasTable('leads');
      if (hasLeads) {
        [leadCount] = await db('leads').count({ count: '*' });
        [newLeadCount] = await db('leads').where({ status: 'new' }).count({ count: '*' });
        recentLeads = await db('leads').orderBy('created_at', 'desc').limit(6);
      }
    } catch (e) {
      console.error('Admin dashboard query error:', e.message);
    }
  }

  res.render('admin/dashboard.njk', adminVars(req, {
    counts: {
      products: productCount?.count || 0,
      categories: categoryCount?.count || 0,
      projects: projectCount?.count || 0,
      leads: leadCount?.count || 0,
      newLeads: newLeadCount?.count || 0,
    },
    recentLeads,
  }));
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
    res.redirect(`/admin/leads/${req.params.id}`);
  } catch (e) {
    res.status(400).send('Update error: ' + e.message);
  }
});

router.post('/admin/leads/:id/delete', async (req, res) => {
  if (!db) return res.status(500).send('Database unavailable');
  try {
    await db('leads').where({ id: req.params.id }).del();
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
  const finalImage = req.file ? `images/uploads/${req.file.filename}` : (main_image || null);
  try {
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
  const finalImage = req.file ? `images/uploads/${req.file.filename}` : (main_image || null);
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
  await db('products').where({ id: req.params.id }).del();
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
  await db('categories').where({ id: req.params.id }).del();
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
  const finalImage = req.file ? `images/uploads/${req.file.filename}` : (image || null);
  try {
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
  const finalImage = req.file ? `images/uploads/${req.file.filename}` : (image || null);
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

// Generic Image Upload API (JSON Response)
router.post('/admin/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  const relativePath = `images/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: relativePath,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

router.post('/admin/projects/:id/delete', async (req, res) => {
  await db('projects').where({ id: req.params.id }).del();
  res.redirect('/admin/projects');
});

// ---- Visual Theme & Layout Customizer ----

const { getThemeSettings, saveThemeSettings, resetThemeSettings, PRESETS, DEFAULT_THEME } = require('../lib/theme');
const pageRegistry = require('../page-registry.json');

router.get('/admin/theme-editor', async (req, res) => {
  const theme = await getThemeSettings();
  const pagesList = Object.keys(pageRegistry).sort();
  res.render('admin/theme-editor.njk', adminVars(req, {
    theme,
    presets: PRESETS,
    pagesList,
    defaultTheme: DEFAULT_THEME,
    saved: req.query.saved === '1',
    reset: req.query.reset === '1',
  }));
});

router.post('/admin/theme-editor', async (req, res) => {
  try {
    const rawData = req.body;
    // Format checkboxes and values
    const newSettings = {
      ...rawData,
      show_announcement: rawData.show_announcement === 'on' || rawData.show_announcement === true || rawData.show_announcement === 'true',
    };
    await saveThemeSettings(newSettings);
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

router.post('/admin/theme-editor/reset', async (req, res) => {
  try {
    await resetThemeSettings();
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, message: 'Theme reset to defaults!' });
    }
    res.redirect('/admin/theme-editor?reset=1');
  } catch (err) {
    res.status(500).send('Reset failed: ' + err.message);
  }
});

router.get('/admin/theme-editor/export', async (req, res) => {
  const theme = await getThemeSettings();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="bongshai-theme-settings.json"');
  res.send(JSON.stringify(theme, null, 2));
});

module.exports = router;
