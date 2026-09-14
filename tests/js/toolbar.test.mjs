import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import {
    buildToolbars,
    cleanSeparators,
    splitToolbarConfig,
} from '../../private/js/cms.ckeditor5.toolbar.js';

// The toolbar djangocms-text ships when nothing is configured.
const DEFAULT_TOOLBAR_CMS = [
    ['Undo', 'Redo'],
    ['CMSPlugins', 'cmswidget', '-', 'ShowBlocks'],
    ['Format', 'Styles', 'BlockStyles', 'InlineStyles'],
    ['TextColor', 'Highlight', 'BGColor', '-', 'PasteText', 'PasteFromWord'],
    ['Maximize'],
    ['Bold', 'Italic', 'Underline', '-', 'InlineQuote', 'Code', '-', 'Subscript', 'Superscript'],
    ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
    ['RemoveFormat'],
    ['Link', 'Unlink'],
    ['NumberedList', 'BulletedList'],
    ['HorizontalRule', 'CodeBlock'],
    ['Outdent', 'Indent', '-', 'Blockquote', '-', 'Table'],
    ['ImagePlugin'],
    ['Source'],
];

const BLOCK_ITEMS = [
    'paragraph', 'heading2', 'heading3', 'heading4', 'heading5', 'alignment',
    'bulletedList', 'numberedList', 'outdent', 'indent', 'codeblock', 'style',
    'mediaEmbed', 'insertTable', 'horizontalLine', 'blockQuote',
];

describe('splitToolbarConfig', () => {
    it('accepts the plain array form', () => {
        assert.deepEqual(splitToolbarConfig(['Bold']), {items: ['Bold'], options: {}});
    });

    it('splits the object form into items and remaining options', () => {
        assert.deepEqual(
            splitToolbarConfig({items: ['Bold'], shouldNotGroupWhenFull: true}),
            {items: ['Bold'], options: {shouldNotGroupWhenFull: true}}
        );
    });

    it('tolerates missing or malformed input', () => {
        assert.deepEqual(splitToolbarConfig(undefined), {items: [], options: {}});
        assert.deepEqual(splitToolbarConfig({shouldNotGroupWhenFull: true}),
            {items: [], options: {shouldNotGroupWhenFull: true}});
    });
});

describe('cleanSeparators', () => {
    it('collapses runs and strips leading/trailing separators', () => {
        assert.deepEqual(cleanSeparators(['|', 'Bold', '|', '|', 'Italic', '|']), ['Bold', '|', 'Italic']);
    });

    it('drops a list that is only separators', () => {
        assert.deepEqual(cleanSeparators(['|', '|']), []);
    });
});

describe('buildToolbars', () => {
    it('maps djangocms-text item names onto CKEditor 5 components', () => {
        const {toolbar} = buildToolbars([['Table', 'Source', 'HorizontalRule', 'TextColor', 'BGColor']]);
        assert.deepEqual(toolbar, ['insertTable', 'SourceEditing', 'horizontalLine', 'fontColor', 'fontBackgroundColor']);
    });

    it('drops items without a CKEditor 5 counterpart', () => {
        const {toolbar} = buildToolbars([['Bold', 'Unlink', 'Maximize', 'InlineQuote', 'cmswidget', '-', 'Italic']]);
        assert.deepEqual(toolbar, ['Bold', 'Italic']);
    });

    it('collapses the three style item names onto a single dropdown', () => {
        const {toolbar} = buildToolbars([['Styles', 'BlockStyles', 'InlineStyles']]);
        assert.deepEqual(toolbar, ['Style']);
    });

    it('turns Format into the heading dropdown for the classic editor', () => {
        const {toolbar, blockToolbar} = buildToolbars([['Format']], {blockItems: BLOCK_ITEMS});
        assert.deepEqual(toolbar, ['heading']);
        assert.deepEqual(blockToolbar, []);
    });

    it('expands Format into block buttons for the inline editor', () => {
        const {toolbar, blockToolbar} = buildToolbars([['Format']], {inline: true, blockItems: BLOCK_ITEMS});
        assert.deepEqual(toolbar, []);
        assert.deepEqual(blockToolbar, ['paragraph', 'heading2', 'heading3', 'heading4', 'heading5']);
    });

    it('keeps source editing and show blocks out of the inline editor', () => {
        const {toolbar} = buildToolbars([['Bold', 'ShowBlocks', 'Source']], {inline: true});
        assert.deepEqual(toolbar, ['Bold']);
    });

    it('leaves no stray separators when a whole group is unsupported', () => {
        const {toolbar} = buildToolbars([['Bold'], ['Maximize'], ['Italic']]);
        assert.deepEqual(toolbar, ['Bold', '|', 'Italic']);
    });

    it('reads items from the object form of the config', () => {
        const {toolbar} = buildToolbars({items: [['Bold']], shouldNotGroupWhenFull: true});
        assert.deepEqual(toolbar, ['Bold']);
    });

    it('keeps CMS plugin buttons that are installed and have an icon', () => {
        const cmsPlugins = [
            {value: 'PicturePlugin', icon: '<svg/>'},
            {value: 'LinkPlugin', icon: null},
        ];
        const {toolbar} = buildToolbars([['PicturePlugin', 'LinkPlugin', 'ImagePlugin']], {cmsPlugins});
        assert.deepEqual(toolbar, ['PicturePlugin']);
    });

    it('produces only available components for the default toolbar', () => {
        const {toolbar, blockToolbar} = buildToolbars(DEFAULT_TOOLBAR_CMS, {blockItems: BLOCK_ITEMS});
        const unavailable = ['BlockStyles', 'InlineStyles', 'TextColor', 'BGColor',
            'InlineQuote', 'cmswidget', 'ImagePlugin', 'Maximize', 'Unlink'];
        for (const item of unavailable) {
            assert.equal(toolbar.includes(item), false, `${item} should not reach CKEditor 5`);
        }
        for (const item of ['heading', 'Style', 'fontColor', 'fontBackgroundColor', 'Highlight']) {
            assert.equal(toolbar.includes(item), true, `${item} should reach CKEditor 5`);
        }
        assert.deepEqual(blockToolbar, []);
    });

    it('splits the default toolbar between balloon and block toolbar when inline', () => {
        const {toolbar, blockToolbar} = buildToolbars(DEFAULT_TOOLBAR_CMS, {
            inline: true,
            blockItems: BLOCK_ITEMS,
        });
        assert.equal(toolbar.includes('Bold'), true);
        assert.equal(toolbar.includes('SourceEditing'), false);
        assert.equal(blockToolbar.includes('insertTable'), true);
        assert.equal(blockToolbar.includes('paragraph'), true);
        // No component may end up in both toolbars.
        const shared = toolbar.filter((item) => item !== '|' && blockToolbar.includes(item));
        assert.deepEqual(shared, []);
    });
});
