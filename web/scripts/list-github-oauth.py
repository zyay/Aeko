import subprocess
import re
import urllib.request

token = subprocess.check_output(["gh", "auth", "token"], text=True).strip()
req = urllib.request.Request(
    "https://github.com/settings/developers",
    headers={
        "Authorization": f"token {token}",
        "User-Agent": "aeko-setup",
        "Accept": "text/html",
    },
)
html = urllib.request.urlopen(req).read().decode("utf-8", "ignore")
apps = re.findall(r'href="(/settings/applications/(\d+))"[^>]*>([^<]+)</a>', html)
print("apps", len(apps))
for href, app_id, name in apps[:20]:
    print(name.strip(), "https://github.com" + href)
