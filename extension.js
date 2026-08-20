// Theme XML Tips — 主题引擎 XML 代码提示（作者：云舒眠眠）
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

/** @type {any} */
let DATA = null;
/** @type {Map<string, any>} */
let tagMap = new Map();
/** @type {Map<string, any>} */
let varMap = new Map();
/** @type {Map<string, any>} */
let funcMap = new Map();
/** @type {Object<string, Array<{name: string, xml: string}>>} 各平台快捷跳转 */
let SHORTCUTS = {};

function loadData(context) {
    const file = path.join(context.extensionPath, 'data', 'tags.json');
    DATA = JSON.parse(fs.readFileSync(file, 'utf8'));
    tagMap = new Map(DATA.tags.map(t => [t.name, t]));
    varMap = new Map(DATA.variables.map(v => [v.name, v]));
    funcMap = new Map((DATA.functions || []).map(f => [f.name, f]));
    try {
        const sf = path.join(context.extensionPath, 'data', 'shortcuts.json');
        if (fs.existsSync(sf)) SHORTCUTS = JSON.parse(fs.readFileSync(sf, 'utf8'));
    } catch (e) { SHORTCUTS = {}; }
}

/**
 * 平台识别规则（按优先级依次判定，命中即返回）。
 * 匹配方式：中文词直接子串匹配；纯拉丁词长度 <= 3（mi / hw / pad / next 除外按词边界）
 * 为避免 "admin" 命中 "mi"、"show" 命中 "hw" 这类误判，短拉丁词统一按词边界匹配。
 * oppo 额外规则：任一级父文件夹名恰好为 advance。
 */
const PLATFORM_RULES = [
    { key: 'harmonyos', label: '鸿蒙', kw: ['鸿蒙', 'next', 'harmonyos next', 'harmonyos', '鸿蒙purax', 'purax', '鸿蒙折叠', 'pad', '鸿蒙pad', 'purax max', '鸿蒙purax max'] },
    { key: 'huawei', label: '华为', kw: ['华为', '4.0', 'huawei', 'hw'] },
    { key: 'honor', label: '荣耀', kw: ['荣耀', 'honor'] },
    { key: 'oppo', label: 'OPPO', kw: ['oppo'], exact: ['advance'] },
    { key: 'vivo', label: 'vivo', kw: ['vivo'] },
    { key: 'xiaomi', label: '小米', kw: ['mi', '小米', 'xiaomi'] },
];

/** 单个文件夹名是否命中关键词 */
function folderMatches(folder, kw) {
    const name = folder.toLowerCase();
    const k = kw.toLowerCase();
    if (/^[\x00-\x7f]+$/.test(k)) {
        if (k.length <= 3) {
            // 短拉丁词按词边界匹配（以非字母数字为界）
            const re = new RegExp('(^|[^a-z0-9])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)');
            return re.test(name);
        }
        return name.includes(k);
    }
    return name.includes(k);   // 中文关键词子串匹配
}

/** 根据 XML 文件路径向上遍历父文件夹，判断所属平台；无法判断返回 null */
function detectPlatform(document) {
    const fsPath = document.uri && document.uri.fsPath;
    if (!fsPath || fsPath.startsWith('untitled')) return null;
    const folders = [];
    let dir = path.dirname(fsPath);
    const rootDir = path.parse(dir).root;
    while (dir && dir !== rootDir) {
        folders.push(path.basename(dir));
        dir = path.dirname(dir);
    }
    for (const rule of PLATFORM_RULES) {
        for (const folder of folders) {
            if ((rule.exact || []).some(e => folder.toLowerCase() === e)) return rule.key;
            if (rule.kw.some(k => folderMatches(folder, k))) return rule.key;
        }
    }
    return null;
}

