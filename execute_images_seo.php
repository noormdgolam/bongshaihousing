<?php
$directory = 'c:\Users\Maria\Documents\WEB\BONGSHAI HOUSING';
$html_files = glob($directory . '\*.html');

foreach ($html_files as $file) {
    $basename = basename($file);
    $content = file_get_contents($file);
    $original_content = $content;

    $image_index = 0;

    $content = preg_replace_callback('/<img([^>]*)>/is', function($matches) use ($directory, &$image_index) {
        $img_attr = $matches[1];
        $is_first_image = ($image_index === 0);
        $image_index++;

        // 1. Title Attribute (from Alt)
        if (stripos($img_attr, 'title=') === false) {
            if (preg_match('/alt=["\'](.*?)["\']/is', $img_attr, $alt_match)) {
                $alt_text = trim($alt_match[1]);
                if (!empty($alt_text)) {
                    $img_attr .= ' title="' . htmlspecialchars($alt_text) . '"';
                }
            }
        }

        // 2. Loading Lazy
        if (!$is_first_image && stripos($img_attr, 'loading=') === false) {
            $img_attr .= ' loading="lazy"';
        }

        // 3. Width & Height (CLS prevention)
        if (stripos($img_attr, 'width=') === false || stripos($img_attr, 'height=') === false) {
            if (preg_match('/src=["\'](.*?)["\']/is', $img_attr, $src_match)) {
                $src = $src_match[1];
                // Resolve relative path
                // e.g. "images/logo.png" or "/images/logo.png"
                $src_clean = ltrim(str_replace('/', '\\', $src), '\\');
                $local_path = $directory . '\\' . $src_clean;
                
                if (file_exists($local_path) && is_file($local_path)) {
                    $size = @getimagesize($local_path);
                    if ($size !== false) {
                        $width = $size[0];
                        $height = $size[1];
                        
                        if (stripos($img_attr, 'width=') === false) {
                            $img_attr .= ' width="' . $width . '"';
                        }
                        if (stripos($img_attr, 'height=') === false) {
                            $img_attr .= ' height="' . $height . '"';
                        }
                    }
                }
            }
        }

        return "<img" . $img_attr . ">";
    }, $content);

    if ($content !== $original_content) {
        file_put_contents($file, $content);
        echo "Optimized images in $basename\n";
    }
}
echo "Image SEO Optimization Complete.\n";
?>
