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

const latestTotal = TOTAL_ALL[TOTAL_ALL.length - 1];
const latestYoung = STAGE_TOTALS["幼兒教育"][3];
const latestP1 = P1[3];

const youngChange4y = (latestYoung / STAGE_TOTALS["幼兒教育"][0] - 1) * 100;
const p1Change4y = (latestP1 / P1[0] - 1) * 100;

const olderStages = ["小學教育", "初中教育", "高中教育", "特殊教育"];
const olderNow = sum(olderStages.map(function (s) { return STAGE_TOTALS[s][3]; }));
const olderBefore = sum(olderStages.map(function (s) { return STAGE_TOTALS[s][0]; }));
const olderChange = (olderNow / olderBefore - 1) * 100;

const currentYoungClasses = Math.ceil(latestYoung / ACTUAL_CLASS_SIZE["幼兒教育"]);

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
        p1Rate: p1Rate,
        externalRate: externalRate,
        classSize: classSize,
        years: years,
        fYears: fYears,
        fYoung: fYoung,
        fClasses: fClasses,
        futureYoung: futureYoung,
        futureClasses: futureClasses,
        youngChangePct: youngChangePct,
        classChange: classChange
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

function baseLayout(yTitle) {
    return {
        margin: { t: 30, r: 25, b: 60, l: 70 },
        xaxis: { title: "學年" },
        yaxis: { title: yTitle, separatethousands: true },
        paper_bgcolor: "white",
        plot_bgcolor: "white",
        legend: { orientation: "h", y: -0.25 }
    };
}

function updateCharts(result) {

    if (typeof Plotly === "undefined") {
        setText("policyResult", "錯誤：Plotly圖表套件未能載入，請檢查網絡連線。");
        return;
    }

    const config = { responsive: true, displaylogo: false };

    // -------------------------------
    // 圖1：總學生人數（公立及私立）
    // -------------------------------

    Plotly.newPlot(
        "totalChart",
        [
            {
                x: YEARS,
                y: TOTAL.公立,
                type: "scatter",
                mode: "lines+markers",
                name: "公立學校",
                line: { color: "#d97706", width: 3 }
            },
            {
                x: YEARS,
                y: TOTAL.私立,
                type: "scatter",
                mode: "lines+markers",
                name: "私立學校",
                line: { color: "#1769aa", width: 3 }
            },
            {
                x: YEARS,
                y: TOTAL_ALL,
                type: "scatter",
                mode: "lines+markers",
                name: "合計",
                line: { color: "#16a34a", width: 3, dash: "dot" }
            }
        ],
        baseLayout("學生人數"),
        config
    );

    // -------------------------------
    // 圖2：各教育階段學生人數
    // -------------------------------

    const stageColors = {
        "幼兒教育": "#d97706",
        "小學教育": "#1769aa",
        "初中教育": "#16a34a",
        "高中教育": "#7c3aed",
        "特殊教育": "#64748b"
    };

    const stageTraces = Object.keys(STAGE_TOTALS).map(function (stage) {
        return {
            x: YEARS,
            y: STAGE_TOTALS[stage],
            type: "scatter",
            mode: "lines+markers",
            name: stage,
            line: { color: stageColors[stage], width: 3 }
        };
    });

    Plotly.newPlot(
        "stageChart",
        stageTraces,
        baseLayout("學生人數"),
        config
    );

    // -------------------------------
    // 圖3：幼一入學人數
    // -------------------------------

    Plotly.newPlot(
        "p1Chart",
        [
            {
                x: YEARS,
                y: P1,
                type: "scatter",
                mode: "lines+markers",
                name: "幼一入學人數",
                line: { color: "#dc2626", width: 3 },
                marker: { size: 9 }
            }
        ],
        baseLayout("幼一入學人數"),
        config
    );

    // -------------------------------
    // 圖4：各教育階段四年變化率
    // -------------------------------

    const changeStages = Object.keys(STAGE_TOTALS);
    const changeValues = changeStages.map(function (s) {
        return (STAGE_TOTALS[s][3] / STAGE_TOTALS[s][0] - 1) * 100;
    });

    const changeColors = changeValues.map(function (v) {
        return v < 0 ? "#dc2626" : "#16a34a";
    });

    Plotly.newPlot(
        "changeChart",
        [
            {
                x: changeStages,
                y: changeValues,
                type: "bar",
                marker: { color: changeColors },
                text: changeValues.map(function (v) {
                    return v.toFixed(1) + "%";
                }),
                textposition: "outside"
            }
        ],
        {
            margin: { t: 30, r: 25, b: 60, l: 70 },
            yaxis: { title: "四年變化率（%）", ticksuffix: "%" },
            paper_bgcolor: "white",
            plot_bgcolor: "white"
        },
        config
    );

    // -------------------------------
    // 圖5：幼兒學生及班級需求預測
    // -------------------------------

    const historyYoungX = YEARS;
    const historyYoungY = STAGE_TOTALS["幼兒教育"];

    const forecastX = [YEARS[YEARS.length - 1]].concat(result.fYears);
    const forecastY = [latestYoung].concat(result.fYoung);
    const forecastClassY = [currentYoungClasses].concat(result.fClasses);

    Plotly.newPlot(
        "forecastChart",
        [
            {
                x: historyYoungX,
                y: historyYoungY,
                type: "scatter",
                mode: "lines+markers",
                name: "幼兒學生（實際）",
                line: { color: "#1769aa", width: 3 }
            },
            {
                x: forecastX,
                y: forecastY,
                type: "scatter",
                mode: "lines+markers",
                name: "幼兒學生（預測）",
                line: { color: "#dc2626", width: 3, dash: "dash" }
            },
            {
                x: forecastX,
                y: forecastClassY,
                type: "scatter",
                mode: "lines+markers",
                name: "班級需求（預測）",
                yaxis: "y2",
                line: { color: "#16a34a", width: 3, dash: "dot" }
            }
        ],
        {
            margin: { t: 30, r: 70, b: 60, l: 70 },
            xaxis: { title: "學年" },
            yaxis: { title: "幼兒學生人數", separatethousands: true },
            yaxis2: {
                title: "班級數",
                overlaying: "y",
                side: "right",
                rangemode: "tozero"
            },
            paper_bgcolor: "white",
            plot_bgcolor: "white",
            legend: { orientation: "h", y: -0.25 }
        },
        config
    );
}

