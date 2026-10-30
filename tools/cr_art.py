"""Generate the Costa Rica hero illustration (vintage travel-poster style) and the ox-cart wheel badge.

Writes cr_hero.svg (inline-ready <svg class="hero-art">) and cr_wheel.txt (CSS data URI).
Deterministic: fixed RNG seed, so re-running gives the same art.
"""
import math, random, pathlib, urllib.parse

OUT = pathlib.Path(__file__).parent
rng = random.Random(7)
W, H = 1400, 420
HORIZON = 322


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def canopy(x0, x1, base, top, bump=(14, 30), jitter=8, bottom=H):
    """Closed path whose top edge is a scalloped tree-line between x0 and x1."""
    pts = [f"M{f(x0)} {f(bottom)}", f"L{f(x0)} {f(base(x0))}"]
    x = x0
    while x < x1:
        w = rng.uniform(*bump)
        nx = min(x + w, x1)
        y0, y1 = base(x), base(nx)
        crown = min(y0, y1) - rng.uniform(top * 0.5, top) - rng.uniform(0, jitter)
        pts.append(f"Q{f((x + nx) / 2)} {f(crown)} {f(nx)} {f(y1)}")
        x = nx
    pts.append(f"L{f(x1)} {f(bottom)}Z")
    return " ".join(pts)


def hills(points, bottom=H):
    """Smooth closed path through (x, y) points using midpoint quadratics."""
    d = [f"M{f(points[0][0])} {f(bottom)}", f"L{f(points[0][0])} {f(points[0][1])}"]
    for (ax, ay), (bx, by) in zip(points, points[1:]):
        d.append(f"Q{f(ax)} {f(ay)} {f((ax + bx) / 2)} {f((ay + by) / 2)}")
    d.append(f"L{f(points[-1][0])} {f(points[-1][1])} L{f(points[-1][0])} {f(bottom)}Z")
    return " ".join(d)


def frond(cx, cy, angle, length, droop, width):
    """A feathery palm frond: a drooping spine with saw-tooth leaflets on both sides."""
    a = math.radians(angle)
    # spine as a quadratic: start at crown, control out along the angle, end drooped
    p0 = (cx, cy)
    p1 = (cx + math.cos(a) * length * 0.55, cy + math.sin(a) * length * 0.55)
    p2 = (cx + math.cos(a) * length, cy + math.sin(a) * length + droop)

    def at(t):
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
        dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
        n = math.hypot(dx, dy) or 1
        return x, y, -dy / n, dx / n

    upper, lower = [], []
    steps = 22
    for i in range(1, steps + 1):
        t = i / steps
        x, y, nx, ny = at(t)
        w = width * math.sin(math.pi * t) ** 0.8 * (1.0 if i % 2 else 0.86)
        upper.append((x + nx * w * 0.45, y + ny * w * 0.45))
        lower.append((x - nx * w, y - ny * w))
    d = [f"M{f(cx)} {f(cy)}"] + [f"L{f(x)} {f(y)}" for x, y in upper] + [f"L{f(x)} {f(y)}" for x, y in reversed(lower)] + ["Z"]
    return " ".join(d)


def palm(base_x, base_y, crown_x, crown_y, size, fill, cls):
    """Curved, slightly tapered trunk with ring marks, plus a crown of fronds (own <g> so it can sway)."""
    bend_x = (base_x + crown_x) / 2 + (crown_x - base_x) * 0.35
    bend_y = (base_y + crown_y) / 2
    w0, w1 = 7 * size, 3.6 * size
    trunk = (f"M{f(base_x - w0)} {f(base_y)} Q{f(bend_x - w0 * 0.8)} {f(bend_y)} {f(crown_x - w1)} {f(crown_y)} "
             f"L{f(crown_x + w1)} {f(crown_y)} Q{f(bend_x + w0 * 0.8)} {f(bend_y)} {f(base_x + w0)} {f(base_y)}Z")
    rings = []
    for i in range(1, 14):
        t = i / 14
        x = (1 - t) ** 2 * base_x + 2 * (1 - t) * t * bend_x + t ** 2 * crown_x
        y = (1 - t) ** 2 * base_y + 2 * (1 - t) * t * bend_y + t ** 2 * crown_y
        hw = (w0 + (w1 - w0) * t) * 0.9
        rings.append(f"M{f(x - hw)} {f(y)} l{f(hw * 2)} {f(-1.5 * size)}")
    fronds = []
    for ang, ln, dr in ((-160, 118, 46), (-128, 104, 26), (-96, 78, 6), (-62, 100, 22), (-28, 122, 50), (8, 108, 62), (-188, 100, 64), (160, 70, 70)):
        fronds.append(f'<path d="{frond(crown_x, crown_y, ang, ln * size, dr * size, 13 * size)}"/>')
    coconuts = "".join(f'<circle cx="{f(crown_x + dx * size)}" cy="{f(crown_y + dy * size)}" r="{f(5.2 * size)}"/>' for dx, dy in ((-6, 8), (5, 9), (0, 13)))
    return (f'<g fill="{fill}"><path d="{trunk}"/>'
            f'<path d="{" ".join(rings)}" stroke="#F4D7B0" stroke-opacity="0.18" stroke-width="{f(1.2 * size)}" fill="none"/>'
            f'<g fill="#3A2A1C">{coconuts}</g>'
            f'<g class="fronds {cls}" style="transform-origin: {f(crown_x)}px {f(crown_y)}px">{"".join(fronds)}</g></g>')


