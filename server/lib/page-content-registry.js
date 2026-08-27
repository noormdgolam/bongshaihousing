/**
 * Page Content Registry
 * Defines the structured, editable JSON fields for static marketing pages.
 * 
 * Each route URL mapped here can be edited in the /admin/pages UI.
 */

module.exports = {
  '/about.html': [
    { key: 'hero_title', label: 'Hero Title (HTML)', type: 'text' },
    { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'trust_paragraph', label: 'Trust Signal Paragraph (HTML)', type: 'textarea' },
    { key: 'story_p1', label: 'Our Story Paragraph 1 (HTML)', type: 'textarea' },
    { key: 'story_p2', label: 'Our Story Paragraph 2', type: 'textarea' },
    { key: 'story_p3', label: 'Our Story Paragraph 3', type: 'textarea' },
    { key: 'mission_text', label: 'Mission Text', type: 'textarea' },
    { key: 'vision_text', label: 'Vision Text', type: 'textarea' }
  ],
  '/steel-building-dhaka.html': [
    { key: 'hero_badge', label: 'Hero Badge', type: 'text' },
    { key: 'hero_title', label: 'Hero Title (HTML)', type: 'text' },
    { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'about_p1', label: 'Who We Are Paragraph 1 (HTML)', type: 'textarea' },
    { key: 'about_p2', label: 'Who We Are Paragraph 2', type: 'textarea' }
  ]
};
