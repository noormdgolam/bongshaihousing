# 📋 Logged Technical Exceptions Report

This report documents every permitted technical exception where Latin/English characters remain in the codebase. As per the zero-tolerance specification, all visible user-facing text is 100% Bangla, while structural HTML/technical attributes remain in Latin script to preserve site navigation and browser standards.

---

## Permitted Technical Exception Categories

| Category | Description | Example in Code | Justification |
| :--- | :--- | :--- | :--- |
| **1. HTML Element ID Attributes** | CSS/JS target identifiers | `id="mainNav"`, `id="about-title"` | Required by CSS selectors and JavaScript DOM manipulation scripts. |
| **2. CSS Class Names** | Utility and layout classes | `class="hero-title"`, `class="btn-primary"` | Defined in `css/style.css` stylesheet rules. |
| **3. Hyperlink Destinations (`href`)** | Internal and external URLs | `href="index.html"`, `href="about.html"` | File path routing for web browser navigation. |
| **4. Image Source Paths (`src`)** | Local file paths for media | `src="images/hero-bg.png"` | File system paths for rendering image assets. |
| **5. Telephone Protocol URLs** | Dialing action links | `href="tel:+8801781636613"` | Operating system protocol handler for phone calls. Visible text rendered as `০১৭৮১-৬৩৬৬১৩`. |
| **6. Mailto Protocol URLs** | Email action links | `href="mailto:sales@bongshai.com"` | Operating system protocol handler for email. |
| **7. Structural Meta Attributes** | Technical SEO metadata | `<meta charset="UTF-8">`, `name="viewport"` | Web browser rendering and character encoding standards. |

---

## Verification
- **User-Facing Visible Text:** 0 Latin script exceptions. (100% Pure Bangla).
- **In-Browser Meta Titles & Alt Tags:** 100% Pure Bangla.
- **Technical Backend Attributes:** Preserved for functionality as logged above.
