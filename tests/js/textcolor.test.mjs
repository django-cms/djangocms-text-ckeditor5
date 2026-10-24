import { afterEach, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { FontColorEditing } from '@ckeditor/ckeditor5-font';
import { UndoEditing } from '@ckeditor/ckeditor5-undo';
import { BoldEditing } from '@ckeditor/ckeditor5-basic-styles';
import { RemoveFormatEditing } from '@ckeditor/ckeditor5-remove-format';
import { CMSTextColorEditing } from '../../private/js/ckeditor5_plugins/ckeditor5.cmstextcolor/index.js';

describe('class-based text colors', () => {
    let editor;
    async function create(data, config = {}) {
        editor = new Editor({
            licenseKey: 'GPL',
            plugins: [Paragraph, BoldEditing, FontColorEditing, UndoEditing, RemoveFormatEditing, CMSTextColorEditing],
            ...config,
        });
        editor.model.document.createRoot();
        await editor.initPlugins();
        await editor.data.init(data);
        editor.fire('ready');
        return editor;
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

    it('round-trips default classes on spans and other elements', async () => {
        await create('<p><span class="text-primary">One</span> <strong class="text-danger">Two</strong></p>');
        assert.equal(editor.getData(), '<p><span class="text-primary">One</span> <span class="text-danger"><strong>Two</strong></span></p>');
    });

    it('replaces the default palette with configured classes', async () => {
        await create('<p><span class="brand-ink">One</span> <span class="text-primary">Two</span></p>', {
            textColors: {'brand-ink': {name: 'Brand ink'}},
        });
        assert.equal(editor.getData(), '<p><span class="brand-ink">One</span> Two</p>');
        selectAll();
        editor.execute('cmsTextColor', {value: 'text-primary'});
        assert.equal(editor.getData(), '<p><span class="brand-ink">One</span> Two</p>');
    });

    it('replaces existing class and inline colors in one undoable operation', async () => {
        await create('<p><span class="text-primary" style="color:red;">One</span> Two</p>');
        const original = editor.getData();
        selectAll();
        editor.execute('cmsTextColor', {value: 'text-danger'});
        assert.equal(editor.getData(), '<p><span class="text-danger">One Two</span></p>');
        editor.execute('undo');
        assert.equal(editor.getData(), original);
        editor.execute('redo');
        assert.equal(editor.getData(), '<p><span class="text-danger">One Two</span></p>');
    });

    it('removes a selected color and participates in RemoveFormat metadata', async () => {
        await create('<p><span class="text-primary">One</span></p>');
        selectAll();
        assert.equal(editor.commands.get('cmsTextColor').value, 'text-primary');
        editor.execute('cmsTextColor');
        assert.equal(editor.getData(), '<p>One</p>');
        assert.equal(editor.model.schema.getAttributeProperties('cmsTextColor').isFormatting, true);
    });

    it('applies and clears typing attributes at a collapsed selection', async () => {
        await create('<p>One</p>');
        editor.model.change(writer => writer.setSelection(editor.model.document.getRoot().getChild(0), 'end'));
        editor.execute('cmsTextColor', {value: 'text-success'});
        editor.model.change(writer => writer.insertText(' Two', editor.model.document.selection.getAttributes(),
            editor.model.document.selection.getFirstPosition()));
        assert.equal(editor.getData(), '<p>One<span class="text-success"> Two</span></p>');
        editor.execute('cmsTextColor');
        assert.equal(editor.model.document.selection.hasAttribute('cmsTextColor'), false);
    });

    it('is disabled in read-only mode', async () => {
        await create('<p>One</p>');
        selectAll();
        editor.enableReadOnlyMode('test');
        assert.equal(editor.commands.get('cmsTextColor').isEnabled, false);
        editor.execute('cmsTextColor', {value: 'text-danger'});
        assert.equal(editor.getData(), '<p>One</p>');
    });

    it('clears class-based colors with the standard RemoveFormat command', async () => {
        await create('<p><span class="text-primary"><strong>One</strong></span></p>');
        selectAll();
        editor.execute('removeFormat');
        assert.equal(editor.getData(), '<p>One</p>');
    });

    it('changes the whole colored section at a caret, including across bold text', async () => {
        await create('<p><span class="text-primary">One <strong>Two</strong></span> Three</p>');
        editor.model.change(writer => writer.setSelection(editor.model.document.getRoot().getChild(0), 2));
        editor.execute('cmsTextColor', {value: 'text-danger'});
        assert.equal(editor.getData(), '<p><span class="text-danger">One <strong>Two</strong></span> Three</p>');
    });

    it('keeps nested colors and paragraph structure when reading block classes', async () => {
        await create('<p class="text-primary">One <span class="text-danger">Two</span></p><p>Three</p>');
        assert.equal(editor.getData(), '<p><span class="text-primary">One </span><span class="text-danger">Two</span></p><p>Three</p>');
    });

    it('changes only the selected part of colored text', async () => {
        await create('<p><span class="text-primary">One Two</span></p>');
        const paragraph = editor.model.document.getRoot().getChild(0);
        editor.model.change(writer => writer.setSelection(writer.createRange(
            writer.createPositionAt(paragraph, 4), writer.createPositionAt(paragraph, 7)
        )));
        editor.execute('cmsTextColor', {value: 'text-danger'});
        assert.equal(editor.getData(), '<p><span class="text-primary">One </span><span class="text-danger">Two</span></p>');
    });
});
