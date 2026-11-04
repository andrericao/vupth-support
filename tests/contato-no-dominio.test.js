const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
function arquivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (["node_modules", "coverage", ".git", "tests"].includes(e.name)) return [];
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return arquivos(p);
    return /\.(html|js|json)$/.test(e.name) ? [p] : [];
  });
}

describe("contato no domínio (DEC-180, DEC-169)", () => {
  test.each(["index.html", "contato.html"])("%s mostra contato@vupth.com", (f) => {
    const html = fs.readFileSync(path.join(raiz, f), "utf8");
    expect(html).toContain('href="mailto:contato@vupth.com"');
  });

  test("nenhum outro e-mail aparece no site", () => {
    const outros = arquivos(raiz)
      .filter((f) => !/package(-lock)?\.json$|eslint\.config\.js$|jest\.config\.js$/.test(f))
      .flatMap((f) => (fs.readFileSync(f, "utf8").match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [])
        .filter((m) => m !== "contato@vupth.com")
        .map((m) => `${path.relative(raiz, f)}: ${m}`));
    expect(outros).toEqual([]);
  });
});
