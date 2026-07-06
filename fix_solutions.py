import re

# Read contact.html to use as the base template without sidebar
with open(r"e:\web\Bongshaihousing\contact.html", "r", encoding="utf-8") as f:
    template = f.read()

# Read the current solutions.html to extract the calculators HTML
with open(r"e:\web\Bongshaihousing\solutions.html", "r", encoding="utf-8") as f:
    current_solutions = f.read()

# Extract the calculators content
# Starts at <!-- 1. Hero Title --> and ends at </script>
match = re.search(r'(<!-- 1\. Hero Title -->.*?</script>)', current_solutions, re.DOTALL)
if not match:
    print("Could not find calculators content.")
    exit(1)

calculators_content = match.group(1)

# Now, we take contact.html and replace its main content
# contact.html has <div class="container" style="padding-top: var(--space-12); padding-bottom: var(--space-12);">
# and it ends before </main>
# We will use regex to find the hero section and the container, then replace it.

hero_html = """
    <!-- PAGE HERO -->
    <section class="page-hero" aria-labelledby="solutions-page-title">
      <div class="container page-hero-content">
        <span class="page-hero-label">Interactive Tools</span>
        <h1 class="page-hero-title" id="solutions-page-title">Solutions &amp; Calculators</h1>
        <p class="page-hero-text">Instantly estimate costs, plan your financing, and determine the perfect plot size for your dream pre-fab home in Bangladesh.</p>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="index.html">Home</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Solutions</span>
        </nav>
      </div>
    </section>
"""

# Replace the hero section
template = re.sub(
    r'<!-- PAGE HERO -->.*?</section>', 
    hero_html, 
    template, 
    flags=re.DOTALL
)

# Replace the content container
# Starts with <div class="container" style="padding-top: var(--space-12); padding-bottom: var(--space-12);">
# Ends before </main>
new_content_html = f"""
    <div class="container" style="padding-top: var(--space-8); padding-bottom: var(--space-12);">
        {calculators_content}
    </div>
"""

template = re.sub(
    r'<div class="container" style="padding-top: var\(--space-12\); padding-bottom: var\(--space-12\);">.*?(</main>)',
    new_content_html + r'\n\1',
    template,
    flags=re.DOTALL
)

# Update title
template = template.replace("<title>Contact Bongshai Housing - Real Estate & Developer</title>", "<title>Interactive Solutions & Calculators - Bongshai Housing</title>")
template = template.replace('<a class="mobile-nav-link" href="solutions.html">Solutions</a>\n        <a class="mobile-nav-link" href="contact.html">Contact</a>', '<a class="mobile-nav-link active" href="solutions.html">Solutions</a>\n        <a class="mobile-nav-link" href="contact.html">Contact</a>')
template = template.replace('<a class="nav-link" href="solutions.html">Solutions</a>\n            <a class="nav-link" href="contact.html">Contact</a>', '<a class="nav-link active" href="solutions.html">Solutions</a>\n            <a class="nav-link" href="contact.html">Contact</a>')


with open(r"e:\web\Bongshaihousing\solutions.html", "w", encoding="utf-8") as f:
    f.write(template)

print("Fixed solutions.html layout.")