def ceiba(x, base_y, h, crown_w, fill):
    """Emergent rainforest tree: thin trunk, wide flat umbrella crown."""
    trunk = f'<path d="M{f(x - 3)} {f(base_y)} L{f(x - 2)} {f(base_y - h)} L{f(x + 2)} {f(base_y - h)} L{f(x + 3)} {f(base_y)}Z"/>'
    blobs = []
    for i in range(7):
        bx = x + (i - 3) * crown_w / 7 + rng.uniform(-4, 4)
        by = base_y - h - rng.uniform(2, 10) + abs(i - 3) * 2.5
        blobs.append(f'<ellipse cx="{f(bx)}" cy="{f(by)}" rx="{f(crown_w / 6 + rng.uniform(0, 5))}" ry="{f(9 + rng.uniform(0, 4))}"/>')
    return f'<g fill="{fill}">{trunk}{"".join(blobs)}</g>'


def heliconia(x, y, s):
    """Lobster-claw heliconia: stem with alternating red bracts tipped yellow-green."""
    parts = [f'<path d="M{f(x)} {f(H)} Q{f(x - 6 * s)} {f(y + 40 * s)} {f(x)} {f(y)}" stroke="#1E3A2A" stroke-width="{f(3 * s)}" fill="none"/>']
    for i in range(6):
        cy = y + 12 * s + i * 13 * s
        side = 1 if i % 2 else -1
        tip_x = x + side * (26 - i * 2) * s
        parts.append(f'<path d="M{f(x)} {f(cy + 5 * s)} Q{f(x + side * 6 * s)} {f(cy - 2 * s)} {f(tip_x)} {f(cy - 15 * s)} Q{f(x + side * 14 * s)} {f(cy + 4 * s)} {f(x)} {f(cy + 5 * s)}Z" fill="#D9482B"/>')
        parts.append(f'<path d="M{f(x + side * 4 * s)} {f(cy + 1 * s)} Q{f(x + side * 12 * s)} {f(cy - 3 * s)} {f(tip_x)} {f(cy - 15 * s)}" stroke="#E8B83A" stroke-width="{f(2 * s)}" fill="none" stroke-linecap="round"/>')
    return "".join(parts)


def banana_leaf(x, y, length, angle, w, fill):
    """Long tropical leaf with a midrib and a few torn slits."""
    a = math.radians(angle)
    ex, ey = x + math.cos(a) * length, y + math.sin(a) * length
    nx, ny = -math.sin(a), math.cos(a)
    mx, my = (x + ex) / 2, (y + ey) / 2
    leaf = (f"M{f(x)} {f(y)} Q{f(mx + nx * w)} {f(my + ny * w)} {f(ex)} {f(ey)} "
            f"Q{f(mx - nx * w)} {f(my - ny * w)} {f(x)} {f(y)}Z")
    rib = f'<path d="M{f(x)} {f(y)} L{f(ex)} {f(ey)}" stroke="#F4D7B0" stroke-opacity="0.16" stroke-width="1.4"/>'
    slits = []
    for t in (0.35, 0.55, 0.72):
        px, py = x + (ex - x) * t, y + (ey - y) * t
        side = 1 if t != 0.55 else -1
        slits.append(f'<path d="M{f(px)} {f(py)} L{f(px + nx * w * 0.75 * side + math.cos(a) * 8)} {f(py + ny * w * 0.75 * side + math.sin(a) * 8)}" stroke="#F7F2E6" stroke-width="2.2"/>')
    return f'<g><path d="{leaf}" fill="{fill}"/>{rib}</g>'


