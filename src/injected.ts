// 注入到当前页面

// This file is injected into the page context and runs in the context of the page
// It can be used to interact with the page and the browser
// the XMLHttpRequest object is overloaded to intercept requests and send them to the extension
// the window object is also overloaded to allow the extension to call functions in the page context
// in general, this script is used to provide a bridge between the page and the extension


// @ts-ignore
function overloadXHR(xhr) {
    const XHR = xhr;
    if (/tiktok|affiliate|tokopedia/gi.test(window.location.href)) {
        // 获取 XMLHttpRequest 原型
        console.log(`Overloading XHR for ${window.location.href}`)
        let xhrPrototype = XHR.prototype;

        // 保存原始的 open 和 send 方法
        let originalOpen = xhrPrototype.open;
        let originalSend = xhrPrototype.send;

        // 重写 open 方法
        // @ts-ignore
        xhrPrototype.open = function (method, url) {
            // 保存请求方法和 URL
            this._method = method;
            this._url = url;

            // 调用原始的 open 方法
            return originalOpen.apply(this, arguments);
        };

        // 重写 send 方法
        // @ts-ignore
        xhrPrototype.send = function (data) {
            const xhr = this;

            // 当请求加载完成时
            xhr.addEventListener("load", function () {
                // 如果 URL 存在
                if (xhr._url) {
                    try {
                        // 如果响应类型不是 blob 或 arraybuffer，且状态码为 200，且有响应文本
                        if (xhr.responseType !== "blob" && xhr.responseType !== "arraybuffer" && xhr.status === 200 && xhr.responseText) {
                            // 获取响应文本
                            var responseText = xhr.responseText;

                            // 发送请求详情
                            window.postMessage({
                                type: "tiktok-request",
                                params: {url: xhr._url, params: data, response: responseText}
                            }, "*")
                        }
                    } catch (error) {
                        console.log(error);
                        console.log("Error in responseType try catch");
                    }
                }
            });

            // 调用原始的 send 方法
            return originalSend.apply(xhr, arguments);
        };

        // 给window注入一个发送http的方法
        // 定义一个函数，用于发送 HTTP 请求
        // @ts-ignore
        window.sendHttpRequest = (requestParams: any) => {
            // 从传入的参数中解构出需要的信息
            let {url, payload, method, headers, isHex, isUpload} = requestParams;

            // 如果没有指定请求方法，默认为 "POST"
            method = method || "POST";

            // 如果没有指定请求头，默认为 "Content-Type": "application/json;charset=UTF-8"
            headers = headers || [{"Content-Type": "application/json;charset=UTF-8"}];

            // 返回一个新的 Promise
            return new Promise((resolve, reject) => {
                // 如果没有提供 URL，返回错误
                if (!url) return reject("URL is empty");

                // 创建一个新的 XMLHttpRequest 对象
                let xhr = new XMLHttpRequest;

                // 打开一个新的请求
                xhr.open(method, url, true);

                // 当请求加载完成时
                xhr.onload = async function () {
                    try {
                        var response = xhr.response;

                        // 如果 isHex 为 true，将响应转换为字符串
                        if (isHex === true) {
                            response = new Uint8Array(response).toString();
                        }

                        // 返回响应
                        resolve(response);
                    } catch (error) {
                        // 如果出现错误，返回错误
                        reject(error);
                    }
                };

                // 如果提供了请求头，设置请求头
                if (headers && headers.length > 0) {
                    headers.forEach((header: any) => {
                        Object.keys(header).forEach(key => {
                            xhr.setRequestHeader(key, header[key]);
                        });
                    });
                }

                // 如果请求出错，返回错误
                xhr.onerror = function (error) {
                    console.info("Request failed");
                    reject(error);
                };

                // 如果 isHex 为 true，将负载转换为 ArrayBuffer
                if (isHex === true) {
                    const buffer = new Uint8Array(payload.split(",").map(Number));
                    payload = buffer.buffer;
                    xhr.responseType = "arraybuffer";
                }

                // 发送请求
                xhr.send(payload);
            });
        };

        // 定义一个函数，用于上传文件
        // @ts-ignore
        window.sendUploadRequest = fileUploadInfo => {
            // 深拷贝传入的对象，防止修改原对象
            let clonedInfo = JSON.parse(JSON.stringify(fileUploadInfo));

            // 从传入的对象中解构出需要的信息
            const {base64Data, fileName, fileType} = JSON.parse(clonedInfo.payload);

            // 定义一个函数，用于将 base64 编码的文件转换为 Blob 对象
            const convertBase64ToBlob = (base64Data: any) => {
                const parts = base64Data.split(",");
                const mimeType = parts[0].match(/:(.*?);/)[1];
                const base64 = atob(parts[1]);
                let length = base64.length;
                const uint8Array = new Uint8Array(length);
                while (length--) {
                    uint8Array[length] = base64.charCodeAt(length);
                }
                return new Blob([uint8Array], {type: mimeType});
            };

            // 调用上面定义的函数，将 base64 编码的文件转换为 Blob 对象
            const blob = convertBase64ToBlob(base64Data);

            // 创建一个 FormData 对象，用于存储要上传的文件
            const formData = new FormData();

            // 将 Blob 对象添加到 FormData 对象中
            formData.append("images[]", blob, fileName);

            // 将 FormData 对象赋值给 payload 属性
            clonedInfo.payload = formData;

            // 调用 window.sendHttpRequest 函数，进行文件上传
            // @ts-ignore
            return window.sendHttpRequest(clonedInfo);
        };
    }
}

console.log('Injecting XHR')
overloadXHR(XMLHttpRequest)
console.log('XHR injected')

// 监听 window 对象上的 "message" 事件, 用于接收其他脚本发送的消息，以便在当前网页环境中调用自定义的一些window下的函数
window.addEventListener("message", (event) => {
    // 从事件对象的 data 属性中解构出 type、func 和 params
    const {type, func, params} = event.data;

    // 如果 type 是 "func" 并且 func 存在
    if (type === "func" && func) {
        // 在 window 对象上调用名为 func 的函数，并传入 params 作为参数
        // @ts-ignore
        window[func](params)
            .then((response: any) => {
                // 如果函数调用成功，调用函数 postMessage 并传入一个对象，该对象包含 params 和函数调用的返回值 response
                // 这里把返回值 response 作为 response 传递给 postMessage，给其他页面调用的时候可以拿到返回值
                window.postMessage({type: "request", params: {params, response}}, "*");
            })
            .catch((error: any) => {
                // 如果函数调用失败，调用函数 postMessage 并传入一个对象，该对象包含 params、null 作为 response 和错误对象 error
                window.postMessage({type: "request", params: {params, response: null, error}}, "*");
                // 在控制台打印错误和一个错误信息
                console.log(error);
                console.log("Error in responseType try catch");
            });
    }
});
