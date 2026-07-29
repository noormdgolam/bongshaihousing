
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
        'hero_title': 'Premier <span class="highlight">Prefab Building</span><br/>Technology in Bangladesh',
        'hero_subtitle': 'Premium Engineering, Procurement, and Construction services across Bangladesh. Specializing in high-rise buildings and pre-engineered steel structures.',
        'tools_title': 'Interactive Tools',
        'tools_subtitle': 'Experience our projects in a whole new dimension with advanced visualization and estimation tools.',
        'testimonials_title': 'Client Success Stories',
        'testimonials_subtitle': 'Hear directly from the families and businesses who trusted us to build their dreams.',
        'about_title': 'Our Legacy of Excellence',
        'about_desc': 'With over two decades of engineering excellence, Bongshai Housing has transformed the skyline of Bangladesh through innovative, sustainable, and transparent construction practices.',
        'services_title': 'Turnkey Solutions',
        'contact_title': 'Let\'s Build Together',
        'footer_desc': 'The leading EPC and Real Estate developer in Bangladesh, committed to structural integrity and architectural brilliance.'
    },
    'bn': {
        'nav_home': 'মূল পাতা',
        'nav_about': 'আমাদের কথা',
        'nav_products': 'পণ্য ও সমাধান',
        'nav_projects': 'সম্পাদিত প্রকল্প',
        'nav_interactive': 'ইন্টারঅ্যাক্টিভ টুলস',
        'nav_contact': 'যোগাযোগ',
        'quote_btn': 'কোটেশন গ্রহণ করুন',
        'hero_title': 'প্রিমিয়ার <span class="highlight">Prefab Building</span><br/>Technology in Bangladesh',
        'hero_subtitle': 'সারা বাংলাদেশে প্রিমিয়াম ইঞ্জিনিয়ারিং, প্রকিউরমেন্ট এবং কনস্ট্রাকশন (EPC) পরিষেবা। বহুতল ভবন এবং প্রি-ইঞ্জিনিয়ার্ড স্টিল স্ট্রাকচারে আমরা বিশেষায়িত।',
        'tools_title': 'ইন্টারঅ্যাক্টিভ টুলস',
        'tools_subtitle': 'উন্নত ভিজ্যুয়ালাইজেশন এবং ব্যয়ের অনুমানের মাধ্যমে আমাদের প্রকল্পগুলো নতুন মাত্রায় উপভোগ করুন।',
        'testimonials_title': 'গ্রাহক সাফল্যের গল্প',
        'testimonials_subtitle': 'যারা আমাদের ওপর আস্থা রেখেছেন এবং নিজেদের স্বপ্নের ঠিকানা গড়েছেন, তাদের কথা শুনুন।',
        'about_title': 'আমাদের উৎকর্ষতার ঐতিহ্য',
        'about_desc': 'দুই দশকেরও বেশি প্রকৌশলগত উৎকর্ষতার মাধ্যমে বংগশাই হাউজিং তাদের উদ্ভাবনী, টেকসই এবং স্বচ্ছ নির্মাণ অনুশীলনের মাধ্যমে বাংলাদেশের স্কাইলাইন পরিবর্তন করেছে।',
        'services_title': 'টার্নকি সমাধান',
        'contact_title': 'আসুন একসাথে গড়ি',
        'footer_desc': 'বাংলাদেশের শীর্ষস্থানীয় ইপিসি এবং রিয়েল এস্টেট ডেভেলপার, যারা কাঠামোগত অখণ্ডতা এবং স্থাপত্যের চমৎকারিত্বের জন্য প্রতিশ্রুতিবদ্ধ।'
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
