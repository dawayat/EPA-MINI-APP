import os
import re

dir_path = 'src/components'

for root, _, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.tsx'):
            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                content = f.read()
                matches = re.findall(r'className=["\']([^"\']+)["\']', content)
                for match in matches:
                    classes = match.split()
                    for cls in classes:
                        if cls in ['text-white', 'text-amber-400', 'text-stone-200', 'text-neutral-400', 'text-neutral-300', 'text-neutral-600']:
                            if not any(c.startswith('dark:text-') for c in classes) and not cls.startswith('dark:'):
                                print(f'{file}: {cls}')
