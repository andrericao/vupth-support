// "Campanhas ativas" (SUP-10): lê GET /campaigns/active (público) e mostra por perfil.
// Desligada até o Backend subir o endpoint. Nomes dos campos: a confirmar com o Backend
// (por isso a leitura tolera apelidos).
(function () {
  "use strict";
  var ENDPOINT = "https://vupth-backend-ia.onrender.com/campaigns/active";
  var ATIVO = false;
  var aviso = document.getElementById("aviso");
  var lista = document.getElementById("lista");
  var todas = [];

  function pega(c, nomes) {
    for (var i = 0; i < nomes.length; i++) if (c[nomes[i]] != null && c[nomes[i]] !== "") return c[nomes[i]];
    return null;
  }
  function linha(rotulo, valor) {
    if (valor == null) return null;
    var p = document.createElement("p");
    var b = document.createElement("b");
    b.textContent = rotulo + ": ";
    p.appendChild(b);
    p.appendChild(document.createTextNode(String(valor)));
    return p;
  }
  function daPessoa(c, perfil) {
    var alvo = pega(c, ["audience", "perfil", "role", "target"]);
    if (alvo == null) return true;
    var lista = [].concat(alvo).map(function (x) { return String(x).toLowerCase(); });
    return lista.some(function (x) {
      return x === "all" || x === "todos" || x.indexOf(perfil === "profissional" ? "profess" : perfil) === 0 ||
        (perfil === "profissional" && x.indexOf("barber") === 0) || (perfil === "dono" && x.indexOf("owner") === 0) ||
        (perfil === "cliente" && x.indexOf("client") === 0);
    });
  }
  function mostra(perfil) {
    lista.textContent = "";
    var itens = todas.filter(function (c) { return daPessoa(c, perfil); });
    if (!itens.length) { lista.textContent = "Nenhuma campanha ativa para este perfil agora."; return; }
    itens.forEach(function (c) {
      var card = document.createElement("article");
      var h = document.createElement("h2");
      h.textContent = pega(c, ["name", "nome", "title"]) || "Campanha";
      card.appendChild(h);
      [
        linha("O que você ganha", pega(c, ["reward", "benefit", "description", "descricao"])),
        linha("Regras", pega(c, ["rules", "regras"])),
        linha("Válida até", pega(c, ["endsAt", "validUntil", "validade"])),
        linha("Vagas restantes", pega(c, ["remaining", "slotsLeft", "vagas"])),
        linha("Como participar", pega(c, ["code", "cupom"]) ? "digite o cupom " + pega(c, ["code", "cupom"]) + " no app" : null),
      ].forEach(function (p) { if (p) card.appendChild(p); });
      lista.appendChild(card);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-perfil]"), function (b) {
    b.addEventListener("click", function () { mostra(b.getAttribute("data-perfil")); });
  });

  if (!ATIVO) {
    aviso.textContent = "As campanhas ainda não estão disponíveis aqui. Volte em breve.";
    return;
  }
  fetch(ENDPOINT).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (d) { todas = Array.isArray(d) ? d : (d && d.campaigns) || []; mostra("cliente"); })
    .catch(function () { aviso.textContent = "Não foi possível carregar as campanhas agora."; });
})();
