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
    workspace: {
        getConfiguration: () => ({ get: (k, d) => d }),
        onDidOpenTextDocument: () => ({ dispose() {} }),
        onDidChangeTextDocument: () => ({ dispose() {} }),
        onDidCloseTextDocument: () => ({ dispose() {} }),
    },
};
// activate() 依赖的 API（用于注册契约测试）
let capturedCompletionProvider = null;
let capturedHoverProvider = null;
vscodeStub.languages = {
    registerCompletionItemProvider: (sel, provider, ...triggers) => { capturedCompletionProvider = provider; return { dispose() {} }; },
    registerHoverProvider: (sel, provider) => { capturedHoverProvider = provider; return { dispose() {} }; },
    createDiagnosticCollection: () => ({ set() {}, delete() {}, dispose() {} }),
};
vscodeStub.Diagnostic = class { constructor(range, message, severity) { this.range = range; this.message = message; this.severity = severity; } };
vscodeStub.DiagnosticSeverity = { Error: 0, Warning: 1 };
vscodeStub.window = {
    onDidChangeActiveTextEditor: () => ({ dispose() {} }),
    activeTextEditor: null,
    showInformationMessage: () => Promise.resolve(),
    showWarningMessage: () => Promise.resolve(),
};
vscodeStub.extensions = { getExtension: () => undefined };
vscodeStub.commands = { registerCommand: () => ({ dispose() {} }) };
vscodeStub.ViewColumn = { One: 1 };

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
    const toPos = off => {
        let line = 0;
        for (let i = 0; i < lineOffsets.length; i++) { if (lineOffsets[i] <= off) line = i; else break; }
        return new Position(line, off - lineOffsets[line]);
    };
    return {
        uri: { fsPath: filePath },
        getText(range) {
            if (!range) return text;
            return text.slice(toOffset(range.start), toOffset(range.end));
        },
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
function endPos(text) {
    const lines = text.split('\n');
    return new Position(lines.length - 1, lines[lines.length - 1].length);
}

const XML_HEAD = '<?xml version="1.0" encoding="utf-8"?>\n<Lockscreen>\n<';
const sc = items => items.filter(i => String(i.detail || '').startsWith('快捷跳转'));
const vs = items => items.filter(i => String(i.label).startsWith('代码片段·'));

// 跳转条数从数据文件动态读取，避免源文档更新后硬编码失效
const SC_DATA = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'data', 'shortcuts.json'), 'utf8'));
const SC_COUNT = k => (SC_DATA[k] || []).length;
const SC_TOTAL = Object.values(SC_DATA).reduce((n, v) => n + v.length, 0);

let fail = 0;
function check(name, cond, extra) {
    console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  (' + extra + ')' : ''));
    if (!cond) fail++;
}

// 1) 鸿蒙路径：只出鸿蒙跳转（68×2）与含鸿蒙的片段（6 个）
{
    const text = XML_HEAD;
    const items = ext._test.provideCompletions(makeDoc('D:\\themes\\鸿蒙NEXT\\lockscreen\\main.xml', text), endPos(text));
    check('鸿蒙路径-跳转数量', sc(items).length === SC_COUNT("harmonyos") * 2, String(sc(items).length));
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
    check('OPPO路径-跳转数量', sc(items).length === SC_COUNT("oppo") * 2, String(sc(items).length));
    check('OPPO路径-片段数量', vs(items).length === 7, String(vs(items).length));
    check('OPPO路径-含当天天气片段', vs(items).some(i => i.label.includes('天气-当天天气')));
}

// 3) 小米路径（mi 词边界）：小米跳转（98×2），片段 3 个（仅日期全平台）
{
    const text = XML_HEAD;
    const items = ext._test.provideCompletions(makeDoc('D:\\themes\\mi\\main.xml', text), endPos(text));
    check('小米路径-跳转数量', sc(items).length === SC_COUNT("xiaomi") * 2, String(sc(items).length));
    check('小米路径-片段数量', vs(items).length === 1 && vs(items)[0].label.includes('日期'), String(vs(items).length));
}

// 4) 未知路径：全量跳转（659×2）+ 全量片段（16），并标注平台名
{
    const text = XML_HEAD;
    const items = ext._test.provideCompletions(makeDoc('C:\\plain\\main.xml', text), endPos(text));
    check('未知路径-跳转全量', sc(items).length === SC_TOTAL * 2, String(sc(items).length));
    check('未知路径-片段全量', vs(items).length === 16, String(vs(items).length));
    check('未知路径-跳转标注平台', sc(items).every(i => /（.+）/.test(String(i.label))));
}

