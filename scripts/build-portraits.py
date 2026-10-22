# Builds public/portraits/<id>.webp: transparent head-and-shoulders cut-outs for the home cards, and
# public/portraits/index.json listing who has one and where each photo came from.
#
# Photos: official congressional portraits (public domain, U.S. government works) from
# https://github.com/unitedstates/images, for everyone in research.json with a Bioguide ID. Other photos, supplied
# for use here, are kept in data/portraits/ and listed in scripts/portrait-extra.json, which takes precedence:
#   {"<person id>": {"file": "data/portraits/<id>.jpg", "credit": "Photo: <who>, used with permission", "url": optional}}
# People with neither keep the initials circle.
#
# Each photo's background is removed with MediaPipe selfie segmentation, and the face is found with MediaPipe face
# detection so every portrait is framed the same way: same eye height, same distance between the eyes.
#
#   python3 -m venv .local/pv && .local/pv/bin/pip install mediapipe==0.10.14 pillow
#   .local/pv/bin/python scripts/build-portraits.py            downloads photos into .local/portraits/
#   .local/pv/bin/python scripts/build-portraits.py --refresh  downloads them again
import json, os, sys, urllib.request
from datetime import date

import cv2
import mediapipe as mp
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, '.local', 'portraits')
OUT = os.path.join(ROOT, 'public', 'portraits')
BASE = 'https://raw.githubusercontent.com/unitedstates/images/gh-pages/congress'
SIZES = ('450x550', 'original')  # the full-size original often shows more of the head and shoulders
OFFICIAL = 'Official congressional portrait (public domain), via the unitedstates/images project'

# Output canvas: 3x the card's 88 x 104 px portrait box. Eyes are centered at EYE_Y, EYE_GAP px apart.
W, H, EYE_Y, EYE_GAP = 264, 312, 124, 50


def fetch(bioguide, size):
    folder = os.path.join(CACHE, size)
    os.makedirs(folder, exist_ok=True)
    path, url = os.path.join(folder, bioguide + '.jpg'), f'{BASE}/{size}/{bioguide}.jpg'
    if '--refresh' in sys.argv and os.path.exists(path):
        os.remove(path)
    if not os.path.exists(path):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                data = r.read()
        except Exception:
            return None
        with open(path, 'wb') as f:
            f.write(data)
    return path, url


def eyes(rgb, detector):
    res = detector.process(rgb)
    if not res.detections:
        return None
    # The largest face is the person; a smaller one can be a painting or poster behind them.
    d = max(res.detections, key=lambda d: d.location_data.relative_bounding_box.width)
    k = d.location_data.relative_keypoints  # 0 = right eye, 1 = left eye
    h, w = rgb.shape[:2]
    return (k[0].x * w, k[0].y * h), (k[1].x * w, k[1].y * h)


def extend(rgba, pad_b, pad_s, k):
    """Carry a cropped photo's clothing on past its bottom and side edges, blurred along the edge so it reads as fabric."""
    f = rgba.astype(np.float32)
    f[..., :3] *= f[..., 3:4] / 255  # premultiplied, so transparent pixels add no color
    solid = np.where(f[..., 3:4] >= 217, f, 0)  # only clothing that reaches the edge is carried on, not stray background
    h = f.shape[0]
    bottom = cv2.GaussianBlur(solid[h - 6:].mean(axis=0, keepdims=True), (k, 1), 0)
    f = np.vstack([f, np.repeat(bottom, pad_b, axis=0)])
    solid = np.vstack([solid, np.repeat(bottom, pad_b, axis=0)])
    left = cv2.GaussianBlur(solid[:, :4].mean(axis=1, keepdims=True), (1, k), 0)
    right = cv2.GaussianBlur(solid[:, -4:].mean(axis=1, keepdims=True), (1, k), 0)
    f = np.hstack([np.repeat(left, pad_s, axis=1), f, np.repeat(right, pad_s, axis=1)])
    a = f[..., 3:4] / 255
    f[..., :3] = np.where(a > 1e-3, f[..., :3] / np.maximum(a, 1e-3), 0)
    return np.clip(f, 0, 255).astype(np.uint8)


def measure(path, detector):
    """Eyes, and how much of the frame the photo covers once scaled (more head room and shoulders is better)."""
    bgr = cv2.imread(path)
    if bgr is None:
        return None
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    e = eyes(rgb, detector)
    if not e:
        return None
    (rx, ry), (lx, ly) = e
    gap = abs(lx - rx)
    s = EYE_GAP / max(1.0, gap)
    cy = (ry + ly) / 2
    cover = min(cy * s, EYE_Y - 20) + min((rgb.shape[0] - cy) * s, H - EYE_Y)
    return {'bgr': bgr, 'rgb': rgb, 'eyes': e, 'gap': gap, 'cover': cover}


