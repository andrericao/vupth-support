const { pagina, roda } = require("./ajuda");

const raiz = document.documentElement;
const botoes = () => [...document.querySelectorAll(".tema-ctl button")];
const sistemaEscuro = (sim) => { window.matchMedia = (q) => ({ matches: sim && q.includes("dark") }); };

beforeEach(() => {
  localStorage.clear();
  raiz.removeAttribute("data-tema");
  document.body.innerHTML = "";
});

describe("alternar tema", () => {
  afterEach(() => { delete window.matchMedia; });

  test("um só botão; sem escolha segue o sistema e oferece o outro tema", () => {
    sistemaEscuro(false);
    pagina("artigos/cliente/multas.html", "/artigos/cliente/multas.html");
    roda("tema.js");
    expect(raiz.hasAttribute("data-tema")).toBe(false);
    expect(botoes().map((b) => b.textContent)).toEqual(["🌙 Escuro"]);
    expect(document.querySelector(".topo-marca").firstElementChild.className).toBe("tema-ctl");
  });

  test("sistema escuro: o botão oferece Claro", () => {
    sistemaEscuro(true);
    pagina("index.html", "/index.html");
    roda("tema.js");
    expect(botoes()[0].textContent).toBe("☀️ Claro");
  });

  test("clicar alterna claro/escuro, guarda e troca o rótulo", () => {
    sistemaEscuro(false);
    pagina("artigos/cliente/multas.html", "/artigos/cliente/multas.html");
    roda("tema.js");
    botoes()[0].click();
    expect(raiz.getAttribute("data-tema")).toBe("escuro");
    expect(localStorage.getItem("vupth-tema")).toBe("escuro");
    expect(botoes()[0].textContent).toBe("☀️ Claro");
    botoes()[0].click();
    expect(raiz.getAttribute("data-tema")).toBe("claro");
    expect(localStorage.getItem("vupth-tema")).toBe("claro");
    expect(botoes()[0].textContent).toBe("🌙 Escuro");
  });

  test("a escolha guardada vale já ao carregar", () => {
    localStorage.setItem("vupth-tema", "escuro");
    pagina("index.html", "/index.html");
    roda("tema.js");
    expect(raiz.getAttribute("data-tema")).toBe("escuro");
    expect(botoes()[0].textContent).toBe("☀️ Claro");
    expect(document.querySelector(".topo").firstElementChild.className).toBe("tema-ctl");
  });

  test("valor estranho guardado vira sistema", () => {
    localStorage.setItem("vupth-tema", "roxo");
    pagina("index.html", "/index.html");
    roda("tema.js");
    expect(raiz.hasAttribute("data-tema")).toBe(false);
  });

  test("sem localStorage, funciona só na página", () => {
    const get = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("bloqueado"); });
    const set = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("bloqueado"); });
    pagina("index.html", "/index.html");
    roda("tema.js");
    botoes()[0].click();
    expect(raiz.getAttribute("data-tema")).toBe("escuro");
    get.mockRestore();
    set.mockRestore();
  });

  test("página sem <main> nem .topo não quebra", () => {
    document.body.innerHTML = "<p>oi</p>";
    expect(() => roda("tema.js")).not.toThrow();
    expect(botoes()).toHaveLength(0);
  });
});
