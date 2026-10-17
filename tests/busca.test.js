const { pagina, roda, indice, fetchFalso, espera } = require("./ajuda");

async function abre(url) {
  pagina("index.html", url);
  fetchFalso({ "indice-cliente": indice("indice-cliente.json"), "indice-parceiro": indice("indice-parceiro.json") });
  roda("busca.js");
  document.dispatchEvent(new Event("DOMContentLoaded"));
  await espera();
}
function digita(texto) {
  const c = document.getElementById("busca");
  c.value = texto;
  c.dispatchEvent(new Event("input"));
}
const textos = (sel) => Array.from(document.querySelectorAll(sel)).map((e) => e.textContent);

describe("busca", () => {
  test("home mostra os três perfis", async () => {
    await abre("/");
    expect(textos("#categorias h2, #categorias a").join(" ")).toMatch(/Cliente[\s\S]*Profissional[\s\S]*Dono/);
  });

  test("achar sem acento nem maiúscula", async () => {
    await abre("/");
    digita("MULTA");
    expect(document.getElementById("resultados-bloco").hidden).toBe(false);
    expect(textos("#resultados a").join(" ")).toMatch(/[Mm]ulta/);
  });

  test("termo vazio volta às categorias", async () => {
    await abre("/");
    digita("multa");
    digita("");
    expect(document.getElementById("resultados-bloco").hidden).toBe(true);
    expect(document.getElementById("categorias").hidden).toBe(false);
  });

  test("erro de digitação sugere um termo parecido e o clique busca", async () => {
    await abre("/");
    digita("multaa");
    const sug = document.querySelector("#resultados .vazio a");
    expect(sug).not.toBeNull();
    sug.dispatchEvent(new Event("click", { cancelable: true }));
    expect(document.getElementById("busca").value).toBe(sug.textContent);
    expect(textos("#resultados a").length).toBeGreaterThan(0);
  });

  test("sem resultado nem sugestão", async () => {
    await abre("/");
    digita("zzzzzzzzzz");
    expect(document.getElementById("resultados-titulo").textContent).toBe("Nada encontrado");
    expect(textos("#resultados .vazio").join(" ")).toMatch(/Tente outras palavras/);
  });

  test("?q= já busca ao abrir", async () => {
    await abre("/?q=fila");
    expect(document.getElementById("busca").value).toBe("fila");
    expect(document.getElementById("resultados-bloco").hidden).toBe(false);
  });

  test("perfil na URL mostra a trilha e as abas, e a busca filtra pelo perfil", async () => {
    await abre("/profissional/regulamentos");
    expect(document.getElementById("trilha").hidden).toBe(false);
    expect(document.getElementById("titulo").textContent).toBe("Profissional: regulamentos");
    digita("fila");
    const hrefs = Array.from(document.querySelectorAll("#resultados a")).map((a) => a.getAttribute("href"));
    expect(hrefs.length).toBeGreaterThan(0);
    hrefs.forEach((h) => expect(h).toMatch(/\/parceiro\//));
  });

  test("perfil por query string (servidor local)", async () => {
    await abre("/?perfil=dono");
    expect(document.getElementById("titulo").textContent).toBe("Dono");
  });

  test("índice indisponível não quebra a página", async () => {
    pagina("index.html", "/");
    fetchFalso({ "indice-cliente": { status: 500 } });
    roda("busca.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));
    await espera();
    expect(document.getElementById("categorias").children.length).toBeGreaterThan(0);
  });
});