# ── scene ────────────────────────────────────────────────────────────────
S = []
S.append(f'<svg class="hero-art" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">')
S.append('''<defs>
    <linearGradient id="crSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4FA7A2"/><stop offset="45%" stop-color="#1F8584"/><stop offset="100%" stop-color="#0D5E61"/></linearGradient>
    <linearGradient id="crRange" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#C7A9B4"/><stop offset="100%" stop-color="#D9BDB4"/></linearGradient>
    <linearGradient id="crVolLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8FA486"/><stop offset="100%" stop-color="#5F7E63"/></linearGradient>
    <linearGradient id="crVolShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5A7462"/><stop offset="100%" stop-color="#3B5A47"/></linearGradient>
    <linearGradient id="crSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EFD3A6"/><stop offset="100%" stop-color="#E2BC88"/></linearGradient>
    <radialGradient id="crSunGlow"><stop offset="0%" stop-color="#F6A55C" stop-opacity="0.75"/><stop offset="60%" stop-color="#F6A55C" stop-opacity="0.18"/><stop offset="100%" stop-color="#F6A55C" stop-opacity="0"/></radialGradient>
    <linearGradient id="crSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F7B05E"/><stop offset="100%" stop-color="#E5673A"/></linearGradient>
    <clipPath id="crAboveHorizon"><rect width="1400" height="322"/></clipPath>
    <filter id="crSoft"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="crCloud" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="3 1.6"/></filter>
    <linearGradient id="crGrainFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#fff" stop-opacity="0"/><stop offset="0.8" stop-color="#fff" stop-opacity="1"/></linearGradient>
    <mask id="crGrainMask"><rect width="1400" height="420" fill="url(#crGrainFade)"/></mask>
    <filter id="crGrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.15  0 0 0 0.55 0"/>
    </filter>
</defs>''')

# sun low on the Pacific, retro stripes, glow
sx, sy, sr = 1075, 318, 66
S.append(f'<circle class="sun-glow" cx="{sx}" cy="{sy}" r="210" fill="url(#crSunGlow)"/>')
S.append(f'<g clip-path="url(#crAboveHorizon)"><circle cx="{sx}" cy="{sy}" r="{sr}" fill="url(#crSun)"/>')
for i, (yy, hh) in enumerate(((286, 2.2), (296, 3), (305, 4), (313, 5))):
    S.append(f'<rect x="{sx - sr}" y="{yy}" width="{sr * 2}" height="{hh}" fill="#F7DCC0"/>')
S.append('</g>')

# long cloud streaks
S.append('<g class="clouds" fill="#FFF8EF" opacity="0.6" filter="url(#crCloud)">')
for cx, cy, w, h in ((210, 120, 250, 5), (330, 134, 150, 4), (930, 158, 280, 5), (1180, 106, 200, 4.5), (1250, 120, 120, 3.5), (620, 94, 140, 3.5)):
    S.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{w / 2}" ry="{h}"/>')
S.append('</g>')

# open sea from the horizon down, with sun reflection and swell lines
S.append(f'<rect x="0" y="{HORIZON}" width="{W}" height="{H - HORIZON}" fill="url(#crSea)"/>')
S.append(f'<rect x="0" y="{HORIZON - 1}" width="{W}" height="1.6" fill="#F7DCC0" opacity="0.7"/>')
for i in range(9):
    yy = HORIZON + 6 + i * 7.5
    w = 110 - i * 9 + rng.uniform(-8, 8)
    S.append(f'<rect x="{f(sx - w / 2 + rng.uniform(-6, 6))}" y="{f(yy)}" width="{f(w)}" height="2" rx="1" fill="#F7C08A" opacity="{f(0.75 - i * 0.06)}"/>')
for i in range(5):
    yy = HORIZON + 14 + i * 14
    S.append(f'<path class="swell" d="M{f(560 + i * 30)} {f(yy)} L1400 {f(yy)}" stroke="#E9F5F2" stroke-width="1.1" opacity="{f(0.35 - i * 0.04)}"/>')

