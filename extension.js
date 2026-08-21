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
/** @type {Array<{name: string, category: string, platforms: string[], xml: string}>} 平台代码片段 */
let VARSNIPPETS = [];

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
    try {
        const vf = path.join(context.extensionPath, 'data', 'varsnippets.json');
        if (fs.existsSync(vf)) VARSNIPPETS = JSON.parse(fs.readFileSync(vf, 'utf8'));
    } catch (e) { VARSNIPPETS = []; }
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
    // 还在输入标签名（含中文过滤词，如 <主）：整个 inner 无空白与等号即视为标签名输入
    if (!/[\s=]/.test(inner)) return { kind: 'tag', tagName };
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

/** 扫描当前文件，提取所有带 name 属性标签的 name 值 → Map(名字 → 来源标签名) */
function fileLocalNames(document) {
    const text = document.getText();
    const map = new Map();
    const re = /<([A-Za-z][\w.-]*)\s[^>]*?\bname\s*=\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(text))) {
        if (m[2] && !map.has(m[2])) map.set(m[2], m[1]);
    }
    return map;
}

/** 扫描当前文件，提取通过 # / @ 使用的全部变量名（含未定义） */
function fileUsedVars(document) {
    const text = document.getText();
    const names = new Set();
    const re = /[#@]([A-Za-z_][\w.]*)/g;
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
            // 提示词直接用快捷跳转名称；filterText 同时含中文名与英文（intent 等），中英文输入均可触发
            const base = s.name + (g.label ? '（' + g.label + '）' : '');
            const filter = s.name + ' 快捷跳转 intent IntentCommand ' + s.xml;
            // 1) 单独的快捷跳转
            const it1 = new vscode.CompletionItem(base, vscode.CompletionItemKind.Snippet);
            it1.detail = '快捷跳转';
            it1.documentation = new vscode.MarkdownString('```xml\n' + s.xml + '\n```');
            it1.insertText = new vscode.SnippetString(s.xml.replace(/\$/g, '\\$'));
            it1.filterText = filter;
            it1.sortText = '4' + s.name;
            items.push(it1);
            // 2) 快捷跳转 + 解锁
            const withUnlock = s.xml + '\n<ExternCommand command="unlock" condition="#click" />';
            const it2 = new vscode.CompletionItem(base + ' +解锁', vscode.CompletionItemKind.Snippet);
            it2.detail = '快捷跳转 + ExternCommand 解锁';
            it2.documentation = new vscode.MarkdownString('```xml\n' + withUnlock + '\n```');
            it2.insertText = new vscode.SnippetString(withUnlock.replace(/\$/g, '\\$'));
            it2.filterText = filter + ' unlock 解锁';
            it2.sortText = '4' + s.name + '~';
            items.push(it2);
        }
    }
    return items;
}

/** 平台代码片段提示：识别到平台时只出该平台片段，未识别时全量并标注平台 */
function varSnippetCompletions(document) {
    const platform = detectPlatform(document);
    const labelOf = key => (PLATFORM_RULES.find(r => r.key === key) || {}).label || key;
    const items = [];
    for (const s of VARSNIPPETS) {
        const hit = platform && s.platforms.includes(platform);
        if (platform && !hit) continue;
        const plabels = s.platforms.map(labelOf).join('/');
        const label = '代码片段·' + s.name + (platform ? '' : '（' + plabels + '）');
        const it = new vscode.CompletionItem(label, vscode.CompletionItemKind.Snippet);
        it.detail = '平台代码片段 · ' + plabels;
        const doc = new vscode.MarkdownString();
        doc.appendMarkdown('适用平台：' + plabels + '  \n\n```xml\n' + s.xml + '\n```');
        it.documentation = doc;
        it.insertText = new vscode.SnippetString(s.xml.replace(/\$/g, '\\$'));
        it.filterText = s.name + ' ' + s.category + ' var ' + s.xml.slice(0, 200);
        it.sortText = '3' + s.category + s.name;
        items.push(it);
    }
    return items;
}

