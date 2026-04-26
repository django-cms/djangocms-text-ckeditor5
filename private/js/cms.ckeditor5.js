/* eslint-env es6 */
/* jshint esversion: 6 */
/* global document, window, console */

// CKEditor 5 v44+ ships its theme CSS as a separate bundle in the meta package.
// Importing it here gets it injected via style-loader at editor-load time.
import 'ckeditor5/ckeditor5.css';

// The editor creator to use.
import { ClassicEditor as ClassicEditorBase } from '@ckeditor/ckeditor5-editor-classic';
import { InlineEditor as InlineEditorBase } from '@ckeditor/ckeditor5-editor-inline';
import { BlockToolbar } from '@ckeditor/ckeditor5-ui';

import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Autoformat } from '@ckeditor/ckeditor5-autoformat';
import { Autosave } from '@ckeditor/ckeditor5-autosave';
import { Alignment } from '@ckeditor/ckeditor5-alignment';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Subscript,
    Superscript,
} from '@ckeditor/ckeditor5-basic-styles';
import { Font } from '@ckeditor/ckeditor5-font';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import { CodeBlock } from '@ckeditor/ckeditor5-code-block';
import { Heading, HeadingButtonsUI } from '@ckeditor/ckeditor5-heading';
import { Indent } from '@ckeditor/ckeditor5-indent';
import { Link } from '@ckeditor/ckeditor5-link';
import { List } from '@ckeditor/ckeditor5-list';
import { MediaEmbed } from '@ckeditor/ckeditor5-media-embed';
import { Paragraph, ParagraphButtonUI } from '@ckeditor/ckeditor5-paragraph';
import { PasteFromOffice } from '@ckeditor/ckeditor5-paste-from-office';
import { RemoveFormat } from '@ckeditor/ckeditor5-remove-format';
import { ShowBlocks } from '@ckeditor/ckeditor5-show-blocks';
import { Table, TableToolbar } from '@ckeditor/ckeditor5-table';
import { TextTransformation } from '@ckeditor/ckeditor5-typing';
import { SourceEditing } from '@ckeditor/ckeditor5-source-editing';
import { HorizontalLine } from '@ckeditor/ckeditor5-horizontal-line';
import { Style } from '@ckeditor/ckeditor5-style';
import { GeneralHtmlSupport } from '@ckeditor/ckeditor5-html-support';

import CmsPlugin from './ckeditor5_plugins/ckeditor5.cmsplugin/index';
import CmsLink from "./ckeditor5_plugins/ckeditor5.cmslink/index";

class ClassicEditor extends ClassicEditorBase {}
class InlineEditor extends InlineEditorBase {}


// Plugins to include in the build.
const builtinPlugins = [
	Essentials,
	// UploadAdapter,
	Autoformat,
	Autosave,
    Alignment,
	Bold,
	Italic,
    Underline,
    Strikethrough,
    Code,
    Subscript,
    Superscript,
    Font,
    CodeBlock,
	BlockQuote,
    GeneralHtmlSupport,
	Heading,
    HeadingButtonsUI,
    HorizontalLine,
    // Base64UploadAdapter,
	// Image,
	// ImageCaption,
	// ImageStyle,
	// ImageToolbar,
    // ImageUpload,
	Indent,
    Link,
    CmsLink,
	List,
	MediaEmbed,
	Paragraph,
    ParagraphButtonUI,
	PasteFromOffice,
    RemoveFormat,
    ShowBlocks,
	SourceEditing,
    Style,
	Table,
	TableToolbar,
	TextTransformation,
    CmsPlugin
];

ClassicEditor.builtinPlugins = builtinPlugins;
InlineEditor.builtinPlugins = builtinPlugins;
InlineEditor.builtinPlugins.push(BlockToolbar);

// Editor configuration.
const defaultConfig = {
	toolbar: {
		items: [
            'heading', '|',
            'bold', 'italic', 'underline', 'alignment', '|', 'link',
			'bulletedList', 'numberedList', 'outdent', 'indent', '|',
            'code', 'codeblock', '|',
            'fontFamily', 'fontSize', 'fontColor', '|',
            'mediaEmbed', 'insertTable', 'horizontalLine', 'blockQuote',
		],
	},
    heading: {
        options: [
            { model: 'paragraph', title: 'Paragraph', class: '' },
            { model: 'heading1', view: 'h1', title: 'Heading 1', class: '' },
            { model: 'heading2', view: 'h2', title: 'Heading 2', class: '' },
            { model: 'heading3', view: 'h3', title: 'Heading 3', class: '' },
            { model: 'heading4', view: 'h4', title: 'Heading 4', class: '' },
            { model: 'heading5', view: 'h5', title: 'Heading 5', class: '' }
        ]
    },
    blockquote: {
        options: {
            classes: 'blockquote'
        }
    },
	table: {
		contentToolbar: [
			'tableColumn',
			'tableRow',
			'mergeTableCells'
		]
	},
    style: {
        definitions: [
            {
                name: 'Article category',
                element: 'h3',
                classes: [ 'category' ]
            },
            {
                name: 'Lead',
                element: 'p',
                classes: [ 'lead' ]
            },
        ]
    },
	// This value must be kept in sync with the language defined in webpack.config.js.
	language: 'en',
};

