"""Check local portfolio documents, evidence boundaries, assets, and context caps."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT / "index.html", ROOT / "publications.html", ROOT / "projects.html",
         *sorted((ROOT / "projects").glob("*.html"))]


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = set()
        self.references = []
        self.labels = []
        self.h1_count = 0
        self.main_count = 0
        self.buttons = 0
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attributes):
        a = dict(attributes)
        if "id" in a:
            assert a["id"] not in self.ids, (self.path, "duplicate id", a["id"])
            self.ids.add(a["id"])
        self.h1_count += tag == "h1"
        self.main_count += tag == "main"
        self.buttons += tag == "button"
        if tag == "html":
            assert a.get("lang") == "en", self.path
        if tag == "a" and "download" not in a:
            href = a.get("href", "")
            if href.startswith(("https://", "http://")) or href.endswith(".pdf"):
                assert a.get("target") == "_blank" and "noopener" in a.get("rel", "").split(), (self.path, href)
        if tag == "img":
            assert "alt" in a, (self.path, "image without alt")
            assert a.get("width") and a.get("height"), (self.path, "unreserved image")
        if tag == "button":
            assert a.get("type") == "button", self.path
        if tag == "svg":
            assert a.get("role") == "img" and a.get("aria-labelledby"), self.path
        for field in ("href", "src", "data-src"):
            if a.get(field):
                self.references.append(a[field])
        if a.get("srcset"):
            self.references.extend(x.strip().split()[0] for x in a["srcset"].split(","))
        if a.get("aria-labelledby"):
            self.labels.extend(a["aria-labelledby"].split())


def contrast(foreground, background):
    def luminance(value):
        rgb = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
        return sum(v * w for v, w in zip(linear, (.2126, .7152, .0722)))
    a, b = sorted([luminance(foreground), luminance(background)])
    return (b + .05) / (a + .05)


def main():
    assert len(PAGES) == 6, "Expected homepage, two indexes, and three case studies"
    parsed = {p.resolve(): Page(p) for p in PAGES}
    links = 0
    for path, page in parsed.items():
        assert page.h1_count == 1 and page.main_count == 1, path
        assert all(label in page.ids for label in page.labels), (path, "missing aria target")
        for reference in page.references:
            url = urlsplit(reference)
            if url.scheme or url.netloc:
                continue
            target = (path.parent / unquote(url.path)).resolve() if url.path else path
            assert target.is_relative_to(ROOT.resolve()), (path, "path escapes workspace")
            assert target.is_file(), (path, "missing local target", reference)
            if url.fragment:
                assert target in parsed and unquote(url.fragment) in parsed[target].ids, (path, reference)
            links += 1
        text = path.read_text(encoding="utf-8")
        assert "\ufffd" not in text and "R?sum?" not in text and "Kamal?s" not in text, path
        assert not re.search(r"\w\?\w|>\?</span>", text), (path, "damaged punctuation")
        assert "Semantic-Merkle" not in text, (path, "excluded manuscript")
        assert not re.search(r"\b\d+(?:\.\d+)?\s*%", text), (path, "unsupported percentage")
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    assert "assets/story-poster" not in home and "data-story-scene" not in home, "Rejected artwork must stay out of the visible page"
    assert "Currently working on distributed systems" in home
    assert "M.Tech CSE" in home and "In progress" in home and "April–June 2026" in home
    papers = (ROOT / "publications.html").read_text(encoding="utf-8")
    assert "Under review" in papers and "IEEE" in papers and "Taylor &amp; Francis" in papers
    artwork = sorted({(path.parent / unquote(urlsplit(ref).path)).resolve()
                      for path, page in parsed.items() for ref in page.references
                      if not urlsplit(ref).scheme and urlsplit(ref).path.endswith(".webp")})
    payload = sum(p.stat().st_size for p in artwork)
    layers = [p for p in artwork if p.name.startswith("hero-")]
    layer_payload = sum(p.stat().st_size for p in layers)
    assert payload - layer_payload <= 600 * 1024, "Static illustrations exceed the design budget"
    assert layer_payload <= 180 * 1024, "Optional hero layers exceed their additional budget"
    for suffix in ("", "-mobile"):
        with Image.open(ROOT / "assets" / f"hero-background{suffix}.webp") as bg, Image.open(ROOT / "assets" / f"hero-foreground{suffix}.webp") as fg:
            assert bg.size == fg.size, "Hero layers must share exact geometry"
            assert fg.mode == "RGBA" and fg.getchannel("A").getextrema() == (0, 255)
    referenced_assets = {(path.parent / unquote(urlsplit(ref).path)).resolve()
                         for path, page in parsed.items() for ref in page.references
                         if not urlsplit(ref).scheme and urlsplit(ref).path}
    assert not [p for p in (ROOT / "assets").iterdir() if p.is_file() and p.resolve() not in referenced_assets], "Deployment assets contain unused files"
    for image_path in artwork:
        with Image.open(image_path) as image:
            image.verify()
    assert 'id="education"' in home and "GPA" not in home and "9.20" not in home
    css = (ROOT / "assets/portfolio.css").read_text(encoding="utf-8")
    screen_root = re.search(r":root\s*\{([^}]+)\}", css).group(1)
    palette = dict(re.findall(r"--([\w-]+):\s*(#[0-9a-fA-F]{6});", screen_root))
    pairs = [("ink", "ground"), ("muted", "ground"), ("ink", "surface"),
             ("muted", "surface"), ("accent", "surface"), ("stone-ink", "accent"),
             ("stone-ink", "stone"), ("stone-muted", "stone")]
    for front, back in pairs:
        ratio = contrast(palette[front], palette[back])
        assert ratio >= 4.5, (front, back, ratio)
        print(f"Contrast {front}/{back}: {ratio:.2f}:1")
    for path in ROOT.rglob("*.md"):
        if any(part in {"node_modules", ".git"} for part in path.parts) or path.name in {"AGENTS.md", "AGENTS.override.md", "SKILL.md"}:
            continue
        text = path.read_text(encoding="utf-8-sig")
        lines, size = len(text.splitlines()), len(path.read_bytes())
        limit = (60, 6144) if path.name == "transfercontext.md" else (200, 16384)
        assert lines <= limit[0] and size <= limit[1], (path, lines, size, limit)
        print(f"Context {path.name}: {lines} lines, {size} bytes")
    for name in ["navigation.js"]:
        subprocess.run(["node", "--check", str(ROOT / "assets" / name)], check=True)
    print(f"PASS: {len(PAGES)} pages; {links} local references; illustrations decoded; artwork {payload} bytes; JS syntax")
    print("Scope: static checks only. Browser layout, interactions, publisher citations, and lab performance remain separate.")


if __name__ == "__main__":
    main()
