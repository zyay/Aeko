#!/usr/bin/env python3
"""Provision Aeko production: Neon link, VAPID, OAuth env vars on Vercel."""
from __future__ import annotations

import base64
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

AUTH_URL = "https://aeko.vercel.app"
GITHUB_CALLBACK = f"{AUTH_URL}/api/auth/callback/github"
GOOGLE_CALLBACK = f"{AUTH_URL}/api/auth/callback/google"
PROJECT_ID = "prj_RWDFj4vmAizJLLRYnMR2QUDndbKJ"
TEAM_ID = "team_3kyqrG7Mo0AuHRZLMm8fQZKR"
NEON_STORE_ID = "store_QdnF0C7VzckKI2B0"
ENV_TARGETS = ("production", "preview", "development")


def vercel_token() -> str:
    auth_path = Path.home() / "AppData/Roaming/com.vercel.cli/Data/auth.json"
    return json.loads(auth_path.read_text())["token"]


def gh_token() -> str:
    out = subprocess.check_output(["gh", "auth", "token"], text=True).strip()
    return out


class Vercel:
    def __init__(self, token: str):
        self.token = token
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def get(self, url: str):
        req = urllib.request.Request(url, headers=self.headers)
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())

    def post(self, url: str, body: dict):
        data = json.dumps(body).encode()
        req = urllib.request.Request(url, data=data, method="POST", headers=self.headers)
        try:
            with urllib.request.urlopen(req) as resp:
                raw = resp.read().decode()
                return resp.status, json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode()

    def env_keys(self) -> set[str]:
        data = self.get(f"https://api.vercel.com/v9/projects/{PROJECT_ID}/env?teamId={TEAM_ID}")
        return {e["key"] for e in data.get("envs", [])}

    def set_env(self, key: str, value: str, *, sensitive: bool = False):
        for target in ENV_TARGETS:
            body = {
                "key": key,
                "value": value,
                "type": "sensitive" if sensitive else "encrypted",
                "target": [target],
            }
            status, resp = self.post(
                f"https://api.vercel.com/v10/projects/{PROJECT_ID}/env?teamId={TEAM_ID}&upsert=true",
                body,
            )
            print(f"  env {key}@{target}: {status}")
            if status >= 400:
                print("   ", resp[:300])


def connect_neon(v: Vercel):
    status, resp = v.post(
        f"https://api.vercel.com/v1/storage/stores/{NEON_STORE_ID}/connections?teamId={TEAM_ID}",
        {
            "projectId": PROJECT_ID,
            "envVarEnvironments": list(ENV_TARGETS),
            "makeEnvVarsSensitive": True,
        },
    )
    print("neon connect:", status, (resp if isinstance(resp, str) else "ok")[:200])


def vapid_keys() -> tuple[str, str]:
    try:
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.primitives import serialization

        key = ec.generate_private_key(ec.SECP256R1())
        priv = base64.urlsafe_b64encode(
            key.private_numbers().private_value.to_bytes(32, "big")
        ).rstrip(b"=").decode()
        pub_nums = key.public_key().public_numbers()
        pub_raw = b"\x04" + pub_nums.x.to_bytes(32, "big") + pub_nums.y.to_bytes(32, "big")
        pub = base64.urlsafe_b64encode(pub_raw).rstrip(b"=").decode()
        return pub, priv
    except Exception:
        out = subprocess.check_output(["node", "-e", """
const crypto = require('crypto');
const keys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pub = keys.publicKey.export({ type: 'spki', format: 'der' }).slice(-65);
const priv = keys.privateKey.export({ type: 'pkcs8', format: 'der' }).slice(-32);
const b64u = (buf) => buf.toString('base64').replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
process.stdout.write(b64u(pub) + '\\n' + b64u(priv));
"""], text=True).strip().split("\n")
        return out[0], out[1]


def scrape_github_oauth_apps(token: str) -> list[dict]:
    req = urllib.request.Request(
        "https://github.com/settings/developers",
        headers={
            "Authorization": f"token {token}",
            "User-Agent": "aeko-setup",
            "Accept": "text/html",
        },
    )
    try:
        html = urllib.request.urlopen(req).read().decode("utf-8", "ignore")
    except Exception as e:
        print("github settings fetch failed:", e)
        return []
    apps: list[dict] = []
    for m in re.finditer(
        r'href="(/settings/applications/(\d+))"[^>]*>([^<]+)</a>',
        html,
    ):
        apps.append({"url": "https://github.com" + m.group(1), "id": m.group(2), "name": m.group(3).strip()})
    return apps


def main():
    v = Vercel(vercel_token())
    keys_before = v.env_keys()
    print("existing env keys:", len(keys_before))

    if "DATABASE_URL" not in keys_before:
        print("linking Neon store…")
        connect_neon(v)
    else:
        print("DATABASE_URL already present")

    if not {"AEKO_VAPID_PUBLIC", "AEKO_VAPID_PRIVATE"} <= keys_before:
        pub, priv = vapid_keys()
        print("setting VAPID keys…")
        v.set_env("AEKO_VAPID_PUBLIC", pub)
        v.set_env("NEXT_PUBLIC_AEKO_VAPID_PUBLIC", pub)
        v.set_env("AEKO_VAPID_PRIVATE", priv, sensitive=True)
        v.set_env("AEKO_VAPID_SUBJECT", "mailto:sockagorny@gmail.com")
    else:
        print("VAPID keys already present")

    oauth_missing = [k for k in ("AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET") if k not in keys_before]
    if oauth_missing:
        print("OAuth env still missing:", ", ".join(oauth_missing))
        print("GitHub callback:", GITHUB_CALLBACK)
        print("Google callback:", GOOGLE_CALLBACK)
        try:
            apps = scrape_github_oauth_apps(gh_token())
            if apps:
                print("GitHub OAuth apps on account:")
                for app in apps:
                    print(f"  - {app['name']}: {app['url']}")
            else:
                print("No GitHub OAuth apps found (create at https://github.com/settings/applications/new)")
        except Exception as e:
            print("gh scrape skipped:", e)
    else:
        print("OAuth env vars already set")

    print("done")


if __name__ == "__main__":
    main()
