import os
import re
from collections import Counter

dir_path = 'src/components'
all_classes = []

for root, _, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.tsx'):
            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                content = f.read()
                matches = re.findall(r'className=["\']([^"\']+)["\']', content)
                for match in matches:
                    classes = match.split()
                    for cls in classes:
                        if cls.startswith('text-') and not cls.startswith('text-[') and not cls.startswith('dark:') and not any(c.startswith('dark:text-') for c in classes):
                            all_classes.append(cls)

c = Counter(all_classes)
for k, v in c.most_common(50):
    print(f'{k}: {v}')
