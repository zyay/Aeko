import subprocess
import re
import urllib.request

token = subprocess.check_output(["gh", "auth", "token"], text=True).strip()
for path in ("/settings/apps", "/settings/developers"):
    req = urllib.request.Request(
        f"https://github.com{path}",
        headers={"Authorization": f"token {token}", "User-Agent": "aeko", "Accept": "text/html"},
    )
    html = urllib.request.urlopen(req).read().decode("utf-8", "ignore")
    print("===", path, "len", len(html))
    for pat in (
        r'data-client-id="(Iv[a-zA-Z0-9\.]+)"',
        r'data-client-id="(Ov[a-zA-Z0-9]+)"',
        r'/settings/apps/([^"\?]+)',
        r'/settings/applications/(\d+)',
    ):
        hits = re.findall(pat, html)
        if hits:
            print(pat, hits[:10])
