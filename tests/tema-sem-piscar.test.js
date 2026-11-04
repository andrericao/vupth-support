// tema-claro-sem-piscar: o tema salvo vale antes da primeira pintura. Um script inline no <head>, antes do CSS,
// põe o data-tema; sem escolha, nada é posto e vale o prefers-color-scheme do estilo.css.
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const paginas = (dir = RAIZ) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return ["node_modules", "coverage", ".git"].includes(e.name) ? [] : paginas(p);
  return e.name.endsWith(".html") ? [path.relative(RAIZ, p)] : [];
});
const inline = (html) => (html.match(/<script>([^<]*vupth-tema[^<]*)<\/script>/) || [])[1];

describe("tema aplicado antes de pintar", () => {
  const todas = paginas();

  test("o site tem páginas", () => expect(todas.length).toBeGreaterThan(10));

  test.each(todas)("%s: script inline do tema no <head>, antes do CSS", (arq) => {
    const html = fs.readFileSync(path.join(RAIZ, arq), "utf8");
    const head = html.slice(0, html.indexOf("</head>"));
    const js = head.indexOf("vupth-tema");
    expect(inline(head)).toBeDefined();
    expect(js).toBeGreaterThan(-1);
    expect(js).toBeLessThan(head.indexOf('rel="stylesheet"'));
  });

  const codigo = inline(fs.readFileSync(path.join(RAIZ, "index.html"), "utf8"));
  const raiz = document.documentElement;
  beforeEach(() => { localStorage.clear(); raiz.removeAttribute("data-tema"); });

  test.each(["claro", "escuro"])("escolha %s salva: aplicada na hora", (tema) => {
    localStorage.setItem("vupth-tema", tema);
    new Function(codigo)();
    expect(raiz.getAttribute("data-tema")).toBe(tema);
  });

  test("sem escolha ou valor estranho: vale o sistema (sem atributo)", () => {
    new Function(codigo)();
    expect(raiz.hasAttribute("data-tema")).toBe(false);
    localStorage.setItem("vupth-tema", "roxo");
    new Function(codigo)();
    expect(raiz.hasAttribute("data-tema")).toBe(false);
  });

  test("sem armazenamento: não quebra a página", () => {
    const orig = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("bloqueado"); } });
    try {
      expect(() => new Function(codigo)()).not.toThrow();
      expect(raiz.hasAttribute("data-tema")).toBe(false);
    } finally {
      Object.defineProperty(window, "localStorage", orig);
    }
  });
});
