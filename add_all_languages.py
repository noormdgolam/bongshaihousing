import os
import glob
import re

languages = {
    'af': 'Afrikaans', 'sq': 'Albanian', 'am': 'Amharic', 'ar': 'Arabic', 'hy': 'Armenian', 'az': 'Azerbaijani',
    'eu': 'Basque', 'be': 'Belarusian', 'bn': 'Bengali', 'bs': 'Bosnian', 'bg': 'Bulgarian', 'ca': 'Catalan',
    'ceb': 'Cebuano', 'ny': 'Chichewa', 'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
    'co': 'Corsican', 'hr': 'Croatian', 'cs': 'Czech', 'da': 'Danish', 'nl': 'Dutch', 'en': 'English',
    'eo': 'Esperanto', 'et': 'Estonian', 'tl': 'Filipino', 'fi': 'Finnish', 'fr': 'French', 'fy': 'Frisian',
    'gl': 'Galician', 'ka': 'Georgian', 'de': 'German', 'el': 'Greek', 'gu': 'Gujarati', 'ht': 'Haitian Creole',
    'ha': 'Hausa', 'haw': 'Hawaiian', 'iw': 'Hebrew', 'hi': 'Hindi', 'hmn': 'Hmong', 'hu': 'Hungarian',
    'is': 'Icelandic', 'ig': 'Igbo', 'id': 'Indonesian', 'ga': 'Irish', 'it': 'Italian', 'ja': 'Japanese',
    'jw': 'Javanese', 'kn': 'Kannada', 'kk': 'Kazakh', 'km': 'Khmer', 'rw': 'Kinyarwanda', 'ko': 'Korean',
    'ku': 'Kurdish (Kurmanji)', 'ky': 'Kyrgyz', 'lo': 'Lao', 'la': 'Latin', 'lv': 'Latvian', 'lt': 'Lithuanian',
    'lb': 'Luxembourgish', 'mk': 'Macedonian', 'mg': 'Malagasy', 'ms': 'Malay', 'ml': 'Malayalam', 'mt': 'Maltese',
    'mi': 'Maori', 'mr': 'Marathi', 'mn': 'Mongolian', 'my': 'Myanmar (Burmese)', 'ne': 'Nepali', 'no': 'Norwegian',
    'or': 'Odia (Oriya)', 'ps': 'Pashto', 'fa': 'Persian', 'pl': 'Polish', 'pt': 'Portuguese', 'pa': 'Punjabi',
    'ro': 'Romanian', 'ru': 'Russian', 'sm': 'Samoan', 'gd': 'Scots Gaelic', 'sr': 'Serbian', 'st': 'Sesotho',
    'sn': 'Shona', 'sd': 'Sindhi', 'si': 'Sinhala', 'sk': 'Slovak', 'sl': 'Slovenian', 'so': 'Somali', 'es': 'Spanish',
    'su': 'Sundanese', 'sw': 'Swahili', 'sv': 'Swedish', 'tg': 'Tajik', 'ta': 'Tamil', 'tt': 'Tatar', 'te': 'Telugu',
    'th': 'Thai', 'tr': 'Turkish', 'tk': 'Turkmen', 'uk': 'Ukrainian', 'ur': 'Urdu', 'ug': 'Uyghur', 'uz': 'Uzbek',
    'vi': 'Vietnamese', 'cy': 'Welsh', 'xh': 'Xhosa', 'yi': 'Yiddish', 'yo': 'Yoruba', 'zu': 'Zulu'
}

desktop_links = []
mobile_links = []

for code, name in languages.items():
    desktop_links.append(f'<a href="javascript:void(0);" onclick="changeLanguage(\'{code}\')" class="dropdown-item" style="padding:var(--space-2) var(--space-3); font-size:var(--fs-sm);">{name}</a>')
    mobile_links.append(f'<a href="javascript:void(0);" onclick="changeLanguage(\'{code}\')" class="mobile-sub-link" style="padding:var(--space-2) var(--space-4);">{name}</a>')

desktop_html_inner = "\\n            ".join(desktop_links)
mobile_html_inner = "\\n          ".join(mobile_links)

# Also need to update the updateLangBtnText JS array
js_langNames = "var langNames = {\\n        "
js_items = []
for code, name in languages.items():
    # remove single quotes from names if any
    safe_name = name.replace("'", "\\'")
    js_items.append(f"'{code}': '{safe_name}'")
js_langNames += ", ".join(js_items)
js_langNames += "\\n      };"

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update the desktop dropdown content
    # We replace the content inside <div class="dropdown-content" ...> </div>
    content = re.sub(
        r'(<div class="dropdown-content" style="display:none; position:absolute; right:0; top:100%; background:#fff; min-width:150px; box-shadow:var(--shadow-lg); border-radius:var(--radius-md); padding:var(--space-2); z-index:100; margin-top:8px;">).*?(</div>)',
        f'\\1\\n            {desktop_html_inner}\\n          \\2',
        content,
        flags=re.DOTALL
    )

    # 2. Add max-height and overflow-y to desktop dropdown-content to make it scrollable
    content = content.replace(
        'min-width:150px; box-shadow:var(--shadow-lg); border-radius:var(--radius-md); padding:var(--space-2); z-index:100; margin-top:8px;"',
        'min-width:150px; box-shadow:var(--shadow-lg); border-radius:var(--radius-md); padding:var(--space-2); z-index:100; margin-top:8px; max-height:400px; overflow-y:auto;"'
    )

    # 3. Update the mobile dropdown content
    content = re.sub(
        r'(<div style="display:none; background:var(--grey-50); border-radius:var(--radius-md); margin-top:4px; padding:var(--space-2) 0;">).*?(</div>)',
        f'\\1\\n          {mobile_html_inner}\\n        \\2',
        content,
        flags=re.DOTALL
    )
    
    # 4. Add max-height and overflow-y to mobile dropdown
    content = content.replace(
        '<div style="display:none; background:var(--grey-50); border-radius:var(--radius-md); margin-top:4px; padding:var(--space-2) 0;">',
        '<div style="display:none; background:var(--grey-50); border-radius:var(--radius-md); margin-top:4px; padding:var(--space-2) 0; max-height:300px; overflow-y:auto;">'
    )

    # 5. Remove includedLanguages parameter from google_translate_element config
    content = re.sub(r'includedLanguages:\s*\'[^\']+\',\s*', '', content)

    # 6. Update updateLangBtnText dictionary
    content = re.sub(
        r'var langNames = \{.*?\};',
        js_langNames,
        content,
        flags=re.DOTALL
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("All languages added successfully.")
