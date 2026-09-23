"""Audit a Hugo build without network access or third-party dependencies."""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "public").resolve()
BASE = "https://delibrately.github.io/wilna-site/"
PREFIX = "/wilna-site/"
issues = []
targets = set()
external = set()


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links = []
        self.ids = set()
        self.h1 = 0
        self.title = False
        self.description = False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if "id" in attr:
            if attr["id"] in self.ids:
                issues.append({"type": "duplicate-id", "id": attr["id"]})
            self.ids.add(attr["id"])
        if tag == "h1":
            self.h1 += 1
        if tag == "title":
            self.title = True
        if tag == "meta" and attr.get("name") == "description":
            self.description = bool(attr.get("content"))
        for field in ("src", "href", "poster"):
            if field in attr:
                self.links.append(attr[field])
        if "srcset" in attr:
            self.links.extend(item.strip().split()[0] for item in attr["srcset"].split(","))
        if tag == "img" and "alt" not in attr:
            issues.append({"type": "missing-alt", "image": attr.get("src")})


documents = {}
for file in ROOT.rglob("*.html"):
    relative = file.relative_to(ROOT).as_posix()
    documents[relative] = Document(file.read_text())


def check(link, source):
    if not link or link in ("#", "javascript:void(0)"):
        issues.append({"type": "empty-link", "source": source, "url": link})
        return
    if link.startswith(("mailto:", "tel:", "data:")):
        return
    parsed = urlparse(urljoin(BASE + source, link))
    if parsed.netloc != "delibrately.github.io":
        external.add(parsed.geturl())
        return
    if not parsed.path.startswith(PREFIX):
        issues.append({"type": "base-path", "source": source, "url": link})
        return
    relative = unquote(parsed.path[len(PREFIX):])
    target = ROOT / relative
    if target.is_dir():
        target = target / "index.html"
    targets.add(target.relative_to(ROOT).as_posix())
    if not target.is_file():
        issues.append({"type": "missing-file", "source": source, "url": link})
    elif parsed.fragment and target.suffix == ".html":
        doc = documents[target.relative_to(ROOT).as_posix()]
        if unquote(parsed.fragment) not in doc.ids:
            issues.append({"type": "missing-fragment", "source": source, "url": link})


for relative, document in documents.items():
    # Hugo's root language redirect has no content heading.
    if relative != "index.html" and (document.h1 != 1 or not document.title or not document.description):
        issues.append({"type": "metadata", "source": relative, "h1": document.h1})
    for link in document.links:
        check(link, relative)

for file in ROOT.rglob("*.css"):
    for link in re.findall(r"url\(['\"]?([^)'\"]+)", file.read_text()):
        check(link, file.relative_to(ROOT).as_posix())

for original in ("intro/1.jpg", "intro/2.jpg", "intro/3.jpg", "research/5.png", "research/6.png", "Dut.png", "logo1.png"):
    if not (ROOT / original).is_file():
        issues.append({"type": "original-image-url", "url": original})

report = {"html_pages": len(documents), "internal_targets": len(targets), "external_links_not_network_checked": sorted(external), "issues": issues}
print(json.dumps(report, ensure_ascii=False, indent=2))
sys.exit(bool(issues))