/** 判断 position 前文本的上下文：'tag' 标签名 | 'attr' 属性名 | 'value' 属性值 | 'text' 其他 */
function getContext(document, position) {
    const text = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
    const lt = text.lastIndexOf('<');
    const gt = text.lastIndexOf('>');
    if (lt < 0 || lt < gt) return { kind: 'text' };                 // 不在标签内
    const inner = text.slice(lt + 1);
    if (/^[\s/]/.test(inner)) return { kind: 'text' };
    const m = inner.match(/^([A-Za-z][\w.-]*)?([\s\S]*)$/);
    if (!m) return { kind: 'text' };
    const tagName = m[1] || '';
    const rest = m[2] || '';
    if (!/[\s]/.test(rest) && !rest.includes('=')) {
        // 还在输入标签名
        if (rest === '' && !/\s$/.test(inner)) return { kind: 'tag', tagName };
    }
    // 属性值中？
    const vm = rest.match(/([\w-]+)\s*=\s*"([^"]*)$/);
    if (vm) return { kind: 'value', tagName, attrName: vm[1], valuePrefix: vm[2] };
    if (/\s[\w-]*$/.test(rest)) return { kind: 'attr', tagName };
    return { kind: 'attr', tagName };
}

/** 收集当前标签的父标签链（粗略，用于子标签优先排序） */
function parentChain(document, position) {
    const text = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
    const stack = [];
    const tok = /<(\/?)([A-Za-z][\w.-]*)[^>]*?(\/?)>/g;
    let m;
    while ((m = tok.exec(text))) {
        if (m[1] === '/') {
            for (let i = stack.length - 1; i >= 0; i--) {
                if (stack[i] === m[2]) { stack.splice(i); break; }
            }
        } else if (m[3] !== '/') {
            stack.push(m[2]);
        }
    }
    return stack;
}

/** 扫描当前文件，提取 <Var name="..."> 定义的全部变量名 */
function fileVarNames(document) {
    const text = document.getText();
    const names = new Set();
    const re = /<Var\s[^>]*?\bname\s*=\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(text))) {
        if (m[1]) names.add(m[1]);
    }
    return [...names];
}

function tagDoc(t) {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**<${t.name}>**`);
    if (t.title) md.appendMarkdown(` — ${t.title}`);
    if (t.section) md.appendMarkdown(`  \n规范章节：${t.section}`);
    if (t.description) md.appendMarkdown(`  \n  \n${t.description}`);
    if (t.children && t.children.length) {
        md.appendMarkdown(`  \n  \n子元素：${t.children.map(c => '`' + c + '`').join(' ')}`);
    }
    return md;
}

function attrDoc(tagName, attrName, a) {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${attrName}**`);
    if (tagName) md.appendMarkdown(`（<${tagName}>）`);
    const meta = [];
    if (a.type) meta.push(`类型：${a.type}`);
    if (a.required) meta.push(a.required);
    if (meta.length) md.appendMarkdown(`  \n${meta.join('，')}`);
    if (a.description) md.appendMarkdown(`  \n  \n${a.description}`);
    const vals = attrValues(tagName, attrName);
    if (vals && vals.length && vals.length <= 12) {
        md.appendMarkdown(`  \n  \n可选值：${vals.map(v => '`' + v + '`').join(' ')}`);
    }
    return md;
}

function funcDoc(f) {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${f.signature}** — ${f.category}函数`);
    if (f.params && f.params.length) {
        md.appendMarkdown(`  \n  \n参数：`);
        for (const p of f.params) md.appendMarkdown(`  \n- \`${p}\``);
    }
    if (f.description) md.appendMarkdown(`  \n  \n${f.description}`);
    return md;
}

/** 属性取值：优先 标签.属性 专属枚举，其次全局属性枚举，最后布尔 */
function attrValues(tagName, attrName) {
    const tve = DATA.tagValueEnums || {};
    if (tagName && tve[tagName + '.' + attrName]) return tve[tagName + '.' + attrName];
    if (DATA.valueEnums[attrName]) return DATA.valueEnums[attrName];
    if (DATA.boolAttributes.includes(attrName)) return ['true', 'false'];
    return null;
}

