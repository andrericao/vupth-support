// Suporte Vupth — busca no navegador sobre os índices dos artigos
// (site-de-suporte, André 11/10: "como no Google, um HTML simples").
// Cada equipe mantém o seu índice; a busca junta os dois.
(function () {
  "use strict";

  var INDICES = ["/indice-cliente.json", "/indice-parceiro.json"];

  // home-por-perfil + separacao-melhor (SUP-12, SUP-4): primeiro o perfil,
  // depois a categoria. Cada um tem URL própria (/cliente/passo-a-passo), para
  // os apps linkarem direto; o _redirects reescreve tudo para esta página.
  var PERFIS = [
    { id: "cliente", nome: "Cliente", resumo: "Entrar na fila, agendar, atrasos e a sua conta." },
    { id: "profissional", nome: "Profissional", resumo: "Atender a fila, status, encaixes e o seu perfil." },
    { id: "dono", nome: "Dono", resumo: "A loja, o horário, os profissionais e os relatórios." },
  ];
  var TIPOS = [
    { id: "passo-a-passo", nome: "Passo a passo" },
    { id: "regulamentos", nome: "Regulamentos" },
    { id: "ajuda", nome: "Ajuda" },
  ];
  // Categoria do índice que não é passo a passo.
  var TIPO_DA_CATEGORIA = { "Atrasos e multas": "regulamentos", "Problemas comuns": "ajuda", "Notificações": "ajuda" };
  var REGULAMENTO_DO_PARCEIRO = { "artigos/parceiro/atrasos.html": true };

  // A ordem das categorias dentro de cada perfil.
  var CATEGORIAS = [
    "Primeiros passos", "Entrar na fila", "Agendar", "Atrasos e multas", "Notificações", "Conta e senha",
    "Problemas comuns", "Fila e status", "Atender", "Encaixes", "Seu perfil", "Relatórios", "Dono da loja", "Conta",
  ];

  var artigos = [];

  function normalizar(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function categoriaDe(a) {
    return a.categoria || "Problemas comuns";
  }

  // O índice do Partner serve o profissional e o dono; "perfis" no JSON manda.
  function perfisDe(a) {
    if (a.perfis) return a.perfis;
    if (a.publico !== "parceiro") return ["cliente"];
    return a.categoria === "Dono da loja" ? ["dono"] : ["profissional"];
  }

  function tipoDe(a) {
    if (a.tipo) return a.tipo;
    if (REGULAMENTO_DO_PARCEIRO[a.arquivo]) return "regulamentos";
    return TIPO_DA_CATEGORIA[categoriaDe(a)] || "passo-a-passo";
  }

  // /cliente/regulamentos, ou ?perfil=cliente&tipo=regulamentos (python3 -m http.server).
  function rota() {
    var partes = location.pathname.split("/").filter(Boolean);
    var q = new URLSearchParams(location.search);
    var perfil = q.get("perfil") || partes[0];
    var tipo = q.get("tipo") || partes[1];
    perfil = PERFIS.filter(function (x) { return x.id === perfil; })[0] || null;
    tipo = perfil && TIPOS.filter(function (x) { return x.id === tipo; })[0] || null;
    return { perfil: perfil, tipo: tipo };
  }

  function prepara(a) {
    a._perfis = perfisDe(a);
    a._tipo = tipoDe(a);
    a._titulo = normalizar(a.titulo);
    a._palavras = normalizar((a.palavras || []).join(" "));
    a._resumo = normalizar(a.resumo);
    return a;
  }

  // Todo termo precisa aparecer em algum lugar; o título pesa mais que as
  // palavras-chave, que pesam mais que o resumo.
  function pontua(a, termos) {
    var total = 0;
    for (var i = 0; i < termos.length; i++) {
      var t = termos[i];
      var p = 0;
      if (a._titulo.indexOf(t) >= 0) p += 3;
      if (a._palavras.indexOf(t) >= 0) p += 2;
      if (a._resumo.indexOf(t) >= 0) p += 1;
      if (p === 0) return 0;
      total += p;
    }
    return total;
  }

  function el(tag, attrs, filhos) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "texto") e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (filhos || []).forEach(function (f) { if (f) e.appendChild(f); });
    return e;
  }

  function rotuloDoPublico(a) {
    var nomes = a._perfis.map(function (id) { return PERFIS.filter(function (x) { return x.id === id; })[0].nome; });
    return el("span", { class: "publico", texto: nomes.join(" e ") });
  }

  function href(perfil, tipo) {
    return "/" + perfil.id + "/" + (tipo ? tipo.id : "");
  }

  function mostraPerfis(caixa) {
    PERFIS.forEach(function (p) {
      caixa.appendChild(el("a", { class: "categoria perfil", href: href(p) }, [
        el("h2", { texto: p.nome }), el("p", { texto: p.resumo }),
      ]));
    });
  }

  function mostraCategorias() {
    var caixa = document.getElementById("categorias");
    var r = rota();
    caixa.textContent = "";
    if (!r.perfil) { mostraPerfis(caixa); return; }

    // Trilha e as abas do perfil: Todos, Passo a passo, Regulamentos, Ajuda, Promoções.
    var trilha = document.getElementById("trilha");
    trilha.textContent = "";
    trilha.appendChild(el("a", { href: "/", texto: "Suporte" }));
    trilha.appendChild(document.createTextNode(" · " + r.perfil.nome + (r.tipo ? " · " + r.tipo.nome : "")));
    trilha.hidden = false;
    document.getElementById("titulo").textContent = r.perfil.nome + (r.tipo ? ": " + r.tipo.nome.toLowerCase() : "");
    document.title = (r.tipo ? r.tipo.nome + " · " : "") + r.perfil.nome + " · Suporte Vupth";

    var doPerfil = artigos.filter(function (a) { return a._perfis.indexOf(r.perfil.id) >= 0; });
    var abas = el("nav", { class: "abas", "aria-label": "Categorias" });
    [{ id: null, nome: "Todos" }].concat(TIPOS).forEach(function (t) {
      if (t.id && !doPerfil.some(function (a) { return a._tipo === t.id; })) return;
      var ativo = (r.tipo ? r.tipo.id : null) === t.id;
      abas.appendChild(el("a", { href: href(r.perfil, t.id && t), "aria-current": ativo ? "page" : "false", texto: t.nome }));
    });
    abas.appendChild(el("a", { href: "/campanhas.html", texto: "Cupons e promoções" }));
    caixa.parentNode.insertBefore(abas, caixa);

    var mostrar = doPerfil.filter(function (a) { return !r.tipo || a._tipo === r.tipo.id; });
    CATEGORIAS.forEach(function (nome) {
      var daCategoria = mostrar.filter(function (a) { return categoriaDe(a) === nome; });
      if (!daCategoria.length) return;
      var lista = el("ul", {}, daCategoria.map(function (a) {
        return el("li", {}, [el("a", { href: "/" + a.arquivo, texto: a.titulo })]);
      }));
      caixa.appendChild(el("div", { class: "categoria" }, [el("h2", { texto: nome }), lista]));
    });
  }

  // "Você quis dizer…": vocabulário dos índices + distância de edição (SUP-3).
  function distancia(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 99;
    var prev = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      var cur = [i];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }

  function sugestao(termos) {
    var vocab = {};
    artigos.forEach(function (a) {
      (a._titulo + " " + a._palavras + " " + a._resumo).split(/[^a-z0-9]+/).forEach(function (w) {
        if (w.length > 2) vocab[w] = true;
      });
    });
    var palavras = Object.keys(vocab);
    var mudou = false;
    var novos = termos.map(function (t) {
      if (vocab[t]) return t;
      var limite = t.length > 5 ? 2 : 1, melhor = t, dm = limite + 1;
      palavras.forEach(function (w) {
        var d = distancia(t, w);
        if (d < dm) { dm = d; melhor = w; }
      });
      if (melhor !== t) mudou = true;
      return melhor;
    });
    return mudou ? novos.join(" ") : null;
  }

  function busca(consulta) {
    var bloco = document.getElementById("resultados-bloco");
    var lista = document.getElementById("resultados");
    var categorias = document.getElementById("categorias");
    var termos = normalizar(consulta).split(/\s+/).filter(function (t) { return t.length > 1; });

    if (!termos.length) {
      bloco.hidden = true;
      categorias.hidden = false;
      return;
    }
    var r = rota();
    var achados = artigos
      .filter(function (a) { return !r.perfil || a._perfis.indexOf(r.perfil.id) >= 0; })
      .map(function (a) { return { a: a, p: pontua(a, termos) }; })
      .filter(function (x) { return x.p > 0; })
      .sort(function (x, y) { return y.p - x.p; });

    lista.textContent = "";
    document.getElementById("resultados-titulo").textContent =
      achados.length ? "Resultados para “" + consulta.trim() + "”" : "Nada encontrado";
    if (!achados.length) {
      var sug = sugestao(termos);
      if (sug) {
        var link = el("a", { href: "#", texto: sug });
        link.addEventListener("click", function (ev) {
          ev.preventDefault();
          var campo = document.getElementById("busca");
          campo.value = sug;
          busca(sug);
        });
        lista.appendChild(el("li", { class: "vazio" }, [document.createTextNode("Você quis dizer "), link, document.createTextNode("?")]));
      } else {
        lista.appendChild(el("li", { class: "vazio", texto: "Tente outras palavras, como “fila”, “agendar” ou “senha”." }));
      }
    }
    achados.forEach(function (x) {
      lista.appendChild(el("li", {}, [
        el("a", { href: "/" + x.a.arquivo, texto: x.a.titulo }),
        rotuloDoPublico(x.a),
        el("p", { texto: x.a.resumo }),
      ]));
    });
    bloco.hidden = false;
    categorias.hidden = true;
  }

  function carrega() {
    return Promise.all(INDICES.map(function (url) {
      return fetch(url).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    })).then(function (listas) {
      artigos = [].concat.apply([], listas).map(prepara);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var campo = document.getElementById("busca");
    carrega().then(function () {
      mostraCategorias();
      var q = new URLSearchParams(location.search).get("q");
      if (q) { campo.value = q; busca(q); }
    });
    campo.addEventListener("input", function () { busca(campo.value); });
  });
})();
