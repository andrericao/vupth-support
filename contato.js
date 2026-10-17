// Formulário de contato (DEC-59/60): POST /support/contact no Backend.
// Ligado em 17/10 (André autorizou; Backend 7d13ffa com perfil e categoria no e-mail).
(function () {
  "use strict";
  var ENDPOINT = "https://vupth-backend-ia.onrender.com/support/contact";
  var ATIVO = true;

  var form = document.getElementById("form");
  var aviso = document.getElementById("aviso");

  if (!ATIVO) {
    aviso.textContent = "O envio de mensagens ainda não está disponível. Enquanto isso, busque o seu assunto na ajuda.";
    Array.prototype.forEach.call(form.elements, function (e) { e.disabled = true; });
    return;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var d = {};
    ["nome", "email", "perfil", "categoria", "assunto", "mensagem"].forEach(function (k) { d[k] = form.elements[k].value.trim(); });
    if (!d.nome || !d.email || !d.assunto || !d.mensagem) { aviso.textContent = "Preencha todos os campos."; return; }
    var botao = document.getElementById("enviar");
    botao.disabled = true;
    fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
      .then(function (r) {
        if (r.status === 204) { form.reset(); aviso.textContent = "Mensagem enviada. Respondemos por e-mail."; }
        else if (r.status === 422) aviso.textContent = "Confira os campos e tente de novo.";
        else if (r.status === 429) aviso.textContent = "Muitas mensagens em pouco tempo. Tente mais tarde.";
        else aviso.textContent = "Não foi possível enviar agora. Tente de novo em instantes.";
      })
      .catch(function () { aviso.textContent = "Sem conexão com o servidor. Tente de novo."; })
      .then(function () { botao.disabled = false; });
  });
})();
