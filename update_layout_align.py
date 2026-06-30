import re

html_template = """<main>
    <!-- PAGE HERO -->
    <section class="page-hero" style="min-height: 30vh; padding: 100px 0 50px;">
      <div class="container page-hero-content" style="text-align: center;">
        <span class="page-hero-label">Premium Prefab Housing</span>
        <h1 class="page-hero-title">{TITLE}</h1>
        <p class="page-hero-text" style="max-width: 800px; margin: 0 auto 24px;">Durable, affordable, and beautifully designed prefab homes. The smart housing choice for Bangladesh.</p>
        <nav class="breadcrumb" style="justify-content: center;">
          <a href="index.html">Home</a> <span aria-hidden="true">/</span> <a href="properties.html">Properties</a> <span aria-hidden="true">/</span> <span aria-current="page">{TITLE}</span>
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
            <div class="cat-sidebar-cta">
              <a href="contact.html">📞 Get a Free Quote</a>
            </div>
          </div>
        </aside>

        <div class="page-sidebar-content">
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-8); align-items: start;">
            
            <!-- LEFT COLUMN: IMAGES (House + Layout) -->
            <div style="display: flex; flex-direction: column; gap: var(--space-6);" class="reveal-left">
              <!-- House Image -->
              <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-md); border: 1px solid var(--grey-100);">
                 <img src="images/cottage-exterior.png" alt="{TITLE} Exterior View" style="width: 100%; display: block;" />
              </div>
              
              <!-- Layout Image -->
              <div style="background: white; padding: 20px; border-radius: 16px; box-shadow: var(--shadow-md); border: 1px solid var(--grey-100); text-align: center;">
                 <h3 style="font-family: var(--font-heading); color: var(--primary); margin-bottom: 16px; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 1px;">Floor Plan Layout</h3>
                 <img src="images/cottage-plan.png" alt="Floor Plan" style="width: 100%; border-radius: 8px; border: 2px solid var(--off-white);" />
              </div>
            </div>

            <!-- RIGHT COLUMN: DESCRIPTIONS & SPECS -->
            <div style="display: flex; flex-direction: column; gap: var(--space-6);" class="reveal-right">
              
              <!-- Core Info & CTA -->
              <div style="background: white; padding: var(--space-6); border-radius: 16px; box-shadow: var(--shadow-xl); border: 1px solid var(--primary-light);">
                <div style="display: inline-block; background: rgba(212, 175, 55, 0.15); color: var(--accent-dark); padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; margin-bottom: 16px;">MOST POPULAR</div>
                <h2 style="font-family: var(--font-heading); font-size: 2.2rem; color: var(--primary); margin-bottom: var(--space-2); line-height: 1.1;">{TITLE}</h2>
                <p style="color: var(--grey-600); font-size: 0.95rem; margin-bottom: var(--space-6);">A perfect blend of affordability, durability, and modern design. Ready for immediate assembly.</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: var(--space-6);">
                  <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--off-white); border-radius: 8px;">
                    <span style="font-size: 1.2rem;">📐</span>
                    <div><div style="font-size: 0.7rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700;">Floor Area</div><div style="font-weight: 700; color: var(--grey-900); font-size: 0.95rem;">440 sft</div></div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--off-white); border-radius: 8px;">
                    <span style="font-size: 1.2rem;">🛏️</span>
                    <div><div style="font-size: 0.7rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700;">Bedrooms</div><div style="font-weight: 700; color: var(--grey-900); font-size: 0.95rem;">2 Rooms</div></div>
                  </div>
                </div>

                <a href="contact.html" class="btn btn-primary btn-lg" style="width: 100%; justify-content: center; margin-bottom: 12px;">Get a Free Quote</a>
                <a href="https://wa.me/8801781636613?text=Hello%2C%20I%20am%20interested%20in%20{TITLE}." target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-lg" style="width: 100%; justify-content: center; background: white;">💬 WhatsApp Now</a>
              </div>

              <!-- Floor Description (Space Allocation) -->
              <div style="background: white; padding: var(--space-6); border-radius: 16px; box-shadow: var(--shadow-sm); border: 1px solid var(--grey-100);">
                <h3 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--primary-dark); margin-bottom: 20px; border-bottom: 2px solid var(--off-white); padding-bottom: 12px;">Floor Description</h3>
                <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.95rem;">
                  <div style="display: flex; justify-content: space-between;"><span style="color: var(--grey-600);"><span style="color:var(--accent);margin-right:8px">▪</span>Bed Room 01</span><span style="font-weight: 700; color: var(--grey-900);">10 ft × 11 ft</span></div>
                  <div style="display: flex; justify-content: space-between;"><span style="color: var(--grey-600);"><span style="color:var(--accent);margin-right:8px">▪</span>Bed Room 02</span><span style="font-weight: 700; color: var(--grey-900);">10 ft × 9 ft</span></div>
                  <div style="display: flex; justify-content: space-between;"><span style="color: var(--grey-600);"><span style="color:var(--accent);margin-right:8px">▪</span>Dining Room</span><span style="font-weight: 700; color: var(--grey-900);">Included</span></div>
                  <div style="display: flex; justify-content: space-between;"><span style="color: var(--grey-600);"><span style="color:var(--accent);margin-right:8px">▪</span>Kitchen</span><span style="font-weight: 700; color: var(--grey-900);">Included</span></div>
                  <div style="display: flex; justify-content: space-between;"><span style="color: var(--grey-600);"><span style="color:var(--accent);margin-right:8px">▪</span>Toilet</span><span style="font-weight: 700; color: var(--grey-900);">Included</span></div>
                  <div style="display: flex; justify-content: space-between;"><span style="color: var(--grey-600);"><span style="color:var(--accent);margin-right:8px">▪</span>Veranda</span><span style="font-weight: 700; color: var(--grey-900);">Included</span></div>
                </div>
              </div>

              <!-- Modern Material Description -->
              <div style="background: white; padding: var(--space-6); border-radius: 16px; box-shadow: var(--shadow-sm); border: 1px solid var(--grey-100);">
                <h3 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--primary-dark); margin-bottom: 20px; border-bottom: 2px solid var(--off-white); padding-bottom: 12px;">Material Description</h3>
                
                <div style="display: flex; flex-direction: column; gap: 20px;">
                  
                  <!-- Group 1 -->
                  <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                      <div style="background: var(--off-white); color: var(--primary); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">🏗️</div>
                      <h4 style="margin: 0; font-size: 1.1rem; color: var(--grey-900);">Structure & Foundation</h4>
                    </div>
                    <div style="background: #f8fafc; border-radius: 8px; padding: 12px; font-size: 0.9rem; color: var(--grey-700); line-height: 1.6;">
                      <strong>Footing & Tie Beam:</strong> Pre-cast RCC <br>
                      <strong>Main Structure:</strong> Premium Prefab steel
                    </div>
                  </div>

                  <!-- Group 2 -->
                  <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                      <div style="background: var(--off-white); color: var(--primary); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">🧱</div>
                      <h4 style="margin: 0; font-size: 1.1rem; color: var(--grey-900);">Exterior & Roof</h4>
                    </div>
                    <div style="background: #f8fafc; border-radius: 8px; padding: 12px; font-size: 0.9rem; color: var(--grey-700); line-height: 1.6;">
                      <strong>Walls:</strong> 2.5" Pre-cast RCC (Outer), 2" Pre-cast RCC (Inner) <br>
                      <strong>Roof:</strong> 0.42mm Color sheet with 5mm PE foam insulation
                    </div>
                  </div>

                  <!-- Group 3 -->
                  <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                      <div style="background: var(--off-white); color: var(--primary); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">✨</div>
                      <h4 style="margin: 0; font-size: 1.1rem; color: var(--grey-900);">Fittings & Finishes</h4>
                    </div>
                    <div style="background: #f8fafc; border-radius: 8px; padding: 12px; font-size: 0.9rem; color: var(--grey-700); line-height: 1.6;">
                      <strong>Doors:</strong> Steel flash (Main), PVC (Internal) <br>
                      <strong>Windows:</strong> Glass with MS frame & 10mm grill <br>
                      <strong>Paint:</strong> Plastic emulsion (Indoor), Weather coat (Outdoor) <br>
                      <strong>Sanitary:</strong> Star band commode, uPVC fittings, 500L Tank
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div><!-- /page-sidebar-content -->
      </div><!-- /page-with-sidebar -->
    </div><!-- /container -->
  </main>"""

pages_to_update = [
    ('lcv-101.html', 'Model LCV-101'),
    ('low-cost-villa.html', 'Low Cost Cottage')
]

for filename, title in pages_to_update:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
        
    pattern = re.compile(r'<main>.*?</main>', re.DOTALL)
    
    new_main = html_template.replace('{TITLE}', title)
    
    new_content = pattern.sub(new_main, content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Updated {filename} with new aligned layout and modern material description.")
