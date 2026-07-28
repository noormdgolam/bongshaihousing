import os
import glob
from pypdf import PdfReader

pdf_dir = r'C:\Users\munna\OneDrive\Desktop\New folder (4)\SEO'
pdfs = glob.glob(os.path.join(pdf_dir, '*.pdf'))

print(f"Reading {len(pdfs)} SEO PDF books...\n")

for p in pdfs:
    fname = os.path.basename(p)
    print(f"==================================================")
    print(f"BOOK: {fname}")
    print(f"==================================================")
    try:
        reader = PdfReader(p)
        print(f"Total pages: {len(reader.pages)}")
        
        # Extract outline or table of contents / first 10 pages summary
        sample_text = ""
        for i in range(min(15, len(reader.pages))):
            text = reader.pages[i].extract_text() or ""
            sample_text += f"\n--- Page {i+1} ---\n" + text[:400]
            
        print("Sample Headings / Excerpt:")
        print(sample_text[:2000])
        print("\n" + "-"*50 + "\n")
    except Exception as e:
        print(f"Error reading {fname}: {e}")
