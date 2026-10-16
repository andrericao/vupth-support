// "Cupons e promoções" (SUP-10): lê GET /campaigns/active (público) e mostra por perfil.
// Campos conforme o Backend (backend.html, Solicitadas 15/10 16h15, 4a94610 + 2dd32f9).
// Desligada até a branch `campanhas` do Backend subir.
(function () {
  "use strict";
  var ENDPOINT = "https://vupth-backend-ia.onrender.com/campaigns/active";
  var ATIVO = false;

  var AUDIENCIA = { cliente: "CLIENT", profissional: "PROFESSIONAL", dono: "OWNER" };
  var DIAS = { MONDAY: "segunda", TUESDAY: "terça", WEDNESDAY: "quarta", THURSDAY: "quinta", FRIDAY: "sexta", SATURDAY: "sábado", SUNDAY: "domingo" };

  var aviso = document.getElementById("aviso");
  var lista = document.getElementById("lista");
  var todas = [];

  function reais(v) { return "R$ " + Number(v).toFixed(2).replace(".", ","); }

  function ganho(c) {
    var valor = c.value_percent != null ? c.value_percent + "%" : c.value_amount != null ? reais(c.value_amount) : "";
    if (c.type === "DISCOUNT") return "Desconto de " + valor + " no corte";
    if (c.type === "FEE_WAIVER") return "Sem a taxa do app";
    if (c.type === "REFERRAL_BONUS") return valor + " por cliente indicado";
    return valor || null;
  }
  function data(iso) {
    var d = new Date(iso);
    return isNaN(d) ? null : d.toLocaleDateString("pt-BR");
  }
  function linha(rotulo, valor) {
    if (valor == null || valor === "") return null;
    var p = document.createElement("p");
    var b = document.createElement("b");
    b.textContent = rotulo + ": ";
    p.appendChild(b);
    p.appendChild(document.createTextNode(valor));
    return p;
  }
  function mostra(perfil) {
    lista.textContent = "";
    var itens = todas.filter(function (c) { return !c.audience || c.audience === AUDIENCIA[perfil]; });
    if (!itens.length) { lista.textContent = "Nenhuma campanha ativa para este perfil agora."; return; }
    itens.forEach(function (c) {
      var card = document.createElement("article");
      var h = document.createElement("h2");
      h.textContent = c.name;
      card.appendChild(h);
      var dias = c.weekdays ? c.weekdays.split(",").map(function (d) { return DIAS[d.trim()] || d; }).join(", ") : null;
      var vagas = c.remaining_slots != null ? c.remaining_slots + (c.max_redemptions != null ? " de " + c.max_redemptions : "") : null;
      [
        linha("O que você ganha", ganho(c)),
        linha("Regras", c.description),
        linha("Só para quem nunca cortou pelo app", c.new_clients_only ? "sim" : null),
        linha("Dias da semana", dias),
        linha("Válida até", c.ends_at ? data(c.ends_at) : null),
        linha("Vagas restantes", vagas),
        linha("Como participar", c.code ? "digite o cupom " + c.code + " no app (Perfil > Promoções)" : null),
      ].forEach(function (p) { if (p) card.appendChild(p); });
      lista.appendChild(card);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-perfil]"), function (b) {
    b.addEventListener("click", function () { mostra(b.getAttribute("data-perfil")); });
  });

  if (!ATIVO) {
    aviso.textContent = "Os cupons e promoções ainda não estão disponíveis aqui. Volte em breve.";
    return;
  }
  fetch(ENDPOINT).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (d) { todas = Array.isArray(d) ? d : []; mostra("cliente"); })
    .catch(function () { aviso.textContent = "Não foi possível carregar os cupons e promoções agora."; });
})();