# hazy far ranges (atmospheric perspective), left side running down to the shore
rng_pts = [(0, 284), (90, 262), (190, 280), (300, 246), (410, 272), (520, 258), (640, 284), (760, 300), (870, 322)]
rd = [f"M{rng_pts[0][0]} {rng_pts[0][1]}"]
for (ax, ay), (bx, by) in zip(rng_pts, rng_pts[1:]):
    rd.append(f"Q{ax} {ay} {(ax + bx) / 2} {(ay + by) / 2}")
rd.append(f"L{rng_pts[-1][0]} {HORIZON} L0 {HORIZON + 30}Z")  # base slopes away under the jungle
S.append(f'<path d="{" ".join(rd)}" fill="url(#crRange)"/>')

# the volcano: lit flank + shadow flank, ridges, wisp of steam
vol = "M230 346 C 330 304, 400 236, 448 160 L 456 153 Q 469 160 482 152 L 490 158 C 540 234, 620 302, 740 346 Z"
shade = "M469 157 C 476 222, 498 292, 522 346 L 740 346 C 620 302, 540 234, 490 158 Z"
S.append(f'<path d="{vol}" fill="url(#crVolLit)"/><path d="{shade}" fill="url(#crVolShade)"/>')
S.append('<g fill="none" stroke-linecap="round">'
         '<path d="M446 172 C 428 218, 404 262, 372 304" stroke="#F4EEDD" stroke-opacity="0.22" stroke-width="2"/>'
         '<path d="M461 168 C 452 226, 438 278, 424 330" stroke="#F4EEDD" stroke-opacity="0.16" stroke-width="2"/>'
         '<path d="M496 172 C 518 226, 548 274, 590 316" stroke="#1E2A22" stroke-opacity="0.14" stroke-width="2.2"/>'
         '<path d="M484 168 C 494 228, 508 284, 530 336" stroke="#1E2A22" stroke-opacity="0.1" stroke-width="2"/></g>')
S.append('<g class="steam" fill="#FFF8EE" filter="url(#crSoft)">')
for i, (dx, dy, r, o) in enumerate(((0, -12, 8, 0.7), (10, -26, 11, 0.6), (26, -40, 13, 0.5), (48, -52, 15, 0.38), (74, -60, 16, 0.26))):
    S.append(f'<ellipse cx="{469 + dx}" cy="{150 + dy}" rx="{r * 1.4}" ry="{r}" opacity="{o}"/>')
S.append('</g>')

# mid jungle hills with a canopy edge and emergent ceibas
mid_base = lambda x: 338 + 10 * math.sin(x / 140) + (x / 940) * 14 + max(0, x - 760) ** 2 / 520
S.append(f'<path d="{canopy(0, 940, mid_base, 14, bump=(12, 24), bottom=H)}" fill="#6F9567"/>')
for tx, th, tw in ((140, 30, 64), (610, 26, 58), (790, 18, 44)):
    S.append(ceiba(tx, mid_base(tx) - 6, th, tw, "#628A5C"))

# near jungle, darker, ending at the beach
near_base = lambda x: 364 + 7 * math.sin(x / 90 + 1) + max(0, x - 560) ** 2 / 1500
S.append(f'<path d="{canopy(0, 780, near_base, 16, bump=(10, 20), bottom=H)}" fill="#2F5E3D"/>')
S.append(f'<path d="{canopy(0, 600, lambda x: 380 + 6 * math.sin(x / 70), 10, bump=(8, 16), bottom=H)}" fill="#244C32"/>')

# headland + sea stack on the right
S.append(f'<path d="{canopy(1236, 1400, lambda x: 338 - (x - 1236) * 0.1, 10, bump=(8, 14), bottom=360)}" fill="#2F5E3D"/>')
S.append('<path d="M1236 360 L1236 338 Q1300 322 1400 322 L1400 360Z" fill="#2F5E3D"/>')
S.append('<path d="M1168 344 Q1174 322 1186 318 Q1198 320 1204 344Z" fill="#3B4A40"/>')
S.append('<path d="M1160 344 L1212 344" stroke="#E9F5F2" stroke-opacity="0.6" stroke-width="1.4"/>')

