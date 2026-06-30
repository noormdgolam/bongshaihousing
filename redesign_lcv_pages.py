import re
import glob

html_template = """<main>
    <!-- PAGE HERO -->
    <section class="page-hero" style="min-height: 40vh; padding: 120px 0 60px;">
      <div class="container page-hero-content" style="text-align: center;">
        <span class="page-hero-label">Premium Prefab Housing</span>
        <h1 class="page-hero-title">Model LCV-{MODEL_NUM}</h1>
        <p class="page-hero-text" style="max-width: 800px; margin: 0 auto 24px;">Durable, affordable, and beautifully designed prefab homes. The smart housing choice for Bangladesh.</p>
        <nav class="breadcrumb" style="justify-content: center;">
          <a href="index.html">Home</a> <span aria-hidden="true">/</span> <a href="low-cost-villa.html">Low Cost Villa</a> <span aria-hidden="true">/</span> <span aria-current="page">LCV-{MODEL_NUM}</span>
        </nav>
      </div>
    </section>

    <div class="container" style="margin-top: 40px; margin-bottom: 80px;">
      <div class="page-with-sidebar">
      
        <!-- ===== CATEGORY SIDEBAR ===== -->
        <aside class="cat-sidebar" aria-label="Product categories">
          <!-- Mobile toggle -->
          <button class="cat-sidebar-toggle" id="catSidebarToggle" aria-expanded="false" aria-controls="catSidebarBody">
            <span>All Products</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <!-- Desktop header -->
          <div class="cat-sidebar-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            All Products
          </div>
          <div class="cat-sidebar-body" id="catSidebarBody">
          <div class="cat-group-label">Residential Prefab</div>
          <a href="low-cost-villa.html" class="cat-item active">Low-Cost Villa<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="luxury-villa.html" class="cat-item">Luxury Villa<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="multi-story-homes.html" class="cat-item">Multi-Story Homes<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="container-house.html" class="cat-item">Container House<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <div class="cat-group-label">Commercial &amp; Industrial</div>
          <a href="single-story-building.html" class="cat-item">Single Story Building<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="industrial-sheds.html" class="cat-item">Industrial Steel Sheds<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="worker-accommodation.html" class="cat-item">Worker Accommodation<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <div class="cat-group-label">Site Solutions</div>
          <a href="site-offices.html" class="cat-item">Site Offices<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="security-kiosks.html" class="cat-item">Security Kiosks<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <div class="cat-group-label">Security &amp; Guard Units</div>
          <a href="guard-house.html" class="cat-item sub"><span class="cat-bullet"></span>Guard House<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="gatehouses.html" class="cat-item sub"><span class="cat-bullet"></span>Gatehouses<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="security-huts.html" class="cat-item sub"><span class="cat-bullet"></span>Security Huts<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="modular-kiosks.html" class="cat-item sub"><span class="cat-bullet"></span>Modular Kiosks<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="prefabricated-booths.html" class="cat-item sub"><span class="cat-bullet"></span>Prefabricated Booths<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="bullet-resistant-guard-booths.html" class="cat-item sub"><span class="cat-bullet"></span>Bullet Resistant Booths<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          <a href="portable-toilets-and-showers.html" class="cat-item sub"><span class="cat-bullet"></span>Portable Toilets &amp; Showers<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
            <div class="cat-sidebar-cta">
              <a href="contact.html">📞 Get a Free Quote</a>
            </div>
          </div>
        </aside>

        <div class="page-sidebar-content">

          <!-- PRODUCT OVERVIEW SECTION -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-8); align-items: start; margin-bottom: 60px;">
            
            <!-- Left: Image Gallery -->
            <div class="reveal-left">
              <img src="images/user-cottage-1-clean.png" alt="Model LCV-{MODEL_NUM} Main View" style="width: 100%; border-radius: 16px; box-shadow: var(--shadow-lg); margin-bottom: var(--space-4);" />
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                <img src="images/user-cottage-2-clean.png" alt="Side View" style="width: 100%; border-radius: 12px; box-shadow: var(--shadow-md);" />
                <img src="images/user-cottage-3-clean.png" alt="Front View" style="width: 100%; border-radius: 12px; box-shadow: var(--shadow-md); height: 100%; object-fit: cover;" />
              </div>
            </div>

            <!-- Right: Specs & CTA -->
            <div class="reveal-right" style="position: sticky; top: 120px; background: white; padding: var(--space-6); border-radius: 16px; box-shadow: var(--shadow-xl); border: 1px solid var(--grey-100);">
              <div style="display: inline-block; background: rgba(212, 175, 55, 0.15); color: var(--accent-dark); padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; margin-bottom: 16px;">MOST POPULAR</div>
              <h2 style="font-family: var(--font-heading); font-size: clamp(1.8rem, 3vw, 2.2rem); color: var(--primary); margin-bottom: var(--space-2); line-height: 1.1;">Model LCV-{MODEL_NUM}</h2>
              <p style="color: var(--grey-600); font-size: 1rem; margin-bottom: var(--space-6);">A perfect blend of affordability, durability, and modern design. Ready for immediate assembly.</p>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-6);">
                <div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: var(--off-white); border-radius: 8px;">
                  <span style="font-size: 1.2rem;">🛏️</span>
                  <div><div style="font-size: 0.65rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700;">Bedrooms</div><div style="font-weight: 600; color: var(--grey-900); font-size: 0.9rem;">2 Rooms</div></div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: var(--off-white); border-radius: 8px;">
                  <span style="font-size: 1.2rem;">🚿</span>
                  <div><div style="font-size: 0.65rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700;">Bathrooms</div><div style="font-weight: 600; color: var(--grey-900); font-size: 0.9rem;">1 Room</div></div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: var(--off-white); border-radius: 8px;">
                  <span style="font-size: 1.2rem;">📐</span>
                  <div><div style="font-size: 0.65rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700;">Floor Area</div><div style="font-weight: 600; color: var(--grey-900); font-size: 0.9rem;">440 sft</div></div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: var(--off-white); border-radius: 8px;">
                  <span style="font-size: 1.2rem;">🍳</span>
                  <div><div style="font-size: 0.65rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700;">Kitchen</div><div style="font-weight: 600; color: var(--grey-900); font-size: 0.9rem;">Included</div></div>
                </div>
              </div>

              <a href="contact.html" class="btn btn-primary btn-lg" style="width: 100%; justify-content: center; margin-bottom: 12px; font-size: 1rem; padding: 12px;">Get a Free Quote</a>
              <a href="tel:+8801781636613" class="btn btn-outline btn-lg" style="width: 100%; justify-content: center; background: white; font-size: 1rem; padding: 12px;">📞 Call 01781-636613</a>
              
              <p style="text-align: center; font-size: 0.75rem; color: var(--grey-500); margin-top: 16px;">* Final price depends on location and customization.</p>
            </div>
          </div>

          <!-- FLOOR PLAN -->
          <div class="section-header reveal" style="text-align: left;">
            <div class="section-label">Technical Details</div>
            <h2 class="section-title">Floor Plan & Dimensions</h2>
            <p class="section-subtitle">Intelligently designed space distribution to maximize comfort and usability.</p>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-8); align-items: center; margin-bottom: 60px;">
            <div class="reveal-left" style="background: white; padding: var(--space-6); border-radius: 16px; box-shadow: var(--shadow-md);">
              <h3 style="color: var(--primary); margin-bottom: var(--space-6); font-family: var(--font-heading); font-size: 1.5rem;">Space Allocation</h3>
              <div style="display: flex; flex-direction: column; gap: var(--space-3); font-size: 0.95rem;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Overall Dimension</span>
                  <span style="color: var(--grey-900); font-weight: 700;">20 ft × 22 ft</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Eave Height</span>
                  <span style="color: var(--grey-900); font-weight: 700;">9.5 ft</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Master Bedroom</span>
                  <span style="color: var(--grey-900); font-weight: 700;">11 ft × 10 ft</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Child Bedroom</span>
                  <span style="color: var(--grey-900); font-weight: 700;">11 ft × 10 ft</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Living / Dining Room</span>
                  <span style="color: var(--grey-900); font-weight: 700;">18 ft × 8 ft</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Kitchen</span>
                  <span style="color: var(--grey-900); font-weight: 700;">6 ft × 6 ft</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Common Toilet</span>
                  <span style="color: var(--grey-900); font-weight: 700;">5 ft × 4 ft</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--grey-600); font-weight: 500;">Veranda</span>
                  <span style="color: var(--grey-900); font-weight: 700;">6 ft × 4 ft</span>
                </div>
              </div>
            </div>
            <div class="reveal-right" style="text-align: center;">
              <img src="images/3d-image.jpg" alt="Floor Plan" style="width: 100%; max-width: 500px; border-radius: 16px; box-shadow: var(--shadow-xl); border: 8px solid white;" />
            </div>
          </div>

          <!-- MATERIAL SPECIFICATIONS -->
          <div class="section-header reveal" style="text-align: left;">
            <div class="section-label">Quality Assured</div>
            <h2 class="section-title">Premium Material Specifications</h2>
            <p class="section-subtitle">We use only the highest grade materials to ensure your home lasts for generations.</p>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-6); margin-bottom: 60px;" class="stagger">
            
            <div class="reveal" style="background: var(--off-white); border-radius: 12px; padding: var(--space-6); border-top: 4px solid var(--primary); box-shadow: var(--shadow-sm);">
              <div style="font-size: 2rem; margin-bottom: 12px;">🏗️</div>
              <h3 style="font-size: 1.2rem; color: var(--primary-dark); margin-bottom: 12px; font-family: var(--font-heading);">Structure</h3>
              <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; color: var(--grey-700); font-size: 0.9rem;">
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Footing:</strong> Pre-cast RCC</span></li>
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Tie Beam:</strong> Pre-cast RCC</span></li>
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Structure:</strong> Prefab steel</span></li>
              </ul>
            </div>

            <div class="reveal" style="background: var(--off-white); border-radius: 12px; padding: var(--space-6); border-top: 4px solid var(--primary); box-shadow: var(--shadow-sm);">
              <div style="font-size: 2rem; margin-bottom: 12px;">🧱</div>
              <h3 style="font-size: 1.2rem; color: var(--primary-dark); margin-bottom: 12px; font-family: var(--font-heading);">Exterior</h3>
              <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; color: var(--grey-700); font-size: 0.9rem;">
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Outer Wall:</strong> 2.5" Pre-cast RCC</span></li>
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Inner Wall:</strong> 2" Pre-cast RCC</span></li>
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Roof:</strong> 0.42mm Color sheet</span></li>
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Insulation:</strong> 5mm PE foam</span></li>
              </ul>
            </div>

            <div class="reveal" style="background: var(--off-white); border-radius: 12px; padding: var(--space-6); border-top: 4px solid var(--primary); box-shadow: var(--shadow-sm);">
              <div style="font-size: 2rem; margin-bottom: 12px;">🚪</div>
              <h3 style="font-size: 1.2rem; color: var(--primary-dark); margin-bottom: 12px; font-family: var(--font-heading);">Fittings</h3>
              <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; color: var(--grey-700); font-size: 0.9rem;">
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Main Door:</strong> Steel flash door</span></li>
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Inside Doors:</strong> PVC</span></li>
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Windows:</strong> Glass with MS frame</span></li>
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Grill:</strong> 10mm Square bar</span></li>
              </ul>
            </div>

            <div class="reveal" style="background: var(--off-white); border-radius: 12px; padding: var(--space-6); border-top: 4px solid var(--primary); box-shadow: var(--shadow-sm);">
              <div style="font-size: 2rem; margin-bottom: 12px;">✨</div>
              <h3 style="font-size: 1.2rem; color: var(--primary-dark); margin-bottom: 12px; font-family: var(--font-heading);">Finishes</h3>
              <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; color: var(--grey-700); font-size: 0.9rem;">
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Paint:</strong> Plastic emulsion & Weather coat</span></li>
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Floor:</strong> Ner cement & color</span></li>
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Sanitary:</strong> Star band commode, uPVC fittings</span></li>
                <li style="display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--success); font-weight: bold;">✓</span> <span><strong>Tanks:</strong> 500 ltr water & Safety tank</span></li>
              </ul>
            </div>

          </div>

          <!-- CALL TO ACTION -->
          <div class="section cta-section reveal" aria-labelledby="villa-cta-title" style="border-radius: 16px;">
            <div class="cta-inner" style="padding: 40px 20px;">
              <h2 class="cta-title" id="villa-cta-title" style="font-size: 2rem;">Ready to Build Your Dream Home?</h2>
              <p class="cta-text" style="font-size: 1rem;">Contact us today to schedule a site visit or request a customized quote for Model LCV-{MODEL_NUM}.</p>
              <div class="cta-actions" style="justify-content: center;">
                <a href="contact.html" class="btn btn-white btn-lg">Get Free Quote</a>
                <a href="https://wa.me/8801781636613?text=Hello%2C%20I%20am%20interested%20in%20Model%20LCV-{MODEL_NUM}." class="btn btn-outline btn-lg" target="_blank" rel="noopener noreferrer">💬 WhatsApp Now</a>
              </div>
            </div>
          </div>

        </div><!-- /page-sidebar-content -->
      </div><!-- /page-with-sidebar -->
    </div><!-- /container -->
  </main>"""

for i in range(1, 10):
    model_num = f"10{i}"
    filename = f"lcv-{model_num}.html"
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
        
    pattern = re.compile(r'<main>.*?</main>', re.DOTALL)
    
    # Replace MODEL_NUM placeholder
    new_main = html_template.replace('{MODEL_NUM}', model_num)
    
    new_content = pattern.sub(new_main, content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Updated {filename} to include sidebar layout.")
