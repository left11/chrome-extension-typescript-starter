// This script is injected into the page and runs in the context of the page
// It can be used to interact with the page and the browser

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from "./app";

class Database {
    async get(key: any): Promise<any> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(key, (result) => {
                resolve(result[key]);
            });
        });
    }

    async set(key: any, value: any): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({[key]: value}, () => {
                resolve();
            });
        });
    }

    async remove(key: any): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove(key, () => {
                resolve();
            });
        });
    }
}

const db = new Database();

async function main() {
    const appContainer = document.createElement('div');
    document.body.appendChild(appContainer);
    ReactDOM.createRoot(appContainer).render(<App/>);
}

main().then(console.log).catch(console.error);