ClassicEditor.defaultConfig = Object.assign({}, defaultConfig);
ClassicEditor.defaultConfig.toolbar.items.push('|', 'SourceEditing');
InlineEditor.defaultConfig = {
    heading: defaultConfig.heading,
    table: defaultConfig.table,
    language: defaultConfig.language,
    image: defaultConfig.image,
    blockquote: defaultConfig.blockquote,
    toolbar: {
		items: [
            'bold', 'italic', 'alignment', '|',
			'link', '|',
            'code', '|',
            'fontFamily', 'fontSize', 'fontColor', '|',
		]
	},
    blockToolbar: {
        items: [
            'paragraph', 'heading2', 'heading3', 'heading4', 'heading5',
            '|',
            'alignment', '|',
            'bulletedList', 'numberedList', 'outdent', 'indent', '|',
            'codeblock', '|', 'style',
            'mediaEmbed', 'insertTable', 'horizontalLine', 'blockQuote',
        ],
        shouldNotGroupWhenFull: true
    }
};


class CmsCKEditor5Plugin {
    constructor(props) {
        this._editors = {};
        this._CSS = [];
        this._pluginNames = {
            Table: 'insertTable',
            Source: 'SourceEditing',
            HorizontalRule: 'horizontalLine',
            JustifyLeft: 'Alignment',
            Strike: 'Strikethrough',
            Styles: 'Style',
            CMSPlugins: 'cms-plugin',
        };
        this._unsupportedPlugins = [
            'Unlink', 'PasteFromWord', 'PasteText', 'Maximize',
            'JustifyCenter', 'JustifyRight', 'JustifyBlock'
        ];
        this._blockItems = [];
        for (const item of InlineEditor.defaultConfig.blockToolbar.items) {
            if (item !== '|') {
                this._blockItems.push(item.toLowerCase());
            }
        }
    }

    // initializes the editor on the target element, with the given html code
    create (el, inModal, content, options, save_callback) {
        if (!(el.id in this._editors)) {
            const inline = el.tagName !== 'TEXTAREA';
            this._update_options(options, inline);
            if (!inline) {
                ClassicEditor.create(el, options.options).then( editor => {
                    this._editors[el.id] = editor;
                });
            } else {
                InlineEditor.create(el, options.options).then( editor => {
                    el.classList.remove('ck-content');  // remove Ckeditor 5 default styles
                    editor.editing.view.change(writer => {
                        const editableElement = editor.editing.view.document.getRoot();
                        writer.removeClass('ck-content', editableElement);
                    });
                    this._editors[el.id] = editor;
                    editor.isDirty = false;
                    editor.model.document.on('change:data', () => editor.isDirty = true);
                    editor.ui.focusTracker.on('change:isFocused', ( evt, name, isFocused ) => {
                        if ( !isFocused && editor.isDirty) {
                            el.dataset.changed = 'true';
                            save_callback();
                            editor.isDirty = false;
                            el.classList.remove('ck-content');  // remove Ckeditor 5 default styles
                        }
                    });
                    const styles = document.querySelectorAll('style[data-cke="true"]');
                    if (styles.length > 0) {
                        // Styles are installed in the document head, but we need to clone them
                        // for later recovery
                        styles.forEach((style) => {
                                if (this._CSS.indexOf(style) === -1) {
                                    this._CSS.push(style.cloneNode(true));
                                }
                            }
                        );
                    } else {
                        this._CSS.forEach((style) => document.head.appendChild(style));
                    }
                });
            }
        }
    }

    // returns the edited html code
    getHTML (el) {
        if (el.id in this._editors) {
            return this._editors[el.id].getData();
        }
        return undefined;
    }

    // returns the edited content as json
    // currently not supported by CKEditor 5
    getJSON (el) {
        return undefined;
    }

