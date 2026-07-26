<?php
$html = file_get_contents('index.html');

// Let's find the start of Construction block: `<div class="step-num">03<span class="step-icon">🏗️</span></div>`
// And we want to replace everything from `            <p class="step-text">Expert engineers and skilled workers build your home using premium materials with full quality control oversight.</p>\n          </div>\n          <div class="process-step reveal" style="--i:3">\n            <div class="step-num">04<span class="step-icon">🔑</span></div>\n            <h3 class="step-title">Handover</h3>\n            <p class="step-text">We deliver your completed home on schedule, conduct final inspections, and provide after-sales support.</p>`
// UP TO `<div class="cta-actions">`

// Let's just restore from a clean state. I know index.html was fine before I started breaking it. Is there a backup?
// No. But I can just do a precise preg_replace.

$pattern = '/<div class="process-step reveal" style="--i:2">.*?<div class="cta-actions">/s';

$replacement = <<<HTML
          <div class="process-step reveal" style="--i:2">
            <div class="step-num">03<span class="step-icon">🏗️</span></div>
            <h3 class="step-title">Construction</h3>
            <p class="step-text">Expert engineers and skilled workers build your home using premium materials with full quality control oversight.</p>
          </div>
          <div class="process-step reveal" style="--i:3">
            <div class="step-num">04<span class="step-icon">🔑</span></div>
            <h3 class="step-title">Handover</h3>
            <p class="step-text">We deliver your completed home on schedule, conduct final inspections, and provide after-sales support.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================
         TESTIMONIALS
    ====================================================== -->
    <section class="section testimonials-bg" id="testimonials" aria-labelledby="testimonials-title">
      <div class="container">
        <div class="section-header reveal">
          <div class="section-label" style="color:var(--accent-light)">Client Reviews</div>
          <h2 class="section-title" style="color:var(--white)" id="testimonials-title">What Our Clients Say</h2>
          <p class="section-subtitle" style="color:rgba(255,255,255,0.7)">Real feedback from real homeowners who trusted Bongshai Housing with their dream homes.</p>
        </div>

        <div class="testimonials-grid stagger">
          <div class="testimonial-card reveal" style="--i:0">
            <div class="stars" aria-label="5 star rating">★★★★★</div>
            <div class="quote-icon" aria-hidden="true">"</div>
            <p class="testimonial-text">The luxury modular villas provided by Bongshai Housing for The Wave Resort are stunning. Our guests love the eco-friendly design and premium finishes. Highly recommended for commercial resort projects!</p>
            <div class="testimonial-author">
              <div class="author-avatar" aria-hidden="true">W</div>
              <div>
                <span class="author-name">Resort Management</span>
                <span class="author-role">The Wave Resort</span>
              </div>
            </div>
          </div>
          <div class="testimonial-card reveal" style="--i:1">
            <div class="stars" aria-label="5 star rating">★★★★★</div>
            <div class="quote-icon" aria-hidden="true">"</div>
            <p class="testimonial-text">Bongshai Housing built our container house in Probachol Sector 3 perfectly. It’s modern, durable, and was completed very quickly. Excellent service from start to finish!</p>
            <div class="testimonial-author">
              <div class="author-avatar" aria-hidden="true">P</div>
              <div>
                <span class="author-name">Private Owner</span>
                <span class="author-role">Probachol Sector 3</span>
              </div>
            </div>
          </div>
          <div class="testimonial-card reveal" style="--i:2">
            <div class="stars" aria-label="5 star rating">★★★★★</div>
            <div class="quote-icon" aria-hidden="true">"</div>
            <p class="testimonial-text">We couldn't be happier with our low-cost prefab cottage in Daudkandi, Cumilla. Bongshai Housing gave us a beautiful, sturdy home on a budget. Thank you!</p>
            <div class="testimonial-author">
              <div class="author-avatar" aria-hidden="true">C</div>
              <div>
                <span class="author-name">Happy Homeowner</span>
                <span class="author-role">Daudkandi, Cumilla</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================
         CTA SECTION
    ====================================================== -->
    <section class="section cta-section" id="cta" aria-labelledby="cta-title">
      <div class="container cta-inner">
        <div class="section-label" style="color:rgba(255,255,255,0.8)">Start Today</div>
        <h2 class="cta-title" id="cta-title">Ready to Build Your Dream Home?</h2>
        <p class="cta-text">Get in touch today for a free consultation and customized housing package. Our experts are available Saturday to Thursday, 9 AM – 7 PM.</p>
        <div class="cta-actions">
HTML;

$html = preg_replace($pattern, $replacement, $html);
file_put_contents('index.html', $html);
echo "Fixed index.html\n";
?>
