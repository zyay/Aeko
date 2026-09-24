#!/usr/bin/env python3
"""Create Google OAuth web client via Cloud Console API (if permitted)."""
from __future__ import annotations

import json
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

PROJECT = "project-ac9fc08d-e2d1-417a-979"
AUTH_URL = __import__("os").environ.get("AUTH_URL", "https://www.getaeko.com")
CALLBACK = f"{AUTH_URL}/api/auth/callback/google"
VERCEL_PROJECT = "prj_RWDFj4vmAizJLLRYnMR2QUDndbKJ"
TEAM = "team_3kyqrG7Mo0AuHRZLMm8fQZKR"
GCLOUD = Path.home() / "AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin/gcloud.cmd"


def access_token() -> str:
    return subprocess.check_output([str(GCLOUD), "auth", "print-access-token"], text=True).strip()


def vercel_token() -> str:
    auth_path = Path.home() / "AppData/Roaming/com.vercel.cli/Data/auth.json"
    return json.loads(auth_path.read_text())["token"]


def set_vercel_env(key: str, value: str, *, sensitive: bool = False):
    token = vercel_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    for target in ("production", "preview", "development"):
        body = json.dumps(
            {
                "key": key,
                "value": value,
                "type": "sensitive" if sensitive else "encrypted",
                "target": [target],
            }
        ).encode()
        url = f"https://api.vercel.com/v10/projects/{VERCEL_PROJECT}/env?teamId={TEAM}&upsert=true"
        req = urllib.request.Request(url, data=body, method="POST", headers=headers)
        with urllib.request.urlopen(req) as resp:
            print(f"  {key}@{target}: {resp.status}")


def api(method: str, url: str, body: dict | None = None):
    headers = {
        "Authorization": f"Bearer {access_token()}",
        "Content-Type": "application/json",
    }
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:2000]


def main():
    # Ensure OAuth consent + credentials APIs are enabled
    for svc in (
        "oauth2.googleapis.com",
        "cloudresourcemanager.googleapis.com",
        "iamcredentials.googleapis.com",
    ):
        subprocess.run([str(GCLOUD), "services", "enable", svc, f"--project={PROJECT}"], check=False)

    # Try IAP brand + client (legacy path; may still work on existing projects)
    status, brands = api("GET", f"https://iap.googleapis.com/v1/projects/{PROJECT}/brands")
    print("brands", status, str(brands)[:500])
    brand_name = None
    if status == 200 and brands.get("brands"):
        brand_name = brands["brands"][0]["name"]
    else:
        status, created = api(
            "POST",
            f"https://iap.googleapis.com/v1/projects/{PROJECT}/brands",
            {
                "applicationTitle": "Aeko",
                "supportEmail": "sockagorny@gmail.com",
            },
        )
        print("create brand", status, str(created)[:500])
        if status in (200, 201):
            brand_name = created.get("name")

    if not brand_name:
        print("Could not create/find OAuth brand")
        return

    status, clients = api("GET", f"https://iap.googleapis.com/v1/{brand_name}/identityAwareProxyClients")
    print("clients", status, str(clients)[:800])
    client = None
    if status == 200:
        for c in clients.get("identityAwareProxyClients", []):
            if c.get("displayName") == "Aeko Web":
                client = c
                break
    if not client:
        status, created = api(
            "POST",
            f"https://iap.googleapis.com/v1/{brand_name}/identityAwareProxyClients",
            {"displayName": "Aeko Web"},
        )
        print("create client", status, str(created)[:800])
        client = created if status in (200, 201) else None

    if not client:
        print("Could not create Google OAuth client")
        return

    client_id = client.get("clientId") or client.get("name", "").split("/")[-1]
    secret = client.get("secret")
    print("Google client id:", client_id)
    if not secret:
        print("No secret returned; IAP clients may not work for NextAuth Google provider")
        return
    set_vercel_env("AUTH_GOOGLE_ID", client_id)
    set_vercel_env("AUTH_GOOGLE_SECRET", secret, sensitive=True)
    print("Google OAuth env pushed to Vercel")


if __name__ == "__main__":
    main()
