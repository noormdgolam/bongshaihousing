<?php
$directory = 'c:\Users\Maria\Documents\WEB\BONGSHAI HOUSING';
$html_files = glob($directory . '\*.html');

$utility_pages = ['404.html', 'lcv-109-test.html', 'maintenance.html', 'maintenance_backup.html'];

foreach ($html_files as $file) {
    $basename = basename($file);
    $content = file_get_contents($file);
    $original_content = $content;

    // 1. Inject noindex for utility pages
    if (in_array($basename, $utility_pages)) {
        if (strpos(strtolower($content), 'name="robots" content="noindex"') === false && strpos(strtolower($content), 'content="noindex"') === false) {
            $content = str_ireplace('</head>', "    <meta name=\"robots\" content=\"noindex\">\n</head>", $content);
        }
    }

    // 2. Titles
    if (preg_match('/<title>(.*?)<\/title>/is', $content, $matches)) {
        $title = trim($matches[1]);
        $new_title = $title;
        if (strlen($title) < 30) {
            $suffix = " | Bongshai Housing Bangladesh";
            if (strlen($title) + strlen($suffix) <= 60) {
                $new_title = $title . $suffix;
            } else {
                $new_title = $title . " | Bongshai Housing";
            }
        } elseif (strlen($title) > 60) {
            // Trim to nearest word under 60
            $new_title = preg_replace('/\s+?(\S+)?$/', '', substr($title, 0, 57)) . '...';
        }
        if ($title !== $new_title) {
            $content = preg_replace('/<title>.*?<\/title>/is', "<title>$new_title</title>", $content, 1);
            $title = $new_title; // For OG tags
        }
    } else {
        $title = "Bongshai Housing";
    }

    // 3. Meta Descriptions
    $desc = "";
    $desc_matched = false;
    // Try to match standard description
    if (preg_match('/<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']/is', $content, $matches)) {
        $desc = trim($matches[1]);
        $desc_matched = true;
    } elseif (preg_match('/<meta[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']/is', $content, $matches)) {
        $desc = trim($matches[1]);
        $desc_matched = true;
    }

    if ($desc_matched) {
        $new_desc = $desc;
        if (strlen($desc) < 50) {
            $suffix = " - Bongshai Housing is the leading steel building and prefab housing developer in Bangladesh. Get a quote today!";
            if (strlen($desc) + strlen($suffix) <= 160) {
                $new_desc = $desc . $suffix;
            } else {
                $new_desc = $desc . " - Bongshai Housing Ltd.";
            }
        } elseif (strlen($desc) > 160) {
            $new_desc = preg_replace('/\s+?(\S+)?$/', '', substr($desc, 0, 157)) . '...';
        }

        if ($desc !== $new_desc) {
            // Replace the exact matched content portion safely
            $quoted_desc = preg_quote($desc, '/');
            $content = preg_replace('/(<meta[^>]*description[^>]*content=["\'])' . $quoted_desc . '(["\'])/is', '${1}' . str_replace('$', '\$', $new_desc) . '${2}', $content, 1);
            if ($content === $original_content) {
               // Fallback if regex failed due to some ordering issue
               $content = preg_replace('/(<meta[^>]*content=["\'])' . $quoted_desc . '(["\'][^>]*name=["\']description["\'])/is', '${1}' . str_replace('$', '\$', $new_desc) . '${2}', $content, 1);
            }
            $desc = $new_desc; // For OG tags
        }
    } else {
        $desc = "Bongshai Housing is the leading steel building and prefab housing developer in Bangladesh.";
    }

    // 4. Open Graph Tags
    if (!preg_match('/<meta[^>]*property=["\']og:title["\']/is', $content)) {
        $clean_basename = str_replace('.html', '', $basename);
        $og_tags = "\n    <!-- Open Graph Tags -->\n" .
                   "    <meta property=\"og:title\" content=\"" . htmlspecialchars($title) . "\" />\n" .
                   "    <meta property=\"og:description\" content=\"" . htmlspecialchars($desc) . "\" />\n" .
                   "    <meta property=\"og:type\" content=\"website\" />\n" .
                   "    <meta property=\"og:url\" content=\"https://bongshaihousing.com/" . $basename . "\" />\n" .
                   "    <meta property=\"og:image\" content=\"https://bongshaihousing.com/images/logo.png\" />\n";
        $content = str_ireplace('</head>', $og_tags . '</head>', $content);
    }

    // 5. Image Alt Tags
    $content = preg_replace_callback('/<img([^>]*)>/is', function($matches) use ($basename) {
        $img_attr = $matches[1];
        if (!preg_match('/alt=["\'][^"\']*["\']/is', $img_attr) || preg_match('/alt=["\']\s*["\']/is', $img_attr)) {
            // Missing or empty alt
            $clean_name = ucwords(str_replace(['-', '_'], ' ', str_replace('.html', '', $basename)));
            $alt_text = "Bongshai Housing - " . $clean_name;
            
            if (preg_match('/alt=["\']\s*["\']/is', $img_attr)) {
                // Replace empty alt
                $img_attr = preg_replace('/alt=["\']\s*["\']/is', 'alt="' . $alt_text . '"', $img_attr);
            } else {
                // Add alt attribute
                $img_attr .= ' alt="' . $alt_text . '"';
            }
        }
        return "<img" . $img_attr . ">";
    }, $content);

    // Save changes
    if ($content !== $original_content) {
        file_put_contents($file, $content);
        echo "Updated $basename\n";
    }
}
echo "Massive SEO Update Complete.\n";
?>
