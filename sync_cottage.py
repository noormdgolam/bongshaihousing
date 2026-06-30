import re

# Read the updated lcv-101 layout
with open('lcv-101.html', 'r', encoding='utf-8') as f:
    lcv_content = f.read()

# Extract the main block
main_match = re.search(r'<main>.*?</main>', lcv_content, re.DOTALL)
if main_match:
    lcv_main = main_match.group(0)
    
    # Replace LCV-101 with Low Cost Cottage inside the main block
    new_cottage_main = lcv_main.replace('Model LCV-101', 'Low Cost Cottage')
    new_cottage_main = new_cottage_main.replace('LCV-101', 'Low Cost Cottage')
    
    # Open low-cost-villa.html
    with open('low-cost-villa.html', 'r', encoding='utf-8') as f:
        cottage_content = f.read()
        
    # Replace its main block
    cottage_content = re.sub(r'<main>.*?</main>', new_cottage_main, cottage_content, flags=re.DOTALL)
    
    # Save the updated low-cost-villa.html
    with open('low-cost-villa.html', 'w', encoding='utf-8') as f:
        f.write(cottage_content)
        
    print("Updated low-cost-villa.html to match the new layout and images.")
else:
    print("Could not find <main> block in lcv-101.html")
