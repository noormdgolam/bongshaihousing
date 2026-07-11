import os
import glob

ADVANTAGES_HTML = """
    <!-- ======================================================
         ADVANTAGES OF STEEL-RC BUILDING
    ====================================================== -->
    <section class="section process-bg" id="advantages" aria-labelledby="advantages-title">
      <div class="container">
        <div class="section-header reveal">
          <div class="section-label">Our Technology</div>
          <h2 class="section-title" id="advantages-title">Advantage of Steel-RC Building</h2>
          <p class="section-subtitle">Discover the benefits of our advanced steel-reinforced concrete building technology.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-4); max-width: 900px; margin: 0 auto;" class="reveal">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> Cost-effective and Eco-friendly</li>
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> High strength, inflexibility and high load bearing capacity</li>
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> Pre-fabricated, easy to install and dismantle</li>
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> Lightness, easy to transport and re-located</li>
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> Low maintenance cost</li>
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> Using several times and recycling</li>
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> Increase area efficiency by 10%--20%</li>
          </ul>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> Environment friendly</li>
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> Water-proof and fire-proof</li>
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> Have good earthquake-resistance - 8 grade</li>
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> Wind resistant – 250 km/h</li>
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> Energy saving with good thermal insulation system</li>
            <li style="margin-bottom: var(--space-3); display: flex; align-items: flex-start; gap: var(--space-2);"><span style="color:var(--primary);">✔️</span> 50~60 years’ life span</li>
          </ul>
        </div>
      </div>
    </section>
"""

# Products to modify
PRODUCT_FILES = [
    "lcv-101.html", "lcv-102.html", "lcv-103.html", "lcv-104.html", "lcv-105.html", "lcv-106.html", "lcv-107.html", "lcv-108.html", "lcv-109.html",
    "dv-101.html", "dv-102.html", "dv-103.html", "dv-104.html", "dv-105.html", "dv-106.html", "dv-107.html", "dv-108.html", "dv-109.html", "dv-110.html", "dv-111.html", "dv-112.html", "dv-113.html",
    "container-house.html", "steel-house.html", "two-story-building.html", "single-story-building.html", "industrial-sheds.html", "worker-accommodation.html", "site-offices.html", "security-kiosks.html", "guard-house.html", "gatehouses.html", "security-huts.html", "modular-kiosks.html", "prefabricated-booths.html", "bullet-resistant-guard-booths.html", "portable-toilets-and-showers.html", "cottage-house.html", "tiny-house.html", "low-cost-villa.html", "luxury-villa.html", "multi-story-homes.html", "other-residential.html"
]

base_dir = r"e:\web\Bongshaihousing"

for filename in PRODUCT_FILES:
    filepath = os.path.join(base_dir, filename)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Don't add if already exists
        if "ADVANTAGES OF STEEL-RC BUILDING" in content:
            continue
            
        # We find </main> and insert just before it
        if "</main>" in content:
            content = content.replace("</main>", ADVANTAGES_HTML + "\n</main>")
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated {filename}")
        else:
            print(f"Skipped {filename} - No </main> tag found")

print("Done updating product pages.")
