module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  // campanhas.js fica fora da cobertura enquanto estiver desligada (ATIVO=false, espera a branch do Backend).
  collectCoverageFrom: ["artigo.js", "busca.js", "contato.js"],
  coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } },
};
