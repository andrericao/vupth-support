const { pagina, roda, fetchFalso, espera } = require("./ajuda");

function preenche(valores) {
  const f = document.getElementById("form");
  Object.keys(valores).forEach((k) => { f.elements[k].value = valores[k]; });
  return f;
}
const completo = { nome: "Ana", email: "ana@x.com", assunto: "Oi", mensagem: "Olá" };

describe("contato", () => {
  test("link do app pré-seleciona perfil, categoria e assunto do feedback", () => {
    pagina("contato.html", "/contato.html?perfil=profissional&categoria=feedback");
    roda("contato.js");
    const f = document.getElementById("form");
    expect(f.elements.perfil.value).toBe("profissional");
    expect(f.elements.categoria.value).toBe("FEEDBACK");
    expect(f.elements.assunto.value).toBe("Feedback sobre o app");
  });

  test("valores desconhecidos na URL são ignorados", () => {
    pagina("contato.html", "/contato.html?perfil=xyz&categoria=nada");
    roda("contato.js");
    const f = document.getElementById("form");
    expect(f.elements.perfil.value).toBe("cliente");
    expect(f.elements.categoria.value).toBe("DUVIDA");
    expect(f.elements.assunto.value).toBe("");
  });

  test("campos vazios: pede para preencher e não envia", () => {
    pagina("contato.html", "/contato.html");
    fetchFalso({});
    roda("contato.js");
    preenche({ nome: "Ana" });
    document.getElementById("form").dispatchEvent(new Event("submit", { cancelable: true }));
    expect(document.getElementById("aviso").textContent).toBe("Preencha todos os campos.");
    expect(fetch).not.toHaveBeenCalled();
  });

  test.each([
    [204, "Mensagem enviada. Respondemos por e-mail."],
    [422, "Confira os campos e tente de novo."],
    [429, "Muitas mensagens em pouco tempo. Tente mais tarde."],
    [500, "Não foi possível enviar agora. Tente de novo em instantes."],
  ])("resposta %i do Backend", async (status, texto) => {
    pagina("contato.html", "/contato.html");
    fetchFalso({ "/support/contact": { status } });
    roda("contato.js");
    preenche({ ...completo, categoria: "PAGAMENTO" });
    document.getElementById("form").dispatchEvent(new Event("submit", { cancelable: true }));
    await espera();
    const [url, op] = fetch.mock.calls[0];
    expect(url).toMatch(/\/support\/contact$/);
    expect(JSON.parse(op.body)).toMatchObject({ nome: "Ana", categoria: "PAGAMENTO", perfil: "cliente" });
    expect(document.getElementById("aviso").textContent).toBe(texto);
    expect(document.getElementById("enviar").disabled).toBe(false);
  });

  test("sem conexão", async () => {
    pagina("contato.html", "/contato.html");
    fetchFalso({});
    roda("contato.js");
    preenche(completo);
    document.getElementById("form").dispatchEvent(new Event("submit", { cancelable: true }));
    await espera();
    expect(document.getElementById("aviso").textContent).toBe("Sem conexão. Tente de novo.");
  });
});

describe("sem explicação de servidor acordando", () => {
  test("o site não menciona 'preparando servidor'", () => {
    const fs = require("fs");
    const path = require("path");
    const raiz = path.resolve(__dirname, "..");
    const achados = [];
    (function varre(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (!["node_modules", ".git", "coverage", "tests"].includes(e.name)) varre(p); return; }
        if (/\.(html|js|json)$/.test(e.name) && e.name !== "package-lock.json" && /preparando servidor|servidor (dorme|est[aá] acordando)/i.test(fs.readFileSync(p, "utf8"))) achados.push(path.relative(raiz, p));
      });
    })(raiz);
    expect(achados).toEqual([]);
  });
});