# beach sweeping in from the left, foam rolling along its edge
sand = "M0 392 C 230 382, 520 384, 760 394 C 880 400, 960 410, 1030 420 L0 420Z"
S.append(f'<path d="{sand}" fill="url(#crSand)"/>')
S.append('<path class="foam" d="M520 387 C 640 389, 760 394, 860 401 C 930 406, 985 412, 1030 420" stroke="#FFFFFF" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0.9"/>')
S.append('<path class="foam foam-2" d="M640 395 C 760 399, 880 407, 960 416" stroke="#FFFFFF" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.55"/>')
S.append('<path d="M1030 420 C 1120 404, 1260 398, 1400 396" stroke="#E9F5F2" stroke-width="1.4" fill="none" opacity="0.5"/>')

# frigatebirds over the bay
S.append('<g class="birds" fill="none" stroke="#2B2F2A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.6">')
for bx, by, s in ((880, 190, 1.0), (920, 172, 0.75), (1210, 210, 0.85), (1000, 140, 0.6)):
    S.append(f'<path transform="translate({bx} {by}) scale({s})" d="M-16 2 Q-10 -6 -5 -1 Q-2 2 0 0 Q2 2 5 -1 Q10 -6 16 2"/>')
S.append('</g>')

# palms: big one front-left leaning into the scene, a smaller one behind, one on the headland
S.append(palm(1325, 342, 1296, 232, 0.72, "#1E3A2A", "fronds-c"))
S.append(palm(78, 420, 112, 278, 0.82, "#24462F", "fronds-b"))
S.append(palm(170, 420, 286, 236, 1.0, "#1A3324", "fronds-a"))

# foreground framing: banana leaves bottom-left, heliconia bottom-right
S.append(banana_leaf(-10, 420, 150, -58, 26, "#1A3324"))
S.append(banana_leaf(30, 420, 120, -78, 20, "#22442E"))
S.append(f'<g>{heliconia(1286, 312, 1.25)}</g>')
S.append(banana_leaf(1414, 424, 128, -116, 22, "#1A3324"))

# print grain over everything
S.append(f'<rect width="{W}" height="{H}" filter="url(#crGrain)" mask="url(#crGrainMask)" opacity="0.32" style="mix-blend-mode:multiply"/>')
S.append('</svg>')
(OUT / "cr_hero.svg").write_text("\n".join(S), encoding="utf-8")


# ── ox-cart wheel badge (data URI) ──────────────────────────────────────────
def wheel():
    c = 50
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
             f'<circle cx="{c}" cy="{c}" r="49.5" fill="#1E2A22"/>',
             f'<circle cx="{c}" cy="{c}" r="46" fill="#C9471F"/>']
    for i in range(24):
        a = math.radians(i * 15)
        parts.append(f'<circle cx="{f(c + math.cos(a) * 47.6)}" cy="{f(c + math.sin(a) * 47.6)}" r="1.15" fill="#E8B83A"/>')
    colours = ["#E8B83A", "#0F7773", "#F2E3C6", "#2F6B45"]
    for i in range(16):
        a = math.radians(i * 22.5 - 90)
        tip = (c + math.cos(a) * 44, c + math.sin(a) * 44)
        l = (c + math.cos(a - 0.2) * 36, c + math.sin(a - 0.2) * 36)
        r = (c + math.cos(a + 0.2) * 36, c + math.sin(a + 0.2) * 36)
        base = (c + math.cos(a) * 31, c + math.sin(a) * 31)
        parts.append(f'<path d="M{f(base[0])} {f(base[1])} L{f(l[0])} {f(l[1])} L{f(tip[0])} {f(tip[1])} L{f(r[0])} {f(r[1])}Z" fill="{colours[i % 4]}"/>')
    for i in range(16):
        a = math.radians(i * 22.5 - 90 + 11.25)
        parts.append(f'<circle cx="{f(c + math.cos(a) * 39)}" cy="{f(c + math.sin(a) * 39)}" r="2" fill="#F2E3C6"/>')
    parts += [f'<circle cx="{c}" cy="{c}" r="32.5" fill="#1E2A22"/>',
              f'<circle cx="{c}" cy="{c}" r="31" fill="#E8B83A"/>',
              f'<circle cx="{c}" cy="{c}" r="29.6" fill="#F7F2E6"/>',
              '</svg>']
    return "".join(parts)


(OUT / "cr_wheel.txt").write_text('url("data:image/svg+xml,' + urllib.parse.quote(wheel(), safe="/=:,.") + '")', encoding="utf-8")
print("hero bytes:", len((OUT / "cr_hero.svg").read_text(encoding="utf-8")), "| wheel bytes:", len((OUT / "cr_wheel.txt").read_text(encoding="utf-8")))
