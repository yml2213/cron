/**
 * Cron 表达式解析器
 */
class CronParser {
    constructor() {
        this.cronRegex = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/
        this.dayNames = {
            '0': '星期日', '1': '星期一', '2': '星期二', '3': '星期三',
            '4': '星期四', '5': '星期五', '6': '星期六', '7': '星期日',
            'SUN': '星期日', 'MON': '星期一', 'TUE': '星期二', 'WED': '星期三',
            'THU': '星期四', 'FRI': '星期五', 'SAT': '星期六'
        }
        this.monthNames = {
            '1': '1月', '2': '2月', '3': '3月', '4': '4月', '5': '5月', '6': '6月',
            '7': '7月', '8': '8月', '9': '9月', '10': '10月', '11': '11月', '12': '12月',
            'JAN': '1月', 'FEB': '2月', 'MAR': '3月', 'APR': '4月', 'MAY': '5月', 'JUN': '6月',
            'JUL': '7月', 'AUG': '8月', 'SEP': '9月', 'OCT': '10月', 'NOV': '11月', 'DEC': '12月'
        }
    }

    /**
     * 解析 Cron 表达式
     * @param {string} expression - Cron 表达式
     * @returns {object} 解析结果
     */
    parse(expression) {
        // 移除多余的空格
        expression = expression.trim()

        // 检查表达式格式
        const match = expression.match(this.cronRegex)
        if (!match) {
            return { error: "无效的 Cron 表达式格式。应为: '分 时 日 月 周'" }
        }

        // 提取各部分
        const [_, minute, hour, dayOfMonth, month, dayOfWeek] = match

        try {
            // 解析各部分
            const parsedMinute = this.parseField(minute, 0, 59)
            const parsedHour = this.parseField(hour, 0, 23)
            const parsedDayOfMonth = this.parseField(dayOfMonth, 1, 31)
            const parsedMonth = this.parseField(month, 1, 12)
            const parsedDayOfWeek = this.parseField(dayOfWeek, 0, 7)

            // 生成描述
            const description = this.generateDescription(
                parsedMinute, parsedHour, parsedDayOfMonth,
                parsedMonth, parsedDayOfWeek
            )

            // 生成未来执行时间
            const nextDates = this.generateNextDates(
                parsedMinute, parsedHour, parsedDayOfMonth,
                parsedMonth, parsedDayOfWeek
            )

            return {
                description,
                nextDates
            }
        } catch (error) {
            return { error: error.message }
        }
    }

