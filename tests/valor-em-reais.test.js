const fs = require("fs");
const path = require("path");
const { pagina, espera } = require("./ajuda");

const raiz = path.resolve(__dirname, "..");

function arquivos(dir, achados) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    if (["node_modules", "coverage", ".git", "tests"].includes(e.name)) return;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) arquivos(p, achados);
    else if (/\.(html|js|json)$/.test(e.name) && e.name !== "package-lock.json") achados.push(p);
  });
  return achados;
}

describe("valor em reais padronizado", () => {
  test("todo valor do site é 'R$ 53,90' ou 'R$ 1.234,56'", () => {
    const erros = [];
    arquivos(raiz, []).forEach((p) => {
      (fs.readFileSync(p, "utf8").match(/R\$\s?\d[\d.,]*/g) || []).forEach((v) => {
        const limpo = v.replace(/[.,]+$/, "");
        if (!/^R\$ \d{1,3}(\.\d{3})*,\d{2}$/.test(limpo)) erros.push(path.relative(raiz, p) + ": " + v);
      });
    });
    expect(erros).toEqual([]);
  });

  test("campanhas.js escreve o valor com vírgula e ponto de milhar", async () => {
    pagina("campanhas.html", "/campanhas.html");
    const fonte = fs.readFileSync(path.join(raiz, "campanhas.js"), "utf8");
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { name: "A", type: "DISCOUNT", value_amount: 5, audience: "CLIENT" },
        { name: "B", type: "DISCOUNT", value_amount: 1234.5, audience: "CLIENT" },
        { name: "C", type: "REFERRAL_BONUS", value_amount: 1234567.891, audience: "CLIENT" },
        { name: "D", type: "DISCOUNT", value_amount: -2, audience: "CLIENT" },
      ]),
    }));
    new Function(fonte)();
    await espera();
    const texto = document.getElementById("lista").textContent;
    expect(texto).toContain("Desconto de R$ 5,00 no corte");
    expect(texto).toContain("Desconto de R$ 1.234,50 no corte");
    expect(texto).toContain("R$ 1.234.567,89 por cliente indicado");
    expect(texto).toContain("Desconto de -R$ 2,00 no corte");
  });
});