// 5) 误判防护：Administrator 路径不得识别为小米
{
    const text = XML_HEAD;
    const items = ext._test.provideCompletions(makeDoc('C:\\Users\\Administrator\\Desktop\\main.xml', text), endPos(text));
    check('admin路径-不误判小米', sc(items).length === SC_TOTAL * 2, String(sc(items).length));
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
    check('<主 中文触发快捷跳转', sc(items).length === SC_COUNT("harmonyos") * 2, String(sc(items).length));
    check('<主 filterText含中文名', sc(items).some(i => i.filterText.includes('主题')));
}

// 8) 标签体内部（如 <Button> 内）手动唤起：应提供快捷跳转与平台片段（v1.7.1 修复）
{
    const text = '<Button x="0" y="0">\n';
    const items = ext._test.provideCompletions(makeDoc('D:\\themes\\huawei\\a.xml', text), endPos(text));
    check('Button内部-快捷跳转', sc(items).length === SC_COUNT("huawei") * 2, String(sc(items).length));
    check('Button内部-平台片段', vs(items).length > 0, String(vs(items).length));
    const theme = sc(items).find(i => i.label === '主题');
    check('Button内部-主题为华为包名', !!theme && theme.insertText.value.includes('com.huawei.android.thememanager'));
}

// 9) 注册契约测试（v1.7.2 修复）：provider 必须是对象而非裸函数，否则真实 VS Code 报 provider FAILED
{
    const ctx = {
        subscriptions: [],
        extensionPath: require('path').join(__dirname, '..'),
        globalStorageUri: { fsPath: require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'txtsnip-act-')) },
        globalState: { get: () => undefined, update: () => Promise.resolve() },
    };
    ext.activate(ctx);
    check('补全provider为对象且含provideCompletionItems',
        !!capturedCompletionProvider && typeof capturedCompletionProvider.provideCompletionItems === 'function');
    check('悬停provider为对象且含provideHover',
        !!capturedHoverProvider && typeof capturedHoverProvider.provideHover === 'function');
    check('activate不抛错且注册全部订阅', ctx.subscriptions.length === 12, String(ctx.subscriptions.length));
}

// 14) 自定义片段右键菜单与面板结构（v1.9.1）
{
    const pkg = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'package.json'), 'utf8'));
    const cmds = pkg.contributes.commands.map(c => c.command);
    check('注册3个命令', ['themeXmlTips.addSnippet', 'themeXmlTips.manageSnippets', 'themeXmlTips.viewSnippets'].every(c => cmds.includes(c)));
    const menus = pkg.contributes.menus['editor/context'].map(m => m.command);
    check('右键菜单含新增与查看', menus.includes('themeXmlTips.addSnippet') && menus.includes('themeXmlTips.viewSnippets'));
    const html = ext._test.snippetManagerHtml();
    check('列表含代码片段预览列', html.includes('<th>代码片段</th>'));
    check('编辑表单含删除按钮', html.includes('delInForm'));
    check('面板含必填校验', html.includes('唤醒词、描述、代码片段均为必填项'));
    check('面板不使用沙箱禁用的confirm/alert', !html.includes('confirm(') && !html.includes('alert('));
}

// 10) 免输 < 直接输入中英文触发（v1.8.0）：标签体内直接打字的 text 上下文
{
    const text = '<Button x="0" y="0">\n主';
    const items = ext._test.provideCompletions(makeDoc('D:\\themes\\huawei\\a.xml', text), endPos(text));
    check('直接输中文-出快捷跳转', sc(items).length === SC_COUNT("huawei") * 2, String(sc(items).length));
    check('直接输中文-中文名可过滤', sc(items).some(i => i.filterText.includes('主题')));
    check('直接输中文-出平台片段', vs(items).length > 0);
}
// 11) package.json 已为 [xml] 默认开启 quickSuggestions（保证免 < 直接打字即弹列表）
{
    const pkg = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'package.json'), 'utf8'));
    const qs = pkg.contributes.configurationDefaults && pkg.contributes.configurationDefaults['[xml]'];
    check('已配置[xml]默认quickSuggestions', !!(qs && qs['editor.quickSuggestions'] && qs['editor.quickSuggestions'].other === true));
}

