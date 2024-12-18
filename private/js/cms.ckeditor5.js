/* eslint-env es6 */
/* jshint esversion: 6 */
/* global document, window, console */


// The editor creator to use.
import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import BalloonEditorBase from  '@ckeditor/ckeditor5-editor-balloon/src/ballooneditor';
import BlockToolbar from '@ckeditor/ckeditor5-ui/src/toolbar/block/blocktoolbar';


import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
// import UploadAdapter from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import Autosave from '@ckeditor/ckeditor5-autosave/src/autosave';
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Code from '@ckeditor/ckeditor5-basic-styles/src/code';
import Subscript from '@ckeditor/ckeditor5-basic-styles/src/subscript';
import Superscript from '@ckeditor/ckeditor5-basic-styles/src/superscript';
import Font from '@ckeditor/ckeditor5-font/src/font';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import CodeBlock from '@ckeditor/ckeditor5-code-block/src/codeblock';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import HeadingButtonsUI from '@ckeditor/ckeditor5-heading/src/headingbuttonsui';
// import Base64UploadAdapter from '@ckeditor/ckeditor5-upload/src/adapters/base64uploadadapter';
// import Image from '@ckeditor/ckeditor5-image/src/image';
// import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';
// import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle';
// import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
// import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import Indent from '@ckeditor/ckeditor5-indent/src/indent';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import ParagraphButtonUI from '@ckeditor/ckeditor5-paragraph/src/paragraphbuttonui';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import RemoveFormat from '@ckeditor/ckeditor5-remove-format/src/removeformat';
import ShowBlocks from '@ckeditor/ckeditor5-show-blocks/src/showblocks';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import TextTransformation from '@ckeditor/ckeditor5-typing/src/texttransformation';
import SourceEditing from '@ckeditor/ckeditor5-source-editing/src/sourceediting';
import HorizontalLine from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline';
//import UserStyle from './ckeditor5-user-style/src/userstyle';

import CmsPlugin from './ckeditor5_plugins/cms.plugin';
import { CmsLink, LinkSuggestionsEditing } from "./ckeditor5_plugins/cms-link";

class ClassicEditor extends ClassicEditorBase {}
class BalloonEditor extends BalloonEditorBase {}


// Plugins to include in the build.
var builtinPlugins = [
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
    LinkSuggestionsEditing,
	List,
	MediaEmbed,
	Paragraph,
    ParagraphButtonUI,
	PasteFromOffice,
    RemoveFormat,
    ShowBlocks,
	SourceEditing,
	Table,
	TableToolbar,
	TextTransformation,
    // UserStyle,
    CmsPlugin
];

ClassicEditor.builtinPlugins = builtinPlugins;
BalloonEditor.builtinPlugins = builtinPlugins;
BalloonEditor.builtinPlugins.push(BlockToolbar);

// Editor configuration.
var defaultConfig = {
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
	// This value must be kept in sync with the language defined in webpack.config.js.
	language: 'en',
};

ClassicEditor.defaultConfig = Object.assign({}, defaultConfig);
ClassicEditor.defaultConfig.toolbar.items.push('|', 'SourceEditing');
BalloonEditor.defaultConfig = {
    heading: defaultConfig.heading,
    table: defaultConfig.table,
    language: defaultConfig.language,
    image: defaultConfig.image,
    blockquote: defaultConfig.blockquote,
    toolbar: {
		items: [
            'bold', 'italic', 'alignment', '|',
			'link', '|',
            'code', '|', // 'userstyle',
            'fontFamily', 'fontSize', 'fontColor', '|',
		]
	},
    blockToolbar: {
        items: [
            'paragraph', 'heading2', 'heading3', 'heading4', 'heading5',
            '|',
            'alignment', '|',
            'bulletedList', 'numberedList', 'outdent', 'indent', '|',
            // 'cms-plugin', '|',  'LinkPlugin',
            'codeblock', '|',
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
        };
        this._unsupportedPlugins = [
            'Unlink', 'PasteFromWord', 'PasteText', 'Maximize',
            'JustifyCenter', 'JustifyRight', 'JustifyBlock'
        ];
        this._blockItems = [];
        for (const item of BalloonEditor.defaultConfig.blockToolbar.items) {
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
                BalloonEditor.create(el, options.options).then( editor => {
                    el.classList.remove('ck-content');  // remove Ckeditor 5 default styles
                    this._editors[el.id] = editor;
                    const initialContent = editor.getData();
                    editor.model.document.on('change:data', () => el.dataset.changed='true');
                    editor.ui.focusTracker.on( 'change:isFocused', ( evt, name, isFocused ) => {
                        el.classList.remove('ck-content');  // remove Ckeditor 5 default styles
                        if ( !isFocused ) {
                            // change:data event is not reliable, so we need to double-check
                            if (el.dataset.changed !== 'true' && editor.getData() !== initialContent) {
                                el.dataset.changed='true';
                            }
                            save_callback();
                        }
                    } );
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

        var blockToolbar = [];
        var topToolbar = [];
        var addingToBlock = false;

        const buildToolbars = (items) => {
            for (var item of items) {
                // Transform
                if (this._pluginNames[item] !== undefined) {
                    item = this._pluginNames[item];
                }

                // Add (if applicable)
                if (Array.isArray(item)) {
                    if (addingToBlock) {
                        if (blockToolbar.length > 0) {
                            blockToolbar.push('|');
                        }
                    } else {
                        if (topToolbar.length > 0) {
                            topToolbar.push('|');
                        }
                    }
                    buildToolbars(item);
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
                } else if (this._blockItems.includes(item.toLowerCase()) && inline) {
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
