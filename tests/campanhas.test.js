const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const espera = () => new Promise((r) => setTimeout(r, 0));

function carrega(resposta) {
  document.documentElement.innerHTML = fs.readFileSync(path.join(raiz, "campanhas.html"), "utf8").replace(/<script[^>]*><\/script>/g, "");
  global.fetch = jest.fn(() => resposta);
  new Function(fs.readFileSync(path.join(raiz, "campanhas.js"), "utf8"))();
}

describe("cards das campanhas ativas", () => {
  test("variedade: cada card ganha uma variante (cor de acento e linha), repetindo a cada cinco", async () => {
    const camp = (n) => ({ name: "C" + n, type: "DISCOUNT", audience: "CLIENT", value_amount: n });
    carrega(Promise.resolve({ ok: true, json: () => Promise.resolve([1, 2, 3, 4, 5, 6].map(camp)) }));
    await espera();
    const classes = [...document.querySelectorAll("#lista article")].map((a) => a.className);
    expect(classes).toEqual(["v0", "v1", "v2", "v3", "v4", "v0"]);
  });

  test("lê a rota pública e mostra o card do perfil", async () => {
    carrega(Promise.resolve({ ok: true, json: () => Promise.resolve([
      { name: "Teste de 10 Reais", description: "Dez reais", type: "DISCOUNT", audience: "CLIENT", value_amount: 10, weekdays: "THURSDAY", code: "TESTE10", max_redemptions: 5, remaining_slots: 4, ends_at: "2026-10-29T02:59:59Z" },
      { name: "Só dono", type: "FEE_WAIVER", audience: "OWNER" },
    ]) }));
    await espera();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/campaigns/active"));
    const lista = document.getElementById("lista");
    expect(lista.querySelectorAll("article")).toHaveLength(1);
    expect(lista.textContent).toContain("Desconto de R$ 10,00 no corte");
    expect(lista.textContent).toContain("quinta");
    expect(lista.textContent).toContain("4 de 5");
    expect(lista.textContent).toContain("TESTE10");
    document.querySelector('[data-perfil="dono"]').click();
    expect(lista.textContent).toContain("Sem a taxa do app");
    document.querySelector('[data-perfil="profissional"]').click();
    expect(lista.textContent).toContain("Nenhuma campanha ativa");
  });

  test("falha da rede mostra aviso em português", async () => {
    carrega(Promise.resolve({ ok: false }));
    await espera();
    expect(document.getElementById("aviso").textContent).toContain("Não foi possível carregar");
  });
});
