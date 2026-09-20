#!/usr/bin/env python3
"""Try to register a GitHub OAuth App via the settings form using gh token auth."""
from __future__ import annotations

import re
import subprocess
import urllib.parse
import urllib.request

AUTH_URL = "https://aeko.vercel.app"
CALLBACK = f"{AUTH_URL}/api/auth/callback/github"


def gh_token() -> str:
    return subprocess.check_output(["gh", "auth", "token"], text=True).strip()


def fetch(url: str, *, data: bytes | None = None, method: str = "GET") -> tuple[int, str, dict]:
    headers = {
        "Authorization": f"token {gh_token()}",
        "User-Agent": "aeko-setup",
        "Accept": "text/html,application/xhtml+xml",
    }
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read().decode("utf-8", "ignore"), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "ignore"), dict(e.headers)


def main():
    status, html, _ = fetch("https://github.com/settings/applications/new")
    print("GET new form:", status, "bytes", len(html))
    if status != 200:
        return
    token_match = re.search(r'name="authenticity_token" value="([^"]+)"', html)
    if not token_match:
        print("No authenticity_token — web session required for OAuth app creation.")
        return
    authenticity = token_match.group(1)
    body = urllib.parse.urlencode(
        {
            "authenticity_token": authenticity,
            "oauth_application[name]": "Aeko",
            "oauth_application[url]": AUTH_URL,
            "oauth_application[callback_url]": CALLBACK,
            "oauth_application[description]": "Aeko workspace sign-in",
            "commit": "Register application",
        }
    ).encode()
    status2, html2, headers2 = fetch(
        "https://github.com/settings/applications",
        data=body,
        method="POST",
    )
    print("POST create:", status2, "location", headers2.get("Location"))
    client = re.search(r"Client ID[^<]*<code[^>]*>([^<]+)</code>", html2, re.I)
    secret = re.search(r"Client secrets[^<]*<code[^>]*>([^<]+)</code>", html2, re.I)
    if client:
        print("client_id", client.group(1).strip())
    if secret:
        print("client_secret", secret.group(1).strip()[:8] + "…")
    if not client:
        print(html2[:1200])


if __name__ == "__main__":
    main()
