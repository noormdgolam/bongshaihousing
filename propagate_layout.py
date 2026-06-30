import re
import glob

# Read the HTML template from lcv-101.html which has the perfect modern layout
with open('lcv-101.html', 'r', encoding='utf-8') as f:
    lcv_101_content = f.read()

# Extract the <main>...</main> section
main_match = re.search(r'<main>.*?</main>', lcv_101_content, re.DOTALL)
if not main_match:
    print("Could not find main block in lcv-101.html")
    exit(1)

main_template = main_match.group(0)

# We want to replace 'Model LCV-101' and 'LCV-101' with the target model number
for i in range(2, 10):
    model_num = f"10{i}"
    filename = f"lcv-{model_num}.html"
    title = f"Model LCV-{model_num}"
    
    # Replace the text in the main template
    new_main = main_template.replace('Model LCV-101', title)
    new_main = new_main.replace('LCV-101', f"LCV-{model_num}")
    
    # Open the target file
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace its main block
    new_content = re.sub(r'<main>.*?</main>', new_main, content, flags=re.DOTALL)
    
    # Save the file
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print(f"Updated {filename} with the new aligned layout, images, and modern descriptions.")
