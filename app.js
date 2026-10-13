/*
    澳門教育資源決策儀錶板
    概念展示版

    注意：
    目前部分數據為模擬或模型推算，
    不代表正式統計或官方政策門檻。
*/


// =====================================================
// 一、基礎示範資料
// =====================================================

const currentStudents = 88135;
const latestBirth = 2870;
const latestYear = 2025;

const historicalBirthYears = [
    2016,
    2017,
    2018,
    2019,
    2020,
    2021,
    2022,
    2023,
    2024,
    2025
];

const historicalBirths = [
    7146,
    6581,
    5954,
    5726,
    5220,
    5195,
    4939,
    4301,
    3565,
    2870
];


// =====================================================
// 二、共用工具
// =====================================================

function formatNumber(value) {
    return Math.round(value).toLocaleString("zh-Hant");
}


function readNumber(id, defaultValue = 0) {
    const element = document.getElementById(id);

    if (!element) {
        return defaultValue;
    }

    const value = Number(element.value);

    if (Number.isNaN(value)) {
        return defaultValue;
    }

    return value;
}


function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.innerText = value;
    }
}


// =====================================================
// 三、計算預測結果
// =====================================================

function calculateForecast() {

    const birthRate =
        readNumber("birthRate", -8) / 100;

    const externalRate =
        readNumber("externalRate", 1) / 100;

    const transferRate =
        readNumber("transferRate", 1.5) / 100;

    const classSize =
        readNumber("classSize", 28);

    const forecastYears =
        Math.max(
            1,
            Math.min(
                10,
                readNumber("forecastYears", 5)
            )
        );

    /*
        簡化概念模型：

        1. 新生兒變化不會立即完全反映在整體學生人數；
        2. 因此使用0.35作為出生人口影響傳導係數；
        3. 外來學生會抵銷部分下降；
        4. 學生轉出率會造成額外減少。

        這不是正式人口預測模型。
    */

    const birthTransmissionFactor = 0.35;

    const birthEffect =
        birthRate * birthTransmissionFactor;

    const netStudentChange =
        birthEffect +
        externalRate -
        transferRate;

    let students = currentStudents;

    const forecastYearsArray = [];
    const forecastStudentsArray = [];

    for (let i = 1; i <= forecastYears; i++) {

        students =
            students * (1 + netStudentChange);

        forecastYearsArray.push(latestYear + i);
        forecastStudentsArray.push(students);
    }

    const futureStudents =
        forecastStudentsArray[
            forecastStudentsArray.length - 1
        ];

    const currentClasses =
        Math.ceil(currentStudents / classSize);

    const futureClasses =
        Math.ceil(futureStudents / classSize);

    const classChange =
        futureClasses - currentClasses;

    const studentChange =
        ((futureStudents / currentStudents) - 1) * 100;

    return {
        birthRate,
        externalRate,
        transferRate,
        classSize,
        forecastYears,
        forecastYearsArray,
        forecastStudentsArray,
        futureStudents,
        currentClasses,
        futureClasses,
        classChange,
        studentChange
    };
}


// =====================================================
// 四、更新KPI卡片
// =====================================================

function updateKPI(result) {

    setText(
        "latestBirth",
        formatNumber(latestBirth)
    );

    setText(
        "currentStudents",
        formatNumber(currentStudents)
    );

    setText(
        "futureStudents",
        formatNumber(result.futureStudents)
    );

    setText(
        "studentChange",
        result.studentChange.toFixed(1) + "%"
    );

    setText(
        "currentClasses",
        formatNumber(result.currentClasses)
    );

    const classChangeText =
        result.classChange > 0
            ? "+" + result.classChange
            : String(result.classChange);

    setText(
        "classChange",
        classChangeText
    );
}


// =====================================================
// 五、更新圖表
// =====================================================

