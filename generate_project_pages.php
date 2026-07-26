<?php

$projects_file = 'projects.html';
$content = file_get_contents($projects_file);

$pattern = '/<article class="property-card(.*?)>(.*?)<\/article>/is';
preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

$new_pages = [];
$updated_content = $content;

function slugify($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return empty($text) ? 'project' : $text;
}

$header_pattern = '/^(.*?)<main>/is';
preg_match($header_pattern, $content, $header_match);
$header = $header_match[1];

$header = preg_replace('/<title>.*?<\/title>/is', '<title>{{TITLE}} | Bongshai Housing</title>', $header);
$header = preg_replace('/<link rel="canonical" href=".*?" \/>/is', '<link rel="canonical" href="https://bongshaihousing.com/{{SLUG}}.html" />', $header);

$footer_pattern = '/<\/main>(.*?)$/is';
preg_match($footer_pattern, $content, $footer_match);
$footer = $footer_match[1];

foreach ($matches as $match) {
    $article_full = $match[0];
    $article_inner = $match[2];
    
    preg_match('/<img[^>]+src="([^"]+)"/is', $article_inner, $img_src_match);
    preg_match('/<img[^>]+alt="([^"]+)"/is', $article_inner, $img_alt_match);
    preg_match('/<img[^>]+title="([^"]+)"/is', $article_inner, $img_title_match);
    
    $img_src = $img_src_match[1] ?? '';
    $img_alt = $img_alt_match[1] ?? '';
    $img_title = $img_title_match[1] ?? '';
    
    preg_match('/<h3 class="property-name">([^<]+)<\/h3>/is', $article_inner, $title_match);
    $title = trim($title_match[1] ?? '');
    
    preg_match('/<p class="property-desc">(.*?)<\/p>/is', $article_inner, $desc_match);
    $desc = trim($desc_match[1] ?? '');
    
    if (empty($title)) continue;
    
    $slug = slugify($title);
    $filename = "project-{$slug}.html";
    
    $new_card_body_addition = "\n              <a href=\"{$filename}\" class=\"btn btn-primary\" style=\"margin-top: 15px; padding: 8px 16px; display: inline-block; text-align: center; width: 100%; border-radius: 8px;\">View Details</a>";
    
    $modified_article = preg_replace('/(<\/p>)\s*(<\/div>)/is', "$1" . $new_card_body_addition . "\n            $2", $article_full);
    
    $updated_content = str_replace($article_full, $modified_article, $updated_content);
    
    $page_header = str_replace(['{{TITLE}}', '{{SLUG}}'], [$title, 'project-' . $slug], $header);
    
    $main_content = "
<main>
    <section class=\"page-hero\" aria-labelledby=\"page-title\">
      <div class=\"container page-hero-content\">
        <h1 class=\"page-hero-title\" id=\"page-title\">{$title}</h1>
        <nav class=\"breadcrumb\" aria-label=\"Breadcrumb\">
          <a href=\"index.html\">Home</a>
          <span aria-hidden=\"true\">/</span>
          <a href=\"projects.html\">Projects</a>
          <span aria-hidden=\"true\">/</span>
          <span aria-current=\"page\">{$title}</span>
        </nav>
      </div>
    </section>

    <section class=\"section\">
      <div class=\"container\">
        <div style=\"display: flex; flex-wrap: wrap; gap: var(--space-6); align-items: flex-start;\">
            <div style=\"flex: 1 1 500px; background: white; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-md); border: 1px solid var(--grey-100);\">
                <img src=\"{$img_src}\" alt=\"{$img_alt}\" title=\"{$img_title}\" style=\"width: 100%; height: auto; display: block;\">
            </div>
            <div style=\"flex: 1 1 400px; background: white; padding: var(--space-6); border-radius: 16px; box-shadow: var(--shadow-sm); border: 1px solid var(--grey-100);\">
                <span class=\"property-type\" style=\"display: inline-block; background: rgba(212, 175, 55, 0.15); color: var(--accent-dark); padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; margin-bottom: 16px;\">Completed Project</span>
                <h2 style=\"font-family: var(--font-heading); font-size: 2rem; color: var(--primary); margin-bottom: var(--space-4);\">{$title}</h2>
                <div style=\"color: var(--grey-700); font-size: 1rem; line-height: 1.6; margin-bottom: var(--space-6);\">
                    <p>{$desc}</p>
                </div>
                <div style=\"display: flex; flex-direction: column; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--grey-100);\">
                    <a href=\"contact.html\" class=\"btn btn-primary btn-lg\" style=\"width: 100%; justify-content: center;\">Request Similar Project</a>
                    <a href=\"https://wa.me/8801781636613\" target=\"_blank\" class=\"btn btn-lg\" style=\"width: 100%; justify-content: center; background: #25D366; color: white; border: none; font-weight: 700;\">💬 Discuss on WhatsApp</a>
                </div>
            </div>
        </div>
      </div>
    </section>
</main>
";
    
    $full_page_html = $page_header . $main_content . $footer;
    file_put_contents($filename, $full_page_html);
    echo "Created {$filename}\n";
}

file_put_contents($projects_file, $updated_content);
echo "Updated {$projects_file}\n";

?>
