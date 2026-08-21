// 真实文件 lint 冒烟：node tools/lint_file.js <xml路径> <platform>
const Module = require('module');
const path = require('path');
const fs = require('fs');
class Position { constructor(l, c) { this.line = l; this.character = c; } with(l, c) { return new Position(l === undefined ? this.line : l, c === undefined ? this.character : c); } }
class Range { constructor(s, e) { this.start = s; this.end = e; } }
class MarkdownString { constructor(v) { this.value = v || ''; } appendMarkdown(t) { this.value += t; return this; } }
const vscodeStub = {
    Position, Range, MarkdownString,
    CompletionItem: class { constructor(l, k) { this.label = l; this.kind = k; } },
    SnippetString: class { constructor(v) { this.value = v || ''; } appendText() { return this; } appendPlaceholder() { return this; } },
    CompletionItemKind: { Class: 7, Field: 5, EnumMember: 20, Variable: 6, Function: 3, Snippet: 15 },
    workspace: { getConfiguration: () => ({ get: (k, d) => d }), onDidOpenTextDocument: () => ({ dispose() {} }), onDidChangeTextDocument: () => ({ dispose() {} }), onDidCloseTextDocument: () => ({ dispose() {} }) },
    languages: { registerCompletionItemProvider: () => ({ dispose() {} }), registerHoverProvider: () => ({ dispose() {} }) },
    window: {},
};
const origLoad = Module._load;
Module._load = function (request, ...rest) { if (request === 'vscode') return vscodeStub; return origLoad.call(this, request, ...rest); };
const ext = require(path.join(__dirname, '..', 'extension.js'));
ext._test.init(path.join(__dirname, '..'));
const file = process.argv[2];
const platform = process.argv[3] || null;
const text = fs.readFileSync(file, 'utf8');
const diags = ext._test.lintText(text, platform);
console.log(`文件: ${file}\n平台: ${platform || '(未识别)'}\n诊断 ${diags.length} 条:`);
for (const d of diags.slice(0, 30)) console.log(`  [${d.severity}] 第${d.line + 1}行: ${d.message}`);
if (diags.length > 30) console.log(`  ... 另 ${diags.length - 30} 条`);
