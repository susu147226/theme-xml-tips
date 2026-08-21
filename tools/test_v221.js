// v2.2.1 新增能力冒烟：华为type=int / 鸿蒙active / 平台扩展标签悬浮与补全
const Module = require('module');
const path = require('path');
class Position { constructor(l, c) { this.line = l; this.character = c; } with(l, c) { return new Position(l === undefined ? this.line : l, c === undefined ? this.character : c); } translate(l, c) { return new Position(this.line + (l || 0), this.character + (c || 0)); } }
class Range { constructor(s, e) { this.start = s; this.end = e; } }
class MarkdownString { constructor(v) { this.value = v || ''; } appendMarkdown(t) { this.value += t; return this; } }
class Hover { constructor(c, r) { this.contents = c; this.range = r; } }
const vscodeStub = {
    Position, Range, MarkdownString, Hover,
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

function makeDoc(file, text) {
    return {
        uri: { fsPath: file, toString: () => file }, languageId: 'xml',
        getText: r => { if (!r) return text; const lines = text.split('\n'); if (r.start.line === r.end.line) return lines[r.start.line].slice(r.start.character, r.end.character); return lines.slice(r.start.line, r.end.line + 1).join('\n'); },
        positionAt: off => { const lines = text.slice(0, off).split('\n'); return new Position(lines.length - 1, lines[lines.length - 1].length); },
        getWordRangeAtPosition: (pos, re) => { const line = text.split('\n')[pos.line]; let s = pos.character, e = pos.character; const g = new RegExp(re.source, 'g'); let m; while ((m = g.exec(line))) { if (m.index <= pos.character && pos.character <= m.index + m[0].length) { s = m.index; e = m.index + m[0].length; break; } } if (s === pos.character && e === pos.character) return null; return new Range(new Position(pos.line, s), new Position(pos.line, e)); },
    };
}
function endPos(text) { const ls = text.split('\n'); return new Position(ls.length - 1, ls[ls.length - 1].length); }

let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('PASS ', name); } else { fail++; console.log('FAIL ', name, extra === undefined ? '' : extra); } }

// 1) 华为/荣耀/vivo/小米 Variable type=int 合法，bad 报错
for (const p of ['huawei', 'honor', 'vivo', 'xiaomi']) {
    const ok = `<Lockscreen>\n<VariableBinders>\n<ContentProviderBinder columns="c" uri="content://weather/weather">\n<Variable name="v" column="c" type="int"/>\n</ContentProviderBinder>\n</VariableBinders>\n</Lockscreen>`;
    check(`${p} Variable type=int 合法`, ext._test.lintText(ok, p).length === 0, JSON.stringify(ext._test.lintText(ok, p)));
    const bad = ok.replace('type="int"', 'type="bad"');
    check(`${p} Variable type=bad 报错`, ext._test.lintText(bad, p).some(x => /type.*bad/.test(x.message)), JSON.stringify(ext._test.lintText(bad, p)));
}
// 2) 鸿蒙 Video/Image/Group/ImageNumber/Button active 不报
const hm = '<Lockscreen>\n<Video name="v" src="a.mp4" active="1"/>\n<Image src="a.png" active="1"/>\n<Group active="1"></Group>\n<ImageNumber src="n.png" number="1" active="1"/>\n<Button active="1" w="10" h="10"/>\n</Lockscreen>';
const hmDiags = ext._test.lintText(hm, 'harmonyos');
check('鸿蒙 active 属性不误报', !hmDiags.some(x => /active/.test(x.message)), JSON.stringify(hmDiags));

// 3) OPPO 平台标签补全：输入 < 时包含 FluidsView 等平台标签
const oppoFile = 'D:/themes/oppo/advance/manifest.xml';
const tagDoc1 = makeDoc(oppoFile, '<Lockscreen>\n<');
const items = ext._test.provideCompletions(tagDoc1, endPos('<Lockscreen>\n<'));
check('OPPO 标签补全含 FluidsView', items.some(i => i.label === 'FluidsView'));
check('OPPO 标签补全含 Slider', items.some(i => i.label === 'Slider'));
check('OPPO 标签补全含 CancelDelayCommand', items.some(i => i.label === 'CancelDelayCommand'));
const hmTagDoc = makeDoc('D:/themes/鸿蒙next/manifest.xml', '<Lockscreen>\n<');
const hmItems = ext._test.provideCompletions(hmTagDoc, endPos('<Lockscreen>\n<'));
check('鸿蒙标签补全不含 FluidsView', !hmItems.some(i => i.label === 'FluidsView'));

// 4) OPPO 平台标签属性补全：<FluidsView 内出 customGravity 等
const attrDoc1 = makeDoc(oppoFile, '<FluidsView ');
const attrItems = ext._test.provideCompletions(attrDoc1, endPos('<FluidsView '));
check('FluidsView 属性补全含 customGravity', attrItems.some(i => i.label === 'customGravity'), attrItems.map(i => i.label).join(','));
check('FluidsView 属性补全含 waterAlpha', attrItems.some(i => i.label === 'waterAlpha'));

// 5) 悬浮：OPPO FluidsView 标签与属性
const hovText = '<FluidsView name="f" customGravity="true"/>';
const hovDoc = makeDoc(oppoFile, hovText);
const hovTag = ext._test.provideHover(hovDoc, new Position(0, 3));
check('FluidsView 标签悬浮含标题', !!(hovTag && hovTag.contents && /流体视图/.test(hovTag.contents.value)), hovTag && hovTag.contents && hovTag.contents.value);
const hovAttr = ext._test.provideHover(hovDoc, new Position(0, 21));
check('FluidsView.customGravity 属性悬浮', !!(hovAttr && hovAttr.contents && /自定义重力/.test(hovAttr.contents.value)), hovAttr && hovAttr.contents && hovAttr.contents.value);
// 鸿蒙平台悬浮不出平台标签
const hovHm = ext._test.provideHover(makeDoc('D:/themes/鸿蒙next/a.xml', hovText), new Position(0, 3));
check('鸿蒙 FluidsView 无悬浮', !hovHm);

// 6) vivo 平台标签悬浮（共享+专有）
const vivoDoc = makeDoc('D:/themes/vivo/a.xml', '<WaterWallpaper xmesh="27"/>');
const hovVivo = ext._test.provideHover(vivoDoc, new Position(0, 3));
check('vivo WaterWallpaper 悬浮', !!(hovVivo && /水波纹/.test(hovVivo.contents.value)));
const vivoF = ext._test.provideHover(makeDoc('D:/themes/vivo/a.xml', '<FluidsView name="f"/>'), new Position(0, 3));
check('vivo FluidsView 悬浮为 vivo 版描述', !!(vivoF && /vivo 锁屏引擎/.test(vivoF.contents.value)));

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 条失败`);
process.exit(fail === 0 ? 0 : 1);
