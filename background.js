let windowId = null
// 打开独立窗口
const panel = {
    create() {
        chrome.windows.create({
            url: chrome.runtime.getURL("tool.html"),
            type: "popup",
            width: 810,
            left: 200,
            top: 200,
            height: 610,
        }, (w) => {
            windowId = w.id
        })
    },
    open() {
        if (windowId === null) {
            this.create()
        } else {
            chrome.windows.get(windowId, (w) => {
                if (!w) {
                    this.create()
                } else {
                    chrome.windows.update(windowId, { focused: true })
                }
            })
        }

    },
    onRemoved(id) {
        if (id === windowId) {
            windowId = null
        }
    }
}

// 注册快捷键
chrome.commands.onCommand.addListener((command) => {
    switch (command) {
        case "panel":
            panel.open()

            break
        default:
            return
    }
})

// 窗口关闭事件
chrome.windows.onRemoved.addListener((id) => {
    panel.onRemoved(id)
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'open_tab') {
        chrome.tabs.create({ url: message.url })
    } else if (message.type === 'chrome_runtime_sendMessage') {
        // Forward the message to other parts of the extension if needed
        chrome.runtime.sendMessage(message.message, sendResponse)
        // a-sync callback
        return true
    }
})
