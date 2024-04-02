# Chrome Extension TypeScript Starter

![build](https://github.com/chibat/chrome-extension-typescript-starter/workflows/build/badge.svg)

Chrome Extension, TypeScript and Visual Studio Code

## Prerequisites

* [node + npm](https://nodejs.org/) (Current Version)

## Option

* [Visual Studio Code](https://code.visualstudio.com/)

## Includes the following

* TypeScript
* Webpack
* React
* Jest
* Example Code
    * Chrome Storage
    * Options Version 2
    * content script
    * count up badge number
    * background

## Project Structure

* src/typescript: TypeScript source files
* src/assets: static files
* dist: Chrome Extension directory
* dist/js: Generated JavaScript files

## Setup

```
npm install
```

## Import as Visual Studio Code project

...

## Build

```
npm run build
```

## Build in watch mode

### terminal

```
npm run watch
```

### Visual Studio Code

Run watch mode.

type `Ctrl + Shift + B`

## Load extension to chrome

Load `dist` directory

## Test
`npx jest` or `npm run test`

## 代码结构说明

1. injected.ts 

重载达人查找页面的XMLHttpRequest对象用于拦截网页端的tiktok请求（主要是为了获取token)
给window注入一个发送http的方法 sendHttpRequest

2. background.ts

服务端等其他请求可放在此处（暂时没做）

3. content_inject_script.ts

注入界面App

4. content_script.ts

注入injected.ts, 同时拦截injected.ts发送过来的message, 保存后续请求要用的token

