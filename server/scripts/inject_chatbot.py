import os
import glob

def main():
    chatbot_path = os.path.join('server', 'views', 'partials', 'ai-chat-widget.njk')
    
    with open(chatbot_path, 'r', encoding='utf-8') as f:
        chatbot_html = f.read()

    # Find all HTML files in the root
    html_files = glob.glob('*.html')
    
    injected_count = 0
    for file in html_files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already injected
        if 'id="bhAiChatWidget"' in content:
            continue
            
        # Insert before </body>
        if '</body>' in content:
            new_content = content.replace('</body>', f'\n<!-- INJECTED AI CHATBOT -->\n{chatbot_html}\n</body>')
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            injected_count += 1
            
    print(f"Successfully injected AI Chatbot into {injected_count} files out of {len(html_files)} total.")

if __name__ == '__main__':
    main()