/** 指定标签的属性补全项（标签与属性提示不区分平台，全平台一致） */
function attrCompletions(tagName) {
    const t = tagMap.get(tagName);
    if (!t) return [];
    return Object.entries(t.attributes || {}).map(([an, a]) => {
        const it = new vscode.CompletionItem(an, vscode.CompletionItemKind.Field);
        it.detail = [a.type, a.required].filter(Boolean).join(' · ');
        it.documentation = attrDoc(tagName, an, a);
        it.insertText = new vscode.SnippetString(`${an}="$1"`);
        it.sortText = (a.required === '必填' ? '0' : '1') + an;
        return it;
    });
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
        // 修复：光标紧贴完整标签名时（如 <Var| 或 <Var|/>）也给出该标签的属性提示。
        // 用光标处空区间插入，避免替换掉已输入的标签名；前导空格补出分隔。
        if (ctx.tagName && tagMap.has(ctx.tagName)) {
            for (const it of attrCompletions(ctx.tagName)) {
                it.range = new vscode.Range(position, position);
                it.insertText = new vscode.SnippetString(` ${it.label}="$1"`);
                it.sortText = '0' + (it.sortText || it.label);
                items.push(it);
            }
        }
        // 快捷跳转提示（单独跳转 / 跳转+解锁 各一条）
        items.push(...shortcutCompletions(document));
        // 平台代码片段提示（常用 Var 定义，按平台过滤）
        items.push(...varSnippetCompletions(document));
        // 用户自定义代码片段（去掉片段体开头的 <，避免与已输入的 < 重复；按平台过滤）
        items.push(...customSnippetCompletions(true, detectPlatform(document)));
        return items;
    }

    if (ctx.kind === 'attr' && ctx.tagName) {
        return attrCompletions(ctx.tagName);
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

        // 2) 变量提示：命令标签(*Command)的 name 属性直接提示（无需 #/@）；其余属性值需输入 # / @ 触发
        const linePrefix = document.getText(new vscode.Range(position.with(undefined, Math.max(0, position.character - 1)), position));
        const word = document.getText(document.getWordRangeAtPosition(position, /[#@]?[\w.]+/)) || '';
        const isCommandName = /Command$/.test(ctx.tagName || '') && ctx.attrName === 'name';
        if (isCommandName || /[#@]/.test(linePrefix) || /^[#@]/.test(word)) {
            const cfg = vscode.workspace.getConfiguration('themeXmlTips');
            if (cfg.get('enableVariableCompletion', true)) {
                const localMap = fileLocalNames(document);
                const usedNames = new Set(fileUsedVars(document));
                for (const [name, tag] of localMap) {
                    const it = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
                    if (tag === 'Var') {
                        it.detail = '文件内变量（Var）';
                        it.documentation = '当前文件中通过 <Var name="' + name + '"> 定义的变量';
                    } else {
                        it.detail = `文件内元素名（<${tag}> name）`;
                        it.documentation = `当前文件中通过 <${tag} name="${name}"> 定义的元素名`;
                    }
                    it.sortText = '00' + name;
                    items.push(it);
                }
                for (const v of DATA.variables) {
                    if (localMap.has(v.name)) continue;      // 与文件内名字重名时优先文件内
                    const it = new vscode.CompletionItem(v.name, vscode.CompletionItemKind.Variable);
                    it.detail = [v.type, v.group].filter(Boolean).join(' · ') || '引擎全局变量';
                    it.documentation = v.description || '';
                    it.sortText = '01' + v.name;
                    items.push(it);
                }
                // 文件中使用但未用 name 属性定义、也不是引擎全局变量的名字
                for (const name of usedNames) {
                    if (localMap.has(name) || varMap.has(name)) continue;
                    const it = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
                    it.detail = '文件中使用（未用 Var 定义）';
                    it.documentation = '当前文件中通过 #/@ 使用，但未发现对应 <Var> 定义，可能依赖外部传入或遗漏定义';
                    it.sortText = '02' + name;
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

    // 标签体内部（如 <Button> 与 </Button> 之间）：Ctrl+Space 或输入后也可唤起快捷跳转与平台代码片段
    if (ctx.kind === 'text') {
        items.push(...shortcutCompletions(document));
        items.push(...varSnippetCompletions(document));
        items.push(...customSnippetCompletions(false, detectPlatform(document)));
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
        const localMap = fileLocalNames(document);
        if (localMap.has(name)) {
            const tag = localMap.get(name);
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`**${document.getText(vRange)}** — ${tag === 'Var' ? '文件内变量' : '文件内元素名'}`);
            md.appendMarkdown(`  \n当前文件中通过 \`<${tag} name="${name}">\` 定义`);
            return new vscode.Hover(md, vRange);
        }
        if (fileUsedVars(document).includes(name)) {
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`**${document.getText(vRange)}** — 文件中使用（未用 Var 定义）`);
            md.appendMarkdown(`  \n当前文件中通过 #/@ 使用，但未发现对应定义，可能依赖外部传入或遗漏定义`);
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

const PLATFORM_LABELS = { harmonyos: '鸿蒙', huawei: '华为', honor: '荣耀', oppo: 'OPPO', vivo: 'vivo', xiaomi: '小米' };

/** 打开/切换到 XML 文件时弹出平台识别结果（每个文件每次会话提醒一次，便于确认识别是否正确） */
function setupPlatformNotify(context) {
    const shown = new Set();
    const notify = editor => {
        const doc = editor && editor.document;
        if (!doc || doc.languageId !== 'xml') return;
        const key = doc.uri.toString();
        if (shown.has(key)) return;
        shown.add(key);
        const p = detectPlatform(doc);
        vscode.window.showInformationMessage(
            p
                ? `Theme XML Tips：当前文件识别为【${PLATFORM_LABELS[p]}】平台，快捷跳转与代码片段已按该平台过滤`
                : 'Theme XML Tips：未识别到平台（路径不含平台关键词），将列出全部平台的快捷跳转与代码片段'
        );
    };
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(notify));
    notify(vscode.window.activeTextEditor);

    // 检测到 Red Hat XML 扩展时提醒一次：其部分版本在补全解析阶段会报错，可能影响提示体验
    if (!context.globalState.get('redhatMuted') && vscode.extensions.getExtension('redhat.vscode-xml')) {
        vscode.window.showWarningMessage(
            'Theme XML Tips：检测到已安装 Red Hat XML 扩展，若补全列表异常可在本工作区尝试禁用该扩展',
            '不再提示'
        ).then(choice => {
            if (choice) context.globalState.update('redhatMuted', true);
        });
    }
}

// ===================== 自定义代码片段（用户表格管理） =====================

/** @type {Array<{prefix: string, description: string, body: string, platform?: string}>} */
let CUSTOM_SNIPPETS = [];
let customStorePath = null;

/** 自定义片段可选平台（空 = 全平台） */
const SNIPPET_PLATFORMS = ['', 'harmonyos', 'huawei', 'honor', 'oppo', 'vivo', 'xiaomi'];
function normalizePlatform(p) {
    return SNIPPET_PLATFORMS.includes(p) ? p : '';
}

/** 初始化存储：globalStorage 目录下的 custom-snippets.json */
function initCustomSnippets(context) {
    const dir = context.globalStorageUri.fsPath;
    fs.mkdirSync(dir, { recursive: true });
    customStorePath = path.join(dir, 'custom-snippets.json');
    reloadCustomSnippets();
}

/** 重新加载：本地文件 + 设置项 themeXmlTips.customSnippets 合并 */
function reloadCustomSnippets() {
    CUSTOM_SNIPPETS = [];
    try {
        if (customStorePath && fs.existsSync(customStorePath)) {
            const arr = JSON.parse(fs.readFileSync(customStorePath, 'utf8'));
            if (Array.isArray(arr)) CUSTOM_SNIPPETS.push(...arr.filter(s => s && s.prefix && s.body)
                .map(s => ({ prefix: s.prefix, description: s.description || '', body: s.body, platform: normalizePlatform(s.platform) })));
        }
    } catch (e) { /* 文件损坏时忽略，不阻塞补全 */ }
    try {
        const fromSettings = vscode.workspace.getConfiguration('themeXmlTips').get('customSnippets', []);
        if (Array.isArray(fromSettings)) {
            for (const s of fromSettings) {
                if (s && s.prefix && s.body && !CUSTOM_SNIPPETS.some(x => x.prefix === s.prefix)) {
                    CUSTOM_SNIPPETS.push({ prefix: s.prefix, description: s.description || '', body: s.body, platform: normalizePlatform(s.platform) });
                }
            }
        }
    } catch (e) { /* ignore */ }
}

function saveCustomSnippetsFile() {
    // 只持久化本地文件部分（设置项里的由用户自己在 settings.json 维护）
    const fromSettings = vscode.workspace.getConfiguration('themeXmlTips').get('customSnippets', []);
    const settingPrefixes = new Set(Array.isArray(fromSettings) ? fromSettings.map(s => s && s.prefix) : []);
    const local = CUSTOM_SNIPPETS.filter(s => !settingPrefixes.has(s.prefix))
        .map(s => ({ prefix: s.prefix, description: s.description || '', body: s.body, platform: normalizePlatform(s.platform) }));
    fs.writeFileSync(customStorePath, JSON.stringify(local, null, 2), 'utf8');   // JSON 序列化自动完成引号/换行等转义
}

/** 插入时转义代码片段体（snippet 语法中的 $ 与 \），保证原样插入 */
function escapeSnippetBody(body) {
    return String(body).replace(/\\/g, '\\\\').replace(/\$/g, '\\$');
}

/** 自定义片段补全项；stripLt 用于 < 已输入的标签上下文，去掉片段体开头的 <；platform 为当前文件识别到的平台（null = 未识别，仅出全平台片段） */
function customSnippetCompletions(stripLt, platform) {
    const items = [];
    for (const s of CUSTOM_SNIPPETS) {
        if (s.platform && s.platform !== platform) continue;   // 指定了平台的片段只在该平台提示
        let body = s.body;
        if (stripLt) body = body.replace(/^\s*</, '');
        const it = new vscode.CompletionItem(s.prefix, vscode.CompletionItemKind.Snippet);
        it.detail = '自定义片段' + (s.platform ? ' · ' + (PLATFORM_LABELS[s.platform] || s.platform) : '') + (s.description ? ' · ' + s.description : '');
        it.documentation = new vscode.MarkdownString('```xml\n' + s.body + '\n```');
        it.insertText = new vscode.SnippetString(escapeSnippetBody(body));
        it.filterText = s.prefix + ' ' + (s.description || '') + ' custom';
        it.sortText = '2' + s.prefix;
        items.push(it);
    }
    return items;
}

/** 管理面板（表格增删改查） */
function openSnippetManager(context, focusAdd) {
    const panel = vscode.window.createWebviewPanel(
        'themeXmlTips.snippets', '自定义代码片段 · Theme XML Tips',
        vscode.ViewColumn.One, { enableScripts: true }
    );
    panel.webview.html = snippetManagerHtml();
    const pushList = () => panel.webview.postMessage({ type: 'list', snippets: CUSTOM_SNIPPETS, focusAdd: !!focusAdd });
    panel.webview.onDidReceiveMessage(msg => {
        if (msg.type === 'ready') { pushList(); return; }
        if (msg.type === 'save') {
            const { oldPrefix, prefix, description, body } = msg;
            const platform = normalizePlatform(msg.platform);
            if (!prefix || !description || !body) {
                vscode.window.showErrorMessage('唤醒词、描述、代码片段均为必填项');
                return;
            }
            if (oldPrefix) CUSTOM_SNIPPETS = CUSTOM_SNIPPETS.filter(s => s.prefix !== oldPrefix);
            if (CUSTOM_SNIPPETS.some(s => s.prefix === prefix)) {
                CUSTOM_SNIPPETS = CUSTOM_SNIPPETS.map(s => s.prefix === prefix ? { prefix, description, body, platform } : s);
            } else {
                CUSTOM_SNIPPETS.push({ prefix, description, body, platform });
            }
            saveCustomSnippetsFile();     // 保存即自动转义并写入本地 JSON
            reloadCustomSnippets();
            pushList();
            vscode.window.showInformationMessage(`代码片段「${prefix}」已保存`);
            return;
        }
        if (msg.type === 'import') { importCustomSnippets().then(() => pushList()); return; }
        if (msg.type === 'export') { exportCustomSnippets(); return; }
        if (msg.type === 'delete') {
            // webview 沙箱中 confirm/alert 被禁用，确认框放在扩展侧用原生模态框
            vscode.window.showWarningMessage(
                `确定删除代码片段「${msg.prefix}」？`, { modal: true }, '删除'
            ).then(choice => {
                if (choice !== '删除') return;
                CUSTOM_SNIPPETS = CUSTOM_SNIPPETS.filter(s => s.prefix !== msg.prefix);
                saveCustomSnippetsFile();
                reloadCustomSnippets();
                pushList();
                vscode.window.showInformationMessage(`代码片段「${msg.prefix}」已删除`);
            });
            return;
        }
    }, undefined, context.subscriptions);
}

function snippetManagerHtml() {
    return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><style>
body{font-family:var(--vscode-font-family);padding:16px;color:var(--vscode-foreground)}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th,td{border:1px solid var(--vscode-panel-border);padding:6px 10px;text-align:left;font-size:13px}
th{background:var(--vscode-editor-inactiveSelectionBackground)}
textarea,input,select{width:100%;box-sizing:border-box;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);padding:6px;margin:4px 0 10px}
textarea{min-height:140px;font-family:monospace}
button{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;padding:6px 16px;cursor:pointer;margin-right:8px}
button.sec{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}
#form{display:none;border:1px solid var(--vscode-panel-border);padding:16px;margin-top:8px}
.req{color:#e81123}
small{opacity:.7}
</style></head><body>
<h3>自定义代码片段</h3>
<div id="searchBar" style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
  <input id="q" style="flex:2;margin:0" placeholder="搜索唤醒词 / 描述 / 片段内容">
  <select id="qPlatform" style="flex:1;margin:0">
    <option value="">全部平台</option>
    <option value="none">全平台（未指定）</option>
    <option value="harmonyos">鸿蒙</option>
    <option value="huawei">华为</option>
    <option value="honor">荣耀</option>
    <option value="oppo">OPPO</option>
    <option value="vivo">vivo</option>
    <option value="xiaomi">小米</option>
  </select>
  <label style="white-space:nowrap;margin:0"><input type="checkbox" id="qExact" style="width:auto;margin:0 4px 0 0">精确匹配</label>
</div>
<table><thead><tr><th>唤醒词</th><th>描述</th><th>平台</th><th>代码片段</th><th>操作</th></tr></thead><tbody id="rows"></tbody></table>
<button id="addBtn">＋ 新增代码片段</button>
<button id="importBtn" class="sec">导入</button>
<button id="exportBtn" class="sec">导出</button>
<div id="form">
  <label>唤醒词：<span class="req">*</span></label><input id="fPrefix" placeholder="如 my-unlock">
  <label>描述：<span class="req">*</span></label><input id="fDesc" placeholder="如 我的解锁命令">
  <label>平台（选填，不选为全平台）：</label>
  <select id="fPlatform">
    <option value="">全平台</option>
    <option value="harmonyos">鸿蒙</option>
    <option value="huawei">华为</option>
    <option value="honor">荣耀</option>
    <option value="oppo">OPPO</option>
    <option value="vivo">vivo</option>
    <option value="xiaomi">小米</option>
  </select>
  <label>代码片段（xml格式）：<span class="req">*</span></label>
  <textarea id="fBody" placeholder='<ExternCommand command="unlock" condition="#click" />'></textarea>
  <small>保存时自动完成 JSON/片段转义；唤醒词、描述、代码片段均为必填。</small><br>
  <span id="errMsg" style="display:none;color:#e81123"></span><br>
  <button id="saveBtn">保存</button><button id="cancelBtn" class="sec">取消</button><button id="delInForm" class="sec" style="display:none">删除</button>
</div>
<script>
const vscode = acquireVsCodeApi();
let editing = null;
const rows = document.getElementById('rows'), form = document.getElementById('form');
const fPrefix = document.getElementById('fPrefix'), fDesc = document.getElementById('fDesc'), fBody = document.getElementById('fBody');
const fPlatform = document.getElementById('fPlatform');
const q = document.getElementById('q'), qPlatform = document.getElementById('qPlatform'), qExact = document.getElementById('qExact');
const PLAT = { harmonyos:'鸿蒙', huawei:'华为', honor:'荣耀', oppo:'OPPO', vivo:'vivo', xiaomi:'小米' };
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function platLabel(p){ return p ? (PLAT[p]||p) : '全平台'; }
function applyFilters(){
  const list = window._list || [];
  const query = q.value.trim(), exact = qExact.checked, pf = qPlatform.value;
  const hit = s => {
    if (!query) return true;
    if (exact) return s.prefix === query || (s.description||'') === query;   // 精确：唤醒词或描述完全相等
    const hay = (s.prefix + ' ' + (s.description||'') + ' ' + (s.body||'')).toLowerCase();
    return hay.includes(query.toLowerCase());                                 // 模糊：子串匹配
  };
  const filtered = list.filter(s => {
    if (pf === 'none') { if (s.platform) return false; }
    else if (pf && s.platform !== pf) return false;
    return hit(s);
  });
  render(filtered);
}
function render(list){
  const prev = s => { const t = String(s.body||'').replace(/\\s+/g,' ').trim(); return t.length>50 ? t.slice(0,50)+'…' : t; };
  rows.innerHTML = list.map(s=>\`<tr><td><b>\${esc(s.prefix)}</b></td><td>\${esc(s.description||'')}</td>
    <td>\${esc(platLabel(s.platform))}</td>
    <td style="max-width:280px;opacity:.8;font-family:monospace;font-size:12px">\${esc(prev(s))}</td>
    <td><button class="sec" data-edit="\${esc(s.prefix)}">编辑</button>
    <button class="sec" data-del="\${esc(s.prefix)}">删除</button></td></tr>\`).join('');
  rows.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));
  rows.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ vscode.postMessage({type:'delete',prefix:b.dataset.del}); });
  if (!list.length) rows.innerHTML = '<tr><td colspan="5" style="opacity:.6">' + ((window._list||[]).length ? '无匹配结果' : '暂无自定义代码片段') + '</td></tr>';
}
q.addEventListener('input', applyFilters);
qPlatform.addEventListener('change', applyFilters);
qExact.addEventListener('change', applyFilters);
function edit(prefix){
  const s = (window._list||[]).find(x=>x.prefix===prefix);
  if(!s) return;
  editing = prefix; fPrefix.value = s.prefix; fDesc.value = s.description||''; fBody.value = s.body; fPlatform.value = s.platform||'';
  document.getElementById('delInForm').style.display = 'inline-block';
  form.style.display = 'block';
}
document.getElementById('addBtn').onclick = ()=>{ editing=null; fPrefix.value=''; fDesc.value=''; fBody.value=''; fPlatform.value=''; document.getElementById('delInForm').style.display='none'; form.style.display='block'; fPrefix.focus(); };
document.getElementById('importBtn').onclick = ()=>{ vscode.postMessage({type:'import'}); };
document.getElementById('exportBtn').onclick = ()=>{ vscode.postMessage({type:'export'}); };
document.getElementById('cancelBtn').onclick = ()=>{ form.style.display='none'; };
document.getElementById('delInForm').onclick = ()=>{
  if(editing){ vscode.postMessage({type:'delete',prefix:editing}); form.style.display='none'; }
};
document.getElementById('saveBtn').onclick = ()=>{
  const d = { oldPrefix: editing, prefix: fPrefix.value.trim(), description: fDesc.value.trim(), body: fBody.value, platform: fPlatform.value };
  const err = document.getElementById('errMsg');
  if(!d.prefix || !d.description || !d.body.trim()){ err.textContent='唤醒词、描述、代码片段均为必填项'; err.style.display='block'; return; }
  err.style.display='none';
  vscode.postMessage({type:'save', ...d});
  form.style.display='none';
};
window.addEventListener('message', e=>{ if(e.data.type==='list'){ window._list = e.data.snippets; applyFilters(); if(e.data.focusAdd){ document.getElementById('addBtn').click(); } } });
vscode.postMessage({type:'ready'});
</script></body></html>`;
}

// ===================== XML 错误检测 =====================

/**
 * 纯文本 XML 规范检测（核心，供诊断与测试共用）
 * @returns {Array<{line:number, endCol:number, message:string, severity:'error'|'warning'}>}
 */
function lintText(text, platform) {
    const diags = [];
    const lines = text.split('\n');
    // 遮蔽注释与 CDATA（保留换行以保证行号不变）
    const masked = text
        .replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '))
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, m => m.replace(/[^\n]/g, ' '));
    const lineStarts = [0];
    for (let i = 0; i < masked.length; i++) if (masked[i] === '\n') lineStarts.push(i + 1);
    const lineOf = off => { let l = 0; for (let i = 0; i < lineStarts.length; i++) { if (lineStarts[i] <= off) l = i; else break; } return l; };
    const push = (line, message, severity) => diags.push({ line, endCol: (lines[line] || '').length, message, severity });

    const stack = [];
    const tagRe = /<(\/?)([A-Za-z][\w.-]*)((?:"[^"]*"|'[^']*'|[^"'/<>]|\/(?!>))*)(\/?)>/g;
    let m;
    while ((m = tagRe.exec(masked))) {
        const name = m[2], attrText = m[3] || '';
        const line = lineOf(m.index);
        if (m[1]) {   // 闭合标签
            if (!stack.length) { push(line, `闭合标签 </${name}> 没有对应的开标签`, 'error'); continue; }
            if (stack[stack.length - 1].name === name) { stack.pop(); continue; }
            const idx = stack.map(s => s.name).lastIndexOf(name);
            if (idx >= 0) {
                const top = stack[stack.length - 1];
                push(line, `闭合标签 </${name}> 与第 ${top.line + 1} 行的开标签 <${top.name}> 不匹配`, 'error');
                stack.length = idx;   // 弹出到匹配位置，继续检测后续标签
            } else {
                push(line, `闭合标签 </${name}> 没有对应的开标签`, 'error');
            }
            continue;
        }
        // 标签名合法性
        const t = tagMap.get(name);
        if (!t) push(line, `未知标签 <${name}>，请检查标签拼写`, 'error');
        // 属性名称与语法校验
        if (t) {
            const attrRe = /([\w.-]+)\s*=\s*"([^"]*)"/g;
            let am;
            while ((am = attrRe.exec(attrText))) {
                const an = am[1], av = am[2];
                if (!(an in (t.attributes || {}))) {
                    push(line, `标签 <${name}> 不支持属性 "${an}"，请检查属性名拼写`, 'warning');
                    continue;
                }
                // 枚举取值 / 布尔取值（表达式值跳过）
                const enums = attrValues(name, an);
                if (enums && av && !/[#@]/.test(av) && !enums.includes(av)) {
                    push(line, `属性 ${an} 的取值 "${av}" 不在可选值（${enums.join(' / ')}）中`, 'error');
                }
                // 表达式括号配对
                if (/[#@(]/.test(av)) {
                    let bal = 0;
                    for (const ch of av) { if (ch === '(') bal++; if (ch === ')') bal--; if (bal < 0) break; }
                    if (bal !== 0) push(line, `属性 ${an} 的表达式括号不配对`, 'error');
                }
                // Image srcExp 平台写法差异：鸿蒙用 {} 包裹表达式，其他平台直接 + 拼接
                if (name === 'Image' && an === 'srcExp' && av) {
                    if (platform === 'harmonyos') {
                        const noBrace = av.replace(/\{[^}]*\}/g, '');
                        if (/[#@][\w.]+/.test(noBrace)) {
                            push(line, `鸿蒙平台 srcExp 中的变量/表达式需用 {} 包裹，如 srcExp="'bg_'+{int(#hour)}+'.jpg'"`, 'warning');
                        }
                    } else if (platform && /\{[^}]*[#@][^}]*\}/.test(av)) {
                        push(line, `当前平台 srcExp 不支持 {} 包裹写法，请使用拼接写法，如 srcExp="'bg_'+#hour+'.jpg'"`, 'warning');
                    }
                }
            }
        }
        if (!m[4]) stack.push({ name, line });   // 非自闭合才入栈
    }
    for (const s of stack) push(s.line, `标签 <${s.name}>（第 ${s.line + 1} 行）未闭合`, 'error');
    return diags.sort((a, b) => a.line - b.line);
}

let diagCollection = null;

/** 将 lint 结果写入 VS Code 问题面板 */
function refreshDiagnostics(doc) {
    if (!diagCollection || !doc || doc.languageId !== 'xml') return;
    const cfg = vscode.workspace.getConfiguration('themeXmlTips');
    if (cfg.get('enableDiagnostics', true) === false) { diagCollection.delete(doc.uri); return; }
    const items = lintText(doc.getText(), detectPlatform(doc)).map(d => {
        const range = new vscode.Range(new vscode.Position(d.line, 0), new vscode.Position(d.line, d.endCol));
        const diag = new vscode.Diagnostic(range, d.message,
            d.severity === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning);
        diag.source = 'theme-xml-tips';
        return diag;
    });
    diagCollection.set(doc.uri, items);
}

function setupDiagnostics(context) {
    if (!vscode.languages.createDiagnosticCollection) return;
    diagCollection = vscode.languages.createDiagnosticCollection('theme-xml-tips');
    context.subscriptions.push(diagCollection);
    if (vscode.workspace.onDidOpenTextDocument) context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(refreshDiagnostics));
    if (vscode.workspace.onDidChangeTextDocument) context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e && e.document)));
    if (vscode.workspace.onDidCloseTextDocument) context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => { if (doc && doc.languageId === 'xml') diagCollection.delete(doc.uri); }));
    if (vscode.window.activeTextEditor) refreshDiagnostics(vscode.window.activeTextEditor.document);
}

// ===================== 自定义代码片段 导入 / 导出 =====================

/** 解析 .sublime-snippet 文本 → {prefix, description, body}（忽略 scope） */
function parseSublimeSnippet(text) {
    const pick = tag => { const m = text.match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>')); return m ? m[1].trim() : ''; };
    let content = pick('content');
    const cdata = content.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
    if (cdata) content = cdata[1].replace(/^\r?\n/, '').replace(/\r?\n\s*$/, '');
    return { prefix: pick('tabTrigger'), description: pick('description'), body: content };
}

/** 解析导入文件 → 片段数组（.sublime-snippet / .json（数组或VS Code对象格式） / 其他按整个文件内容为片段体） */
function parseImportFile(fileName, text) {
    if (/\.sublime-snippet$/i.test(fileName)) {
        const s = parseSublimeSnippet(text);
        return (s.prefix && s.body) ? [{ prefix: s.prefix, description: s.description || s.prefix, body: s.body, platform: '' }] : [];
    }
    if (/\.json$/i.test(fileName)) {
        const data = JSON.parse(text);
        const out = [];
        if (Array.isArray(data)) {
            for (const s of data) {
                if (s && s.prefix && s.body) out.push({ prefix: String(s.prefix), description: s.description || '', body: String(s.body), platform: normalizePlatform(s.platform) });
            }
        } else if (data && typeof data === 'object') {
            for (const [k, s] of Object.entries(data)) {
                if (!s || typeof s !== 'object') continue;
                const prefix = Array.isArray(s.prefix) ? s.prefix[0] : s.prefix;
                const body = Array.isArray(s.body) ? s.body.join('\n') : s.body;
                if (prefix && body) out.push({ prefix: String(prefix), description: s.description || k, body: String(body), platform: normalizePlatform(s.platform) });
            }
        }
        return out;
    }
    // 其他格式（如 .xml）：整个文件内容作为片段体，自动转义在保存/插入时完成
    const base = path.basename(fileName).replace(/\.[^.]+$/, '');
    return [{ prefix: base, description: '导入的代码片段（' + base + '）', body: text.replace(/\r\n/g, '\n').trim(), platform: '' }];
}

async function importCustomSnippets() {
    const uris = await vscode.window.showOpenDialog({
        canSelectMany: true, openLabel: '导入',
        filters: { '代码片段文件': ['json', 'xml', 'sublime-snippet'], '所有文件': ['*'] },
    });
    if (!uris || !uris.length) return 0;
    let added = 0;
    const errs = [];
    for (const u of uris) {
        try {
            for (const s of parseImportFile(u.fsPath, fs.readFileSync(u.fsPath, 'utf8'))) {
                if (CUSTOM_SNIPPETS.some(x => x.prefix === s.prefix)) {
                    CUSTOM_SNIPPETS = CUSTOM_SNIPPETS.map(x => x.prefix === s.prefix ? s : x);
                } else {
                    CUSTOM_SNIPPETS.push(s);
                }
                added++;
            }
        } catch (e) { errs.push(path.basename(u.fsPath)); }
    }
    if (added) { saveCustomSnippetsFile(); reloadCustomSnippets(); }
    if (errs.length) vscode.window.showWarningMessage('部分文件导入失败：' + errs.join('、'));
    vscode.window.showInformationMessage(`已导入 ${added} 个自定义代码片段`);
    return added;
}

async function exportCustomSnippets() {
    if (!CUSTOM_SNIPPETS.length) { vscode.window.showInformationMessage('暂无自定义代码片段可导出'); return false; }
    const uri = await vscode.window.showSaveDialog({
        saveLabel: '导出', filters: { 'JSON': ['json'] },
        defaultUri: vscode.Uri.file ? vscode.Uri.file('theme-snippets-export.json') : undefined,
    });
    if (!uri) return false;
    fs.writeFileSync(uri.fsPath, JSON.stringify(CUSTOM_SNIPPETS, null, 2), 'utf8');
    vscode.window.showInformationMessage(`已导出 ${CUSTOM_SNIPPETS.length} 个自定义代码片段`);
    return true;
}

// ===================== 激活 =====================

function activate(context) {
    loadData(context);
    initCustomSnippets(context);
    const sel = { language: 'xml', scheme: '*' };
    // 注意：provider 必须传对象（实现 provideCompletionItems / provideHover），不能直接传函数
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(sel, { provideCompletionItems: provideCompletions }, '<', ' ', '"', '#', '@', '(', ','),
        vscode.languages.registerHoverProvider(sel, { provideHover: provideHover }),
        vscode.commands.registerCommand('themeXmlTips.addSnippet', () => openSnippetManager(context, true)),
        vscode.commands.registerCommand('themeXmlTips.manageSnippets', () => openSnippetManager(context, false)),
        vscode.commands.registerCommand('themeXmlTips.viewSnippets', () => openSnippetManager(context, false)),
        vscode.commands.registerCommand('themeXmlTips.importSnippets', () => importCustomSnippets()),
        vscode.commands.registerCommand('themeXmlTips.exportSnippets', () => exportCustomSnippets())
    );
    setupPlatformNotify(context);
    setupDiagnostics(context);
}

function deactivate() {}

module.exports = {
    activate, deactivate,
    _test: {
        detectPlatform, folderMatches, provideCompletions, escapeSnippetBody,
        lintText, parseSublimeSnippet, parseImportFile,
        init: dir => loadData({ extensionPath: dir }),
        initSnippets: dir => initCustomSnippets({ globalStorageUri: { fsPath: dir } }),
        getCustomSnippets: () => CUSTOM_SNIPPETS,
        saveCustomSnippets: arr => { CUSTOM_SNIPPETS = arr.slice(); saveCustomSnippetsFile(); reloadCustomSnippets(); },
        snippetManagerHtml,
    }
};
