// alternar-tema-claro-escuro: um botão claro/escuro (um-botao-de-tema-como-o-docs); sem escolha, vale o sistema. A escolha fica no aparelho
// (localStorage, com try/catch) e é aplicada no <head>, antes de pintar, para não piscar.
// "sistema" é o padrão: sem atributo, vale o prefers-color-scheme do estilo.css.
(function () {
  var CHAVE = "vupth-tema";

  function le() {
    try {
      var v = localStorage.getItem(CHAVE);
      return v === "claro" || v === "escuro" ? v : "sistema";
    } catch {
      return "sistema";
    }
  }

  function guarda(tema) {
    try { localStorage.setItem(CHAVE, tema); } catch { /* sem armazenamento: vale só nesta página */ }
  }

  function aplica(tema) {
    var raiz = document.documentElement;
    if (tema === "sistema") raiz.removeAttribute("data-tema");
    else raiz.setAttribute("data-tema", tema);
  }

  // Um só botão, como no vupth-docs: mostra o tema para onde vai ("☀️ Claro" no escuro, "🌙 Escuro" no claro).
  function escuro() {
    var t = document.documentElement.getAttribute("data-tema");
    return t ? t === "escuro" : !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function monta() {
    var onde = document.querySelector(".topo") || document.querySelector(".topo-marca") || document.querySelector("main");
    if (!onde) return;
    var grupo = document.createElement("div");
    grupo.className = "tema-ctl";
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tema-btn";
    b.setAttribute("aria-live", "polite");
    function rotulo() {
      var vaiClaro = escuro();
      b.textContent = vaiClaro ? "☀️ Claro" : "🌙 Escuro";
      b.dataset.tema = vaiClaro ? "claro" : "escuro";
    }
    b.addEventListener("click", function () {
      var prox = escuro() ? "claro" : "escuro";
      guarda(prox);
      aplica(prox);
      rotulo();
    });
    rotulo();
    grupo.appendChild(b);
    onde.insertBefore(grupo, onde.firstChild);
  }

  aplica(le());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", monta);
  else monta();
})();
