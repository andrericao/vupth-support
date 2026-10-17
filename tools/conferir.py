#!/usr/bin/env python3
"""Confere o site estático: índices x artigos, links internos e ids repetidos."""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
erros = []


class Lê(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.ids = [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.append(a["id"])
        for k in ("href", "src"):
            if a.get(k):
                self.links.append(a[k])


def alvo(origem, ref):
    ref = ref.split("#")[0].split("?")[0]
    if not ref:
        return None
    return RAIZ / ref.lstrip("/") if ref.startswith("/") else origem.parent / ref


htmls = sorted(p for p in RAIZ.rglob("*.html") if ".git" not in p.parts and "node_modules" not in p.parts)
for p in htmls:
    l = Lê()
    l.feed(p.read_text(encoding="utf-8"))
    rel = p.relative_to(RAIZ)
    for i in {i for i in l.ids if l.ids.count(i) > 1}:
        erros.append(f"{rel}: id repetido '{i}'")
    for ref in l.links:
        if re.match(r"^(https?:|mailto:|tel:|data:|javascript:|#)", ref) or not ref:
            continue
        t = alvo(p, ref)
        if t is None:
            continue
        if t.is_dir():
            t = t / "index.html"
        if not t.exists() and not t.with_suffix(".html").exists():
            erros.append(f"{rel}: link quebrado '{ref}'")

indexados = set()
for nome in ("indice-cliente.json", "indice-parceiro.json"):
    for x in json.loads((RAIZ / nome).read_text(encoding="utf-8")):
        indexados.add(x["arquivo"])
        for c in ("arquivo", "titulo", "resumo", "palavras", "categoria", "publico"):
            if not x.get(c):
                erros.append(f"{nome}: '{x.get('arquivo')}' sem '{c}'")
        if not (RAIZ / x["arquivo"]).exists():
            erros.append(f"{nome}: arquivo inexistente '{x['arquivo']}'")

for p in sorted((RAIZ / "artigos").rglob("*.html")):
    if str(p.relative_to(RAIZ)) not in indexados:
        erros.append(f"artigo fora dos índices: {p.relative_to(RAIZ)}")

print("\n".join(erros) if erros else f"ok: {len(htmls)} páginas, {len(indexados)} artigos indexados")
sys.exit(1 if erros else 0)
