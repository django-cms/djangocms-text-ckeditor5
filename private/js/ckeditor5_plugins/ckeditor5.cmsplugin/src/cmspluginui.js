/**
 * @module cmsplugin/cmspluginui
 */

/* eslint-env es11 */
/* jshint esversion: 11 */
/* global window */

import { Plugin } from '@ckeditor/ckeditor5-core';
import { Collection } from '@ckeditor/ckeditor5-utils';
import {
    ButtonView,
    ViewModel,
    createDropdown,
    addListToDropdown,
} from '@ckeditor/ckeditor5-ui';
import { DomEventObserver } from '@ckeditor/ckeditor5-engine';

import { IconTemplateGeneric } from '@ckeditor/ckeditor5-icons';
import {
    filterDropdownPlugins,
    parsePluginMarkup,
    rangeItemsToText,
    toolbarItemNames,
} from './utils';

const PLUGIN_SCHEMAS = new Set(['cms-inline-plugin', 'cms-block-plugin']);

class DoubleClickObserver extends DomEventObserver {
    constructor(view) {
        super(view);
        this.domEventType = 'dblclick';
    }
    onDomEvent(domEvent) {
        this.fire(domEvent.type, domEvent);
    }
}

export default class CMSPluginUI extends Plugin {
    static get pluginName() {
        return 'CMSPluginUI';
    }

    init() {
        const editor = this.editor;
        const t = editor.t;
        const installed = editor.config.get('cmsPlugin.installed_plugins') || [];

        const langCMSPlugins = editor.config.get('cmsPlugin.lang.CMSPlugins') || {};

        editor.ui.componentFactory.add('cms-plugin', locale => {
            const dropdownView = createDropdown(locale);

            const exclude = new Set([
                ...toolbarItemNames(editor.config.get('toolbar')),
                ...toolbarItemNames(editor.config.get('blockToolbar')),
            ]);

            addListToDropdown(dropdownView, buildDropdownItems(installed, exclude));

            dropdownView.buttonView.set({
                label: langCMSPlugins.title || t('CMS Plugins'),
                icon: langCMSPlugins.icon || IconTemplateGeneric,
                tooltip: langCMSPlugins.aria || langCMSPlugins.title || t('CMS Plugins'),
                withText: false,
            });

            this.listenTo(dropdownView, 'execute', evt => {
                const value = evt.source.commandParam;
                const plugin = installed.find(p => p.value === value);
                if (plugin) {
                    this.addPlugin(plugin);
                }
                editor.editing.view.focus();
            });

            return dropdownView;
        });

        for (const plugin of installed) {
            if (!plugin.icon) {
                continue;
            }
            editor.ui.componentFactory.add(plugin.value, locale => {
                const buttonView = new ButtonView(locale);
                buttonView.set({
                    label: plugin.name,
                    icon: plugin.icon,
                    tooltip: true,
                    withText: false,
                    commandParam: plugin.value,
                });

                this.listenTo(buttonView, 'execute', () => {
                    this.addPlugin(plugin);
                });

                return buttonView;
            });
        }

        const view = editor.editing.view;
        view.addObserver(DoubleClickObserver);
        this.listenTo(view.document, 'dblclick', (evt, data) => {
            const modelElement = findCmsPluginAncestor(editor, data.target);
            if (modelElement) {
                this.editPlugin(modelElement);
                data.preventDefault();
                data.stopPropagation();
                evt.stop();
            }
        });
    }

    editPlugin(modelElement) {
        const editor = this.editor;
        const CmsDialog = window.CMS_Editor && window.CMS_Editor.API && window.CMS_Editor.API.CmsDialog;
        if (!CmsDialog) {
            console.error('djangocms-text-ckeditor5: CmsDialog not available on window.CMS_Editor.API');
            return;
        }

        const id = modelElement.getAttribute('id');
        if (!id) {
            return;
        }
        const sourceEl = editor.sourceElement;

        new CmsDialog(
            sourceEl,
            saveSuccess => {
                if (!saveSuccess) {
                    return;
                }
                window.CMS_Editor.requestPluginMarkup(id, sourceEl)
                    .then(markup => updatePluginAttrs(editor, modelElement, markup))
                    .catch(error => console.warn(error));
            },
            () => editor.editing.view.focus()
        ).editDialog(id);
    }

    addPlugin(plugin) {
        const editor = this.editor;
        const CmsDialog = window.CMS_Editor && window.CMS_Editor.API && window.CMS_Editor.API.CmsDialog;
        if (!CmsDialog) {
            console.error('djangocms-text-ckeditor5: CmsDialog not available on window.CMS_Editor.API');
            return;
        }

        const sourceEl = editor.sourceElement;
        const range = editor.model.document.selection.getFirstRange();
        const selectionText = (range && !range.isCollapsed) ? rangeItemsToText(range.getItems()) : '';

        new CmsDialog(
            sourceEl,
            data => {
                if (!data || !data.plugin_id) {
                    return;
                }
                window.CMS_Editor.requestPluginMarkup(data.plugin_id, sourceEl)
                    .then(markup => insertPluginMarkup(editor, markup))
                    .catch(error => console.error(error));
            },
            () => editor.editing.view.focus()
        ).addDialog(plugin.value, selectionText);
    }
}

function buildDropdownItems(installed, exclude) {
    const itemDefinitions = new Collection();
    for (const item of filterDropdownPlugins(installed, exclude)) {
        itemDefinitions.add({
            type: 'button',
            model: new ViewModel({
                commandParam: item.value,
                label: item.label,
                withText: true,
            }),
        });
    }
    return itemDefinitions;
}

function insertPluginMarkup(editor, markup) {
    const parsed = parsePluginMarkup(markup);
    if (!parsed) {
        return;
    }
    editor.model.change(writer => {
        const modelEl = writer.createElement(parsed.schema, parsed.attrs);
        editor.model.insertContent(modelEl);
        writer.setSelection(modelEl, 'on');
    });
}

function updatePluginAttrs(editor, modelElement, markup) {
    const parsed = parsePluginMarkup(markup);
    if (!parsed) {
        return;
    }
    if (parsed.schema !== modelElement.name) {
        // The plugin changed its inline/block nature on edit. Replace in place
        // by deleting the old element and inserting the new one at the same
        // position. Capture the position BEFORE the removal — once the element
        // is gone, a range/position derived from it can be invalidated by
        // CKE5's live-position bookkeeping (e.g. under collaboration / undo).
        editor.model.change(writer => {
            const insertPos = writer.createPositionBefore(modelElement);
            const newEl = writer.createElement(parsed.schema, parsed.attrs);
            writer.remove(modelElement);
            editor.model.insertContent(newEl, insertPos);
            writer.setSelection(newEl, 'on');
        });
        return;
    }
    editor.model.change(writer => {
        for (const [key, value] of Object.entries(parsed.attrs)) {
            writer.setAttribute(key, value, modelElement);
        }
    });
}

function findCmsPluginAncestor(editor, viewElement) {
    const mapper = editor.editing.mapper;
    let current = viewElement;
    while (current) {
        const modelEl = mapper.toModelElement(current);
        if (modelEl && PLUGIN_SCHEMAS.has(modelEl.name)) {
            return modelEl;
        }
        current = current.parent;
    }
    return null;
}
