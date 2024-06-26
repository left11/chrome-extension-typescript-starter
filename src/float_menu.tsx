import React, {useEffect} from 'react';
import {tkApi} from "./tk_api";

// 在页面的右侧注入操作按钮
function injectButton() {
    const url = window.location.href;
    if (url.includes('affiliate.tiktokglobalshop.com/connection/creator')) {
        console.log('当前页面是创作者中心页面');
        const button = document.createElement('button');
        button.innerText = '自动私信';
        button.style.position = 'fixed';
        button.style.right = '0';
        button.style.top = '50%';
        button.style.transform = 'translateY(-50%)';
        button.style.backgroundColor = 'blue';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '10px 20px';
        button.style.cursor = 'pointer';
        button.onclick = () => {
            // tkApi.sendIndividualMessage({'creator_oecuid': {is_authed: true, status: 0, value: "7494051048330202421"} }, 'Hellooo, I\'m not sure if you\'re interested in our products, but I wanted to inquire if there is any intention for collaboration.').then().catch()
            // 找出选中的checkbox项目 <input type="checkbox" class="dlink-check-sub" name="dlink-check-group"> checkbox的class必须是 dlink-check-sub
            const selectedCheckboxes = document.querySelectorAll('input.dlink-check-sub:checked');
            //遍历每个选中的checkbox
            tkApi.getUserCreatorCache().then((userCreatorList) => {
                console.log(userCreatorList)
                selectedCheckboxes.forEach((checkbox) => {
                    // 获取当前行的所有单元格
                    let p = checkbox.parentElement;
                    let span = p!.querySelector('span.text-body-s-regular.text-neutral-text4.text-overflow-single');
                    // @ts-ignore
                    let nickname = span!.innerText;
                    console.log(nickname); // logs the value of the span element, which should be "funshopstt"
                    // 根据value找到tkApi.userCreatorList中的对应的oecuid

                    const oecuid = userCreatorList.filter((item:any) => item.nickname.value === nickname)[0].creator_oecuid.value;
                    // console.log(value, oecuid)

                    // 发送私信
                    console.log(`开始给${nickname}发送私信`)
                    let intervalId = setInterval(() => {
                        tkApi.sendIndividualMessage({'creator_oecuid': {is_authed: true, status: 0, value: oecuid} }, `Hello ${nickname}, I'm not sure if you're interested in our products, but I wanted to inquire if there is any intention for collaboration.`)
                            .then()
                            .catch()
                    }, 3000); // 3000毫秒等于3秒
                });
            }).catch()

        }
        document.body.appendChild(button);
    }
}

// 在页面的达人列表左侧注入复选框
function injectCheckbox() {
    setInterval(() => {
        // 查找达人列表的表头
        const tableHeader = document.querySelector('.arco-table-header thead .arco-table-tr');
        if (tableHeader) {
            // 检查是否已经有复选框
            const existingCheckbox = tableHeader.querySelector('#dlink-check-all');
            if (!existingCheckbox) {
                // 创建复选框
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = 'dlink-check-all';
                checkbox.name = 'dlink-check-group';

                // 添加全选/全不选的事件监听器
                checkbox.addEventListener('click', () => {
                    const checkboxes = document.querySelectorAll('input[name="dlink-check-group"]');
                    checkboxes.forEach((box) => {
                        // 判断box元素是不是一个checkbox
                        if (box instanceof HTMLInputElement) {
                            box.checked = checkbox.checked;
                        }
                    });
                });

                // 创建标签
                const label = document.createElement('label');
                label.innerText = '全部选择';
                label.htmlFor = 'dlink-check-all';

                // 创建包含复选框和标签的div元素
                const div = document.createElement('div');
                div.appendChild(checkbox);
                // 在表头的第一个<th>元素前面插入div元素
                const firstTh = tableHeader.querySelector('th');
                if (firstTh) {
                    firstTh.style.position = 'relative';

                    console.log(`插入全部选择复选框`)
                    firstTh.insertBefore(div, firstTh.firstChild);
                } else {
                    console.log(`没有找到表头的第一个<th>元素`)
                }
            }
        }

        const tableRows = document.querySelectorAll('div.arco-table-body > table > tr.cursor-pointer');
        tableRows.forEach((row) => {
            // 检查是否已经有复选框
            const existingCheckbox = row.querySelector('.dlink-check-sub');
            if (!existingCheckbox) {
                // 创建复选框
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'dlink-check-sub';
                checkbox.name = 'dlink-check-group';

                // 在<tr>的第一个<td>元素前面插入复选框
                const firstTd = row.querySelector('td');
                if (firstTd) {
                    firstTd.style.position = 'relative';
                    firstTd.insertBefore(checkbox, firstTd.firstChild);
                    console.log(`插入子复选框`)
                } else {
                    // console.log(`没有找到<tr>的第一个<td>元素`)
                }
            }
        });
    }, 3000); // 每隔3秒检查一次
}

const FloatMenu: React.FC = () => {
    useEffect(() => {
        injectButton()
    }, []);
    useEffect(() => {
        injectCheckbox()
    }, []);
    return null;
};

export default FloatMenu;
