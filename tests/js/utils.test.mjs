import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import {
    filterDropdownPlugins,
    isBlockPlugin,
    parsePluginMarkup,
    rangeItemsToText,
    toolbarItemNames,
} from '../../private/js/ckeditor5_plugins/ckeditor5.cmsplugin/src/utils.js';

describe('isBlockPlugin', () => {
    it('returns true for known block tags (case-insensitive input)', () => {
        assert.equal(isBlockPlugin({ tagName: 'DIV' }), true);
        assert.equal(isBlockPlugin({ tagName: 'P' }), true);
        assert.equal(isBlockPlugin({ tagName: 'TABLE' }), true);
    });

    it('returns false for inline tags', () => {
        assert.equal(isBlockPlugin({ tagName: 'SPAN' }), false);
        assert.equal(isBlockPlugin({ tagName: 'A' }), false);
        assert.equal(isBlockPlugin({ tagName: 'IMG' }), false);
    });

    it('returns false for null/undefined/empty', () => {
        assert.equal(isBlockPlugin(null), false);
        assert.equal(isBlockPlugin(undefined), false);
        assert.equal(isBlockPlugin({}), false);
    });
});

describe('toolbarItemNames', () => {
    it('returns empty set for undefined / empty input', () => {
        assert.deepEqual([...toolbarItemNames(undefined)], []);
        assert.deepEqual([...toolbarItemNames(null)], []);
        assert.deepEqual([...toolbarItemNames([])], []);
        assert.deepEqual([...toolbarItemNames({ items: [] })], []);
    });

    it('extracts string items from a flat CKE5 toolbar object', () => {
        const names = toolbarItemNames({ items: ['bold', 'italic', '|', 'link'] });
        assert.deepEqual([...names].sort(), ['bold', 'italic', 'link', '|'].sort());
    });

    it('extracts string items from a flat array', () => {
        const names = toolbarItemNames(['bold', 'italic']);
        assert.deepEqual([...names], ['bold', 'italic']);
    });

    it('recurses into nested arrays (djangocms-text-style toolbar)', () => {
        const names = toolbarItemNames([
            ['Undo', 'Redo'],
            ['cms-plugin', 'ImagePlugin'],
        ]);
        assert.ok(names.has('Undo'));
        assert.ok(names.has('cms-plugin'));
        assert.ok(names.has('ImagePlugin'));
    });

    it('recurses into grouped objects with .items', () => {
        const names = toolbarItemNames({
            items: ['bold', { items: ['heading2', 'heading3'] }],
        });
        assert.ok(names.has('bold'));
        assert.ok(names.has('heading2'));
        assert.ok(names.has('heading3'));
    });
});

describe('filterDropdownPlugins', () => {
    const installed = [
        { value: 'TextPlugin', name: 'Text' },
        { value: 'ImagePlugin', name: 'Image' },
        { value: 'SnippetPlugin', name: 'Snippet' },
    ];

    it('returns all plugins when nothing is excluded', () => {
        const out = filterDropdownPlugins(installed, new Set());
        assert.equal(out.length, 3);
        assert.deepEqual(out[0], { value: 'TextPlugin', label: 'Text' });
    });

    it('omits plugins whose value is in the exclude set', () => {
        const out = filterDropdownPlugins(installed, new Set(['ImagePlugin']));
        assert.equal(out.length, 2);
        assert.ok(!out.find(p => p.value === 'ImagePlugin'));
    });

    it('returns empty array when all are excluded', () => {
        const out = filterDropdownPlugins(installed, new Set(['TextPlugin', 'ImagePlugin', 'SnippetPlugin']));
        assert.deepEqual(out, []);
    });

    it('returns label from plugin.name (not plugin.value)', () => {
        const out = filterDropdownPlugins([{ value: 'X', name: 'Pretty Name' }], new Set());
        assert.equal(out[0].label, 'Pretty Name');
    });
});

describe('rangeItemsToText', () => {
    const textItem = data => ({ data, is: type => type === '$text' });
    const proxyItem = data => ({ data, is: type => type === '$textProxy' });
    const elementItem = () => ({ is: type => type === 'element' });

    it('joins .data of $text and $textProxy items', () => {
        assert.equal(
            rangeItemsToText([textItem('Hello '), proxyItem('world')]),
            'Hello world'
        );
    });

    it('skips non-text items', () => {
        assert.equal(
            rangeItemsToText([textItem('Hi'), elementItem(), textItem(' there')]),
            'Hi there'
        );
    });

    it('returns empty string for empty / non-text iterable', () => {
        assert.equal(rangeItemsToText([]), '');
        assert.equal(rangeItemsToText([elementItem()]), '');
    });

    it('tolerates items without a .data field', () => {
        const itemWithoutData = { is: type => type === '$text' };
        assert.equal(rangeItemsToText([itemWithoutData]), '');
    });
});

describe('parsePluginMarkup', () => {
    // Skip these in environments without DOM (parsePluginMarkup returns null
    // when document is undefined, which we assert below).
    const hasDom = typeof document !== 'undefined';

    it('returns null when no document is available', { skip: hasDom }, () => {
        assert.equal(parsePluginMarkup('<cms-plugin id="1"></cms-plugin>'), null);
    });

    it('parses an inline plugin markup', { skip: !hasDom }, () => {
        const result = parsePluginMarkup(
            '<cms-plugin id="42" type="LinkPlugin" title="My link" render-plugin="true"><a href="#">x</a></cms-plugin>'
        );
        assert.equal(result.schema, 'cms-inline-plugin');
        assert.equal(result.attrs.id, '42');
        assert.equal(result.attrs.type, 'LinkPlugin');
        assert.equal(result.attrs.plugin_title, 'My link');
        assert.equal(result.attrs.render_plugin, 'true');
        assert.equal(result.attrs.plugin_content, '<a href="#">x</a>');
    });

    it('detects block plugins by inner element tag', { skip: !hasDom }, () => {
        const result = parsePluginMarkup(
            '<cms-plugin id="7" type="BlockPlugin"><div>x</div></cms-plugin>'
        );
        assert.equal(result.schema, 'cms-block-plugin');
    });

    it('falls back to alt for plugin_title when title missing', { skip: !hasDom }, () => {
        const result = parsePluginMarkup(
            '<cms-plugin id="1" alt="Alt text"></cms-plugin>'
        );
        assert.equal(result.attrs.plugin_title, 'Alt text');
    });

    it('defaults type to CmsPluginBase when missing', { skip: !hasDom }, () => {
        const result = parsePluginMarkup('<cms-plugin id="1"></cms-plugin>');
        assert.equal(result.attrs.type, 'CmsPluginBase');
    });
});
