const express = require('express');
const db = require('../lib/db');
const requireAdmin = require('../middleware/requireAdmin');

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

router.post('/admin/products', async (req, res) => {
  const { category_id, model_number, slug, title, description, price_per_sqft, price_currency, main_image, published } = req.body;
  try {
    const [id] = await db('products').insert({
      category_id, model_number, slug, title, description,
      price_per_sqft: price_per_sqft || null,
      price_currency: price_currency || 'BDT',
      main_image: main_image || null,
      published: published === 'on',
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
  res.render('admin/products/form.njk', adminVars(req, { product, categories, specs, variants, error: null }));
});

router.post('/admin/products/:id', async (req, res) => {
  const { category_id, model_number, slug, title, description, price_per_sqft, price_currency, main_image, published } = req.body;
  await db('products').where({ id: req.params.id }).update({
    category_id, model_number, slug, title, description,
    price_per_sqft: price_per_sqft || null,
    price_currency: price_currency || 'BDT',
    main_image: main_image || null,
    published: published === 'on',
    updated_at: db.fn.now(),
  });
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

router.post('/admin/products/:id/delete', async (req, res) => {
  await db('products').where({ id: req.params.id }).del();
  res.redirect('/admin/products');
});

// ---- Categories ----

router.get('/admin/categories', async (req, res) => {
  const categories = await db('categories').orderBy('sort_order');
  res.render('admin/categories/list.njk', adminVars(req, { categories }));
});

router.get('/admin/categories/new', (req, res) => {
  res.render('admin/categories/form.njk', adminVars(req, { category: null, error: null }));
});

router.post('/admin/categories', async (req, res) => {
  const { slug, name, landing_page_slug, description, hero_image, sort_order } = req.body;
  try {
    const [id] = await db('categories').insert({ slug, name, landing_page_slug: landing_page_slug || null, description: description || null, hero_image: hero_image || null, sort_order: sort_order || 0 });
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

router.post('/admin/categories/:id', async (req, res) => {
  const { slug, name, landing_page_slug, description, hero_image, sort_order } = req.body;
  await db('categories').where({ id: req.params.id }).update({
    slug, name, landing_page_slug: landing_page_slug || null, description: description || null,
    hero_image: hero_image || null, sort_order: sort_order || 0, updated_at: db.fn.now(),
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

router.post('/admin/projects', async (req, res) => {
  const { slug, title, location, description, image, status_label, published, sort_order } = req.body;
  try {
    const [id] = await db('projects').insert({
      slug, title, location: location || null, description: description || null, image: image || null,
      status_label: status_label || 'Completed Project', published: published === 'on', sort_order: sort_order || 0,
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

router.post('/admin/projects/:id', async (req, res) => {
  const { slug, title, location, description, image, status_label, published, sort_order } = req.body;
  await db('projects').where({ id: req.params.id }).update({
    slug, title, location: location || null, description: description || null, image: image || null,
    status_label: status_label || 'Completed Project', published: published === 'on', sort_order: sort_order || 0,
    updated_at: db.fn.now(),
  });
  res.redirect(`/admin/projects/${req.params.id}/edit`);
});

router.post('/admin/projects/:id/delete', async (req, res) => {
  await db('projects').where({ id: req.params.id }).del();
  res.redirect('/admin/projects');
});

module.exports = router;
