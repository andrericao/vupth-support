const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const paginas = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  if (["node_modules", "coverage", ".git"].includes(e.name)) return [];
  const p = path.join(dir, e.name);
  return e.isDirectory() ? paginas(p) : p.endsWith(".html") ? [p] : [];
});

describe("logotipo VUPTH em todas as abas (logotipo-nas-abas)", () => {
  test.each(paginas(raiz).map((p) => [path.relative(raiz, p), p]))("%s tem o logotipo", (_, p) => {
    const html = fs.readFileSync(p, "utf8");
    expect(/class="marca"><img src="\/marca\/v\.svg"|class="topo-marca"><a href="\/index\.html" class="marca-link"><span class="logo-v"/.test(html)).toBe(true);
  });

  test("o logotipo é o da Design (byte a byte)", () => {
    const da = path.join(raiz, "..", "vupth-docs", "fontes", "design", "marca", "v.svg");
    if (!fs.existsSync(da)) return;
    expect(fs.readFileSync(path.join(raiz, "marca", "v.svg"))).toEqual(fs.readFileSync(da));
  });
});
