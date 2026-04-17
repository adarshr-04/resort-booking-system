import os
import re

directory = r"C:\Users\Adarsh\Desktop\resort-proj"

# The mappings from old to new. 
# We order them from most specific to least specific so we don't accidentally trample.
replacements = [
    # General strings
    (r"Pristine Woods\'s Palace Madikeri", "Coorg Pristine Woods"),
    (r"Coorg Pristine Woods", "Coorg Pristine Woods"),
    (r"Pristine Woods\'s Palace", "Coorg Pristine Woods"),
    (r"Coorg Pristine Woods", "Coorg Pristine Woods"),
    
    # Just Pristine Woods
    (r"Pristine Woods\'s", "Pristine Woods"),
    (r"Pristine Woods", "Pristine Woods"),
    (r"Pristine Woods", "Pristine Woods"),
    
    # Just Pristine Woods
    (r"Pristine Woods", "Pristine Woods"),
    
    # Specifically for the Navbar formatted HTML
    (r"Pristine Woods&apos;S", "COORG"),
    (r"Pristine Woods", "Pristine Woods"),
]

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return

    new_content = content
    for old, new in replacements:
        new_content = re.sub(old, new, new_content, flags=re.IGNORECASE)

    if new_content != content:
        print(f"Modifying: {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

for root, dirs, files in os.walk(directory):
    if 'node_modules' in root or '.git' in root or 'venv' in root or 'dist' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.py', '.html', '.md', '.json', '.css')):
            process_file(os.path.join(root, file))

print("Replacement complete.")
