// In the sandboxed page

// Mock chrome APIs
window.chrome = {
    runtime: {
        getManifest: () => {
            return {
                manifest_version: 3,
                name: 'Cron定时解析',
                version: '1.8.3'
            }
        },
        sendMessage: (message) => {
            window.parent.postMessage({
                type: 'chrome_runtime_sendMessage',
                message: message
            }, '*')
        },
        onMessage: {
            addListener: (callback) => {
                const messageListener = (event) => {
                    if (event.data && event.data.type === 'chrome_runtime_onMessage') {
                        callback(event.data.message)
                    }
                }
                window.addEventListener('message', messageListener)
            }
        }
    },
    tabs: {
        create: (options) => {
            window.parent.postMessage({
                type: 'open_tab',
                url: options.url
            }, '*')
        }
    }
}


// Mock localStorage
const fakeLocalStorage = {}

Object.defineProperty(window, 'localStorage', {
    value: {
        setItem: function (key, value) {
            fakeLocalStorage[key] = value
            window.parent.postMessage({
                type: 'localStorage_setItem',
                key: key,
                value: value
            }, '*')
        },
        getItem: function (key) {
            return fakeLocalStorage[key] || null
        },
        removeItem: function (key) {
            delete fakeLocalStorage[key]
            window.parent.postMessage({
                type: 'localStorage_removeItem',
                key: key
            }, '*')
        },
        clear: function () {
            for (const key in fakeLocalStorage) {
                delete fakeLocalStorage[key]
            }
            window.parent.postMessage({
                type: 'localStorage_clear'
            }, '*')
        },
        key: function (index) {
            return Object.keys(fakeLocalStorage)[index] || null
        },
        get length() {
            return Object.keys(fakeLocalStorage).length
        }
    },
    writable: true
})

// Request initial data from parent
window.parent.postMessage({ type: 'localStorage_getAll' }, '*')

// Listen for initial data
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'localStorage_getAll_response') {
        Object.assign(fakeLocalStorage, event.data.data)
    }
}) 