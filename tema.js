// alternar-tema-claro-escuro: claro, escuro ou o sistema. A escolha fica no aparelho
// (localStorage, com try/catch) e é aplicada no <head>, antes de pintar, para não piscar.
// "sistema" é o padrão: sem atributo, vale o prefers-color-scheme do estilo.css.
(function () {
  var CHAVE = "vupth-tema";
  var OPCOES = [["claro", "Claro"], ["escuro", "Escuro"], ["sistema", "Sistema"]];

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

  function monta() {
    var onde = document.querySelector(".topo") || document.querySelector("main");
    if (!onde) return;
    var grupo = document.createElement("div");
    grupo.className = "tema-ctl";
    grupo.setAttribute("role", "group");
    grupo.setAttribute("aria-label", "Tema");
    var botoes = OPCOES.map(function (o) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = o[1];
      b.dataset.tema = o[0];
      b.addEventListener("click", function () {
        guarda(o[0]);
        aplica(o[0]);
        marca(o[0]);
      });
      grupo.appendChild(b);
      return b;
    });
    function marca(tema) {
      botoes.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tema === tema)); });
    }
    marca(le());
    onde.insertBefore(grupo, onde.firstChild);
  }

  aplica(le());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", monta);
  else monta();
})();