// 12) 命令标签 name 属性免 #/@ 直接提示变量（v1.8.1）；expression 仍需 #/@；其他标签不变
{
    const varItems = items => items.filter(i => i.kind === 6);
    // 命令标签 name：不输入 #/@ 也出变量
    let t = '<Trigger action="down">\n<VariableCommand name="';
    let items = ext._test.provideCompletions(makeDoc('D:\\test\\a.xml', t), endPos(t));
    check('VariableCommand.name 免#出变量', varItems(items).length > 100, String(varItems(items).length));
    t = '<Command name="';
    items = ext._test.provideCompletions(makeDoc('D:\\test\\a.xml', t), endPos(t));
    check('Command.name 免#出变量', varItems(items).length > 100, String(varItems(items).length));
    // 命令标签 expression：不输 # 不出变量，输 # 出变量
    t = '<VariableCommand expression="';
    items = ext._test.provideCompletions(makeDoc('D:\\test\\a.xml', t), endPos(t));
    check('expression 不输#不出变量', varItems(items).length === 0, String(varItems(items).length));
    t = '<VariableCommand expression="#';
    items = ext._test.provideCompletions(makeDoc('D:\\test\\a.xml', t), endPos(t));
    check('expression 输#出变量', varItems(items).length > 100, String(varItems(items).length));
    // 非命令标签 name 类属性不受影响（Text.text 不输 #/@ 不出变量）
    t = '<Text text="';
    items = ext._test.provideCompletions(makeDoc('D:\\test\\a.xml', t), endPos(t));
    check('Text.text 不输#不出变量', varItems(items).length === 0, String(varItems(items).length));
}

// 13) 自定义代码片段（v1.9.0）：转义 / 本地JSON存储 / 补全接入
{
    const os = require('os'), fsx = require('fs'), pth = require('path');
    check('$与\\自动转义', ext._test.escapeSnippetBody('<Var expression="$1" a="b\\c"/>') === '<Var expression="\\$1" a="b\\\\c"/>');
    const tmp = fsx.mkdtempSync(pth.join(os.tmpdir(), 'txtsnip-'));
    ext._test.initSnippets(tmp);
    check('初始为空', ext._test.getCustomSnippets().length === 0);
    ext._test.saveCustomSnippets([{ prefix: 'mytest', description: '我的测试片段', body: '<Var name="a" expression="$1"/>' }]);
    const storeFile = pth.join(tmp, 'custom-snippets.json');
    check('已写入本地JSON文件', fsx.existsSync(storeFile));
    const saved = JSON.parse(fsx.readFileSync(storeFile, 'utf8'));
    check('JSON内容正确且原文保留', saved.length === 1 && saved[0].body === '<Var name="a" expression="$1"/>');
    // text 上下文：完整插入（含 <）
    let items = ext._test.provideCompletions(makeDoc('D:\\test\\a.xml', '<Button>\n'), endPos('<Button>\n'));
    let mine = items.find(i => i.label === 'mytest');
    check('text上下文出自定义片段', !!mine && mine.insertText.value.includes('<Var') && mine.insertText.value.includes('\\$1'));
    // tag 上下文（已输入 <）：去掉片段开头的 < 防止重复
    items = ext._test.provideCompletions(makeDoc('D:\\test\\a.xml', '<Button>\n<'), endPos('<Button>\n<'));
    mine = items.find(i => i.label === 'mytest');
    check('tag上下文去掉重复<', !!mine && !mine.insertText.value.startsWith('<'));
    fsx.rmSync(tmp, { recursive: true, force: true });
}

// 15) 变量提取范围扩大 + 未定义变量提示 + 新增全局变量（v1.9.3）
{
    const varItems = items => items.filter(i => i.kind === 6);
    const text = '<Wallpaper>\n<Var name="w" expression="1"/>\n<Image name="pic1" src="a.png"/>\n<Text text="#undefVar + #';
    const items = ext._test.provideCompletions(makeDoc('D:\\test\\a.xml', text), endPos(text));
    const pic1 = varItems(items).find(i => i.label === 'pic1');
    check('带name属性的Image名被提取', !!pic1 && pic1.detail.includes('Image'), pic1 ? pic1.detail : '无');
    check('Var变量仍被提取', varItems(items).some(i => i.label === 'w' && i.detail.includes('Var')));
    const undef = varItems(items).find(i => i.label === 'undefVar');
    check('使用但未定义的变量被提示', !!undef && undef.detail.includes('未用 Var 定义'), undef ? undef.detail : '无');
    for (const g of ['bmp_width', 'bmp_height', 'actual_w', 'actual_h']) {
        check(`新增全局变量 ${g}`, varItems(items).some(i => i.label === g));
    }
    // 全局变量与文件内名字重名时优先文件内
    const w = varItems(items).filter(i => i.label === 'w');
    check('重名只保留文件内定义', w.length === 1 && w[0].detail.includes('Var'));
}

