/**
 * @module cms.ckeditor5.toolbar
 *
 * Pure helpers that translate djangocms-text's (CKEditor 4 flavoured) toolbar
 * configuration into CKEditor 5 `toolbar` / `blockToolbar` configurations.
 * Kept free of CKEditor 5 imports so they can be unit tested under plain Node.
 */

/* eslint-env es11 */
/* jshint esversion: 11 */

// djangocms-text toolbar item -> CKEditor 5 component name. The component
// factory itself is case-insensitive, so only genuinely different names are
// listed here.
export const PLUGIN_NAMES = {
    Table: 'insertTable',
    Source: 'SourceEditing',
    HorizontalRule: 'horizontalLine',
    JustifyLeft: 'Alignment',
    Strike: 'Strikethrough',
    Styles: 'Style',
    // CKEditor 5 has a single style dropdown for both block and inline styles.
    // All three names collapse onto it; duplicates are dropped below.
    BlockStyles: 'Style',
    InlineStyles: 'Style',
    TextColor: 'fontColor',
    BGColor: 'fontBackgroundColor',
    CMSPlugins: 'cms-plugin',
};

// Items without a CKEditor 5 counterpart. They are dropped silently instead of
// making CKEditor log a `toolbarview-item-unavailable` warning for each of them.
export const UNSUPPORTED_PLUGINS = [
    'Unlink', 'PasteFromWord', 'PasteText', 'Maximize',
    'JustifyCenter', 'JustifyRight', 'JustifyBlock',
    // No inline <q> feature in CKEditor 5.
    'InlineQuote',
    // Tiptap-only extension point contributed by third-party packages.
    'cmswidget',
];

// Items the inline editor cannot offer (they need the full editing surface).
const INLINE_UNSUPPORTED = ['ShowBlocks', 'SourceEditing'];

// "Format" expands into these buttons when it ends up in a block toolbar.
const FORMAT_BLOCK_ITEMS = ['paragraph', 'heading2', 'heading3', 'heading4', 'heading5'];

/**
 * Splits a CKEditor 5 toolbar config into its item list and its remaining
 * options, accepting both the plain array and the `{items: [...]}` object form.
 *
 * @param {Array|Object|undefined} config
 * @returns {{items: Array, options: Object}}
 */
export function splitToolbarConfig(config) {
    if (Array.isArray(config)) {
        return {items: config, options: {}};
    }
    if (config && typeof config === 'object') {
        const {items, ...options} = config;
        return {items: Array.isArray(items) ? items : [], options};
    }
    return {items: [], options: {}};
}

/**
 * Collapses runs of separators and strips leading/trailing ones. Groups whose
 * items are all unsupported would otherwise leave stray dividers behind.
 *
 * @param {Array<string>} items
 * @returns {Array<string>}
 */
export function cleanSeparators(items) {
    const out = [];
    for (const item of items) {
        if (item === '|' && (out.length === 0 || out[out.length - 1] === '|')) {
            continue;
        }
        out.push(item);
    }
    while (out.length > 0 && out[out.length - 1] === '|') {
        out.pop();
    }
    return out;
}

/**
 * Translates a djangocms-text toolbar definition into CKEditor 5 toolbars.
 *
 * For the inline editor, items known to belong to the block toolbar are moved
 * there; everything else stays in the balloon toolbar. Items are de-duplicated
 * case-insensitively across both toolbars, because several djangocms-text names
 * map onto the same CKEditor 5 component.
 *
 * @param {Array|Object} config The toolbar config (array or `{items: [...]}`).
 * @param {Object} opts
 * @param {boolean} opts.inline Whether the target is the inline editor.
 * @param {Array<string>} opts.blockItems Item names belonging to the block toolbar.
 * @param {Object} opts.pluginNames Item name -> CKEditor 5 component name.
 * @param {Array<string>} opts.unsupportedPlugins Item names to drop.
 * @param {Array<{value: string, icon: string}>} opts.cmsPlugins Installed CMS plugins.
 * @returns {{toolbar: Array<string>, blockToolbar: Array<string>}}
 */
export function buildToolbars(config, {
    inline = false,
    blockItems = [],
    pluginNames = PLUGIN_NAMES,
    unsupportedPlugins = UNSUPPORTED_PLUGINS,
    cmsPlugins = [],
} = {}) {
    const {items} = splitToolbarConfig(config);
    const blockItemSet = new Set(blockItems.map((item) => item.toLowerCase()));
    const topToolbar = [];
    const blockToolbar = [];
    const seen = new Set();
    let addingToBlock = false;

    // CMSPluginUI only registers a toolbar button for installed CMS plugins that
    // carry an icon. Anything else named like a CMS plugin (`ImagePlugin` in the
    // default toolbar, for instance) has no component and is dropped — CKEditor 5
    // component names never end in "Plugin".
    const isUnavailableCmsPlugin = (item) => {
        const plugin = cmsPlugins.find((candidate) => candidate.value === item);
        return plugin ? !plugin.icon : /Plugin$/.test(item);
    };

    const target = () => (addingToBlock ? blockToolbar : topToolbar);
    const push = (item) => {
        const key = item.toLowerCase();
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        target().push(item);
    };

    const visit = (list) => {
        for (let item of list) {
            if (typeof item === 'string' && pluginNames[item] !== undefined) {
                item = pluginNames[item];
            }

            if (Array.isArray(item) || (item && Array.isArray(item.items))) {
                // A nested group: separate it from what has been collected so far.
                if (target().length > 0) {
                    target().push('|');
                }
                visit(Array.isArray(item) ? item : item.items);
            } else if (typeof item !== 'string') {
                // Drop anything that is neither a group nor a named item.
                continue;
            } else if (item === '-' || unsupportedPlugins.includes(item)) {
                continue;
            } else if (inline && INLINE_UNSUPPORTED.includes(item)) {
                continue;
            } else if (isUnavailableCmsPlugin(item)) {
                continue;
            } else if (item === 'Format') {
                if (inline) {
                    // The inline editor shows the formats as individual buttons
                    // in the block toolbar rather than as a dropdown.
                    addingToBlock = true;
                    FORMAT_BLOCK_ITEMS.forEach(push);
                } else {
                    addingToBlock = false;
                    push('heading');
                }
            } else if (item === '|') {
                target().push('|');
            } else if (inline && blockItemSet.has(item.toLowerCase())) {
                addingToBlock = true;
                push(item);
            } else {
                addingToBlock = false;
                push(item);
            }
        }
    };

    visit(items);

    return {
        toolbar: cleanSeparators(topToolbar),
        blockToolbar: cleanSeparators(blockToolbar),
    };
}
