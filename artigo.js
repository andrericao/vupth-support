// Artigos: índice lateral recolhível (SUP-2) e caixa "Antes disso" (SUP-4).
(function () {
  "use strict";

  // Artigo -> artigos de que ele depende (no mesmo público). Nome do arquivo sem .html.
  var ANTES = {
    cliente: {
      "entrar-na-conta": ["criar-conta"],
      "esqueci-a-senha": ["criar-conta"],
      "encontrar-uma-loja": ["entrar-na-conta"],
      "entrar-na-fila": ["criar-conta", "entrar-na-conta", "encontrar-uma-loja"],
      "acompanhar-a-vez": ["entrar-na-fila"],
      "mudar-minha-vez": ["entrar-na-fila"],
      "sair-da-fila": ["entrar-na-fila"],
      "solicitar-corte": ["entrar-na-conta", "encontrar-uma-loja"],
      "avaliar-atendimento": ["entrar-na-fila"],
      "atrasos": ["entrar-na-fila"],
      "multas": ["entrar-na-fila"],
      "nao-recebo-avisos": ["notificacoes"],
      "excluir-conta": ["entrar-na-conta"],
      "dados-pessoais": ["entrar-na-conta"],
    },
    parceiro: {
      "atender-a-fila": ["status-e-fila"],
      "adicionar-cliente": ["atender-a-fila"],
      "pedidos-de-encaixe": ["atender-a-fila"],
      "atrasos": ["atender-a-fila"],
      "refeicoes": ["status-e-fila"],
      "dono-profissionais": ["dono-loja-e-horario"],
      "relatorios-e-expediente": ["atender-a-fila"],
    },
  };

  var m = location.pathname.match(/\/artigos\/(cliente|parceiro)\/([^/]+?)(?:\.html)?$/);
  var principal = document.querySelector("main.artigo");
  if (!principal) return;

  function slug(t) { return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40); }

  // "Antes disso"
  if (m && ANTES[m[1]] && ANTES[m[1]][m[2]]) {
    var caixa = document.createElement("div");
    caixa.className = "antes";
    var t = document.createElement("b");
    t.textContent = "Antes disso: ";
    caixa.appendChild(t);
    ANTES[m[1]][m[2]].forEach(function (nome, i) {
      if (i) caixa.appendChild(document.createTextNode(" · "));
      var a = document.createElement("a");
      a.href = nome + ".html";
      a.textContent = nome.replace(/-/g, " ");
      caixa.appendChild(a);
      // troca pelo título real quando o índice carregar
      fetch("../../indice-" + m[1] + ".json").then(function (r) { return r.json(); }).then(function (lista) {
        lista.forEach(function (x) { if (x.arquivo.indexOf("/" + nome + ".html") > 0) a.textContent = x.titulo; });
      }).catch(function () {});
    });
    var resumo = principal.querySelector(".resumo") || principal.querySelector("h1");
    resumo.insertAdjacentElement("afterend", caixa);
  }

  // Índice lateral: títulos (h2) e passos (ol > li)
  var itens = [];
  var usados = {};
  function marca(el, rotulo, nivel) {
    var id = el.id || slug(rotulo) || "item";
    while (usados[id]) id += "-x";
    usados[id] = true;
    el.id = id;
    itens.push({ el: el, id: id, rotulo: rotulo, nivel: nivel });
  }
  Array.prototype.forEach.call(principal.querySelectorAll("h2, ol > li"), function (el) {
    var txt = el.textContent.replace(/\s+/g, " ").trim();
    if (!txt) return;
    if (el.tagName === "H2") marca(el, txt, 0);
    else marca(el, txt.length > 48 ? txt.slice(0, 47) + "…" : txt, 1);
  });
  if (itens.length < 3) return;

  var nav = document.createElement("nav");
  nav.className = "indice";
  nav.setAttribute("aria-label", "Nesta página");
  var botao = document.createElement("button");
  botao.type = "button";
  botao.className = "indice-botao";
  var ul = document.createElement("ul");
  var links = {};
  itens.forEach(function (i) {
    var li = document.createElement("li");
    if (i.nivel) li.className = "sub";
    var a = document.createElement("a");
    a.href = "#" + i.id;
    a.textContent = i.rotulo;
    li.appendChild(a);
    ul.appendChild(li);
    links[i.id] = li;
  });
  nav.appendChild(botao);
  nav.appendChild(ul);
  document.body.appendChild(nav);

  function aberto(sim) {
    nav.classList.toggle("fechado", !sim);
    botao.textContent = sim ? "Nesta página ▾" : "Nesta página ▸";
    botao.setAttribute("aria-expanded", sim ? "true" : "false");
  }
  aberto(window.innerWidth >= 1100); // no celular, recolhido
  botao.addEventListener("click", function () { aberto(nav.classList.contains("fechado")); });

  if ("IntersectionObserver" in window) {
    var visiveis = {};
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { visiveis[e.target.id] = e.isIntersecting; });
      var atual = null;
      itens.forEach(function (i) { if (!atual && visiveis[i.id]) atual = i.id; });
      if (!atual) return;
      Object.keys(links).forEach(function (k) { links[k].classList.toggle("atual", k === atual); });
    }, { rootMargin: "0px 0px -60% 0px" });
    itens.forEach(function (i) { obs.observe(i.el); });
  }
})();