// 16) 自定义片段平台字段 / 按平台过滤 / 面板搜索（v1.9.4）
{
    const os = require('os'), fsx = require('fs'), pth = require('path');
    const tmp = fsx.mkdtempSync(pth.join(os.tmpdir(), 'txtsnip-plat-'));
    ext._test.initSnippets(tmp);
    ext._test.saveCustomSnippets([
        { prefix: 'allp', description: '全平台片段', body: '<Var name="a"/>' },
        { prefix: 'oppoonly', description: 'OPPO专用', body: '<Var name="b"/>', platform: 'oppo' },
        { prefix: 'hmonly', description: '鸿蒙专用', body: '<Var name="c"/>', platform: 'harmonyos' },
    ]);
    const saved = JSON.parse(fsx.readFileSync(pth.join(tmp, 'custom-snippets.json'), 'utf8'));
    check('平台字段已持久化', saved.find(s => s.prefix === 'oppoonly').platform === 'oppo'
        && saved.find(s => s.prefix === 'allp').platform === '');
    ext._test.saveCustomSnippets([{ prefix: 'badp', description: 'x', body: '<Var/>', platform: 'windows' }]);
    check('非法平台归一为全平台', ext._test.getCustomSnippets().find(s => s.prefix === 'badp').platform === '');
    ext._test.saveCustomSnippets([
        { prefix: 'allp', description: '全平台片段', body: '<Var name="a"/>' },
        { prefix: 'oppoonly', description: 'OPPO专用', body: '<Var name="b"/>', platform: 'oppo' },
        { prefix: 'hmonly', description: '鸿蒙专用', body: '<Var name="c"/>', platform: 'harmonyos' },
    ]);
    const at = p => {
        const t = '<Button>\n';
        return ext._test.provideCompletions(makeDoc(p, t), endPos(t));
    };
    let items = at('D:\\themes\\oppo商店\\a.xml');
    check('OPPO文件-出全平台片段', items.some(i => i.label === 'allp'));
    check('OPPO文件-出OPPO片段', items.some(i => i.label === 'oppoonly'));
    check('OPPO文件-不出鸿蒙片段', !items.some(i => i.label === 'hmonly'));
    check('平台片段detail标注平台', items.find(i => i.label === 'oppoonly').detail.includes('OPPO'));
    items = at('D:\\themes\\鸿蒙NEXT\\a.xml');
    check('鸿蒙文件-出鸿蒙片段', items.some(i => i.label === 'hmonly'));
    check('鸿蒙文件-不出OPPO片段', !items.some(i => i.label === 'oppoonly'));
    items = at('D:\\themes\\unknown\\a.xml');
    check('未识别平台-只出全平台片段', items.some(i => i.label === 'allp') && !items.some(i => i.label === 'oppoonly' || i.label === 'hmonly'));
    // 面板搜索与平台选择 UI
    const html = ext._test.snippetManagerHtml();
    check('面板含搜索框', html.includes('id="q"'));
    check('面板含平台搜索下拉', html.includes('id="qPlatform"'));
    check('面板含精确匹配开关', html.includes('id="qExact"'));
    check('表单含平台选择字段', html.includes('id="fPlatform"'));
    check('列表含平台列', html.includes('<th>平台</th>'));
    check('搜索含模糊与精确逻辑', html.includes('applyFilters') && html.includes('toLowerCase'));
    fsx.rmSync(tmp, { recursive: true, force: true });
}

