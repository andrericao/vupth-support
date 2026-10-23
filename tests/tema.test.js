const fs = require("fs");
const path = require("path");

const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, "tokens.json"), "utf8"));
const css = fs.readFileSync(path.join(__dirname, "..", "estilo.css"), "utf8");

const PARES = {
  green: "brand-green", onGreen: "on-green", greenTint: "green-tint", onGreenTint: "on-green-tint",
  background: "bg", surface: "surface", surfaceAlt: "surface-alt", textPrimary: "text-primary",
  textSecondary: "text-secondary", textPlaceholder: "text-placeholder", border: "border",
  danger: "danger", dangerTint: "danger-tint",
};

const vars = (bloco) => Object.fromEntries([...bloco.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const claro = vars(css.match(/:root \{([\s\S]*?)\n\}/)[1]);
const escuro = vars(css.match(/prefers-color-scheme: dark\) \{\s*:root \{([\s\S]*?)\n {2}\}/)[1]);

const luz = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const razao = (a, b) => {
  const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe("tema do tokens.json", () => {
  test.each(Object.entries(PARES))("%s bate nos dois temas", (token, variavel) => {
    expect(claro[variavel].toLowerCase()).toBe(tokens.cor[token].claro.toLowerCase());
    expect(escuro[variavel].toLowerCase()).toBe(tokens.cor[token].escuro.toLowerCase());
  });

  test("escala de texto, espaço e raio vêm do arquivo", () => {
    Object.entries(tokens.tipografia.escala).forEach(([k, v]) => expect(claro[`fs-${k}`]).toBe(`${v.px}px`));
    Object.entries(tokens.raio).forEach(([k, v]) => expect(claro[`radius-${k}`]).toBe(`${v}px`));
    const usados = Object.entries(claro).filter(([k]) => /^sp-/.test(k)).map(([, v]) => parseInt(v, 10));
    const permitidos = [...Object.values(tokens.espaco), ...Object.keys(tokens.ritmo).map(Number)];
    usados.forEach((px) => expect(permitidos).toContain(px));
  });

  test("fontes: família de cada papel", () => {
    expect(claro["font-heading"]).toContain("Archivo");
    expect(claro["font-body"]).toContain("Inter");
    expect(claro["font-mono"]).toContain("DM Mono");
  });

  test.each(tokens.verificacao.filter((v) => PARES[v.texto] && PARES[v.fundo]))(
    "contraste $texto sobre $fundo ($tema)", (v) => {
      const t = v.tema === "claro" ? claro : escuro;
      expect(razao(t[PARES[v.texto]], t[PARES[v.fundo]])).toBeGreaterThanOrEqual(v.minimo);
    });

  test("nenhuma cor escrita à mão fora das variáveis", () => {
    const fora = css.replace(/:root \{[\s\S]*?\n\}/, "").replace(/@media \(prefers-color-scheme: dark\) \{[\s\S]*?\n {2}\}\n\}/, "");
    expect(fora.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull();
    expect(fora.match(/rgba?\(/g)).toBeNull();
  });

  test("a cópia confere com a fonte, quando o vupth-docs está ao lado", () => {
    const fonte = path.join(__dirname, "..", "..", "vupth-docs", "fontes", "design", "tokens.json");
    if (!fs.existsSync(fonte)) return;
    expect(JSON.parse(fs.readFileSync(fonte, "utf8"))).toEqual(tokens);
  });
});