    // destroy the editor
    destroyEditor (el) {
        if (el.id in this._editors) {
            this._editors[el.id].destroy();
            delete this._editors[el.id];
        }
    }

    _update_options(options, inline) {
        if (options.options === undefined) {
            options.options = {};
        }
        if (options.options.licenseKey === undefined) {
            options.options.licenseKey = 'GPL';
        }
        if (options.url_endpoint) {
            options.options.url_endpoint = options.url_endpoint;
        }

        // Bridge djangocms-text's flat settings into the cmsPlugin config namespace
        // expected by the CMSPlugin/CMSPluginUI editor plugins.
        const cmsPlugin = options.options.cmsPlugin || {};
        cmsPlugin.installed_plugins = cmsPlugin.installed_plugins || options.installed_plugins || [];
        cmsPlugin.placeholder = cmsPlugin.placeholder || options.placeholder_id;
        cmsPlugin.pk = cmsPlugin.pk || options.plugin_id;
        cmsPlugin.plugin_position = cmsPlugin.plugin_position || options.plugin_position;
        cmsPlugin.plugin_language = cmsPlugin.plugin_language || options.plugin_language;
        cmsPlugin.lang = cmsPlugin.lang || options.lang || {};
        options.options.cmsPlugin = cmsPlugin;

        // Push the toolbar / panel positioning down past the django CMS frontend
        // toolbar so the inline editor's sticky top toolbar isn't hidden behind it.
        // Only applied in the frame that actually hosts the CMS toolbar — admin
        // iframes don't have one, so the query returns null and the offset is 0.
        options.options.ui = options.options.ui || {};
        if (!options.options.ui.viewportOffset) {
            const cmsToolbar = document.querySelector('.cms-toolbar');
            options.options.ui.viewportOffset = {
                top: cmsToolbar ? cmsToolbar.offsetHeight : 0,
            };
        }

        let blockToolbar = [];
        let topToolbar = [];
        let addingToBlock = false;

        const buildToolbars = (items) => {
            for (let item of items) {
                // Transform
                if (this._pluginNames[item] !== undefined) {
                    item = this._pluginNames[item];
                }

                // Add (if applicable)
                if (Array.isArray(item) || Array.isArray(item.items)) {
                    if (addingToBlock) {
                        if (blockToolbar.length > 0) {
                            blockToolbar.push('|');
                        }
                    } else if (topToolbar.length > 0) {
                        topToolbar.push('|');
                    }
                    buildToolbars(Array.isArray(item) ? item : item.items);
                } else if (inline && ['ShowBlocks', 'SourceEditing'].includes(item)) {
                    // No source editing or show blocks in inline editor
                    continue;
                } else if (this._unsupportedPlugins.includes(item) || item === '-') {
                    // Skip items with no CKEditor 5 equivalent
                    continue;
                } else if (item === 'Format') {
                    // Expand "Format" widget in inline editor
                    item = 'heading';
                    if (inline) {
                        blockToolbar.push('paragraph', 'heading2', 'heading3', 'heading4', 'heading5');
                        addingToBlock = true;
                        item = '|';
                    }
                } else if (item === '|') {
                    if (addingToBlock) {
                        blockToolbar.push(item);
                    } else {
                        topToolbar.push(item);
                    }
                } else if (typeof item === 'string' && this._blockItems.includes(item.toLowerCase()) && inline) {
                    blockToolbar.push(item);
                    addingToBlock = true;
                } else {
                    topToolbar.push(item);
                    addingToBlock = false;
                }
            }
        };

        buildToolbars(options.options.toolbar || []);
        if (topToolbar.length > 0) {
            options.options.toolbar = {items: topToolbar};
        }
        if (blockToolbar.length > 0) {
            options.options.blockToolbar = {items: blockToolbar};
        }
    }

    _init() {
        this.editor.ui.componentFactory.add('cms-plugin', locale => {
            const view = new ButtonView(locale);
            view.set({
                label: 'CMS Plugin',
                icon: pluginIcon,
                tooltip: true
            });
            // Callback executed once the image is clicked.
            view.on('execute', () => {
                const selection = this.editor.model.document.selection;
                const selectedElement = selection.getSelectedElement();
                if (selectedElement && selectedElement.name === 'cms-plugin') {
                    this.editor.execute('link', { url: selectedElement.getAttribute('url') });
                } else {
                    this.editor.execute('link', { url: 'https://www.django-cms.org' });
                }
            });
            return view;
        });
    }
}


window.cms_editor_plugin = new CmsCKEditor5Plugin({});
