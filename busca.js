// Suporte Vupth — busca no navegador sobre os índices dos artigos
// (site-de-suporte, André 11/10: "como no Google, um HTML simples").
// Cada equipe mantém o seu índice; a busca junta os dois.
(function () {
  "use strict";

  var INDICES = ["indice-cliente.json", "indice-parceiro.json"];


  // A ordem das categorias na página inicial. Artigo sem categoria (o índice
  // do Partner) cai em "Para profissionais e donos".
  var CATEGORIAS = [
    "Primeiros passos",
    "Entrar na fila",
    "Agendar",
    "Atrasos e multas",
    "Notificações",
    "Conta e senha",
    "Problemas comuns",
    "Para profissionais e donos",
  ];
  var CATEGORIA_DO_PARCEIRO = "Para profissionais e donos";

  var artigos = [];

  function normalizar(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function categoriaDe(a) {
    return a.categoria || (a.publico === "parceiro" ? CATEGORIA_DO_PARCEIRO : "Problemas comuns");
  }

  function prepara(a) {
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
    return el("span", { class: "publico", texto: a.publico === "parceiro" ? "Parceiro" : "Cliente" });
  }

  function mostraCategorias() {
    var caixa = document.getElementById("categorias");
    caixa.textContent = "";
    CATEGORIAS.forEach(function (nome) {
      var daCategoria = artigos.filter(function (a) { return categoriaDe(a) === nome; });
      if (!daCategoria.length) return;
      var lista = el("ul", {}, daCategoria.map(function (a) {
        return el("li", {}, [el("a", { href: a.arquivo, texto: a.titulo })]);
      }));
      caixa.appendChild(el("div", { class: "categoria" }, [el("h2", { texto: nome }), lista]));
    });
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
    var achados = artigos
      .map(function (a) { return { a: a, p: pontua(a, termos) }; })
      .filter(function (x) { return x.p > 0; })
      .sort(function (x, y) { return y.p - x.p; });

    lista.textContent = "";
    document.getElementById("resultados-titulo").textContent =
      achados.length ? "Resultados para “" + consulta.trim() + "”" : "Nada encontrado";
    if (!achados.length) {
      lista.appendChild(el("li", { class: "vazio", texto: "Tente outras palavras, como “fila”, “agendar” ou “senha”." }));
    }
    achados.forEach(function (x) {
      lista.appendChild(el("li", {}, [
        el("a", { href: x.a.arquivo, texto: x.a.titulo }),
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
