# -*- coding: utf-8 -*-
"""Enrich data/tags.json with:
  - functions: 主题引擎表达式函数（数字表达式 3.23 / 字符串表达式 3.24），含参数签名
  - valueEnums 扩充：varSpeedFlag 30 个变速函数（3.46）等
  - tagValueEnums: 特定标签的特定属性取值（如 MediaCommand.command）
幂等：重复运行结果一致。
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "tags.json")

# ---------------- 表达式函数（3.23 数字表达式 / 3.24 字符串表达式） ----------------
FUNCTIONS = [
    # 数学计算
    {"name": "sin", "signature": "sin(x)", "params": ["x：弧度值"], "category": "数学", "description": "三角函数正弦值，x 为弧度值。"},
    {"name": "cos", "signature": "cos(x)", "params": ["x：弧度值"], "category": "数学", "description": "三角函数余弦值，x 为弧度值。"},
    {"name": "tan", "signature": "tan(x)", "params": ["x：弧度值"], "category": "数学", "description": "正切值，x 绝对值趋近 pi/2 的倍数时可能有精度问题。"},
    {"name": "asin", "signature": "asin(x)", "params": ["x：[-1,1]"], "category": "数学", "description": "反正弦函数，x∈[-1,1] 时返回 [-pi/2, pi/2]，超出返回 0。"},
    {"name": "acos", "signature": "acos(x)", "params": ["x：[-1,1]"], "category": "数学", "description": "反余弦函数，x∈[-1,1]，超出返回 0。"},
    {"name": "atan", "signature": "atan(x)", "params": ["x"], "category": "数学", "description": "反正切值。"},
    {"name": "sqrt", "signature": "sqrt(x)", "params": ["x：正数"], "category": "数学", "description": "开平方函数，x 为负数时返回 0。"},
    {"name": "abs", "signature": "abs(x)", "params": ["x"], "category": "数学", "description": "返回一个数的绝对值。"},
    {"name": "min", "signature": "min(x, y)", "params": ["x", "y"], "category": "数学", "description": "返回 x 和 y 中的最小值。"},
    {"name": "max", "signature": "max(x, y)", "params": ["x", "y"], "category": "数学", "description": "返回 x 和 y 中的最大值。"},
    {"name": "pow", "signature": "pow(x, y)", "params": ["x：底数", "y：指数"], "category": "数学", "description": "幂方函数，x 的 y 次方，例如 pow(2,3)=8。"},
    {"name": "round", "signature": "round(x)", "params": ["x"], "category": "数学", "description": "四舍五入取整，例如 round(4.5)=5，round(-4.5)=-4。"},
    {"name": "int", "signature": "int(x)", "params": ["x"], "category": "数学", "description": "舍弃小数部分取整，例如 int(4.5)=4，int(-4.5)=-4。"},
    {"name": "digit", "signature": "digit(x, n)", "params": ["x：数字", "n：位数（倒序从右往左，从1开始）"], "category": "数学", "description": "取给定数字的第几位，例如 digit(12345,2)=4，digit(12345,1)=5。"},
    {"name": "len", "signature": "len(x)", "params": ["x：数字"], "category": "数学", "description": "给定数字的数字个数，例如 len(1234)=4。"},
    {"name": "rand", "signature": "rand()", "params": [], "category": "数学", "description": "取 0 到 1 之间的随机数（float）。int(rand()*a+b) 可得 b 到 b+a 之间的随机整数。"},
    # 条件判断
    {"name": "eq", "signature": "eq(x, y)", "params": ["x", "y"], "category": "条件", "description": "条件判断：x 与 y 相等时值为 1，否则为 0。"},
    {"name": "ne", "signature": "ne(x, y)", "params": ["x", "y"], "category": "条件", "description": "条件判断：x 与 y 不相等时值为 1，否则为 0。"},
    {"name": "ge", "signature": "ge(x, y)", "params": ["x", "y"], "category": "条件", "description": "条件判断：x 大于等于 y 时值为 1，否则为 0。"},
    {"name": "gt", "signature": "gt(x, y)", "params": ["x", "y"], "category": "条件", "description": "条件判断：x 大于 y 时值为 1，否则为 0。"},
    {"name": "le", "signature": "le(x, y)", "params": ["x", "y"], "category": "条件", "description": "条件判断：x 小于等于 y 时值为 1，否则为 0。"},
    {"name": "lt", "signature": "lt(x, y)", "params": ["x", "y"], "category": "条件", "description": "条件判断：x 小于 y 时值为 1，否则为 0。"},
    {"name": "isnull", "signature": "isnull(x)", "params": ["x：全局变量，如 #var 或 @var"], "category": "条件", "description": "条件判断：变量没有值返回 1，有值返回 0，用于判断绑定的变量是否查到数据。"},
    {"name": "not", "signature": "not(x)", "params": ["x"], "category": "条件", "description": "条件判断：x 等于 0 返回 1，不等于 0 返回 0。"},
    {"name": "ifelse", "signature": "ifelse(x, y, z)", "params": ["x：条件", "y：x>0 时的返回值", "z：否则的返回值"], "category": "条件", "description": "条件判断：x 大于 0 返回 y，否则返回 z。支持多级形式 ifelse(x1,y1,x2,y2,...,z)。"},
    # 字符串
    {"name": "substr", "signature": "substr(str, start, len)", "params": ["str：原字符串", "start：开始位置（从0开始）", "len：字串长度"], "category": "字符串", "description": "返回字符串的子串，例如 substr('你好呀',1,2)='好呀'。"},
    {"name": "strIsEmpty", "signature": "strIsEmpty(str)", "params": ["str：字符串/字符串变量/字符串函数"], "category": "字符串", "description": "字符串是否为空，为空返回 'true'，否则返回 'false'。"},
    {"name": "strIndexOf", "signature": "strIndexOf(str1, str2)", "params": ["str1", "str2"], "category": "字符串", "description": "str2 在 str1 中首次出现的位置（索引从0开始），未出现返回 '-1'。"},
    {"name": "strLastIndexOf", "signature": "strLastIndexOf(str1, str2)", "params": ["str1", "str2"], "category": "字符串", "description": "str2 在 str1 中最后出现的位置（索引从0开始），未出现返回 '-1'。"},
    {"name": "strContains", "signature": "strContains(str1, str2)", "params": ["str1", "str2"], "category": "字符串", "description": "str1 中是否包含 str2，包含返回 'true'，否则 'false'。"},
    {"name": "strReplaceAll", "signature": "strReplaceAll(str1, str2, str3)", "params": ["str1：原字符串", "str2：被替换串", "str3：替换为"], "category": "字符串", "description": "将 str1 中所有的 str2 替换为 str3。"},
    {"name": "strEqual", "signature": "strEqual(str1, str2)", "params": ["str1", "str2"], "category": "字符串", "description": "判断两个字符串是否完全相等，相等返回 'true'，否则 'false'。"},
    {"name": "preciseeval", "signature": "preciseeval(str, digits)", "params": ["str：数字表达式计算公式", "digits：保留的小数位数"], "category": "字符串", "description": "计算 str 的值并保留指定小数位，例如 preciseeval({1/3},3)=0.333。注意其后不能使用其他运算符和 + 连接符。"},
    {"name": "formatDate", "signature": "formatDate(format, time)", "params": ["format：格式串，如 'yyyy-MM-dd hh:mm:ss'", "time：时间变量，如 @time_sys"], "category": "字符串", "description": "返回指定格式的时间字符串。"},
    {"name": "plus", "signature": "plus(a, b)", "params": ["a：字符串/数值/数值函数", "b：同左"], "category": "字符串", "description": "返回 a 和 b 的和的整数值，例如 plus(3,3)=6。"},
    {"name": "argb", "signature": "argb(a, r, g, b)", "params": ["a：透明度[0-255]", "r：红[0-255]", "g：绿[0-255]", "b：蓝[0-255]"], "category": "字符串", "description": "解析透明度和红绿蓝三原色的值，返回 8 位 16 进制颜色表示字符串。"},
]

# ---------------- 变速函数（3.46，用于各动画帧元素的 varSpeedFlag） ----------------
EASING = []
for base, cn in [("SineFun", "正弦曲线"), ("QuadFun", "二次方曲线"), ("CubicFun", "三次方曲线"),
                 ("QuartFun", "四次方曲线"), ("QuintFun", "五次方曲线"), ("ExpoFun", "指数曲线"),
                 ("CircFun", "圆形曲线"), ("BackFun", "超过范围的三次方曲线"),
                 ("ElasticFun", "指数衰减的正弦曲线"), ("BounceFun", "指数衰减的反弹曲线")]:
    for suffix, mode in [("In", "缓入"), ("Out", "缓出"), ("InOut", "缓入缓出")]:
        EASING.append("%s_%s" % (base, suffix))

# 属性名 -> 可选值（全局，按属性名匹配）
VALUE_ENUMS_EXTRA = {
    "varSpeedFlag": EASING,
    "mode": ["0", "1"],
    "direction": ["horizontal", "vertical"],
}

# 标签.属性 -> 可选值（优先于全局按属性名匹配）
TAG_VALUE_ENUMS = {
    "MediaCommand.command": ["mediaPlay", "mediaPause", "mediaLike", "mediaDislike",
                             "skipToPrevious", "skipToNext", "addVoice", "subVoice", "mediaRepeatMode"],
    "ExternCommand.command": ["unlock"],
    "IntentCommand.action": ["android.intent.action.MAIN", "action.system.home"],
    "Command.value": ["play", "stop", "true", "false"],
    "VideoCommand.play": ["true", "false"],
}

# ---------------- 全局变量补充 ----------------
VARIABLES_EXTRA = [
    {"name": "bmp_width", "type": "数值", "group": "图片宽高",
     "description": "图片位图宽度。规范迁移注意：脚本中 Image 标签的 bmp_width 若存在需替换为 actual_w。元素属性形式：<图片name>.bmp_width"},
    {"name": "bmp_height", "type": "数值", "group": "图片宽高",
     "description": "图片位图高度。规范迁移注意：脚本中 Image 标签的 bmp_height 若存在需替换为 actual_h。元素属性形式：<图片name>.bmp_height"},
    {"name": "actual_w", "type": "数值", "group": "图片宽高",
     "description": "图片实际宽度。用法：<图片name>.actual_w，如图片 name 为 a 则通过 a.actual_w 取得。"},
    {"name": "actual_h", "type": "数值", "group": "图片宽高",
     "description": "图片实际高度。用法：<图片name>.actual_h，如图片 name 为 a 则通过 a.actual_h 取得。"},
]

def main():
    d = json.load(open(DATA, encoding="utf-8"))
    d["functions"] = FUNCTIONS
    # 全局变量补充（幂等：已存在则更新描述）
    existing = {v["name"]: v for v in d.get("variables", [])}
    for v in VARIABLES_EXTRA:
        if v["name"] in existing:
            existing[v["name"]].update(v)
        else:
            d.setdefault("variables", []).append(dict(v))
    ve = d.setdefault("valueEnums", {})
    for k, v in VALUE_ENUMS_EXTRA.items():
        ve[k] = v
    # 修正：ExternCommand 仅支持解锁命令（规范 3.31/5.5），移除早期推测值
    if ve.get("command") and "unlock" in ve["command"]:
        ve["command"] = ["unlock"]
    d["tagValueEnums"] = TAG_VALUE_ENUMS
    d["easingFunctions"] = EASING
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    print("functions:", len(FUNCTIONS), "| easing:", len(EASING),
          "| valueEnums:", len(ve), "| tagValueEnums:", len(TAG_VALUE_ENUMS),
          "| variables:", len(d["variables"]))

if __name__ == "__main__":
    main()
