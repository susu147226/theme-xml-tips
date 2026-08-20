// 集成测试：stub vscode，端到端验证「平台识别 → 快捷跳转/代码片段提示」的过滤效果
const Module = require('module');
const path = require('path');

class Position {
    constructor(line, character) { this.line = line; this.character = character; }
    with(l, c) { return new Position(l === undefined ? this.line : l, c === undefined ? this.character : c); }
    translate(dl, dc) { return new Position(this.line + (dl || 0), this.character + (dc || 0)); }
}
class Range {
    constructor(start, end) { this.start = start; this.end = end; }
}
class CompletionItem {
    constructor(label, kind) { this.label = label; this.kind = kind; }
}
class SnippetString {
    constructor(v) { this.value = v || ''; }
    appendText(t) { this.value += t; return this; }
    appendPlaceholder(p) { this.value += '${1:' + p + '}'; return this; }
}
class MarkdownString {
    constructor(v) { this.value = v || ''; }
    appendMarkdown(t) { this.value += t; return this; }
}
const vscodeStub = {
    Position, Range, CompletionItem, SnippetString, MarkdownString,
    CompletionItemKind: { Class: 7, Field: 5, EnumMember: 20, Variable: 6, Function: 3, Snippet: 15 },
    workspace: { getConfiguration: () => ({ get: (k, d) => d }) },
};
// activate() 依赖的 API（用于注册契约测试）
let capturedCompletionProvider = null;
let capturedHoverProvider = null;
vscodeStub.languages = {
    registerCompletionItemProvider: (sel, provider, ...triggers) => { capturedCompletionProvider = provider; return { dispose() {} }; },
    registerHoverProvider: (sel, provider) => { capturedHoverProvider = provider; return { dispose() {} }; },
};
vscodeStub.window = {
    onDidChangeActiveTextEditor: () => ({ dispose() {} }),
    activeTextEditor: null,
    showInformationMessage: () => Promise.resolve(),
    showWarningMessage: () => Promise.resolve(),
};
vscodeStub.extensions = { getExtension: () => undefined };

const origLoad = Module._load;
Module._load = function (request, ...rest) {
    if (request === 'vscode') return vscodeStub;
    return origLoad.call(this, request, ...rest);
};
const ext = require('../extension.js');
ext._test.init(path.join(__dirname, '..'));

/** 构造假文档：text 为全文，position 在文末 */
function makeDoc(filePath, text) {
    const lineOffsets = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === '\n') lineOffsets.push(i + 1);
    const toOffset = p => lineOffsets[p.line] + p.character;
    return {
        uri: { fsPath: filePath },
        getText(range) {
            if (!range) return text;
            return text.slice(toOffset(range.start), toOffset(range.end));
        },
    };
}
function endPos(text) {
    const lines = text.split('\n');
    return new Position(lines.length - 1, lines[lines.length - 1].length);
}

const XML_HEAD = '<?xml version="1.0" encoding="utf-8"?>\n<Lockscreen>\n<';
const sc = items => items.filter(i => String(i.detail || '').startsWith('快捷跳转'));
const vs = items => items.filter(i => String(i.label).startsWith('代码片段·'));

let fail = 0;
function check(name, cond, extra) {
    console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  (' + extra + ')' : ''));
    if (!cond) fail++;
}

// 1) 鸿蒙路径：只出鸿蒙跳转（68×2）与含鸿蒙的片段（6 个）
{
    const text = XML_HEAD;
    const items = ext._test.provideCompletions(makeDoc('D:\\themes\\鸿蒙NEXT\\lockscreen\\main.xml', text), endPos(text));
    check('鸿蒙路径-跳转数量', sc(items).length === 68 * 2, String(sc(items).length));
    check('鸿蒙路径-片段数量', vs(items).length === 6, String(vs(items).length));
    check('鸿蒙路径-跳转不带平台标注', sc(items).every(i => !String(i.label).includes('（')));
    check('鸿蒙路径-片段不带平台标注', vs(items).every(i => !String(i.label).includes('（')));
    const theme = sc(items).find(i => i.label === '主题');
    check('鸿蒙路径-主题跳转为鸿蒙包名', !!theme && theme.insertText.value.includes('com.huawei.hmsapp.thememanager'));
    const unlock = sc(items).find(i => i.label === '主题 +解锁');
    check('鸿蒙路径-主题+解锁含ExternCommand', !!unlock && unlock.insertText.value.includes('<ExternCommand command="unlock" condition="#click" />'));
    check('鸿蒙路径-提示词即跳转名称', !!theme && theme.filterText.includes('主题') && theme.filterText.toLowerCase().includes('intent'));
}

// 2) OPPO 路径（advance 父目录）：只出 OPPO 跳转（129×2）与含 OPPO 的片段（7 个）
{
    const text = XML_HEAD;
    const items = ext._test.provideCompletions(makeDoc('D:\\themes\\coloros\\advance\\main.xml', text), endPos(text));
    check('OPPO路径-跳转数量', sc(items).length === 129 * 2, String(sc(items).length));
    check('OPPO路径-片段数量', vs(items).length === 7, String(vs(items).length));
    check('OPPO路径-含当天天气片段', vs(items).some(i => i.label.includes('天气-当天天气')));
}

