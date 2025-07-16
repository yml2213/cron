/**
 * Cron 解析器扩展的主要 JS 文件
 */
document.addEventListener('DOMContentLoaded', function () {
    // 初始化 Cron 解析器
    const parser = new CronParser()

    // 获取 DOM 元素
    const cronInput = document.getElementById('cron-input')
    const parseButton = document.getElementById('parse-button')
    const resultArea = document.getElementById('result-area')
    const tabs = document.querySelectorAll('.tab')
    const tabContents = document.querySelectorAll('.tab-content')
    const examplesList = document.getElementById('examples-list')
    const specialCharsList = document.getElementById('special-chars-list')

    // 示例数据
    const examples = [
        { expression: '*/5 * * * *', description: '每5分钟执行一次' },
        { expression: '0 * * * *', description: '每小时的第0分钟执行' },
        { expression: '0 0 * * *', description: '每天午夜执行' },
        { expression: '0 12 * * *', description: '每天中午12点执行' },
        { expression: '0 0 * * 0', description: '每周日午夜执行' },
        { expression: '0 0 1 * *', description: '每月1号午夜执行' },
        { expression: '0 0 1 1 *', description: '每年1月1日午夜执行' },
        { expression: '0 8-17 * * 1-5', description: '工作日的8点到17点整点执行' }
    ]

    // 特殊字符说明
    const specialChars = [
        { char: '*', description: '表示所有可能的值' },
        { char: ',', description: '用于列举值，如 "1,3,5"' },
        { char: '-', description: '表示范围，如 "1-5"' },
        { char: '/', description: '表示步长，如 "*/5" 表示每5个单位' },
        { char: '?', description: '用于日期和星期字段，表示不指定值' }
    ]

    // 初始化示例列表
    examples.forEach(example => {
        const li = document.createElement('li')
        li.innerHTML = `<code>${example.expression}</code>: ${example.description}`
        li.addEventListener('click', () => {
            cronInput.value = example.expression
            parseCron()
        })
        examplesList.appendChild(li)
    })

    // 初始化特殊字符列表
    specialChars.forEach(item => {
        const li = document.createElement('li')
        li.innerHTML = `<code>${item.char}</code>: ${item.description}`
        specialCharsList.appendChild(li)
    })

    // 选项卡切换
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有选项卡的活动状态
            tabs.forEach(t => t.classList.remove('active'))
            tabContents.forEach(content => content.style.display = 'none')

            // 设置当前选项卡为活动状态
            tab.classList.add('active')
            const tabId = tab.getAttribute('data-tab')
            document.getElementById(tabId).style.display = 'block'
        })
    })

    // 设置默认选项卡
    tabs[0].click()

    // 解析按钮点击事件
    parseButton.addEventListener('click', parseCron)

    // 输入框回车事件
    cronInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            parseCron()
        }
    })

    // 解析 Cron 表达式
    function parseCron() {
        const expression = cronInput.value.trim()

        if (!expression) {
            resultArea.textContent = '请输入 Cron 表达式'
            resultArea.classList.add('error')
            return
        }

        const result = parser.parse(expression)

        if (result.error) {
            resultArea.textContent = `错误: ${result.error}`
            resultArea.classList.add('error')
            return
        }

        resultArea.classList.remove('error')

        // 构建结果文本
        let resultText = `${result.description}\n\n最近10次执行时间\n`

        result.nextDates.forEach((date, index) => {
            resultText += `第${index + 1}次: ${parser.formatDate(date)}\n`
        })

        resultArea.textContent = resultText
    }

    // 如果有初始值，立即解析
    if (cronInput.value.trim()) {
        parseCron()
    }
}) 