// =====================================================
// 七、減班優化判斷
// =====================================================

function updateAssessment(result) {

    /*
        示範判斷規則（概念展示，非官方門檻）：
        1. 幼兒學生預測下降8%或以上；
        2. 預測班級減少至少1班；
        兩項同時符合，才建議進入減班優化評估。
    */

    const youngDecline = result.youngChangePct <= -8;
    const classReduction = result.classChange <= -1;

    let decision;

    if (youngDecline && classReduction) {
        decision = "建議進入減班優化評估，並同步檢查跨校合作、校舍使用及教師配置。";
    } else if (youngDecline) {
        decision = "幼兒學生預測下降，但未同時出現明顯班級減少，建議先持續監測。";
    } else if (classReduction) {
        decision = "預測班級需求下降，建議檢查招生率、校舍使用率及教師配置。";
    } else {
        decision = "目前未達到示範性的減班優化條件，建議保留及一般優化。";
    }

    setText("policyResult", decision);

    const table = document.getElementById("assessmentTable");
    if (!table) return;

    table.innerHTML = `
        <tr>
            <td>幼兒學生預測變化</td>
            <td>${result.youngChangePct.toFixed(1)}%</td>
            <td>${youngDecline ? "達到示範性觀察條件" : "未達示範性觀察條件"}</td>
        </tr>
        <tr>
            <td>目前幼兒估算班數</td>
            <td>${formatNumber(currentYoungClasses)}班</td>
            <td>按實際平均班額26.5人估算</td>
        </tr>
        <tr>
            <td>預測幼兒班級數</td>
            <td>${formatNumber(result.futureClasses)}班</td>
            <td>${classReduction ? "預計減少班級" : "未見班級減少"}</td>
        </tr>
        <tr>
            <td>班級變化</td>
            <td>${result.classChange}班</td>
            <td>${classReduction ? "需要進一步評估" : "暫不觸發減班判斷"}</td>
        </tr>
        <tr>
            <td>目標每班人數</td>
            <td>${result.classSize}人</td>
            <td>使用者輸入參數</td>
        </tr>
        <tr>
            <td>資料性質</td>
            <td>模型推算</td>
            <td>概念展示，非正式政策門檻</td>
        </tr>
    `;
}

// =====================================================
// 八、執行Dashboard
// =====================================================

function runDashboard() {
    const result = calculateForecast();
    updateKPI(result);
    updateCharts(result);
    updateAssessment(result);
}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const calculateButton =
            document.getElementById("calculateButton");

        if (calculateButton) {
            calculateButton.addEventListener("click", runDashboard);
        }

        runDashboard();
    }
);
