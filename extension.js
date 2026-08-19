// HarmonyOS Theme XML Tips — 主题引擎 XML 代码提示
// 数据来源：《HarmonyOS NEXT主题引擎规范及指导 v2.3》
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

/** @type {any} */
let DATA = null;
/** @type {Map<string, any>} */
let tagMap = new Map();
/** @type {Map<string, any>} */
let varMap = new Map();

function loadData(context) {
    const file = path.join(context.extensionPath, 'data', 'tags.json');
    DATA = JSON.parse(fs.readFileSync(file, 'utf8'));
    tagMap = new Map(DATA.tags.map(t => [t.name, t]));
    varMap = new Map(DATA.variables.map(v => [v.name, v]));
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
    return md;
}

function attrValues(tagName, attrName) {
    if (DATA.valueEnums[attrName]) return DATA.valueEnums[attrName];
    if (DATA.boolAttributes.includes(attrName)) return ['true', 'false'];
    return null;
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
        const vals = attrValues(ctx.tagName, ctx.attrName);
        if (vals) {
            for (const v of vals) {
                const it = new vscode.CompletionItem(v, vscode.CompletionItemKind.EnumMember);
                items.push(it);
            }
        }
        // # / @ 变量提示
        const linePrefix = document.getText(new vscode.Range(position.with(undefined, Math.max(0, position.character - 1)), position));
        const word = document.getText(document.getWordRangeAtPosition(position, /[#@]?[\w.]+/)) || '';
        if (/[#@]/.test(linePrefix) || /^[#@]/.test(word)) {
            const cfg = vscode.workspace.getConfiguration('themeXmlTips');
            if (cfg.get('enableVariableCompletion', true)) {
                for (const v of DATA.variables) {
                    const it = new vscode.CompletionItem(v.name, vscode.CompletionItemKind.Variable);
                    it.detail = [v.type, v.group].filter(Boolean).join(' · ');
                    it.documentation = v.description || '';
                    it.sortText = '0' + v.name;
                    items.push(it);
                }
            }
        }
        return items;
    }
    return items;
}

function provideHover(document, position) {
    // 变量悬停
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
    }
    const range = document.getWordRangeAtPosition(position, /[A-Za-z][\w.-]*/);
    if (!range) return null;
    const word = document.getText(range);
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
        vscode.languages.registerCompletionItemProvider(sel, provideCompletions, '<', ' ', '"', '#', '@'),
        vscode.languages.registerHoverProvider(sel, provideHover)
    );
}

function deactivate() {}

module.exports = { activate, deactivate };
