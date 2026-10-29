// Artigos: índice lateral recolhível (SUP-2) e caixa "Antes disso" (SUP-4).

// Ícone do botão das laterais: o mesmo do vupth-docs (quadro com divisória), espelhado na direita por CSS.
var ICONE_LADO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>';

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
      var corpo = document.createElement("div");
      corpo.className = "arvore-corpo";
      var atalhos = document.createElement("p");
      atalhos.className = "atalhos";
      [["Início", "/"], ["Buscar", "/#busca"], ["Cupons e promoções", "/campanhas.html"]].forEach(function (p, i) {
        if (i) atalhos.appendChild(document.createTextNode(" · "));
        var a = document.createElement("a"); a.href = p[1]; a.textContent = p[0]; atalhos.appendChild(a);
      });
      corpo.appendChild(atalhos);
      var chipsEsq = [];
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
        chipsEsq.push({ texto: iniciais(g.nome), titulo: g.nome, aoClicar: function () { det.open = true; } });
      });
      lado.appendChild(corpo);
      document.body.appendChild(lado);
      lateral(lado, "Assuntos", "esq", 1280, chipsEsq);

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
      try { resp = localStorage.getItem(chave); } catch { /* sem armazenamento ou rede: segue sem */ }
      var perg = document.createElement("p");
      perg.textContent = "Este artigo ajudou? ";
      function agradece() { perg.textContent = "Obrigado pelo retorno."; }
      ["👍", "👎"].forEach(function (em, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = em;
        b.setAttribute("aria-label", i ? "Não ajudou" : "Ajudou");
        b.addEventListener("click", function () {
          try { localStorage.setItem(chave, i ? "nao" : "sim"); } catch { /* sem armazenamento ou rede: segue sem */ }
          // Voto no Backend (BAK voto-do-artigo); se falhar, o voto local basta.
          try {
            fetch(VOTO + encodeURIComponent((publico + "-" + atualNome).slice(0, 80)) + "/vote", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vote: i ? "DOWN" : "UP" })
            }).catch(function () {});
          } catch { /* sem armazenamento ou rede: segue sem */ }
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
  nav.appendChild(ul);
  document.body.appendChild(nav);

  var chipsDir = [];
  itens.forEach(function (i) { if (!i.nivel) chipsDir.push({ texto: String(chipsDir.length + 1), titulo: i.rotulo, href: "#" + i.id }); });
  lateral(nav, "Nesta página", "dir", 1100, chipsDir);

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

// Iniciais de um assunto para o ícone da faixa recolhida (duas letras, como no vupth-docs).
function iniciais(nome) {
  var ps = nome.split(/[^A-Za-zÀ-ÿ]+/).filter(Boolean);
  return (ps.length > 1 ? ps[0][0] + ps[1][0] : nome.slice(0, 2)).toUpperCase();
}

// Lateral estilo Render (laterais-estilo-render): expandida, o conteúdo e o controle "Recolher" no pé;
// recolhida (tela larga), uma coluna de ícones com tooltip e o mesmo controle no mesmo lugar.
// Em tela estreita é gaveta: fechada some e deixa só o botão flutuante; abre por ele, fecha por
// "Fechar", Esc ou ao tocar num link. O estado guardado só vale em tela larga.
function lateral(painel, rotulo, lado, largura, chips) {
  "use strict";
  var chave = "vupth-suporte-lado-" + lado, guardado = null;
  try { guardado = localStorage.getItem(chave); } catch { /* sem armazenamento ou rede: segue sem */ }
  function larga() { return window.innerWidth >= largura; }
  var esq = lado === "esq";

  var trilho = document.createElement("div");
  trilho.className = "trilho";
  chips.forEach(function (c) {
    var el = document.createElement(c.href ? "a" : "button");
    if (c.href) el.href = c.href; else el.type = "button";
    el.className = "chip";
    el.textContent = c.texto;
    el.title = c.titulo;
    el.setAttribute("aria-label", c.titulo);
    if (c.aoClicar) el.addEventListener("click", function () { aplica(true, true); c.aoClicar(); });
    trilho.appendChild(el);
  });
  painel.appendChild(trilho);

  var ctl = document.createElement("button");
  ctl.type = "button";
  ctl.className = "lado-ctl";
  var ico = document.createElement("span");
  ico.className = "ico";
  var rot = document.createElement("span");
  rot.className = "rot";
  ico.innerHTML = ICONE_LADO;
  ctl.appendChild(ico);
  ctl.appendChild(rot);
  var rodape = document.createElement("div");
  rodape.className = "lado-rodape " + lado;
  rodape.appendChild(ctl);
  painel.appendChild(rodape);

  var abrir = document.createElement("button");
  abrir.type = "button";
  abrir.className = "lado-abrir " + lado;
  abrir.textContent = (esq ? "» " : "« ") + rotulo;
  document.body.appendChild(abrir);

  function aplica(sim, grava) {
    painel.classList.toggle("fechado", !sim);
    abrir.hidden = sim;
    rot.textContent = !sim ? "Expandir" : larga() ? "Recolher" : "Fechar";
    ctl.setAttribute("aria-expanded", sim ? "true" : "false");
    ctl.setAttribute("aria-label", (sim ? "Recolher " : "Expandir ") + rotulo);
    ctl.title = (sim ? "Recolher " : "Expandir ") + rotulo;
    if (grava && larga()) { try { localStorage.setItem(chave, sim ? "0" : "1"); } catch { /* sem armazenamento ou rede: segue sem */ } }
  }
  aplica(larga() && guardado !== "1", false);
  ctl.addEventListener("click", function () { aplica(painel.classList.contains("fechado"), true); });
  abrir.addEventListener("click", function () { aplica(true, false); ctl.focus(); });
  painel.addEventListener("click", function (e) {
    if (!larga() && e.target.closest("a")) aplica(false, false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !larga() && !painel.classList.contains("fechado")) { aplica(false, false); abrir.focus(); }
  });
  return aplica;
}
