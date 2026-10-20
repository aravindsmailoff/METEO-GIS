#!/usr/bin/env python3
"""
Cryptographic & binary bundle verifier for standalone signed METEO-GIS APKs.
Verifies:
1. Both app-release.apk and app-debug.apk exist and are non-empty.
2. Both APKs embed standalone compiled `assets/index.android.bundle` (> 500 KB Hermes bytecode).
3. Extracted `assets/index.android.bundle` from `app-release.apk` contains ZERO occurrences of
   `http://10.0.2.2:3000`, `http://127.0.0.1:3000`, `http://localhost:3000`, `10.0.2.2`, `127.0.0.1`,
   or `METEOGIS_PROD_API_URL`, and DOES contain `https://meteo-gis.vercel.app`.
"""

import hashlib
import os
import sys
import zipfile


def main() -> int:
    rel_apk = sys.argv[1] if len(sys.argv) > 1 else "app/build/outputs/apk/release/app-release.apk"
    dbg_apk = sys.argv[2] if len(sys.argv) > 2 else "app/build/outputs/apk/debug/app-debug.apk"

    for label, path in [("RELEASE", rel_apk), ("DEBUG", dbg_apk)]:
        if not os.path.isfile(path):
            raise AssertionError(f"Missing {label} APK at {path}")
        raw_apk = open(path, "rb").read()
        sha256 = hashlib.sha256(raw_apk).hexdigest()
        with zipfile.ZipFile(path) as zf:
            entries = set(zf.namelist())
            if "assets/index.android.bundle" not in entries:
                raise AssertionError(f"{label} APK is missing standalone assets/index.android.bundle!")
            bundle = zf.read("assets/index.android.bundle")
            if len(bundle) <= 500_000:
                raise AssertionError(f"{label} bundle is unexpectedly small: {len(bundle)} bytes")
            print(
                f"{label}_APK bytes={len(raw_apk)} sha256={sha256} "
                f"bundle_bytes={len(bundle)} magic={bundle[:8].hex()}"
            )

    with zipfile.ZipFile(rel_apk) as zf:
        release_bundle = zf.read("assets/index.android.bundle")

    forbidden_tokens = [
        b"http://10.0.2.2:3000",
        b"http://127.0.0.1:3000",
        b"http://localhost:3000",
        b"10.0.2.2",
        b"127.0.0.1",
        b"METEOGIS_PROD_API_URL",
    ]
    for token in forbidden_tokens:
        count = release_bundle.count(token)
        print(f"BINARY_SCAN {token.decode('utf-8')}: {count}")
        if count != 0:
            raise AssertionError(
                f"Forbidden development token '{token.decode('utf-8')}' found {count} times in release bundle!"
            )

    vercel_count = release_bundle.count(b"https://meteo-gis.vercel.app")
    print(f"BINARY_SCAN https://meteo-gis.vercel.app: {vercel_count}")
    if vercel_count < 1:
        raise AssertionError("Production URL https://meteo-gis.vercel.app missing from release bundle!")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
