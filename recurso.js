// Artigo de recurso (artigos-por-recurso, SUP-1): a chave do app só exibe ou oculta o artigo.
// Sem resposta do Backend, o artigo fica oculto. Faixa quando a chave não vale para todos.
(function () {
  "use strict";
  var principal = document.querySelector("main.artigo[data-recurso]");
  if (!principal) return;
  var caminho = principal.getAttribute("data-recurso");

  function oculta() {
    principal.textContent = "";
    var h = document.createElement("h1");
    h.textContent = "Este assunto ainda não está disponível";
    var p = document.createElement("p");
    p.className = "ajuda";
    p.appendChild(document.createTextNode("Volte em breve ou "));
    var a = document.createElement("a");
    a.href = "/index.html";
    a.textContent = "busque outro assunto";
    p.appendChild(a);
    p.appendChild(document.createTextNode("."));
    principal.appendChild(h);
    principal.appendChild(p);
  }

  principal.hidden = true;
  fetch("https://vupth-backend-ia.onrender.com/features/articles")
    .then(function (r) { return r.ok ? r.json() : []; })
    .catch(function () { return []; })
    .then(function (lista) {
      var meu = (lista || []).filter(function (x) { return x.article_path === caminho; })[0];
      if (!meu) oculta();
      else if (meu.release !== "ALL") {
        var faixa = document.createElement("p");
        faixa.className = "faixa-parcial";
        faixa.setAttribute("role", "note");
        faixa.textContent = "Este recurso ainda não foi disponibilizado para todos.";
        var resumo = principal.querySelector(".resumo") || principal.querySelector("h1");
        resumo.insertAdjacentElement("afterend", faixa);
      }
      principal.hidden = false;
    });
})();
