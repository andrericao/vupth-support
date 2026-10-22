const { pagina, roda, indice, fetchFalso, espera } = require("./ajuda");

async function abre(arquivo, url) {
  pagina(arquivo, url);
  fetchFalso({ "indice-cliente": indice("indice-cliente.json"), "indice-parceiro": indice("indice-parceiro.json"), "/vote": { status: 204 } });
  roda("artigo.js");
  await espera();
}

beforeEach(() => { localStorage.clear(); window.innerWidth = 1024; });

describe("artigo", () => {
  test("monta árvore, 'Nesta página', cartões e rodapé", async () => {
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    expect(document.querySelector("nav.arvore")).not.toBeNull();
    expect(document.querySelector("nav.indice")).not.toBeNull();
    expect(document.querySelector(".cartoes")).not.toBeNull();
    expect(document.querySelector(".util")).not.toBeNull();
    expect(document.querySelector(".arvore li.aqui")).not.toBeNull();
  });

  test("laterais têm o controle no pé, com rótulo e tooltip", async () => {
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    const ctls = document.querySelectorAll(".lado-ctl");
    expect(ctls.length).toBe(2);
    ctls.forEach((c) => { expect(c.parentElement.lastElementChild).toBe(c); expect(c.title).toMatch(/Recolher|Expandir/); });
    expect(document.querySelectorAll(".lado-abrir").length).toBe(2);
  });

  test("faixa recolhida: ícones com tooltip; o assunto expande a árvore", async () => {
    window.innerWidth = 1400;
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    const arvore = document.querySelector("nav.arvore");
    const ctl = arvore.querySelector(".lado-ctl");
    ctl.click();
    expect(arvore.classList.contains("fechado")).toBe(true);
    expect(ctl.querySelector(".rot").textContent).toBe("Expandir");
    const chip = arvore.querySelector(".trilho .chip");
    expect(chip.title).not.toBe("");
    expect(chip.getAttribute("aria-label")).toBe(chip.title);
    chip.click();
    expect(arvore.classList.contains("fechado")).toBe(false);
    const indiceLateral = document.querySelector("nav.indice");
    const link = indiceLateral.querySelector(".trilho a.chip");
    expect(link.getAttribute("href")).toMatch(/^#/);
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

  test("laterais recolhem e lembram o estado (tela larga)", async () => {
    window.innerWidth = 1400;
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    const arvore = document.querySelector("nav.arvore");
    expect(arvore.classList.contains("fechado")).toBe(false);
    arvore.querySelector(".lado-ctl").click();
    expect(arvore.classList.contains("fechado")).toBe(true);
    expect(localStorage.getItem("vupth-suporte-lado-esq")).toBe("1");
    document.querySelector("nav.indice .lado-ctl").click();
    expect(localStorage.getItem("vupth-suporte-lado-dir")).toBe("1");
  });

  test("estado guardado manda em tela larga", async () => {
    window.innerWidth = 1400;
    localStorage.setItem("vupth-suporte-lado-esq", "1");
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    expect(document.querySelector("nav.arvore").classList.contains("fechado")).toBe(true);
  });

  test("tela estreita: gaveta fechada, abre pelo botão flutuante, fecha por Esc, Fechar e link", async () => {
    window.innerWidth = 600;
    localStorage.setItem("vupth-suporte-lado-esq", "0");
    await abre("artigos/cliente/entrar-na-fila.html", "/artigos/cliente/entrar-na-fila.html");
    const arvore = document.querySelector("nav.arvore");
    const abrir = document.querySelector(".lado-abrir.esq");
    expect(arvore.classList.contains("fechado")).toBe(true);
    expect(abrir.hidden).toBe(false);
    abrir.click();
    expect(arvore.classList.contains("fechado")).toBe(false);
    expect(abrir.hidden).toBe(true);
    expect(arvore.querySelector(".lado-ctl .rot").textContent).toBe("Fechar");
    expect(localStorage.getItem("vupth-suporte-lado-esq")).toBe("0");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(arvore.classList.contains("fechado")).toBe(true);
    abrir.click();
    arvore.querySelector(".lado-ctl").click();
    expect(arvore.classList.contains("fechado")).toBe(true);
    abrir.click();
    const a = arvore.querySelector(".arvore-corpo a");
    a.addEventListener("click", (e) => e.preventDefault());
    a.click();
    expect(arvore.classList.contains("fechado")).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
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
