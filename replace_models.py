import re

def replace_models():
    target_files = [
        'index.html',
        'steel-building-gazipur.html',
        'steel-building-dhaka.html',
        'steel-building-chotrogram.html',
        'prefab-housing-cumilla.html',
        'prefab-cottage-bogra-rangpur.html'
    ]
    
    new_html = """<div class="properties-grid stagger">

          <!-- Duplex Villa -->
          <article class="property-card reveal" data-tilt data-aos="fade-up" style="--i:0" aria-labelledby="villa-title">
            <div class="property-img-wrap">
              <img src="images/projects/completed/razabari_gazipur_1784362716498.webp" alt="Duplex Villa by Bongshai Housing" loading="lazy" title="Duplex Villa by Bongshai Housing" width="1024" height="1024">
              <div class="property-badge-top">
                <span class="badge badge-gold">Premium Living</span>
              </div>
            </div>
            <div class="property-card-body" data-tilt data-aos="fade-up">
              <span class="property-type">Duplex Villa</span>
              <h3 class="property-name" id="villa-title">Duplex Villa (950x2 Sq.Ft)</h3>
              <p class="property-desc">High-end, factory-built duplex residences with premium materials, smart technology, and sophisticated designs.</p>
              <div class="property-specs" aria-label="Property specifications">
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🛏️</span> 6 Bedrooms</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🚿</span> 4 Bathrooms</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🏠</span> Smart Design</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🌿</span> Open Balcony</div>
              </div>
              <a href="duplex-villa.html" class="btn btn-primary" style="width:100%;justify-content:center;">View Package Details</a>
            </div>
          </article>

          <!-- Wooden Retreat -->
          <article class="property-card reveal" data-tilt data-aos="fade-up" style="--i:1" aria-labelledby="wooden-title">
            <div class="property-img-wrap">
              <img src="images/projects/completed/daudkandi_cumilla_1784362527182.webp" alt="Wooden Retreat by Bongshai Housing" loading="lazy" title="Wooden Retreat by Bongshai Housing" width="1024" height="1024">
              <div class="property-badge-top">
                <span class="badge badge-green">Most Popular</span>
              </div>
            </div>
            <div class="property-card-body" data-tilt data-aos="fade-up">
              <span class="property-type">Eco-Cottage</span>
              <h3 class="property-name" id="wooden-title">Wooden Retreat (1200 Sq.Ft)</h3>
              <p class="property-desc">Durable and aesthetic wooden retreat, designed for eco-friendly living with significantly reduced labor and material waste.</p>
              <div class="property-specs" aria-label="Property specifications">
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🛏️</span> 3 Bedrooms</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🚿</span> 2 Bathrooms</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🍳</span> Kitchen</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🌿</span> Open Deck</div>
              </div>
              <a href="wooden-house.html" class="btn btn-primary" style="width:100%;justify-content:center;">View Package Details</a>
            </div>
          </article>

          <!-- Container House -->
          <article class="property-card reveal" data-tilt data-aos="fade-up" style="--i:2" aria-labelledby="container-title">
            <div class="property-img-wrap">
              <img src="images/projects/completed/vanga_faridpur.webp" alt="Container House by Bongshai Housing" loading="lazy" title="Container House by Bongshai Housing" width="707" height="457">
              <div class="property-badge-top">
                <span class="badge badge-navy">Modular Housing</span>
              </div>
            </div>
            <div class="property-card-body" data-tilt data-aos="fade-up">
              <span class="property-type">Container Build</span>
              <h3 class="property-name" id="container-title">40ft Container House</h3>
              <p class="property-desc">Highly flexible and mobile living solution combining steel and comfort for maximum efficiency and cost-effectiveness.</p>
              <div class="property-specs" aria-label="Property specifications">
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🛏️</span> 1 Bedroom</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🚿</span> 1 Bathroom</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🍳</span> Kitchenette</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🏗️</span> Expandable</div>
              </div>
              <a href="container-house.html" class="btn btn-primary" style="width:100%;justify-content:center;">View Package Details</a>
            </div>
          </article>

        </div>"""

    # Regex to find <div class="properties-grid stagger"> ... </div>
    pattern = re.compile(r'<div class="properties-grid stagger">.*?</div>\s*</div>\s*</section>', re.IGNORECASE | re.DOTALL)
    
    # Wait, the closing tags are:
    # </div>
    # </div>
    # </section>
    
    pattern = re.compile(r'<div class="properties-grid stagger">.*?        </div>\s*</div>\s*</section>', re.IGNORECASE | re.DOTALL)

    replaced = 0
    for file in target_files:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # The exact replacement
            new_content = pattern.sub(new_html + '\n      </div>\n    </section>', content)
            
            if new_content != content:
                with open(file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                replaced += 1
                print(f"Replaced models in {file}")
            else:
                print(f"Pattern not found in {file}")
        except FileNotFoundError:
            print(f"File not found: {file}")
            
    print(f"Replaced models in {replaced} files.")

if __name__ == '__main__':
    replace_models()
