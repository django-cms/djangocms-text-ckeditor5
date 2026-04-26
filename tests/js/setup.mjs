import { beforeEach } from 'node:test';
import { JSDOM } from 'jsdom';

// Per-test DOM reset so DOM-mutating tests don't leak state into one another.
// Wired both as an initial install and as a `beforeEach` hook — node:test
// applies module-level hooks across all tests imported after the setup module.
function installDom() {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.DOMParser = dom.window.DOMParser;
}

installDom();
beforeEach(installDom);