// 3) 小米路径（mi 词边界）：小米跳转（98×2），片段 3 个（仅日期全平台）
{
    const text = XML_HEAD;
    const items = ext._test.provideCompletions(makeDoc('D:\\themes\\mi\\main.xml', text), endPos(text));
    check('小米路径-跳转数量', sc(items).length === 98 * 2, String(sc(items).length));
    check('小米路径-片段数量', vs(items).length === 1 && vs(items)[0].label.includes('日期'), String(vs(items).length));
}

// 4) 未知路径：全量跳转（659×2）+ 全量片段（16），并标注平台名
{
    const text = XML_HEAD;
    const items = ext._test.provideCompletions(makeDoc('C:\\plain\\main.xml', text), endPos(text));
    check('未知路径-跳转全量', sc(items).length === 659 * 2, String(sc(items).length));
    check('未知路径-片段全量', vs(items).length === 16, String(vs(items).length));
    check('未知路径-跳转标注平台', sc(items).every(i => /（.+）/.test(String(i.label))));
}

// 5) 误判防护：Administrator 路径不得识别为小米
{
    const text = XML_HEAD;
    const items = ext._test.provideCompletions(makeDoc('C:\\Users\\Administrator\\Desktop\\main.xml', text), endPos(text));
    check('admin路径-不误判小米', sc(items).length === 659 * 2, String(sc(items).length));
}

// 6) 光标紧贴完整标签名时也应给出属性提示（v1.7.0 修复）
for (const [text, tag] of [['<Var', 'Var'], ['<Image', 'Image'], ['<Text', 'Text']]) {
    const items = ext._test.provideCompletions(makeDoc('D:\\test\\a.xml', text), endPos(text));
    const attrs = items.filter(i => i.kind === 5);
    check(`${text} 含属性提示`, attrs.length > 0, String(attrs.length));
    check(`${text} 属性插入带前导空格`, attrs.every(i => i.insertText.value.startsWith(' ')));
    check(`${text} 仍含标签提示`, items.some(i => i.kind === 7));
}
{
    const items = ext._test.provideCompletions(makeDoc('D:\\test\\a.xml', '<Va'), endPos('<Va'));
    check('半成品标签名不出属性', items.filter(i => i.kind === 5).length === 0);
}

// 7) < 后输入中文过滤词（v1.7.1 修复）：<主 应判定为标签输入并出快捷跳转
{
    const text = XML_HEAD + '主';
    const items = ext._test.provideCompletions(makeDoc('D:\\themes\\鸿蒙NEXT\\a.xml', text), endPos(text));
    check('<主 中文触发快捷跳转', sc(items).length === 68 * 2, String(sc(items).length));
    check('<主 filterText含中文名', sc(items).some(i => i.filterText.includes('主题')));
}

// 8) 标签体内部（如 <Button> 内）手动唤起：应提供快捷跳转与平台片段（v1.7.1 修复）
{
    const text = '<Button x="0" y="0">\n';
    const items = ext._test.provideCompletions(makeDoc('D:\\themes\\huawei\\a.xml', text), endPos(text));
    check('Button内部-快捷跳转', sc(items).length === 125 * 2, String(sc(items).length));
    check('Button内部-平台片段', vs(items).length > 0, String(vs(items).length));
    const theme = sc(items).find(i => i.label === '主题');
    check('Button内部-主题为华为包名', !!theme && theme.insertText.value.includes('com.huawei.android.thememanager'));
}

// 9) 注册契约测试（v1.7.2 修复）：provider 必须是对象而非裸函数，否则真实 VS Code 报 provider FAILED
{
    const ctx = {
        subscriptions: [],
        extensionPath: require('path').join(__dirname, '..'),
        globalState: { get: () => undefined, update: () => Promise.resolve() },
    };
    ext.activate(ctx);
    check('补全provider为对象且含provideCompletionItems',
        !!capturedCompletionProvider && typeof capturedCompletionProvider.provideCompletionItems === 'function');
    check('悬停provider为对象且含provideHover',
        !!capturedHoverProvider && typeof capturedHoverProvider.provideHover === 'function');
    check('activate不抛错且注册2个provider', ctx.subscriptions.length === 3, String(ctx.subscriptions.length));
}

// 10) 免输 < 直接输入中英文触发（v1.8.0）：标签体内直接打字的 text 上下文
{
    const text = '<Button x="0" y="0">\n主';
    const items = ext._test.provideCompletions(makeDoc('D:\\themes\\huawei\\a.xml', text), endPos(text));
    check('直接输中文-出快捷跳转', sc(items).length === 125 * 2, String(sc(items).length));
    check('直接输中文-中文名可过滤', sc(items).some(i => i.filterText.includes('主题')));
    check('直接输中文-出平台片段', vs(items).length > 0);
}
// 11) package.json 已为 [xml] 默认开启 quickSuggestions（保证免 < 直接打字即弹列表）
{
    const pkg = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'package.json'), 'utf8'));
    const qs = pkg.contributes.configurationDefaults && pkg.contributes.configurationDefaults['[xml]'];
    check('已配置[xml]默认quickSuggestions', !!(qs && qs['editor.quickSuggestions'] && qs['editor.quickSuggestions'].other === true));
}

console.log(fail ? `\n${fail} 个用例失败` : '\n全部通过');
process.exit(fail ? 1 : 0);
