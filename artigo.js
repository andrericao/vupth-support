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

  // Navegação como a documentação do Expo (indice-como-expo): árvore de assuntos
  // à esquerda, cartões Anterior/Próximo e rodapé "Este artigo ajudou?".
  if (m) {
    var publico = m[1], atualNome = m[2];
    var VOTO = "https://vupth-backend-ia.onrender.com/support/articles/";
    fetch("/indice-" + publico + ".json").then(function (r) { return r.json(); }).then(function (lista) {
      var grupos = [], porNome = {};
      lista.forEach(function (x) {
        var cat = x.categoria || "Outros";
        if (!porNome[cat]) { porNome[cat] = { nome: cat, itens: [] }; grupos.push(porNome[cat]); }
        porNome[cat].itens.push(x);
      });
      var ordem = [];
      grupos.forEach(function (g) { g.itens.forEach(function (x) { ordem.push({ x: x, cat: g.nome }); }); });
      var pos = -1;
      ordem.forEach(function (o, i) { if (o.x.arquivo.indexOf("/" + atualNome + ".html") > 0) pos = i; });

      var lado = document.createElement("nav");
      lado.className = "arvore fechado";
      lado.setAttribute("aria-label", "Assuntos");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "arvore-botao";
      lado.appendChild(btn);
      var corpo = document.createElement("div");
      corpo.className = "arvore-corpo";
      var atalhos = document.createElement("p");
      atalhos.className = "atalhos";
      [["Início", "/"], ["Buscar", "/#busca"], ["Cupons e promoções", "/campanhas.html"]].forEach(function (p, i) {
        if (i) atalhos.appendChild(document.createTextNode(" · "));
        var a = document.createElement("a"); a.href = p[1]; a.textContent = p[0]; atalhos.appendChild(a);
      });
      corpo.appendChild(atalhos);
      grupos.forEach(function (g) {
        var det = document.createElement("details");
        var sum = document.createElement("summary");
        sum.textContent = g.nome;
        det.appendChild(sum);
        var ul = document.createElement("ul");
        g.itens.forEach(function (x) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "/" + x.arquivo;
          a.textContent = x.titulo;
          if (x.arquivo.indexOf("/" + atualNome + ".html") > 0) { li.className = "aqui"; a.setAttribute("aria-current", "page"); det.open = true; }
          li.appendChild(a);
          ul.appendChild(li);
        });
        det.appendChild(ul);
        corpo.appendChild(det);
      });
      lado.appendChild(corpo);
      document.body.appendChild(lado);
      function abreLado(sim) {
        lado.classList.toggle("fechado", !sim);
        btn.textContent = sim ? "Assuntos ▾" : "Assuntos ▸";
        btn.setAttribute("aria-expanded", sim ? "true" : "false");
      }
      abreLado(window.innerWidth >= 1280);
      btn.addEventListener("click", function () { abreLado(lado.classList.contains("fechado")); });

      // Anterior / Próximo
      var cartoes = document.createElement("div");
      cartoes.className = "cartoes";
      function cartao(o, rotulo) {
        var a = document.createElement("a");
        a.className = "cartao " + (rotulo === "Anterior" ? "ant" : "prox");
        a.href = "/" + o.x.arquivo;
        var r = document.createElement("small"); r.textContent = rotulo;
        var t = document.createElement("b"); t.textContent = o.x.titulo;
        var c = document.createElement("span"); c.textContent = o.cat;
        a.appendChild(r); a.appendChild(t); a.appendChild(c);
        cartoes.appendChild(a);
      }
      if (pos > 0) cartao(ordem[pos - 1], "Anterior");
      if (pos >= 0 && pos < ordem.length - 1) cartao(ordem[pos + 1], "Próximo");

      // Rodapé: utilidade do artigo, sugestão e data
      var rod = document.createElement("div");
      rod.className = "util";
      var chave = "ajudou:" + publico + "/" + atualNome, resp = null;
      try { resp = localStorage.getItem(chave); } catch (e) {}
      var perg = document.createElement("p");
      perg.textContent = "Este artigo ajudou? ";
      function agradece() { perg.textContent = "Obrigado pelo retorno."; }
      ["👍", "👎"].forEach(function (em, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = em;
        b.setAttribute("aria-label", i ? "Não ajudou" : "Ajudou");
        b.addEventListener("click", function () {
          try { localStorage.setItem(chave, i ? "nao" : "sim"); } catch (e) {}
          // Voto no Backend (BAK voto-do-artigo); se falhar, o voto local basta.
          try {
            fetch(VOTO + encodeURIComponent((publico + "-" + atualNome).slice(0, 80)) + "/vote", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vote: i ? "DOWN" : "UP" })
            }).catch(function () {});
          } catch (e) {}
          agradece();
        });
        perg.appendChild(b);
      });
      rod.appendChild(perg);
      if (resp) agradece();
      var sug = document.createElement("p");
      var sa = document.createElement("a"); sa.href = "/contato.html"; sa.textContent = "Mande sua sugestão";
      sug.appendChild(sa);
      rod.appendChild(sug);
      var dt = new Date(document.lastModified);
      if (!isNaN(dt) && dt.getFullYear() > 2000) {
        var d = document.createElement("p"); d.className = "data";
        d.textContent = "Atualizado em " + dt.toLocaleDateString("pt-BR");
        rod.appendChild(d);
      }
      var fim = principal.querySelector(".ajuda");
      if (fim) { fim.insertAdjacentElement("beforebegin", cartoes); fim.insertAdjacentElement("beforebegin", rod); }
      else { principal.appendChild(cartoes); principal.appendChild(rod); }
    }).catch(function () {});
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
