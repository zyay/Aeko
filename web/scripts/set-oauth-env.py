#!/usr/bin/env python3
"""Push OAuth client credentials to Vercel (run after creating GitHub/Google apps)."""
from __future__ import annotations

import argparse
import json
import os
import urllib.request
from pathlib import Path

PROJECT_ID = "prj_RWDFj4vmAizJLLRYnMR2QUDndbKJ"
TEAM_ID = "team_3kyqrG7Mo0AuHRZLMm8fQZKR"
TARGETS = ("production", "preview", "development")


def vercel_token() -> str:
    auth_path = Path.home() / "AppData/Roaming/com.vercel.cli/Data/auth.json"
    return json.loads(auth_path.read_text())["token"]


def set_env(key: str, value: str, *, sensitive: bool = False):
    token = vercel_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    for target in TARGETS:
        body = json.dumps(
            {
                "key": key,
                "value": value,
                "type": "sensitive" if sensitive else "encrypted",
                "target": [target],
            }
        ).encode()
        url = f"https://api.vercel.com/v10/projects/{PROJECT_ID}/env?teamId={TEAM_ID}&upsert=true"
        req = urllib.request.Request(url, data=body, method="POST", headers=headers)
        with urllib.request.urlopen(req) as resp:
            print(f"{key}@{target}: {resp.status}")


def main():
    p = argparse.ArgumentParser(description="Set Aeko OAuth env vars on Vercel")
    p.add_argument("--github-id", default=os.environ.get("AUTH_GITHUB_ID"))
    p.add_argument("--github-secret", default=os.environ.get("AUTH_GITHUB_SECRET"))
    p.add_argument("--google-id", default=os.environ.get("AUTH_GOOGLE_ID"))
    p.add_argument("--google-secret", default=os.environ.get("AUTH_GOOGLE_SECRET"))
    args = p.parse_args()
    if args.github_id and args.github_secret:
        set_env("AUTH_GITHUB_ID", args.github_id)
        set_env("AUTH_GITHUB_SECRET", args.github_secret, sensitive=True)
    if args.google_id and args.google_secret:
        set_env("AUTH_GOOGLE_ID", args.google_id)
        set_env("AUTH_GOOGLE_SECRET", args.google_secret, sensitive=True)
    missing = [
        name
        for name, val in (
            ("AUTH_GITHUB_ID/SECRET", args.github_id and args.github_secret),
            ("AUTH_GOOGLE_ID/SECRET", args.google_id and args.google_secret),
        )
        if not val
    ]
    if missing:
        print("Still missing:", ", ".join(missing))
        origin = __import__("os").environ.get("AUTH_URL", "https://www.getaeko.com")
        print(f"GitHub callback: {origin}/api/auth/callback/github")
        print(f"Google callback:  {origin}/api/auth/callback/google")
        raise SystemExit(1)
    print("OAuth env vars set. Run: vercel deploy --prod")


if __name__ == "__main__":
    main()
