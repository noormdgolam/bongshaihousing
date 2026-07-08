import os
import re
import csv
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

try:
    from duckduckgo_search import DDGS
except ImportError:
    print("Please install duckduckgo-search: pip install duckduckgo-search")
    exit(1)

# Configuration
QUERIES = [
    '"architecture" "write for us"',
    '"construction blog" "guest post"',
    '"prefab housing" "submit article"',
]
NUM_RESULTS_PER_QUERY = 10
OUTPUT_FILE = 'outreach_targets.csv'

# Email Regex (Basic)
EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'

# Standard User-Agent to avoid immediate blocking
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def extract_emails_from_url(url):
    emails = set()
    try:
        print(f"  Scraping: {url}")
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # Get text from entire page
            text = soup.get_text()
            found_emails = re.findall(EMAIL_REGEX, text)
            for email in found_emails:
                # Filter out common false positives (like .png or .jpg masquerading in regex)
                if not email.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
                    emails.add(email.lower())
                    
            # Also try to find a "Contact" link and scrape that if no emails found
            if not emails:
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if 'contact' in href.lower():
                        if href.startswith('/'):
                            parsed_uri = urlparse(url)
                            base = '{uri.scheme}://{uri.netloc}'.format(uri=parsed_uri)
                            contact_url = base + href
                        elif href.startswith('http'):
                            contact_url = href
                        else:
                            continue
                        
                        try:
                            contact_resp = requests.get(contact_url, headers=HEADERS, timeout=10)
                            if contact_resp.status_code == 200:
                                contact_text = BeautifulSoup(contact_resp.text, 'html.parser').get_text()
                                contact_emails = re.findall(EMAIL_REGEX, contact_text)
                                for em in contact_emails:
                                    if not em.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
                                        emails.add(em.lower())
                        except Exception:
                            pass
                        break # Only try the first contact page we find
    except Exception as e:
        print(f"  [!] Error scraping {url}: {e}")
    return list(emails)

def generate_pitch(domain, emails):
    if not emails:
        return ""
    
    template = f"""Hi Team at {domain},

I was reading your recent posts and love the insight you share on construction and architecture. 

I’m reaching out from Bongshai Housing. We specialize in modern prefabricated and container housing in Bangladesh. I’d love to contribute a high-quality, non-promotional guest article to your blog. 

I have a few topics I think your audience would love:
1. The Environmental Benefits of Upcycling Shipping Containers into Homes
2. How Prefabricated Construction is Solving Rapid Urbanization Challenges

I can provide the full draft, complete with high-quality images. Let me know if this sounds like a good fit!

Best regards,
Bongshai Housing
https://bongshaihousing.com"""
    return template

def main():
    print("=== Starting SEO Prospector ===")
    results = []
    seen_domains = set()

    for query in QUERIES:
        print(f"\nSearching DuckDuckGo for: {query}")
        try:
            results_generator = DDGS().text(query, max_results=NUM_RESULTS_PER_QUERY)
            for result in results_generator:
                url = result.get('href')
                if not url: continue
                domain = urlparse(url).netloc
                if domain in seen_domains:
                    continue
                seen_domains.add(domain)
                
                emails = extract_emails_from_url(url)
                pitch = generate_pitch(domain, emails)
                
                results.append({
                    'Query': query,
                    'URL': url,
                    'Domain': domain,
                    'Emails': ", ".join(emails) if emails else "None Found",
                    'Suggested_Pitch': pitch
                })
                
                time.sleep(1) # Be polite
        except Exception as e:
            print(f"Error during search: {e}")

    # Save to CSV
    if results:
        print(f"\nSaving {len(results)} prospects to {OUTPUT_FILE}...")
        keys = results[0].keys()
        with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(results)
        print("Done!")
    else:
        print("No prospects found.")

if __name__ == "__main__":
    main()
