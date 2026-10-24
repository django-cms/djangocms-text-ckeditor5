import { afterEach, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { FontColorEditing, FontBackgroundColorEditing } from '@ckeditor/ckeditor5-font';
import { BoldEditing } from '@ckeditor/ckeditor5-basic-styles';
import { UndoEditing } from '@ckeditor/ckeditor5-undo';
import { RemoveFormatEditing } from '@ckeditor/ckeditor5-remove-format';
import { CMSTextColorEditing } from '../../private/js/ckeditor5_plugins/ckeditor5.cmstextcolor/index.js';
import { CMSBackgroundColorEditing } from '../../private/js/ckeditor5_plugins/ckeditor5.cmsbackgroundcolor/index.js';

describe('class-based background colors', () => {
    let editor;
    async function create(data, config = {}) {
        editor = new Editor({
            licenseKey: 'GPL',
            plugins: [Paragraph, BoldEditing, FontColorEditing, FontBackgroundColorEditing,
                UndoEditing, RemoveFormatEditing, CMSTextColorEditing, CMSBackgroundColorEditing],
            ...config,
        });
        editor.model.document.createRoot();
        await editor.initPlugins();
        await editor.data.init(data);
        editor.fire('ready');
    }
    function selectAll() {
        editor.model.change(writer => writer.setSelection(editor.model.document.getRoot(), 'in'));
    }
    afterEach(async () => {
        if (editor) {
            if (editor.state === 'initializing') editor.fire('ready');
            await editor.destroy();
        }
    });

    it('round-trips background classes without losing bold or block structure', async () => {
        await create('<p class="bg-primary">One <strong class="bg-danger">Two</strong></p><p>Three</p>');
        assert.equal(editor.getData(), '<p><span class="bg-primary">One </span><span class="bg-danger"><strong>Two</strong></span></p><p>Three</p>');
    });

    it('replaces the defaults with a custom palette and rejects unknown colors', async () => {
        await create('<p><span class="brand-fill">One</span></p>', {
            backgroundColors: {'brand-fill': {name: 'Brand fill'}},
        });
        selectAll();
        editor.execute('cmsBackgroundColor', {value: 'bg-danger'});
        assert.equal(editor.getData(), '<p><span class="brand-fill">One</span></p>');
        editor.execute('cmsBackgroundColor');
        assert.equal(editor.getData(), '<p>One</p>');
        editor.execute('cmsBackgroundColor', {value: 'brand-fill'});
        assert.equal(editor.getData(), '<p><span class="brand-fill">One</span></p>');
    });

    it('replaces inline backgrounds in one undoable operation while preserving text color', async () => {
        await create('<p><span style="background-color:red;color:blue;">One</span></p>');
        const original = editor.getData();
        selectAll();
        editor.execute('cmsBackgroundColor', {value: 'bg-success'});
        const colored = editor.getData();
        assert.match(colored, /class="bg-success"/);
        assert.match(colored, /color:blue/);
        assert.doesNotMatch(colored, /background-color/);
        editor.execute('undo');
        assert.equal(editor.getData(), original);
        editor.execute('redo');
        assert.equal(editor.getData(), colored);
    });

    it('keeps text and background colors independent when applying and removing them', async () => {
        await create('<p>One</p>');
        selectAll();
        editor.execute('cmsTextColor', {value: 'text-primary'});
        editor.execute('cmsBackgroundColor', {value: 'bg-danger'});
        const html = new DOMParser().parseFromString(editor.getData(), 'text/html');
        assert.ok(html.querySelector('.text-primary.bg-danger'));
        editor.execute('cmsBackgroundColor');
        assert.equal(editor.getData(), '<p><span class="text-primary">One</span></p>');
        editor.execute('cmsBackgroundColor', {value: 'bg-danger'});
        editor.execute('cmsTextColor');
        assert.equal(editor.getData(), '<p><span class="bg-danger">One</span></p>');
        const colored = editor.getData();
        editor.setData(colored);
        assert.equal(editor.getData(), colored);
        selectAll();
        editor.execute('removeFormat');
        assert.equal(editor.getData(), '<p>One</p>');
    });

    it('changes the whole background at a caret and preserves nested text colors', async () => {
        await create('<p><span class="bg-primary">One <span class="text-danger">Two</span></span> Three</p>');
        editor.model.change(writer => writer.setSelection(editor.model.document.getRoot().getChild(0), 2));
        editor.execute('cmsBackgroundColor', {value: 'bg-success'});
        const data = editor.getData();
        assert.match(data, /class="bg-success"/);
        assert.ok(new DOMParser().parseFromString(data, 'text/html').querySelector('.text-danger'));
        assert.doesNotMatch(data, /bg-primary/);
        assert.ok(data.endsWith(' Three</p>'));
    });

    it('applies only to a partial selection', async () => {
        await create('<p><span class="bg-primary">One Two</span></p>');
        const paragraph = editor.model.document.getRoot().getChild(0);
        editor.model.change(writer => writer.setSelection(writer.createRange(
            writer.createPositionAt(paragraph, 4), writer.createPositionAt(paragraph, 7)
        )));
        editor.execute('cmsBackgroundColor', {value: 'bg-danger'});
        assert.equal(editor.getData(), '<p><span class="bg-primary">One </span><span class="bg-danger">Two</span></p>');
    });

    it('supports future typing and respects read-only mode', async () => {
        await create('<p>One</p>');
        editor.model.change(writer => writer.setSelection(editor.model.document.getRoot().getChild(0), 'end'));
        editor.execute('cmsBackgroundColor', {value: 'bg-success'});
        editor.model.change(writer => writer.insertText(' Two', editor.model.document.selection.getAttributes(),
            editor.model.document.selection.getFirstPosition()));
        assert.equal(editor.getData(), '<p>One<span class="bg-success"> Two</span></p>');
        editor.enableReadOnlyMode('test');
        assert.equal(editor.commands.get('cmsBackgroundColor').isEnabled, false);
        editor.execute('cmsBackgroundColor');
        assert.equal(editor.getData(), '<p>One<span class="bg-success"> Two</span></p>');
    });
});
