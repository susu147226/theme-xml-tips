// 平台检测离线测试：stub vscode 后直接加载 extension.js
const Module = require('module');
const origLoad = Module._load;
Module._load = function (request, ...rest) {
    if (request === 'vscode') return {};
    return origLoad.call(this, request, ...rest);
};
const { _test } = require('../extension.js');
const { detectPlatform } = _test;

function doc(p) { return { uri: { fsPath: p } }; }

const cases = [
    // [路径, 期望平台]
    ['D:\\themes\\鸿蒙折叠\\lockscreen\\main.xml', 'harmonyos'],
    ['D:\\themes\\HarmonyOS NEXT\\a.xml', 'harmonyos'],
    ['D:\\themes\\purax max\\a.xml', 'harmonyos'],
    ['D:\\themes\\next\\a.xml', 'harmonyos'],
    ['D:\\work\\pad主题\\a.xml', 'harmonyos'],
    ['D:\\themes\\华为主题\\a.xml', 'huawei'],
    ['D:\\themes\\huawei4.0\\a.xml', 'huawei'],
    ['D:\\themes\\hw\\a.xml', 'huawei'],
    ['D:\\themes\\荣耀锁屏\\a.xml', 'honor'],
    ['D:\\themes\\HONOR\\a.xml', 'honor'],
    ['D:\\themes\\oppo商店\\a.xml', 'oppo'],
    ['D:\\themes\\coloros\\advance\\a.xml', 'oppo'],
    ['D:\\themes\\vivo\\a.xml', 'vivo'],
    ['D:\\themes\\小米主题\\a.xml', 'xiaomi'],
    ['D:\\themes\\mi\\a.xml', 'xiaomi'],
    ['D:\\themes\\xiaomi14\\a.xml', 'xiaomi'],
    // 误判防护
    ['C:\\Users\\Administrator\\Desktop\\a.xml', null],      // admin 里的 mi 不能命中小米
    ['D:\\showcase\\a.xml', null],                            // show 里的 hw 不能命中华为
    ['D:\\themes\\unknown\\a.xml', null],
    // 优先级：鸿蒙 > 华为
    ['D:\\华为\\鸿蒙purax\\a.xml', 'harmonyos'],
];

let fail = 0;
for (const [p, expect] of cases) {
    const got = detectPlatform(doc(p));
    const ok = got === expect;
    if (!ok) fail++;
    console.log((ok ? 'PASS' : 'FAIL') + '  ' + p + '  => ' + got + ' (期望 ' + expect + ')');
}
console.log(fail ? `\n${fail} 个用例失败` : '\n全部通过');
process.exit(fail ? 1 : 0);
