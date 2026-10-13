/*
    澳門教育資源決策儀錶板（概念展示版）
    數據來源：2021/2022至2024/2025學年非高等教育學生統計
    預測部分為模型推算，非官方預測
*/

// =====================================================
// 一、官方統計數據（已提供資料）
// =====================================================

const YEARS = ["2021/2022", "2022/2023", "2023/2024", "2024/2025"];

const TOTAL = {
    公立: [3458, 3441, 3591, 3714],
    私立: [82325, 83743, 84502, 84421]
};

const STAGES = {
    "幼兒教育": { 公立: [686, 613, 591, 528], 私立: [17423, 16495, 15597, 14524] },
    "小學教育": { 公立: [1240, 1288, 1392, 1391], 私立: [35612, 36604, 36983, 37415] },
    "初中教育": { 公立: [552, 528, 560, 712], 私立: [15498, 15909, 16513, 17928] },
    "高中教育": { 公立: [554, 561, 566, 581], 私立: [13308, 14238, 14918, 15477] },
    "特殊教育": { 公立: [426, 451, 482, 502], 私立: [484, 497, 491, 468] }
};

// 幼一入學人數（公立＋私立）
const P1 = [5539, 5516, 5079, 4406];

// 2024/2025學年平均每班人數（已提供資料）
const ACTUAL_CLASS_SIZE = {
    "幼兒教育": 26.5,
    "小學教育": 29.2,
    "初中教育": 30.5,
    "高中教育": 29.3
};

// =====================================================
// 二、衍生數據
// =====================================================

function sum(arr) {
    return arr.reduce(function (a, b) { return a + b; }, 0);
}

const TOTAL_ALL = YEARS.map(function (_, i) {
    return TOTAL.公立[i] + TOTAL.私立[i];
});

const STAGE_TOTALS = {};
Object.keys(STAGES).forEach(function (stage) {
    STAGE_TOTALS[stage] = STAGES[stage].公立.map(function (v, i) {
        return v + STAGES[stage].私立[i];
    });
});

const latestTotal = TOTAL_ALL[TOTAL_ALL.length - 1];          // 88135
const latestYoung = STAGE_TOTALS["幼兒教育"][3];               // 15052
const latestP1 = P1[3];                                        // 4406

const youngChange4y = (latestYoung / STAGE_TOTALS["幼兒教育"][0] - 1) * 100;   // 約-16.9%
const p1Change4y = (latestP1 / P1[0] - 1) * 100;                              // 約-20.5%

const olderStages = ["小學教育", "初中教育", "高中教育", "特殊教育"];
const olderNow = sum(olderStages.map(function (s) { return STAGE_TOTALS[s][3]; }));
const olderBefore = sum(olderStages.map(function (s) { return STAGE_TOTALS[s][0]; }));
const olderChange = (olderNow / olderBefore - 1) * 100;                       // 約+9.4%

const currentYoungClasses = Math.ceil(latestYoung / ACTUAL_CLASS_SIZE["幼兒教育"]);  // 568班

// =====================================================
// 三、工具函數
// =====================================================

function formatNumber(value) {
    return Math.round(value).toLocaleString("zh-Hant");
}

function readNumber(id, defaultValue) {
    const el = document.getElementById(id);
    if (!el) return defaultValue;
    const v = Number(el.value);
    return Number.isNaN(v) ? defaultValue : v;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

// =====================================================
// 四、預測模型（概念模型）
// =====================================================

function calculateForecast() {

    const p1Rate = readNumber("p1Rate", -13) / 100;
    const externalRate = readNumber("externalRate", 1) / 100;
    const classSize = readNumber("classSize", 26);
    const years = Math.max(1, Math.min(8, readNumber("forecastYears", 5)));

    /*
        概念模型說明：
        幼一入學變化會在未來數年逐步傳導至整個幼兒教育階段
        （幼兒共三個年級，因此使用0.7傳導係數），
        外來學生增長可部分抵銷下降。
        此為概念展示模型，不是官方人口預測。
    */

    const transmission = 0.7;
    const netYoungChange = p1Rate * transmission + externalRate / 100;

    // 幼兒學生預測
    let young = latestYoung;
    const fYears = [];
    const fYoung = [];
    const fClasses = [];

    for (let i = 1; i <= years; i++) {
        young = young * (1 + netYoungChange);
        fYears.push("預測" + i);
        fYoung.push(young);
        fClasses.push(Math.ceil(young / classSize));
    }

    const futureYoung = fYoung[fYoung.length - 1];
    const futureClasses = fClasses[fClasses.length - 1];
    const youngChangePct = (futureYoung / latestYoung - 1) * 100;
    const classChange = futureClasses - currentYoungClasses;

    return {
        p1Rate, externalRate, classSize, years,
        fYears, fYoung, fClasses,
        futureYoung, futureClasses,
        youngChangePct, classChange
    };
}

// =====================================================
// 五、更新KPI
// =====================================================

function updateKPI(result) {

    setText("kpiTotal", formatNumber(latestTotal));

    setText("kpiYoung", formatNumber(latestYoung));
    setText("kpiYoungChange", "四年變化：" + youngChange4y.toFixed(1) + "%");

    setText("kpiP1", formatNumber(latestP1));
    setText("kpiP1Change", "四年變化：" + p1Change4y.toFixed(1) + "%");

    setText("kpiOlder", (olderChange >= 0 ? "+" : "") + olderChange.toFixed(1) + "%");

    setText("kpiClasses", formatNumber(currentYoungClasses) + "班");

    const t = result.classChange > 0 ? "+" : "";
    setText("kpiClassChange", t + result.classChange + "班");
}

// =====================================================
// 六、圖表
// =====================================================

const LAYOUT_BASE = {
    margin: { t: 30, r: 25, b: 55,
