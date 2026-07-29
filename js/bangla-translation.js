
// ==========================================================================
// Seamless Bilingual Toggle (EN/BN)
// ==========================================================================

const dictionary = {
    'en': {
        'nav_home': 'Home',
        'nav_about': 'About Us',
        'nav_products': 'Products & Solutions',
        'nav_projects': 'Completed Projects',
        'nav_interactive': 'Interactive Tools',
        'nav_contact': 'Contact',
        'quote_btn': 'Get a Quote',
        'hero_title': 'Building Tomorrow, Today.',
        'hero_subtitle': 'Premium Engineering, Procurement, and Construction services across Bangladesh.',
        'tools_title': 'Interactive Tools',
        'tools_subtitle': 'Experience our projects in a whole new dimension with advanced visualization and estimation tools.',
        'testimonials_title': 'Client Success Stories',
        'testimonials_subtitle': 'Hear directly from the families and businesses who trusted us to build their dreams.'
    },
    'bn': {
        'nav_home': 'মূল পাতা',
        'nav_about': 'আমাদের কথা',
        'nav_products': 'পণ্য ও সমাধান',
        'nav_projects': 'সম্পাদিত প্রকল্প',
        'nav_interactive': 'ইন্টারঅ্যাক্টিভ টুলস',
        'nav_contact': 'যোগাযোগ',
        'quote_btn': 'কোটেশন গ্রহণ করুন',
        'hero_title': 'আগামীকালের নির্মাণ, আজই।',
        'hero_subtitle': 'সারা বাংলাদেশে প্রিমিয়াম ইঞ্জিনিয়ারিং, প্রকিউরমেন্ট এবং কনস্ট্রাকশন পরিষেবা।',
        'tools_title': 'ইন্টারঅ্যাক্টিভ টুলস',
        'tools_subtitle': 'উন্নত ভিজ্যুয়ালাইজেশন এবং অনুমানের মাধ্যমে আমাদের প্রকল্পগুলো উপভোগ করুন।',
        'testimonials_title': 'গ্রাহক সাফল্যের গল্প',
        'testimonials_subtitle': 'যারা আমাদের ওপর আস্থা রেখেছেন, তাদের কথা শুনুন।'
    }
};

function switchLanguage(lang) {
    localStorage.setItem('bongshai_lang', lang);
    document.documentElement.lang = lang;
    
    // Update active state on toggle buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if(btn.dataset.lang === lang) {
            btn.classList.add('bg-accent', 'text-primary', 'font-bold');
            btn.classList.remove('text-gray-600');
        } else {
            btn.classList.remove('bg-accent', 'text-primary', 'font-bold');
            btn.classList.add('text-gray-600');
        }
    });

    // Translate elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[lang] && dictionary[lang][key]) {
            el.innerHTML = dictionary[lang][key];
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Bind buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchLanguage(btn.dataset.lang);
        });
    });

    // Init language
    const savedLang = localStorage.getItem('bongshai_lang') || 'en';
    switchLanguage(savedLang);
});