    /**
     * 解析单个字段
     * @param {string} field - Cron 表达式的字段
     * @param {number} min - 最小有效值
     * @param {number} max - 最大有效值
     * @returns {Array} 解析后的值数组
     */
    parseField(field, min, max) {
        // 处理特殊字符
        if (field === '*') {
            return Array.from({ length: max - min + 1 }, (_, i) => min + i)
        }

        const values = new Set()

        // 处理逗号分隔的列表
        field.split(',').forEach(part => {
            // 处理范围 (如 1-5)
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(v => parseInt(v, 10))
                if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
                    throw new Error(`无效的范围: ${part}`)
                }
                for (let i = start; i <= end; i++) {
                    values.add(i)
                }
            }
            // 处理步长 (如 */5)
            else if (part.includes('/')) {
                const [range, step] = part.split('/')
                const stepInt = parseInt(step, 10)

                if (isNaN(stepInt) || stepInt <= 0) {
                    throw new Error(`无效的步长: ${step}`)
                }

                let start = min
                let end = max

                if (range !== '*') {
                    if (range.includes('-')) {
                        [start, end] = range.split('-').map(v => parseInt(v, 10))
                    } else {
                        start = parseInt(range, 10)
                        if (isNaN(start)) {
                            throw new Error(`无效的范围起点: ${range}`)
                        }
                    }
                }

                for (let i = start; i <= end; i += stepInt) {
                    values.add(i)
                }
            }
            // 处理单个值
            else {
                const value = parseInt(part, 10)
                if (isNaN(value) || value < min || value > max) {
                    throw new Error(`无效的值: ${part}`)
                }
                values.add(value)
            }
        })

        return Array.from(values).sort((a, b) => a - b)
    }

    /**
     * 生成人类可读的描述
     */
    generateDescription(minutes, hours, daysOfMonth, months, daysOfWeek) {
        let description = ''

        // 分钟描述
        if (minutes.length === 60) {
            description += '每分钟'
        } else if (minutes.length === 1) {
            description += `在第 ${minutes[0]} 分钟`
        } else if (this.isEveryNth(minutes)) {
            const step = minutes[1] - minutes[0]
            description += `每隔 ${step} 分钟`
        } else {
            description += `在第 ${minutes.join(', ')} 分钟`
        }

        // 小时描述
        if (hours.length === 24) {
            description += '的每小时'
        } else if (hours.length === 1) {
            description += `的 ${hours[0]} 点`
        } else if (this.isEveryNth(hours)) {
            const step = hours[1] - hours[0]
            description += `，每隔 ${step} 小时`
        } else {
            description += `的 ${hours.join(', ')} 点`
        }

        // 日期描述
        if (daysOfMonth.length === 31) {
            // 所有日期，看星期
            if (daysOfWeek.length === 7) {
                description += '，每天'
            } else if (daysOfWeek.length === 1) {
                description += `，每个${this.dayNames[daysOfWeek[0]]}`
            } else {
                const dayNames = daysOfWeek.map(d => this.dayNames[d])
                description += `，每个${dayNames.join('、')}`
            }
        } else {
            description += `，每月的第 ${daysOfMonth.join(', ')} 日`

            if (daysOfWeek.length < 7) {
                const dayNames = daysOfWeek.map(d => this.dayNames[d])
                description += `，如果是 ${dayNames.join('、')}`
            }
        }

        // 月份描述
        if (months.length === 12) {
            description += ''
        } else if (months.length === 1) {
            description += `，在 ${this.monthNames[months[0]]}`
        } else {
            const monthNames = months.map(m => this.monthNames[m])
            description += `，在 ${monthNames.join('、')}`
        }

        return description
    }

    /**
     * 检查数组是否是等间隔的
     */
    isEveryNth(arr) {
        if (arr.length <= 1) return false
        const step = arr[1] - arr[0]
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] - arr[i - 1] !== step) {
                return false
            }
        }
        return true
    }

    /**
     * 生成未来的执行时间
     */
    generateNextDates(minutes, hours, daysOfMonth, months, daysOfWeek) {
        const now = new Date()
        const result = []
        let date = new Date(now)

        // 重置秒和毫秒
        date.setSeconds(0)
        date.setMilliseconds(0)

        // 找到10个未来的执行时间
        while (result.length < 10) {
            // 检查当前日期是否匹配
            if (this.dateMatches(date, minutes, hours, daysOfMonth, months, daysOfWeek)) {
                // 如果日期在未来，添加到结果
                if (date > now) {
                    result.push(new Date(date))
                }
            }

            // 前进一分钟
            date.setMinutes(date.getMinutes() + 1)
        }

        return result
    }

    /**
     * 检查日期是否匹配 Cron 表达式
     */
    dateMatches(date, minutes, hours, daysOfMonth, months, daysOfWeek) {
        const minute = date.getMinutes()
        const hour = date.getHours()
        const dayOfMonth = date.getDate()
        const month = date.getMonth() + 1 // JavaScript 月份从0开始
        const dayOfWeek = date.getDay() // JavaScript 星期从0(周日)开始

        return (
            minutes.includes(minute) &&
            hours.includes(hour) &&
            daysOfMonth.includes(dayOfMonth) &&
            months.includes(month) &&
            (daysOfWeek.includes(dayOfWeek) || daysOfWeek.includes(7) && dayOfWeek === 0)
        )
    }

    /**
     * 格式化日期为可读字符串
     */
    formatDate(date) {
        const pad = (num) => String(num).padStart(2, '0')

        const year = date.getFullYear()
        const month = pad(date.getMonth() + 1)
        const day = pad(date.getDate())
        const hour = pad(date.getHours())
        const minute = pad(date.getMinutes())

        return `${year}-${month}-${day} ${hour}:${minute}:00`
    }
}

// 导出解析器
window.CronParser = CronParser 