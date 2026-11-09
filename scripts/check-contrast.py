#!/usr/bin/env python3
"""Check WCAG contrast of the EcoVolt theme's text/background pairs in both modes.

Usage: python3 scripts/check-contrast.py [themes/ecovolt.yaml]
Exits non-zero if any pair is below its minimum.
"""
import re
import sys

# (foreground var, background var, minimum ratio). 4.5 = body text, 3.0 = large text / UI parts.
PAIRS = [
    ("primary-text-color", "card-background-color", 4.5),
    ("primary-text-color", "primary-background-color", 4.5),
    ("secondary-text-color", "card-background-color", 4.5),
    ("secondary-text-color", "primary-background-color", 4.5),
    ("ha-card-header-color", "card-background-color", 4.5),
    ("app-header-text-color", "app-header-background-color", 4.5),
    ("sidebar-text-color", "sidebar-background-color", 4.5),
    ("sidebar-selected-text-color", "sidebar-background-color", 4.5),
    ("text-primary-color", "ha-color-fill-primary-loud-resting", 4.5),
    ("text-primary-color", "ha-color-fill-primary-loud-hover", 4.5),
    ("ha-color-text-link", "card-background-color", 4.5),
    ("ha-color-on-primary-normal", "ha-color-fill-primary-normal-resting", 4.5),
    ("ha-color-on-primary-quiet", "ha-color-fill-primary-quiet-resting", 4.5),
    ("primary-color", "card-background-color", 3.0),
    ("accent-color", "card-background-color", 1.0),  # informational: amber is never used as text
    ("energy-solar-color", "card-background-color", 1.0),
]

# HA defaults for semantic tokens the theme leaves alone, per mode (from HA frontend semantic globals).
DEFAULTS = {
    "light": {
        "ha-color-text-link": "ha-color-primary-40",
        "ha-color-fill-primary-normal-resting": "ha-color-primary-90",
        "ha-color-fill-primary-quiet-resting": "ha-color-primary-95",
        "ha-color-on-primary-normal": "ha-color-primary-40",
        "ha-color-on-primary-quiet": "ha-color-primary-50",
    },
    "dark": {
        "ha-color-text-link": "ha-color-primary-60",
        "ha-color-fill-primary-normal-resting": "ha-color-primary-10",
        "ha-color-fill-primary-quiet-resting": "ha-color-primary-05",
        "ha-color-on-primary-normal": "ha-color-primary-60",
        "ha-color-on-primary-quiet": "ha-color-primary-70",
    },
}


def parse_theme(path):
    """Tiny parser for this theme's shape: name -> keys, plus modes -> light/dark -> keys."""
    base, modes, section = {}, {"light": {}, "dark": {}}, None
    for raw in open(path, encoding="utf-8"):
        line = raw.split(" #")[0].rstrip() if not raw.lstrip().startswith("#") else ""
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip())
        m = re.match(r'\s*([A-Za-z0-9_-]+):\s*"?([^"]*)"?\s*$', line)
        if not m:
            continue
        key, val = m.group(1), m.group(2)
        if indent == 4 and key in modes:
            section = key
        elif indent == 2:
            section = None if key != "modes" else section
            if val:
                base[key] = val
        elif indent == 6 and section:
            modes[section][key] = val
    return base, modes


def hex_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


def lum(h):
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in hex_rgb(h)]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def resolve(vars_, key, depth=0):
    val = vars_.get(key)
    if val is None or depth > 10:
        return None
    m = re.match(r"var\(--([a-z0-9-]+)\)", val)
    if m:
        return resolve(vars_, m.group(1), depth + 1)
    if val in vars_:
        return resolve(vars_, val, depth + 1)
    return val if val.startswith("#") else None


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "themes/ecovolt.yaml"
    base, modes = parse_theme(path)
    failed = 0
    for mode in ("light", "dark"):
        vars_ = {**DEFAULTS[mode], **base, **modes[mode]}
        print(f"\n== {mode} ==")
        for fg, bg, minimum in PAIRS:
            f, b = resolve(vars_, fg), resolve(vars_, bg)
            if not f or not b:
                print(f"  ??   {fg} on {bg}: unresolved")
                failed += 1
                continue
            r = ratio(f, b)
            ok = r >= minimum
            failed += 0 if ok else 1
            print(f"  {'ok  ' if ok else 'FAIL'} {r:5.2f} (min {minimum}) {fg} {f} on {bg} {b}")
    print(f"\n{'All pairs pass.' if not failed else f'{failed} pair(s) failed.'}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
