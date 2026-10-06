"""Bouwt de extensie en beheert de Firefox-updatelijst.

python bouw.py                   maakt dist/…-chrome-<versie>.zip en dist/…-firefox-<versie>.zip
python bouw.py updates <xpi>     zet de ondertekende xpi van de huidige versie in updates.json
"""
import hashlib, json, os, sys, zipfile

SRC = 'threads-activity-filter'
REPO = 'blyoco/threadcheck'
ADDON_ID = 'threads-activity-filter@rodney'
# Firefox vraagt dit bestand periodiek op en installeert een hogere versie automatisch.
UPDATE_URL = f'https://raw.githubusercontent.com/{REPO}/main/updates.json'
XPI_NAME = 'threadcheck-firefox.xpi'


def manifest():
    return json.load(open(os.path.join(SRC, 'manifest.json'), encoding='utf-8'))


def build():
    chrome = manifest()
    version = chrome['version']
    os.makedirs('dist', exist_ok=True)

    # Firefox kent geen service worker als achtergrond en wil een vast ID plus een datagebruik-verklaring.
    firefox = dict(chrome)
    firefox['background'] = {'scripts': ['evidence.js', 'background.js']}
    firefox['browser_specific_settings'] = {
        'gecko': {
            'id': ADDON_ID,
            'strict_min_version': '142.0',
            'update_url': UPDATE_URL,
            'data_collection_permissions': {'required': ['none']},
        },
        'gecko_android': {'strict_min_version': '142.0'},
    }

    for name, mf, prefix in (('chrome', chrome, SRC + '/'), ('firefox', firefox, '')):
        path = os.path.join('dist', f'threads-activity-filter-{name}-{version}.zip')
        with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
            for root, dirs, files in os.walk(SRC):
                dirs.sort()
                for f in sorted(files):
                    rel = os.path.relpath(os.path.join(root, f), SRC).replace(os.sep, '/')
                    if rel == 'manifest.json':
                        z.writestr(prefix + rel, json.dumps(mf, indent=2, ensure_ascii=False))
                    else:
                        z.write(os.path.join(root, f), prefix + rel)
        print(path)


def add_update(xpi):
    version = manifest()['version']
    digest = hashlib.sha256(open(xpi, 'rb').read()).hexdigest()
    try:
        data = json.load(open('updates.json', encoding='utf-8'))
    except FileNotFoundError:
        data = {'addons': {ADDON_ID: {'updates': []}}}
    updates = [u for u in data['addons'][ADDON_ID]['updates'] if u['version'] != version]
    updates.append({
        'version': version,
        'update_link': f'https://github.com/{REPO}/releases/download/v{version}/{XPI_NAME}',
        'update_hash': 'sha256:' + digest,
    })
    data['addons'][ADDON_ID]['updates'] = updates
    with open('updates.json', 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    print(f'updates.json: {version} toegevoegd')


if __name__ == '__main__':
    if sys.argv[1:2] == ['updates']:
        add_update(sys.argv[2])
    else:
        build()
