// v2.2.4 新规则补全冒烟：鸿蒙 type 含 int；oppo/vivo Image.scaleType 含 fit_width
const Module = require('module');
const path = require('path');
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
const ext = require('../extension.js');
ext._test.init(path.join(__dirname, '..'));

function makeDoc(filePath, text) {
    const lineOffsets = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === '\n') lineOffsets.push(i + 1);
    const toOffset = p => lineOffsets[p.line] + p.character;
    const toPos = off => {
        let line = 0;
        for (let i = 0; i < lineOffsets.length; i++) { if (lineOffsets[i] <= off) line = i; else break; }
        return new Position(line, off - lineOffsets[line]);
    };
    return {
        uri: { fsPath: filePath },
        getText(range) { if (!range) return text; return text.slice(toOffset(range.start), toOffset(range.end)); },
        getWordRangeAtPosition(pos, regex) {
            const off = toOffset(pos);
            const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
            let m;
            while ((m = re.exec(text))) {
                if (off >= m.index && off <= m.index + m[0].length) return new Range(toPos(m.index), toPos(m.index + m[0].length));
                if (m.index > off) break;
            }
            return undefined;
        },
    };
}
function endPos(text) { const lines = text.split('\n'); return new Position(lines.length - 1, lines[lines.length - 1].length); }

let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log('PASS ', name); } else { fail++; console.log('FAIL ', name); } }

// 鸿蒙：Var type 值补全含 int
let text = '<?xml version="1.0" encoding="utf-8"?>\n<Lockscreen>\n<Var name="a" type="" />\n</Lockscreen>';
let pos = new Position(2, 20);
let items = ext._test.provideCompletions(makeDoc('D:\\themes\\鸿蒙NEXT\\a.xml', text), pos);
check('鸿蒙 Var type 补全含 int', items.some(i => i.label === 'int'));

// OPPO：Image scaleType 值补全含 fit_width
text = '<?xml version="1.0" encoding="utf-8"?>\n<Lockscreen>\n<Image src="a.jpg" scaleType="" />\n</Lockscreen>';
pos = new Position(2, 30);
items = ext._test.provideCompletions(makeDoc('D:\\themes\\oppo\\a.xml', text), pos);
check('OPPO Image scaleType 补全含 fit_width', items.some(i => i.label === 'fit_width'));

// vivo：Image scaleType 值补全含 fit_width
items = ext._test.provideCompletions(makeDoc('D:\\themes\\vivo\\a.xml', text), pos);
check('vivo Image scaleType 补全含 fit_width', items.some(i => i.label === 'fit_width'));

// 鸿蒙：Image scaleType 补全不含 fit_width（未要求）
items = ext._test.provideCompletions(makeDoc('D:\\themes\\鸿蒙NEXT\\a.xml', text), pos);
check('鸿蒙 Image scaleType 不含 fit_width', !items.some(i => i.label === 'fit_width'));

// VideoCommand：属性补全含 sound
text = '<?xml version="1.0" encoding="utf-8"?>\n<Lockscreen>\n<VideoCommand name="v"  />\n</Lockscreen>';
pos = new Position(2, 23);
items = ext._test.provideCompletions(makeDoc('D:\\themes\\鸿蒙NEXT\\a.xml', text), pos);
check('鸿蒙 VideoCommand 属性补全含 sound', items.some(i => i.label === 'sound'));
items = ext._test.provideCompletions(makeDoc('D:\\themes\\huawei\\a.xml', text), pos);
check('华为 VideoCommand 属性补全含 sound', items.some(i => i.label === 'sound'));

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
