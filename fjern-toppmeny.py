#!/usr/bin/env python3
"""Fjerner toppmenyen fra alle HTML-sider i Regninga-prosjektet.

Kjør fra prosjektroten:
    python fjern-toppmeny.py
"""
from pathlib import Path
from bs4 import BeautifulSoup
import shutil
import re

ROOT = Path.cwd().resolve()
PATCH = Path(__file__).resolve().parent
BACKUP = ROOT / ".regninga-backup-for-menyfjerning"
ASSETS = ROOT / "assets"
CSS_NAME = "header-uten-meny.css"

if ROOT == PATCH:
    raise SystemExit("Legg oppdateringsfilene i roten av Regninga-prosjektet før du kjører skriptet.")

ASSETS.mkdir(exist_ok=True)
shutil.copy2(PATCH / "assets" / CSS_NAME, ASSETS / CSS_NAME)

selectors = [
    "nav.main-nav", "nav.nav", "nav.nav-links", "nav.nav-menu",
    ".desktop-nav", ".mobile-nav", ".menu-button", ".menu-toggle",
    ".nav-toggle", "#mainNav", "#mobileMenu", "#menuButton",
    "[aria-label='Hovedmeny']", "[aria-controls='mainNav']",
    "[aria-controls='mobileMenu']",
]

menu_words = {
    "bolig", "bil", "pendling", "strøm", "samboer", "hund", "barn",
    "pensjon", "jobb mindre", "jobbe mindre", "banken"
}

changed = []
for html in sorted(ROOT.rglob("*.html")):
    if PATCH in html.parents or BACKUP in html.parents:
        continue

    original = html.read_text(encoding="utf-8")
    soup = BeautifulSoup(original, "html.parser")
    header = soup.select_one("header.site-header") or soup.find("header")

    if header:
        for selector in selectors:
            for element in header.select(selector):
                element.decompose()

        # Fjerner også ukjente menycontainere som består av de oppgitte menypunktene.
        for element in list(header.find_all(["nav", "ul", "div"])):
            text = " ".join(element.stripped_strings).casefold()
            hits = sum(1 for word in menu_words if word in text)
            if hits >= 3 and not element.select_one(".brand, .logo, .site-logo"):
                element.decompose()

    # Fjern gamle CSS-patcher som bare skjulte menyen.
    for link in soup.find_all("link", href=True):
        href = link.get("href", "")
        if href.endswith("fjern-toppmeny.css") or href.endswith(CSS_NAME):
            link.decompose()

    depth = len(html.relative_to(ROOT).parents) - 1
    prefix = "../" * depth
    css_href = f"{prefix}assets/{CSS_NAME}"
    new_link = soup.new_tag("link", rel="stylesheet", href=css_href)
    if soup.head:
        soup.head.append(new_link)

    # Tomme, skjulte kompatibilitetselementer hindrer at eldre JS stopper resten av siden.
    # De inneholder ingen tekst, lenker eller menyinnhold.
    body = soup.body
    if body:
        if not soup.find(id="menuButton"):
            button = soup.new_tag("button", id="menuButton")
            button["type"] = "button"
            button["hidden"] = ""
            button["aria-hidden"] = "true"
            button["class"] = "regninga-menu-compat"
            body.append(button)
        if not soup.find(id="mainNav"):
            nav = soup.new_tag("nav", id="mainNav")
            nav["hidden"] = ""
            nav["aria-hidden"] = "true"
            nav["class"] = "regninga-menu-compat"
            body.append(nav)

    rendered = str(soup)
    if rendered != original:
        backup = BACKUP / html.relative_to(ROOT)
        backup.parent.mkdir(parents=True, exist_ok=True)
        if not backup.exists():
            shutil.copy2(html, backup)
        html.write_text(rendered, encoding="utf-8")
        changed.append(str(html.relative_to(ROOT)))

# Fjern utdaterte, separate meny-patcher dersom de finnes.
for obsolete in [
    ASSETS / "fjern-toppmeny.css",
    ROOT / "assets" / "banken-config.js",
]:
    if obsolete.exists():
        obsolete.unlink()

print(f"Ferdig. Oppdaterte {len(changed)} HTML-filer.")
for name in changed:
    print(f"  - {name}")
print("Toppområdet inneholder nå bare logo/merkenavn. Ingen menytekst vises.")
