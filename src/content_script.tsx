import * as querystring from "querystring";

console.log(`kedaya content script start...`)
// 注入脚本
const s = document.createElement('script')
s.src = chrome.runtime.getURL('js/injected.js');
(document.head || document.documentElement).appendChild(s)

const processQuery = async (query: string) => {
  // Parse the query parameters from the input string
  let queryParams = querystring.parse(query.split("?")[1] || "");

  // Remove specific parameters from the query parameters
  delete queryParams.msToken;
  delete queryParams["X-Bogus"];
  delete queryParams._signature;

  // If 'fp' parameter does not exist, get its value from cookie
  if (!queryParams.fp) {
    // @ts-ignore
    queryParams.fp = (() => {
      const cookie = document.cookie.split(";").find((cookie) => {
        const [key, value] = cookie.split("=");
        return key.trim() === "s_v_web_id";
      });
      return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
    })();
  }

  // Assign the processed query parameters to 'o.scriptQuery'
  // o.scriptQuery = queryParams;
  // TODO 存储到store
  chrome.storage.local.set({scriptQuery: JSON.stringify(queryParams)}, function () {
    console.log('Value is set to ' + JSON.stringify(queryParams));
  });


  // Call a series of asynchronous functions
  // await o.getShopInfo();
  // await o.getWebSocketTokenInfo();
  // await o.getProductCategoryList();
  // await o.saveShop();
  // await o.saveHtml();
};

// 监听页面请求，拦截token请求，将token的参数暂存到store中后续使用
window.addEventListener('message', function (event) {
  if (event.source !== window) return
  // deep clone event data
  const eventData = JSON.parse(JSON.stringify(event.data));

  if (eventData.type && eventData.type === 'tiktok-request' && !eventData.params.url.includes("/v1/list")) {
    // 拦截token请求
    if (eventData.params.url.includes("/api/v1/affiliate/lux/feelgood/token")) {
      console.log(eventData)
      processQuery(eventData.params.url).then().catch();
    }

  }
})