/** 生成当前平台（或全部平台）的快捷跳转补全项 */
function shortcutCompletions(document) {
    const platform = detectPlatform(document);
    const groups = [];
    if (platform && SHORTCUTS[platform]) {
        groups.push({ key: platform, label: null, list: SHORTCUTS[platform] });
    } else if (!platform) {
        // 无法判断平台时列出全部，详情中标注平台名
        for (const rule of PLATFORM_RULES) {
            if (SHORTCUTS[rule.key] && SHORTCUTS[rule.key].length) {
                groups.push({ key: rule.key, label: rule.label, list: SHORTCUTS[rule.key] });
            }
        }
    }
    const items = [];
    for (const g of groups) {
        for (const s of g.list) {
            const base = '快捷跳转·' + s.name + (g.label ? '（' + g.label + '）' : '');
            // 1) 单独的快捷跳转
            const it1 = new vscode.CompletionItem(base, vscode.CompletionItemKind.Snippet);
            it1.detail = '快捷跳转';
            it1.documentation = new vscode.MarkdownString('```xml\n' + s.xml + '\n```');
            it1.insertText = new vscode.SnippetString(s.xml.replace(/\$/g, '\\$'));
            it1.filterText = s.name + ' ' + s.xml;
            it1.sortText = '4' + s.name;
            items.push(it1);
            // 2) 快捷跳转 + 解锁
            const withUnlock = s.xml + '\n<ExternCommand command="unlock" condition="#click" />';
            const it2 = new vscode.CompletionItem(base + '+解锁', vscode.CompletionItemKind.Snippet);
            it2.detail = '快捷跳转 + ExternCommand 解锁';
            it2.documentation = new vscode.MarkdownString('```xml\n' + withUnlock + '\n```');
            it2.insertText = new vscode.SnippetString(withUnlock.replace(/\$/g, '\\$'));
            it2.filterText = s.name + ' unlock ' + s.xml;
            it2.sortText = '4' + s.name + '~';
            items.push(it2);
        }
    }
    return items;
}