// 17) XML 错误检测 + 导入导出解析（v1.9.5）
{
    const lint = ext._test.lintText;
    let d = lint('<Lockscreen>\n<Text x="1"/>\n</Lockscreen>', null);
    check('正常文档无诊断', d.length === 0, String(d.length));
    d = lint('<Lockscreen>\n<Text x="1">\n</Lockscreen>', null);
    check('闭合标签不匹配报错并标注行', d.some(x => x.severity === 'error' && x.message.includes('不匹配') && x.line === 2), JSON.stringify(d));
    d = lint('<Lockscreen>\n<Text x="1"/>\n</Lockscren>', null);
    check('闭合标签拼写错误报无对应开标签', d.some(x => x.message.includes('没有对应的开标签') && x.line === 2), JSON.stringify(d));
    d = lint('<Lockscreen>\n<Text x="1"/>', null);
    check('未闭合标签报错并标注行', d.some(x => x.message.includes('未闭合') && x.line === 0));
    d = lint('</Text>', null);
    check('无对应开标签报错', d.some(x => x.message.includes('没有对应的开标签')));
    d = lint('<Lockscreen>\n<FooBar/>\n</Lockscreen>', null);
    check('未知标签报错', d.some(x => x.message.includes('未知标签 <FooBar>')));
    d = lint('<Text xxx="1"/>', null);
    check('未知属性警告', d.some(x => x.severity === 'warning' && x.message.includes('不支持属性 "xxx"')));
    d = lint('<Text align="middle"/>', null);
    check('枚举取值报错', d.some(x => x.severity === 'error' && x.message.includes('可选值')));
    d = lint('<Text align="left"/>', null);
    check('合法枚举不报错', d.length === 0, String(d.length));
    d = lint('<!-- <FooBar/> -->\n<Text align="left"/>', null);
    check('注释内标签不检测', d.length === 0, String(d.length));
    d = lint('<Var name="a" expression="le(#x,1"/>', null);
    check('括号不配对报错', d.some(x => x.message.includes('括号不配对')));
    d = lint('<Var name="a" expression="le(#x,1)"/>', null);
    check('括号配对不报错', d.length === 0, String(d.length));
    d = lint('<Image srcExp="\'bg_\'+#hour+\'.jpg\'" w="1" h="1"/>', 'harmonyos');
    check('鸿蒙srcExp缺{}警告', d.some(x => x.message.includes('需用 {} 包裹')), JSON.stringify(d));
    d = lint('<Image srcExp="\'bg_\'+{#hour}+\'.jpg\'" w="1" h="1"/>', 'harmonyos');
    check('鸿蒙srcExp含{}不警告', !d.some(x => x.message.includes('srcExp')), JSON.stringify(d));
    d = lint('<Image srcExp="\'bg_\'+{#hour}+\'.jpg\'" w="1" h="1"/>', 'oppo');
    check('非鸿蒙srcExp含{}警告', d.some(x => x.message.includes('不支持 {} 包裹写法')), JSON.stringify(d));
    d = lint('<Image srcExp="\'bg_\'+#hour+\'.jpg\'" w="1" h="1"/>', 'oppo');
    check('非鸿蒙srcExp拼接不警告', !d.some(x => x.message.includes('srcExp')), JSON.stringify(d));
    // 导入解析
    const sub = ext._test.parseSublimeSnippet('<snippet>\n<description>网络接口</description>\n<content><![CDATA[\n<WebServiceBinder name="$1"/>\n]]></content>\n<tabTrigger>WebServiceBinder</tabTrigger>\n<scope>text.xml</scope>\n</snippet>');
    check('sublime片段-唤醒词取tabTrigger', sub.prefix === 'WebServiceBinder');
    check('sublime片段-描述取description', sub.description === '网络接口');
    check('sublime片段-内容去除CDATA', sub.body.includes('<WebServiceBinder name="$1"/>') && !sub.body.includes('CDATA'));
    const arr = ext._test.parseImportFile('a.json', JSON.stringify([{ prefix: 'p1', description: 'd1', body: '<Var/>', platform: 'vivo' }]));
    check('json数组导入含平台', arr.length === 1 && arr[0].platform === 'vivo');
    const obj = ext._test.parseImportFile('b.json', JSON.stringify({ 'X': { prefix: ['p2'], body: ['<Var/>', '<Image/>'], description: 'd2' } }));
    check('vscode对象格式导入', obj.length === 1 && obj[0].prefix === 'p2' && obj[0].body === '<Var/>\n<Image/>');
    const xml = ext._test.parseImportFile('demo.xml', '<Lockscreen>\n</Lockscreen>\n');
    check('xml整文件导入', xml.length === 1 && xml[0].prefix === 'demo' && xml[0].body.startsWith('<Lockscreen>'));
    const html = ext._test.snippetManagerHtml();
    check('面板含导入导出按钮', html.includes('importBtn') && html.includes('exportBtn'));
}

console.log(fail ? `\n${fail} 个用例失败` : '\n全部通过');
process.exit(fail ? 1 : 0);
