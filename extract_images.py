import fitz
import os

doc = fitz.open("Izrahiah Immanuel Portfolio 2026 Edited.pdf")

# page numbers are 1-indexed here; script converts to 0-index
projects = {
    "vertical-farm": [4, 5],
    "hastings-gantt": [6, 7, 8, 9, 10, 11, 12, 13],
    "momentum": [14, 15, 16, 17, 18, 19],
    "frozen-palace": [20, 21, 22, 23, 24, 25],
    "honeycomb": [26, 27, 28],
    "dance-hall": [30, 31, 32, 33, 34, 35],
}

GAP = 4           # pt distance under which two image rects are merged into one cluster
MIN_W, MIN_H = 80, 60   # drop clusters smaller than this (stray marks / tiny legend rows)
ZOOM = 3.0
PAD = 3           # pt padding added around each cluster crop

# page 15 has a pure-vector site plan (no raster images at all) -> manual crop
MANUAL_CROPS = {
    15: fitz.Rect(15, 30, 600, 745),
}

# pages with no meaningful content to extract
SKIP_PAGES = {29}

out_root = "images/projects"
os.makedirs(out_root, exist_ok=True)


def cluster_rects(rects, gap):
    n = len(rects)
    parent = list(range(n))

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    expanded = [fitz.Rect(r.x0 - gap, r.y0 - gap, r.x1 + gap, r.y1 + gap) for r in rects]
    for i in range(n):
        for j in range(i + 1, n):
            if expanded[i].intersects(expanded[j]):
                union(i, j)

    groups = {}
    for i in range(n):
        root = find(i)
        groups.setdefault(root, []).append(rects[i])

    clusters = []
    for members in groups.values():
        u = fitz.Rect()
        for r in members:
            u |= r
        clusters.append(u)
    return clusters


manifest = {}

for project, pages in projects.items():
    proj_dir = os.path.join(out_root, project)
    os.makedirs(proj_dir, exist_ok=True)
    count = 0
    manifest[project] = []
    for pno in pages:
        if pno in SKIP_PAGES:
            continue
        page = doc[pno - 1]

        if pno in MANUAL_CROPS:
            clip = MANUAL_CROPS[pno]
            mat = fitz.Matrix(ZOOM, ZOOM)
            pix = page.get_pixmap(matrix=mat, clip=clip)
            count += 1
            fname = f"{count:02d}.png"
            pix.save(os.path.join(proj_dir, fname))
            manifest[project].append((pno, fname, round(clip.width), round(clip.height)))
            continue

        imgs = page.get_images(full=True)
        rects = []
        for im in imgs:
            for r in page.get_image_rects(im[0]):
                if r.width > 0 and r.height > 0:
                    rects.append(r)

        if not rects:
            continue

        clusters = cluster_rects(rects, GAP)
        clusters = [c for c in clusters if c.width >= MIN_W and c.height >= MIN_H]
        clusters.sort(key=lambda r: (round(r.y0 / 10), r.x0))

        for r in clusters:
            page_rect = page.rect
            clip = fitz.Rect(
                max(page_rect.x0, r.x0 - PAD),
                max(page_rect.y0, r.y0 - PAD),
                min(page_rect.x1, r.x1 + PAD),
                min(page_rect.y1, r.y1 + PAD),
            )
            mat = fitz.Matrix(ZOOM, ZOOM)
            pix = page.get_pixmap(matrix=mat, clip=clip)
            count += 1
            fname = f"{count:02d}.png"
            pix.save(os.path.join(proj_dir, fname))
            manifest[project].append((pno, fname, round(clip.width), round(clip.height)))

for project, items in manifest.items():
    print(f"\n=== {project} ({len(items)} images) ===")
    for pno, fname, w, h in items:
        print(f"  page {pno}: {fname}  ({w}x{h}pt)")
