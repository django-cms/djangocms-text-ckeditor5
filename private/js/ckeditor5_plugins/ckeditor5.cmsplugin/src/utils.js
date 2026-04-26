/**
 * @module cmsplugin/utils
 *
 * Pure helpers for the CMS plugin integration. Kept free of CKEditor 5
 * imports so they can be unit tested under plain Node.
 */

/* eslint-env es11 */
/* jshint esversion: 11 */

const BLOCK_TAGS = new Set(
    ('address article aside blockquote canvas dd div dl dt fieldset figcaption figure footer form ' +
     'h1 h2 h3 h4 h5 h6 header hr li main nav noscript ol p pre section table tfoot ul video')
        .toUpperCase()
        .split(' ')
);

export function isBlockPlugin(innerEl) {
    return !!(innerEl && innerEl.tagName && BLOCK_TAGS.has(innerEl.tagName));
}

/**
 * Walks a CKEditor 5 toolbar config (a list of strings, possibly nested in
 * grouped objects with `items: [...]`) and returns a Set of every string item.
 *
 * @param {Array|Object|undefined} toolbarConfig
 * @returns {Set<string>}
 */
export function toolbarItemNames(toolbarConfig) {
    const names = new Set();
    const visit = config => {
        if (!config) return;
        const items = Array.isArray(config) ? config : (config.items || []);
        for (const item of items) {
            if (typeof item === 'string') {
                names.add(item);
            } else if (item && (Array.isArray(item.items) || Array.isArray(item))) {
                visit(item);
            }
        }
    };
    visit(toolbarConfig);
    return names;
}

/**
 * Returns the subset of installed plugins that are NOT already exposed by name
 * in the toolbar (so the dropdown only lists what would otherwise be hidden).
 *
 * @param {Array<{value:string,name:string}>} installed
 * @param {Set<string>} exclude
 * @returns {Array<{value:string,label:string}>}
 */
export function filterDropdownPlugins(installed, exclude) {
    const out = [];
    for (const plugin of installed) {
        if (exclude.has(plugin.value)) {
            continue;
        }
        out.push({ value: plugin.value, label: plugin.name });
    }
    return out;
}

/**
 * Concatenates plain text from a CKEditor 5 selection range's items.
 * Accepts any iterable of items that implement `.is(type)` and expose `.data`.
 *
 * @param {Iterable} items
 * @returns {string}
 */
export function rangeItemsToText(items) {
    let text = '';
    for (const item of items) {
        if (item && typeof item.is === 'function' && (item.is('$textProxy') || item.is('$text'))) {
            text += item.data || '';
        }
    }
    return text;
}

/**
 * Parses a `<cms-plugin>` HTML fragment (the response from
 * `window.CMS_Editor.requestPluginMarkup`) into the model attributes used by
 * the inline / block plugin schema.
 *
 * @param {string} markup
 * @returns {{schema:'cms-inline-plugin'|'cms-block-plugin', attrs:object}|null}
 */
export function parsePluginMarkup(markup) {
    if (typeof document === 'undefined') {
        return null;
    }
    const ghost = document.createElement('div');
    ghost.innerHTML = markup || '<cms-plugin></cms-plugin>';
    const cmsPluginEl = ghost.firstElementChild;
    if (!cmsPluginEl) {
        return null;
    }

    const attrs = {};
    Array.from(cmsPluginEl.attributes).forEach(attr => {
        attrs[attr.name] = attr.value;
    });

    const schema = isBlockPlugin(cmsPluginEl.firstElementChild)
        ? 'cms-block-plugin'
        : 'cms-inline-plugin';

    return {
        schema,
        attrs: {
            id: attrs.id,
            plugin_title: attrs.title || attrs.alt || '',
            render_plugin: attrs['render-plugin'] || 'true',
            type: attrs.type || 'CmsPluginBase',
            plugin_content: cmsPluginEl.innerHTML,
        },
    };
}
