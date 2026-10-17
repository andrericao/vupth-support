const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");

// Põe o <body> de uma página do site no jsdom e a URL desejada.
function pagina(arquivo, url) {
  const html = fs.readFileSync(path.join(RAIZ, arquivo), "utf8");
  window.history.pushState({}, "", url);
  document.body.innerHTML = html.replace(/^[\s\S]*<body[^>]*>/i, "").replace(/<\/body>[\s\S]*$/i, "").replace(/<script[\s\S]*?<\/script>/gi, "");
}

// Executa o script do site (IIFE) com o DOM atual, instrumentado pela cobertura.
function roda(script) {
  jest.isolateModules(() => { require(path.join(RAIZ, script)); });
}

function indice(nome) {
  return JSON.parse(fs.readFileSync(path.join(RAIZ, nome), "utf8"));
}

// fetch falso: mapa de URL (trecho) -> corpo JSON ou { status }.
function fetchFalso(mapa) {
  global.fetch = jest.fn((url) => {
    const chave = Object.keys(mapa).find((k) => String(url).includes(k));
    if (chave === undefined) return Promise.reject(new Error("sem rota"));
    const v = mapa[chave];
    if (v && v.status !== undefined) return Promise.resolve({ ok: v.status < 400, status: v.status, json: () => Promise.resolve(v.corpo || []) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(v) });
  });
}

const espera = () => new Promise((r) => setTimeout(r, 0));

module.exports = { pagina, roda, indice, fetchFalso, espera };
