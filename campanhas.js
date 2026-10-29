// "Cupons e promoções" (SUP-10): lê GET /campaigns/active (público) e mostra por perfil.
// Campos conforme o Backend (backend.html, Solicitadas 15/10 16h15, 4a94610 + 2dd32f9).
// Ligada: o Backend já serve /campaigns/active em produção (cards-de-campanhas-ativas).
(function () {
  "use strict";
  var ENDPOINT = "https://vupth-backend-ia.onrender.com/campaigns/active";
  var ATIVO = true;

  var AUDIENCIA = { cliente: "CLIENT", profissional: "PROFESSIONAL", dono: "OWNER" };
  var DIAS = { MONDAY: "segunda", TUESDAY: "terça", WEDNESDAY: "quarta", THURSDAY: "quinta", FRIDAY: "sexta", SATURDAY: "sábado", SUNDAY: "domingo" };

  var aviso = document.getElementById("aviso");
  var lista = document.getElementById("lista");
  var todas = [];

  // Sempre "R$ 53,90" e "R$ 1.234,56" (valor-em-reais-padronizado).
  function reais(v) {
    var n = Number(v), p = Math.abs(n).toFixed(2).split(".");
    return (n < 0 ? "-" : "") + "R$ " + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + p[1];
  }

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
    itens.forEach(function (c, i) {
      var card = document.createElement("article");
      card.className = "v" + (i % 5);
      var h = document.createElement("h2");
      h.textContent = c.name;
      card.appendChild(h);
      var g = ganho(c);
      if (g) {
        var v = document.createElement("p");
        v.className = "valor";
        v.textContent = g;
        card.appendChild(v);
      }
      var dias = c.weekdays ? c.weekdays.split(",").map(function (d) { return DIAS[d.trim()] || d; }).join(", ") : null;
      var vagas = c.remaining_slots != null ? c.remaining_slots + (c.max_redemptions != null ? " de " + c.max_redemptions : "") : null;
      [
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
