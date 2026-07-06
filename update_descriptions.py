import re

file_path = r"e:\web\Bongshaihousing\duplex-villa.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

descriptions = [
    "Experience elite suburban living with our signature duplex. Designed for optimal cross-ventilation, this model brings unparalleled comfort and prestige to your family.",
    "A luxurious sanctuary for the modern Bangladeshi joint family. Featuring expansive balconies and a layout that perfectly balances privacy with togetherness.",
    "Elevate your lifestyle with this contemporary duplex. Its robust, weather-resistant build and elegant exterior make it a standout choice for elite urban living.",
    "Perfect for growing families, this spacious duplex blends traditional charm with modern amenities, offering a serene escape from the bustling city life.",
    "Discover unparalleled elegance. This duplex maximizes natural light and space, ensuring a cool, airy environment year-round in Bangladesh's tropical climate.",
    "A masterpiece of modern architecture tailored for premium residential plots. Enjoy sweeping views, dedicated family spaces, and uncompromising build quality.",
    "Designed for those who demand the best. This model features robust earthquake-resistant construction with a touch of luxury, ideal for city fringes or countryside estates.",
    "Experience the pinnacle of comfort. With smartly designed interiors and lush landscaped integration, this duplex is your perfect family haven.",
    "A stunning blend of aesthetics and functionality. This model offers an expansive living area that caters perfectly to traditional Bangladeshi hospitality and gatherings.",
    "Embrace a life of luxury and tranquility. Thoughtfully designed to provide shade and breeze, this duplex is the ultimate prestige retreat for your loved ones.",
    "Sophisticated and secure, this duplex is crafted for the discerning homeowner. Its premium imported finishes reflect true prestige and timeless elegance.",
    "A visionary design that redefines upscale living in Bangladesh. Perfect for large families, offering generous space and a seamless connection to outdoor gardens.",
    "The crown jewel of our duplex collection. Unmatched in grandeur and tailored specifically to withstand local weather while offering world-class luxury."
]

def replacer(match):
    if not hasattr(replacer, "count"):
        replacer.count = 0
    desc = descriptions[replacer.count % len(descriptions)]
    replacer.count += 1
    return f'<p class="property-desc">{desc}</p>'

# The exact string to replace
target_text = r'<p class="property-desc">Premium duplex living with exceptional design and beautifully landscaped surroundings\.</p>'

content = re.sub(target_text, replacer, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated descriptions in duplex-villa.html.")
