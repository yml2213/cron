const iframe = document.getElementById('sandbox-iframe')

window.addEventListener('message', (event) => {
    // Only accept messages from the sandbox
    if (event.source !== iframe.contentWindow) {
        return
    }

    const data = event.data
    if (data && data.type) {
        switch (data.type) {
            // Chrome API routing
            case 'open_tab':
            case 'chrome_runtime_sendMessage':
                chrome.runtime.sendMessage(data)
                break

            // localStorage routing
            case 'localStorage_getAll':
                iframe.contentWindow.postMessage({
                    type: 'localStorage_getAll_response',
                    data: { ...localStorage }
                }, '*')
                break
            case 'localStorage_setItem':
                localStorage.setItem(data.key, data.value)
                break
            case 'localStorage_removeItem':
                localStorage.removeItem(data.key)
                break
            case 'localStorage_clear':
                localStorage.clear()
                break
        }
    }
})

// Forward messages from background to sandbox
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            type: 'chrome_runtime_onMessage',
            message: message
        }, '*')
    }
}) 