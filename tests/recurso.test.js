const { pagina, roda, indice, fetchFalso, espera } = require("./ajuda");

const ARQ = "artigos/recursos/profissional-paga-taxa.html";
const CAMINHO = "recursos/profissional-paga-taxa";

async function abreArtigo(mapa) {
  pagina(ARQ, "/" + ARQ);
  fetchFalso(mapa);
  roda("recurso.js");
  await espera();
  await espera();
}
const principal = () => document.querySelector("main.artigo");

describe("artigo de recurso (a chave só exibe ou oculta)", () => {
  test("chave ligada para todos: artigo visível, sem faixa", async () => {
    await abreArtigo({ "/features/articles": [{ key: "profissional_paga_taxa", article_path: CAMINHO, profiles: [], release: "ALL" }] });
    expect(principal().hidden).toBe(false);
    expect(principal().querySelector(".faixa-parcial")).toBeNull();
    expect(principal().querySelector("h1").textContent).toMatch(/Taxas do app/);
  });

  test("chave ligada para alguém: faixa 'ainda não foi disponibilizado para todos'", async () => {
    await abreArtigo({ "/features/articles": [{ key: "profissional_paga_taxa", article_path: CAMINHO, profiles: [], release: "PARTIAL" }] });
    expect(principal().hidden).toBe(false);
    expect(principal().querySelector(".faixa-parcial").textContent).toMatch(/ainda não foi disponibilizado para todos/);
  });

  test("chave desligada (fora da lista): link direto mostra 'ainda não está disponível'", async () => {
    await abreArtigo({ "/features/articles": [] });
    expect(principal().hidden).toBe(false);
    expect(principal().textContent).toMatch(/Este assunto ainda não está disponível/);
    expect(principal().textContent).not.toMatch(/O que são as taxas/);
  });

  test("sem resposta do Backend: artigo oculto", async () => {
    await abreArtigo({ "/features/articles": { status: 503 } });
    expect(principal().textContent).toMatch(/ainda não está disponível/);
  });

  test("rede fora: artigo oculto", async () => {
    await abreArtigo({});
    expect(principal().textContent).toMatch(/ainda não está disponível/);
  });

  test("página sem data-recurso não é tocada", () => {
    pagina("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    fetchFalso({});
    roda("recurso.js");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("busca e índice com recursos", () => {
  async function abre(visiveis) {
    pagina("index.html", "/");
    fetchFalso({
      "indice-cliente": indice("indice-cliente.json"),
      "indice-parceiro": indice("indice-parceiro.json"),
      "indice-recursos": indice("indice-recursos.json"),
      "/features/articles": visiveis,
    });
    roda("busca.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));
    await espera();
    await espera();
  }
  function digita(t) {
    const c = document.getElementById("busca");
    c.value = t;
    c.dispatchEvent(new Event("input"));
  }
  const achados = () => Array.from(document.querySelectorAll("#resultados a")).map((a) => a.textContent).join(" ");

  test("chave desligada: o artigo não aparece na busca", async () => {
    await abre([]);
    digita("riscada");
    expect(achados()).not.toMatch(/Taxas do app/);
  });

  test("chave ligada para todos: aparece, sem 'Em liberação'", async () => {
    await abre([{ article_path: CAMINHO, release: "ALL" }]);
    digita("riscada");
    expect(achados()).toMatch(/Taxas do app/);
    expect(document.getElementById("resultados").textContent).not.toMatch(/Em liberação/);
  });

  test("chave parcial: aparece com 'Em liberação'", async () => {
    await abre([{ article_path: CAMINHO, release: "PARTIAL" }]);
    digita("riscada");
    expect(document.getElementById("resultados").textContent).toMatch(/Em liberação/);
  });

  test("chave desligada: fora da lista do perfil", async () => {
    pagina("index.html", "/profissional/passo-a-passo");
    fetchFalso({ "indice-cliente": [], "indice-parceiro": indice("indice-parceiro.json"), "indice-recursos": indice("indice-recursos.json"), "/features/articles": [] });
    roda("busca.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));
    await espera();
    await espera();
    expect(document.getElementById("categorias").textContent).not.toMatch(/Taxas do app/);
  });
});