def cutout(m, segmenter):
    bgr, rgb = m['bgr'], m['rgb']
    mask = segmenter.process(rgb).segmentation_mask.astype(np.float32)
    # Snap the soft mask to the photo's own edges (hair, collar), then firm it up.
    mask = cv2.ximgproc.guidedFilter(guide=bgr, src=mask, radius=max(4, int(m['gap'] / 16)), eps=1e-4)
    alpha = np.clip((mask - 0.35) / 0.3, 0, 1)
    # Keep only the person: drop loose specks of background the segmentation picked up.
    r = max(2, int(m['gap'] / 20))
    disk = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    core = cv2.morphologyEx((alpha > 0.5).astype(np.uint8), cv2.MORPH_OPEN, disk)  # cut thin bridges to specks
    n, lab, stats, _ = cv2.connectedComponentsWithStats(core, connectivity=8)
    if n > 1:
        body = (lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
        alpha *= cv2.dilate(body, disk, iterations=2)
    (rx, ry), (lx, ly) = m['eyes']
    s = EYE_GAP / max(1.0, m['gap'])
    cx, cy = (rx + lx) / 2, (ry + ly) / 2
    # A tightly cropped photo ends before the frame does: carry its clothing on to the edge. That part sits inside
    # the bottom of the card's circle, so it reads as more of the jacket rather than a cut-off line.
    pad = int(H / s)
    k = int(m['gap'] * 0.35) | 1
    rgba = extend(np.dstack([rgb, (alpha * 255).astype(np.uint8)]), pad, pad, k)
    t = np.float32([[s, 0, W / 2 - (cx + pad) * s], [0, s, EYE_Y - cy * s]])
    out = cv2.warpAffine(rgba, t, (W, H), flags=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    return Image.fromarray(out, 'RGBA')


def main():
    D = json.load(open(os.path.join(ROOT, 'public', 'research.json'), encoding='utf8'))
    extra_path = os.path.join(ROOT, 'scripts', 'portrait-extra.json')
    extra = json.load(open(extra_path, encoding='utf8')) if os.path.exists(extra_path) else {}
    os.makedirs(OUT, exist_ok=True)
    old_path = os.path.join(OUT, 'index.json')
    old = json.load(open(old_path, encoding='utf8'))['people'] if os.path.exists(old_path) else {}
    people, missing, listed = {}, [], set()
    seg = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=0)
    det = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
    for s in D['members'] + D.get('cands', []):
        if s['id'] in extra:
            x = extra[s['id']]
            options, credit = [(os.path.join(ROOT, x['file']), x.get('url'))], x['credit']
        elif s.get('bioguide'):
            options, credit = [o for o in (fetch(s['bioguide'], z) for z in SIZES) if o], OFFICIAL
        else:
            continue
        listed.add(s['id'])
        # Of the versions of the photo, use the one that fills the frame best; on a near tie, the sharper one.
        best = None
        for path, url in options:
            m = measure(path, det)
            if m and m['gap'] >= 36 and (not best or m['cover'] > best[0]['cover'] + 8 or (m['cover'] > best[0]['cover'] - 8 and m['gap'] > best[0]['gap'])):
                best = (m, url)
        img = cutout(best[0], seg) if best else None
        if img is None:
            missing.append(s['id'])
            if s['id'] in old and os.path.exists(os.path.join(OUT, s['id'] + '.webp')):
                people[s['id']] = old[s['id']]  # keep the portrait already built rather than lose it
            continue
        img.save(os.path.join(OUT, s['id'] + '.webp'), 'WEBP', quality=82, method=6)
        people[s['id']] = {'file': f'portraits/{s["id"]}.webp', 'credit': credit}
        if best[1]:
            people[s['id']]['src'] = best[1]
    for f in os.listdir(OUT):  # drop portraits of people no longer listed
        if f.endswith('.webp') and f[:-5] not in listed:
            os.remove(os.path.join(OUT, f))
    index = {'about': 'Transparent portraits for the home cards. See scripts/build-portraits.py.',
             'built': date.today().isoformat(), 'people': people}
    with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf8') as f:
        json.dump(index, f, indent=2)
    print(f'Wrote {len(people)} portraits to public/portraits/.' + (f' No photo or no face found: {", ".join(missing)}.' if missing else ''))


if __name__ == '__main__':
    main()
