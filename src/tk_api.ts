import Long from "long";
import moment from "moment";

const BASE_URL = "https://affiliate.tiktokglobalshop.com"

// 私信流程
// 1. 获取token信息 getTokenInfo()
// 2. 根据creator_oec_id 创建会话, 获取conversation_id  shopCreatorShopConversationCreate()
// 3. 创建消息对象 并对消息对象进行protobuf编码
// 4. 发送消息
// 5. 处理发送消息结果


class TKAPI {
    private baseUrl: string;
    private tokenInfo: any;
    private sequenceId: any = 1e9;
    public creatorQuery:string = "";
    public nextPagination:string = "";

    constructor(baseUrl: string = BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async getUserCreatorCache() {
        let items = await chrome.storage.local.get("userCreatorList");
        return items["userCreatorList"];
    }

    async setUserCreatorCache(data: any) {
        await chrome.storage.local.set({"userCreatorList": data});
    }

    async getTiktokProtoDecode(data: any, type = "tiktok.Response") {
        return await this.post("/invitation/proto/decode", {data: data, type: type})
    }

    async getTiktokProtoEncode(data: any, type = "tiktok.Request") {
        return await this.post("/invitation/proto/encode", {data: data, type: type})
    }

    async post(url: string, data: any) {
        return await this.auth("post", "https://tool.kollink.net/web" + url, data)
    }

    async auth(method: string, url: string, data: any) {
        let token;
        const DL_TOKEN = await chrome.storage.local.get("DL_TOKEN");
        if (DL_TOKEN && DL_TOKEN["DL_TOKEN"]) {
            token = DL_TOKEN["DL_TOKEN"];
        } else {
            const ret = await this.hackLogin();
            console.log(`模拟登录达链拿登录token.....`, ret)
            // @ts-ignore
            token = ret.data.user.token;
            await chrome.storage.local.set({'DL_TOKEN': token})
        }
        // const r = await chrome.storage.local.get("DL-USER")
        // const token = r["DL-USER"].token;
        // console.log(r);
        const headers = {"Content-Type": "application/json;charset=utf-8", "Access-Token": token};
        return await this.send(method, url, data, headers);
    }

    async hackLogin() {
        return await this.send("post", "https://tool.kollink.net/web/login", {
            mobile: "13810295336",
            password: "27c6cd9f622cb9b820a6de5039014cd7",
            sellerId: "8647392017145235247",
            code: "",
            companyId: ""
        }, {"Content-Type": "application/json;charset=utf-8"})
    }

    async send(method: string, url: string, data: any, headers: any) {
        console.log(`headers....`, headers)
        let init: any;
        if (headers) {
            init = {method: method, body: JSON.stringify(data), headers: headers}
        } else {
            init = {method: method, body: JSON.stringify(data)}
        }
        return new Promise((resolve, reject) => {
            fetch(url, init)
                .then(response => response.json())
                .then(data => {
                    resolve(data);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }


    // @ts-ignore
    async query(e, t) {
        let n = await chrome.storage.local.get("scriptQuery");
        n = JSON.parse(n.scriptQuery);
        // @ts-ignore
        return t && (n = t.reduce(((e, t) => (e[t] = n[t], e)), {})), function (e) {
            let t = [];
            for (let n in e) if (e.hasOwnProperty(n)) {
                let r = e[n];
                t.push(n + "=" + r)
            }
            return t.join("&")
        }(Object.assign(e || {}, n))
    }

    /**
     * 创建会话，获取会话id
     * param e:  ["role": "shop_creator", "user_id": "7495275988470827025"]
     * 成功返回 {code: 0, data: {conversation_id: "123456"}}
     */
    // @ts-ignore
    async shopCreatorShopConversationCreate(e) {
        return sendRequest({
            type: "shop_creator_shop_conversation_create",
            // @ts-ignore
            url: this.baseUrl + "/api/v1/im/shop_creator/shop/conversation/create?" + (await this.query()) + "&oec_region=MY&oec_seller_id=7495275988470827025",
            payload: {users: e},
            method: "POST",
            headers: [{"Content-Type": "application/json; charset=utf-8"}]
        }, "sendHttpRequest")
    }

    /**
     * 发送消息
     * param e: api_url
     * param t: 消息内容 protobuf
     *
     */
    // @ts-ignore
    async imSendMessage(e, t) {
        return sendRequest({
            type: "im_send_message",
            url: e + "v1/message/send",
            payload: t,
            isHex: !0,
            method: "POST",
            headers: [{Accept: "application/x-protobuf"}, {"Content-Type": "application/x-protobuf"}]
        }, "sendHttpRequest")
    }

    /**
     * tokenInfo return example:
     * {
     *   "code": 0,
     *   "data": {
     *     "token": "B7LKaTrkW5UxQACXdK1eRt6lgqSQH8rLAJpriBGqqvH6U2lI3PHapK",
     *     "env": "prod",
     *     "idc_region": "sg1",
     *     "ws_url": "wss://frontier.byteoversea.com/ws/v2",
     *     "biz_service_id": 10000,
     *     "api_url": "https://oec-im-tt-sg.tiktokglobalshopv.com/",
     *     "app_id": 380360,
     *     "fp_id": 448,
     *     "app_key": "1b0770367c05f1a78f880192365e7a21",
     *     "shark_app_name": "ecom_im",
     *     "frontier_service_id": 20345,
     *     "user": {
     *       "role": 2,
     *       "id": "5170120918534262382"
     *     },
     *     "region_code": "",
     *     "shop_region": "",
     *     "user_info": {
     *       "name": "twrgeous",
     *       "avatar": "https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/7220334d431949e0972ce009d8d8d09b~tplv-aphluv4xwc-resize-webp:800:800.webp?from=3419323672"
     *     },
     *     "user_cursor": 1711891218493662
     *   },
     *   "message": ""
     * }
     */
    async getTokenInfo() {
        return sendRequest({
            type: "affiliateAccountInfo",
            // @ts-ignore
            url: this.baseUrl + "/api/v1/im/shop_creator/shop/user/token/get?" + (await this.query({})),
            method: "GET",
            headers: [{"Content-Type": "application/json;charset=UTF-8"}]
        }, "sendHttpRequest")
    }

    async fetchWebSocketTokenInfo(inputToken: any) {
        if (inputToken) {
            this.tokenInfo = inputToken;
        } else {
            const response = await this.getTokenInfo();
            // @ts-ignore
            const {code, data} = response.response;

            if (code === 0) {
                console.log(`tokeninfo 获取成功...`, data)
                this.tokenInfo = data;
            } else {
                // token 获取失败
                console.log("tokeninfo 获取失败");
                return null;
            }
        }
        return this.tokenInfo
    }

    /**
     *
     * param form  {form: any, images: any, products: any}
     * param options {tokenInfo: any, response: any}
     */
    // @ts-ignore
    processForm(form, options) {
        let items = [];
        let clonedForm = JSON.parse(JSON.stringify(form))

        // Process form as a type 1 item
        clonedForm.type = 1;
        items.push(clonedForm);

        // Process each image as a type 2 item
        if (form.images) {
            form.images.forEach((image: any) => {
                let item = JSON.parse(JSON.stringify(form));
                // noinspection JSConstantReassignment
                delete item.form.images;
                item.form.invitation_message = "[图片]";
                item.form.image = image;
                item.type = 2;
                items.push(item);
            });
        }

        // Process each product as a type 3 item
        if (form.products) {
            form.products.forEach((product: any) => {
                let item = JSON.parse(JSON.stringify(form));
                delete item.form.products;
                item.form.invitation_message = "[商品卡片]";
                item.form.product = product;
                item.type = 3;
                items.push(item);
            });
        }

        // Map each item to a new object with additional properties
        items = items.map((item) => ({
            item: item,
            payload: item,
            body: this.createMessage(item, options),
            config: options
        }));

        return items;
    }


    /**
     * 构造要发送的消息体
     * param input  {inputForm}
     * param context {tokenInfo:{}, conversationId: string}
     */
    createMessage(input: any, context: any) {
        const {form: formData} = input;
        const {conversationId: conversationId, tokenInfo: tokenData} = context;

        // Extract conversation ID from server response
        input.conversationId = conversationId

        const uniqueId = generateUUID();
        const shortConversationId = Long.fromString(conversationId)
        const userId = tokenData.user.id.toString();
        const token = tokenData.token;
        const shopRegion = tokenData.shop_region;
        const sequenceId = input.sequenceId;

        let messageContent;

        // Generate message content based on input type
        switch (input.type) {
            case 1: // Text message
                messageContent = {
                    PIGEON_BIZ_TYPE: "1",
                    monitor_send_message_platform: "pc",
                    monitor_send_message_start_time: (new Date).getTime().toString(),
                    sender_role: "2",
                    "a:user_language": "zh",
                    shop_region: shopRegion,
                    sender_im_id: userId,
                    sender_im_role: "2",
                    type: "text",
                    original_content: "",
                    "s:mentioned_users": "",
                    "s:client_message_id": uniqueId
                };
                break;
            case 2: // Image message
                messageContent = {
                    // Similar fields omitted for brevity
                    PIGEON_BIZ_TYPE: "1",
                    monitor_send_message_platform: "pc",
                    monitor_send_message_start_time: (new Date).getTime().toString(),
                    sender_role: "2",
                    "a:user_language": "zh",
                    shop_region: shopRegion,
                    sender_im_id: userId,
                    sender_im_role: "2",
                    type: "file_image",
                    imageUrl: formData.image.url,
                    imageHeight: formData.image?.height?.toString(),
                    imageWidth: formData.image?.width?.toString(),
                    starling_content_key: "im_sdk_cell_sent_photo",
                    uuid: generateUUID(),
                    "s:mentioned_users": "",
                    "s:client_message_id": uniqueId
                };
                break;
            case 3: // Product message
                messageContent = {
                    PIGEON_BIZ_TYPE: "1",
                    monitor_send_message_platform: "pc",
                    monitor_send_message_start_time: (new Date).getTime().toString(),
                    sender_role: "2",
                    "a:user_language": "zh",
                    shop_region: shopRegion,
                    sender_im_id: userId,
                    sender_im_role: "2",
                    type: "product",
                    starling_content_key: "im_creator_message_type_product_card",
                    productId: formData.product?.productId,
                    "s:mentioned_users": "",
                    "s:client_message_id": uniqueId
                }
        }

        // Return the final message object
        return {
            headers: {},
            body: {
                send_message_body: {
                    conversation_id: conversationId,
                    conversation_short_id: shortConversationId,
                    conversation_type: 2,
                    content: formData.invitation_message?.toString(),
                    mentioned_users: [],
                    client_message_id: uniqueId,
                    ticket: "deprecated",
                    message_type: 1000,
                    ext: messageContent
                }
            },
            cmd: 100,
            sequence_id: sequenceId,
            refer: 3,
            token: token,
            device_id: userId,
            sdk_version: "0.0.8-feat-add-cmd-in-error",
            build_number: "93229b4:feat/0.0.8-add-cmd-in-error",
            inbox_type: 0,
            device_platform: "web",
            auth_type: 2
        }
    };

    baseMessageTemplate(txt: string) {
        return {
            intentional_cooperation: [1],
            provided_free_sample: !1,
            images: null,
            products: null,
            invitation_message: txt,
            interval_daya: 7,
            interval_time: 5,
            creator_oec_id: "",
            pages: [1, 3],
            allPages: !1,
        }
    }

    /**
     * 向receiver发送消息
     * @param receiver 拦截请求获取到的creator的详细信息
     * @param msg 消息模板
     */
    async sendIndividualMessage(receiver: any, msg: string) {
        // 获取token信息
        const tokenInfo = await this.fetchWebSocketTokenInfo(null);
        if (!tokenInfo) {
            console.log(`获取token信息失败...`)
            return null;
        }

        // 创建会话
        const conversationIdResp = await this.shopCreatorShopConversationCreate([{
            role: "creator",
            id: receiver.creator_oecuid.value
        }]);
        // @ts-ignore
        if (conversationIdResp?.response?.code !== 0) {
            // 创建会话失败
            console.log(`创建会话失败...`)
            return null;
        }

        const baseMessage = this.baseMessageTemplate(msg);
        const form = {
            userItem: receiver,
            tokenInfo: tokenInfo,
            creator_oec_id: receiver.creator_oecuid.value,
            clientId: generateUUID(),
            sequenceId: Long.fromNumber(this.sequenceId++),
            form: baseMessage,
            type: 1
        }

        // @ts-ignore
        const message = this.createMessage(form, {
            tokenInfo: tokenInfo,
            // @ts-ignore
            conversationId: conversationIdResp.response.data.conversation_id
        });
        console.log(`message....`, message)
        const encodeData = await this.getTiktokProtoEncode(message, "tiktok.Request");
        // @ts-ignore
        console.log(`encodeData....`, encodeData!.data)

        // @ts-ignore
        const ret = await this.imSendMessage(tokenInfo.api_url, encodeData.data);
        // @ts-ignore
        console.log(`send message response....`, ret)

    }

}

const tkApi = new TKAPI();
export {tkApi};

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


// @ts-ignore
function sendRequest(message, messageType) {
    let clonedMessage = JSON.parse(JSON.stringify(message));
    clonedMessage = Object.assign({
        type: "executionLog",
        method: "POST",
        headers: [{"Content-Type": "application/json"}]
    }, clonedMessage);

    if (clonedMessage.payload && typeof clonedMessage.payload !== "string" && clonedMessage.isHex !== true) {
        clonedMessage.payload = JSON.stringify(clonedMessage.payload);
    }

    clonedMessage.type = generateUUID();
    const requestParams = clonedMessage;

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {

            reject({
                response: {code: 504, message: "请求超时"},
                params: requestParams
            });
            clearTimeout(timeoutId);
            window.removeEventListener("message", messageListener);
        }, 30000);

        // @ts-ignore
        let messageListener = async function (event) {
            const receivedData = JSON.parse(JSON.stringify(event.data));
            if (receivedData.type === "request" && receivedData.params && receivedData.params.params?.type === requestParams.type) {
                const {params} = receivedData;
                console.log(`received response for ${params.params.type}`, receivedData);
                let response;
                if (params.params?.isHex === true) {
                    console.log(`pppppppp`, params)
                    const decodedResponse = await (new TKAPI()).getTiktokProtoDecode(params.response);
                    console.log(`ddddddcode`, decodedResponse)
                    // @ts-ignore
                    response = {code: 0, data: decodedResponse?.data || {}};
                } else {
                    response = JSON.parse(params.response || "{}");
                }
                if (response.code === 0) {
                    resolve({
                        response: response,
                        params: params.params || {}
                    });
                } else {

                    reject({
                        response: response,
                        params: params.params || {}
                    });
                }
                clearTimeout(timeoutId);
                window.removeEventListener("message", messageListener);
            }
        };

        window.addEventListener("message", messageListener);
        window.postMessage({
            type: "func",
            func: messageType || "sendHttpRequest",
            params: clonedMessage
        }, "*");
    });
}

