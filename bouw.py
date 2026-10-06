"""Bouwt dist/…-chrome-<versie>.zip en dist/…-firefox-<versie>.zip uit de map threads-activity-filter."""
import json, os, zipfile

SRC = 'threads-activity-filter'
manifest = json.load(open(os.path.join(SRC, 'manifest.json'), encoding='utf-8'))
version = manifest['version']
os.makedirs('dist', exist_ok=True)

# Firefox kent geen service worker als achtergrond en wil een vast ID plus een datagebruik-verklaring.
firefox = dict(manifest)
firefox['background'] = {'scripts': ['evidence.js', 'background.js']}
firefox['browser_specific_settings'] = {
    'gecko': {
        'id': 'threads-activity-filter@rodney',
        'strict_min_version': '142.0',
        'data_collection_permissions': {'required': ['none']},
    },
    'gecko_android': {'strict_min_version': '142.0'},
}

for name, mf, prefix in (('chrome', manifest, SRC + '/'), ('firefox', firefox, '')):
    path = os.path.join('dist', f'threads-activity-filter-{name}-{version}.zip')
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(os.listdir(SRC)):
            if f == 'manifest.json':
                z.writestr(prefix + f, json.dumps(mf, indent=2, ensure_ascii=False))
            else:
                z.write(os.path.join(SRC, f), prefix + f)
    print(path)
