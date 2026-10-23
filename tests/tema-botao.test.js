const { pagina, roda } = require("./ajuda");

const raiz = document.documentElement;
const botoes = () => [...document.querySelectorAll(".tema-ctl button")];
const marcado = () => botoes().find((b) => b.getAttribute("aria-pressed") === "true").dataset.tema;

beforeEach(() => {
  localStorage.clear();
  raiz.removeAttribute("data-tema");
  document.body.innerHTML = "";
});

describe("alternar tema", () => {
  test("sem escolha, segue o sistema e o botão 'Sistema' fica marcado", () => {
    pagina("artigos/cliente/multas.html", "/artigos/cliente/multas.html");
    roda("tema.js");
    expect(raiz.hasAttribute("data-tema")).toBe(false);
    expect(botoes().map((b) => b.textContent)).toEqual(["Claro", "Escuro", "Sistema"]);
    expect(marcado()).toBe("sistema");
    expect(document.querySelector("main").firstElementChild.className).toBe("tema-ctl");
  });

  test("escolher escuro aplica, marca e guarda; sistema volta ao padrão", () => {
    pagina("artigos/cliente/multas.html", "/artigos/cliente/multas.html");
    roda("tema.js");
    botoes()[1].click();
    expect(raiz.getAttribute("data-tema")).toBe("escuro");
    expect(marcado()).toBe("escuro");
    expect(localStorage.getItem("vupth-tema")).toBe("escuro");
    botoes()[2].click();
    expect(raiz.hasAttribute("data-tema")).toBe(false);
    expect(localStorage.getItem("vupth-tema")).toBe("sistema");
  });

  test("a escolha guardada vale já ao carregar", () => {
    localStorage.setItem("vupth-tema", "claro");
    pagina("index.html", "/index.html");
    roda("tema.js");
    expect(raiz.getAttribute("data-tema")).toBe("claro");
    expect(marcado()).toBe("claro");
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
    expect(raiz.getAttribute("data-tema")).toBe("claro");
    get.mockRestore();
    set.mockRestore();
  });

  test("página sem <main> nem .topo não quebra", () => {
    document.body.innerHTML = "<p>oi</p>";
    expect(() => roda("tema.js")).not.toThrow();
    expect(botoes()).toHaveLength(0);
  });
});
