const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(relativePath) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (name === '../services/adminApi') return {};
      if (name === '../utils/cbcQuote') return load('src/utils/cbcQuote.ts');
      return require(name);
    },
  });
  return exports;
}

test('admin funding renders withdrawal controls and initial loading state without crashing', () => {
  const Funding = load('src/components/AdminWalletFunding.tsx').default;
  const html = renderToStaticMarkup(React.createElement(Funding));
  assert.match(html, /Save limits/);
  assert.match(html, /Withdrawal limits/);
  assert.match(html, /Loading funding requests/);
});