function updateCharts(result) {

    // 檢查Plotly是否已成功載入
    if (typeof Plotly === "undefined") {

        setText(
            "policyResult",
            "錯誤：圖表套件Plotly未能載入，請檢查網絡連線。"
        );

        return;
    }

    // -------------------------------
    // 學生人數預測圖
    // -------------------------------

    const studentYears = [
        latestYear
    ].concat(result.forecastYearsArray);

    const studentValues = [
        currentStudents
    ].concat(result.forecastStudentsArray);

    Plotly.newPlot(
        "studentChart",
        [
            {
                x: studentYears,
                y: studentValues,
                type: "scatter",
                mode: "lines+markers",
                name: "學生人數",
                line: {
                    color: "#1769aa",
                    width: 3
                },
                marker: {
                    size: 8
                }
            }
        ],
        {
            title: {
                text: "目前及預測學生人數"
            },
            margin: {
                top: 55,
                right: 25,
                bottom: 55,
                left: 65
            },
            xaxis: {
                title: "年份",
                dtick: 1
            },
            yaxis: {
                title: "學生人數",
                separatethousands: true
            },
            paper_bgcolor: "white",
            plot_bgcolor: "white"
        },
        {
            responsive: true,
            displaylogo: false
        }
    );

    // -------------------------------
    // 新生兒趨勢圖
    // -------------------------------

    Plotly.newPlot(
        "birthChart",
        [
            {
                x: historicalBirthYears,
                y: historicalBirths,
                type: "scatter",
                mode: "lines+markers",
                name: "新生兒",
                line: {
                    color: "#d97706",
                    width: 3
                },
                marker: {
                    size: 8
                }
            }
        ],
        {
            title: {
                text: "2016—2025年新生兒趨勢"
            },
            margin: {
                top: 55,
                right: 25,
                bottom: 55,
                left: 65
            },
            xaxis: {
                title: "年份",
                dtick: 1
            },
            yaxis: {
                title: "新生兒人數",
                separatethousands: true
            },
            paper_bgcolor: "white",
            plot_bgcolor: "white"
        },
        {
            responsive: true,
            displaylogo: false
        }
    );
}


// =====================================================
// 六、更新減班優化判斷
// =====================================================

function updateAssessment(result) {

    /*
        示範判斷規則：

        1. 學生人數預測下降8%或以上；
        2. 預測班級減少至少1班；
        3. 兩項條件同時符合，才建議進入減班優化評估。

        這些是概念展示條件，
        不是現行官方政策門檻。
    */

    const studentDecline =
        result.studentChange <= -8;

    const classReduction =
        result.classChange <= -1;

    let decision;

    if (studentDecline && classReduction) {

        decision =
            "建議進入減班優化評估，並同步檢查跨校合作、校舍使用及教師配置。";

    } else if (studentDecline) {

        decision =
            "學生人數預測下降，但目前未同時出現明顯班級減少，建議先持續監測。";

    } else if (classReduction) {

        decision =
            "預測班級需求下降，建議檢查招生率、校舍使用率及教師配置。";

    } else {

        decision =
            "目前未達到示範性的減班優化條件，建議保留及一般優化。";
    }

    setText(
        "policyResult",
        decision
    );

    const declineJudgement =
        studentDecline
            ? "達到示範性觀察條件"
            : "未達示範性觀察條件";

    const classJudgement =
        classReduction
            ? "預計減少班級"
            : "未見班級減少";

    const table = document.getElementById(
        "assessmentTable"
    );

    if (!table) {
        return;
    }

    table.innerHTML = `
        <tr>
            <td>預測學生變化</td>
            <td>${result.studentChange.toFixed(1)}%</td>
            <td>${declineJudgement}</td>
        </tr>

        <tr>
            <td>目前估算班數</td>
            <td>${formatNumber(result.currentClasses)}班</td>
            <td>按照目標每班人數估算</td>
        </tr>

        <tr>
            <td>預測班級數</td>
            <td>${formatNumber(result.futureClasses)}班</td>
            <td>${classJudgement}</td>
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
// 七、執行整個Dashboard
// =====================================================

function runDashboard() {

    const result =
        calculateForecast();

    updateKPI(result);

    updateCharts(result);

    updateAssessment(result);
}


// =====================================================
// 八、等待網頁載入後執行
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const calculateButton =
            document.getElementById("calculateButton");

        if (calculateButton) {
            calculateButton.addEventListener(
                "click",
                runDashboard
            );
        }

        runDashboard();
    }
);