function provideCompletions(document, position) {
    const ctx = getContext(document, position);
    const items = [];

    if (ctx.kind === 'tag') {
        const parents = parentChain(document, position);
        const parent = parents.length ? tagMap.get(parents[parents.length - 1]) : null;
        const childSet = parent && parent.children ? new Set(parent.children) : null;
        for (const t of DATA.tags) {
            const it = new vscode.CompletionItem(t.name, vscode.CompletionItemKind.Class);
            it.detail = t.title ? `${t.title}${t.section ? '（' + t.section + '）' : ''}` : (t.section || '');
            it.documentation = tagDoc(t);
            it.insertText = t.name;
            it.sortText = (childSet && childSet.has(t.name) ? '0' : (DATA.rootTags.includes(t.name) ? '1' : '2')) + t.name;
            items.push(it);
        }
        // 快捷跳转提示（单独跳转 / 跳转+解锁 各一条）
        items.push(...shortcutCompletions(document));
        return items;
    }

    if (ctx.kind === 'attr' && ctx.tagName) {
        const t = tagMap.get(ctx.tagName);
        const attrs = t ? Object.entries(t.attributes || {}) : [];
        for (const [an, a] of attrs) {
            const it = new vscode.CompletionItem(an, vscode.CompletionItemKind.Field);
            it.detail = [a.type, a.required].filter(Boolean).join(' · ');
            it.documentation = attrDoc(ctx.tagName, an, a);
            it.insertText = new vscode.SnippetString(`${an}="$1"`);
            it.sortText = (a.required === '必填' ? '0' : '1') + an;
            items.push(it);
        }
        return items;
    }

    if (ctx.kind === 'value') {
        // 1) 属性支持参数提示（枚举值）
        const vals = attrValues(ctx.tagName, ctx.attrName);
        if (vals) {
            for (const v of vals) {
                const it = new vscode.CompletionItem(v, vscode.CompletionItemKind.EnumMember);
                it.detail = `${ctx.attrName} 可选值`;
                it.sortText = '0' + v;
                items.push(it);
            }
        }

        // 2) # / @ 变量提示：文件内 <Var name> 定义优先，其次引擎全局变量
        const linePrefix = document.getText(new vscode.Range(position.with(undefined, Math.max(0, position.character - 1)), position));
        const word = document.getText(document.getWordRangeAtPosition(position, /[#@]?[\w.]+/)) || '';
        if (/[#@]/.test(linePrefix) || /^[#@]/.test(word)) {
            const cfg = vscode.workspace.getConfiguration('themeXmlTips');
            if (cfg.get('enableVariableCompletion', true)) {
                const localNames = new Set(fileVarNames(document));
                for (const name of localNames) {
                    const it = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
                    it.detail = '文件内变量（Var）';
                    it.documentation = '当前文件中通过 <Var name="' + name + '"> 定义的变量';
                    it.sortText = '00' + name;
                    items.push(it);
                }
                for (const v of DATA.variables) {
                    if (localNames.has(v.name)) continue;      // 与文件内变量重名时优先文件内
                    const it = new vscode.CompletionItem(v.name, vscode.CompletionItemKind.Variable);
                    it.detail = [v.type, v.group].filter(Boolean).join(' · ') || '引擎全局变量';
                    it.documentation = v.description || '';
                    it.sortText = '01' + v.name;
                    items.push(it);
                }
            }
        }

        // 3) 表达式函数提示（带参数占位符）
        for (const f of (DATA.functions || [])) {
            const it = new vscode.CompletionItem(f.signature, vscode.CompletionItemKind.Function);
            it.filterText = f.name;
            it.detail = f.category + '函数';
            it.documentation = funcDoc(f);
            if (f.params && f.params.length) {
                const snip = new vscode.SnippetString(f.name + '(');
                f.params.forEach((p, i) => {
                    if (i > 0) snip.appendText(', ');
                    snip.appendPlaceholder(p.split('：')[0].split('，')[0]);
                });
                snip.appendText(')');
                it.insertText = snip;
            } else {
                it.insertText = f.name + '()';
            }
            it.sortText = '3' + f.name;
            items.push(it);
        }
        return items;
    }
    return items;
}

function provideHover(document, position) {
    // 变量悬停（引擎全局变量 / 文件内 Var 变量）
    const vRange = document.getWordRangeAtPosition(position, /[#@][\w.]+/);
    if (vRange) {
        const name = document.getText(vRange).slice(1);
        const v = varMap.get(name);
        if (v) {
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`**${document.getText(vRange)}** — 主题引擎变量`);
            if (v.type) md.appendMarkdown(`  \n类型：${v.type}`);
            if (v.group) md.appendMarkdown(`  \n分组：${v.group}`);
            if (v.description) md.appendMarkdown(`  \n  \n${v.description}`);
            return new vscode.Hover(md, vRange);
        }
        if (fileVarNames(document).includes(name)) {
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`**${document.getText(vRange)}** — 文件内变量`);
            md.appendMarkdown(`  \n当前文件中通过 \`<Var name="${name}">\` 定义`);
            return new vscode.Hover(md, vRange);
        }
    }
    const range = document.getWordRangeAtPosition(position, /[A-Za-z][\w.-]*/);
    if (!range) return null;
    const word = document.getText(range);
    // 函数悬停：函数名后紧跟 (
    const afterWord = document.getText(new vscode.Range(range.end, range.end.translate(0, 1)));
    if (afterWord === '(' && funcMap.has(word)) {
        return new vscode.Hover(funcDoc(funcMap.get(word)), range);
    }
    // 标签悬停：前面是 < 或 </
    const before = document.getText(new vscode.Range(new vscode.Position(0, 0), range.start));
    if (/<\/?$/.test(before)) {
        const t = tagMap.get(word);
        if (t) return new vscode.Hover(tagDoc(t), range);
    }
    // 属性悬停：在某标签内且后面跟 =
    const ctx = getContext(document, range.start);
    if (ctx.tagName) {
        const after = document.getText(new vscode.Range(range.end, range.end.translate(0, 2)));
        if (/^\s*=/.test(after)) {
            const t = tagMap.get(ctx.tagName);
            const a = t && t.attributes ? t.attributes[word] : null;
            if (a) return new vscode.Hover(attrDoc(ctx.tagName, word, a), range);
        }
    }
    return null;
}

function activate(context) {
    loadData(context);
    const sel = { language: 'xml', scheme: '*' };
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(sel, provideCompletions, '<', ' ', '"', '#', '@', '(', ','),
        vscode.languages.registerHoverProvider(sel, provideHover)
    );
}

function deactivate() {}

module.exports = { activate, deactivate, _test: { detectPlatform, folderMatches } };
