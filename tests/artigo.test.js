const { pagina, roda, indice, fetchFalso, espera } = require("./ajuda");

async function abre(arquivo, url) {
  pagina(arquivo, url);
  fetchFalso({ "indice-cliente": indice("indice-cliente.json"), "indice-parceiro": indice("indice-parceiro.json"), "/vote": { status: 204 } });
  roda("artigo.js");
  await espera();
}

beforeEach(() => { localStorage.clear(); });

describe("artigo", () => {
  test("monta árvore, 'Nesta página', cartões e rodapé", async () => {
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    expect(document.querySelector("nav.arvore")).not.toBeNull();
    expect(document.querySelector("nav.indice")).not.toBeNull();
    expect(document.querySelector(".cartoes")).not.toBeNull();
    expect(document.querySelector(".util")).not.toBeNull();
    expect(document.querySelector(".arvore li.aqui")).not.toBeNull();
  });

  test("laterais recolhidas mostram o rótulo ao lado da seta", async () => {
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    const botoes = document.querySelectorAll(".arvore-botao, .indice-botao");
    expect(botoes.length).toBe(2);
    botoes.forEach((b) => expect(b.querySelector(".rot")).not.toBeNull());
    expect(document.querySelector(".arvore-botao").textContent).toMatch(/»\s+Assuntos/);
    expect(document.querySelector(".indice-botao").textContent).toMatch(/«\s+Nesta página/);
  });

  test("artigo que depende de outro mostra 'Antes disso' com o título real", async () => {
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    const antes = document.querySelector(".antes");
    expect(antes).not.toBeNull();
    expect(antes.querySelectorAll("a").length).toBe(3);
    expect(antes.textContent).toMatch(/Criar a sua conta/);
  });

  test("👍 e 👎 enviam o voto ao Backend e guardam no aparelho", async () => {
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    const [sim, nao] = document.querySelectorAll(".util button");
    sim.click();
    let [url, op] = fetch.mock.calls[fetch.mock.calls.length - 1];
    expect(url).toMatch(/\/support\/articles\/cliente-entrar-na-fila\/vote$/);
    expect(JSON.parse(op.body)).toEqual({ vote: "UP" });
    expect(localStorage.getItem("ajudou:cliente/entrar-na-fila")).toBe("sim");
    expect(document.querySelector(".util p").textContent).toBe("Obrigado pelo retorno.");
    nao.click();
    [, op] = fetch.mock.calls[fetch.mock.calls.length - 1];
    expect(JSON.parse(op.body)).toEqual({ vote: "DOWN" });
  });

  test("quem já votou vê o agradecimento", async () => {
    localStorage.setItem("ajudou:cliente/entrar-na-fila", "sim");
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    expect(document.querySelector(".util p").textContent).toBe("Obrigado pelo retorno.");
  });

  test("falha de rede no voto não quebra", async () => {
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    global.fetch = jest.fn(() => Promise.reject(new Error("rede")));
    document.querySelector(".util button").click();
    await espera();
    expect(document.querySelector(".util p").textContent).toBe("Obrigado pelo retorno.");
  });

  test("laterais recolhem e lembram o estado", async () => {
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    const arvore = document.querySelector("nav.arvore");
    const botao = arvore.querySelector(".arvore-botao");
    const antes = arvore.classList.contains("fechado");
    botao.click();
    expect(arvore.classList.contains("fechado")).toBe(!antes);
    expect(localStorage.getItem("vupth-suporte-lado-esq")).toBe(antes ? "0" : "1");
    const indiceLateral = document.querySelector("nav.indice");
    indiceLateral.querySelector(".indice-botao").click();
    expect(localStorage.getItem("vupth-suporte-lado-dir")).not.toBeNull();
  });

  test("estado guardado manda sobre o tamanho da tela", async () => {
    localStorage.setItem("vupth-suporte-lado-esq", "1");
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    expect(document.querySelector("nav.arvore").classList.contains("fechado")).toBe(true);
  });

  test("artigo do Partner usa o índice do parceiro", async () => {
    await abre("artigos/parceiro/atrasos.html", "/artigos/parceiro/atrasos.html");
    expect(document.querySelector("nav.arvore")).not.toBeNull();
  });

  test("página sem main.artigo é ignorada", () => {
    pagina("index.html", "/");
    roda("artigo.js");
    expect(document.querySelector("nav.arvore")).toBeNull();
  });
});

describe("artigo: seção atual marcada pelo scroll", () => {
  test("o observador marca o item visível no 'Nesta página'", async () => {
    let cb;
    global.IntersectionObserver = jest.fn(function (f) { cb = f; this.observe = jest.fn(); });
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    const alvo = document.querySelector("main.artigo h2, main.artigo ol > li");
    cb([{ target: alvo, isIntersecting: true }]);
    expect(document.querySelectorAll(".indice li.atual").length).toBe(1);
    cb([{ target: { id: "inexistente" }, isIntersecting: false }, { target: alvo, isIntersecting: false }]);
    delete global.IntersectionObserver;
  });
});
