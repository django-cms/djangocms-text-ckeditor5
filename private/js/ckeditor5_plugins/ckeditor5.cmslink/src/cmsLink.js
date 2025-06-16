/* eslint-env es11 */
/* jshint esversion: 11 */

import {Plugin} from 'ckeditor5/src/core';
import {findAttributeRange} from "ckeditor5/src/typing";


/**
 * The `CmsLink` plugin extends the default CKEditor Link Plugin to handle custom "CMS links."
 * It provides functionalities like handling custom link attributes, managing the CKEditor UI,
 * and integrating autocomplete functionality for CMS-based links.
 *
 * This plugin includes:
 * - The addition of a custom "cmsHref" attribute for links in the model schema.
 * - Conversion between the model and view for the "cmsHref" attribute.
 * - Enhancements to the link and unlink commands to manage the custom "cmsHref" attribute.
 * - Autocomplete handling for CMS links in the editor UI.
 * - The addition of preview functionality for CMS links.
 *
 * Methods:
 * - `init`: Initializes the plugin, sets up the required configurations, and registers the necessary converters and handlers.
 * - `_defineConverters`: Defines model-to-view (downcast) and view-to-model (upcast) converters for the "cmsHref" attribute.
 * - `_handleExtraAttributeValues`: Modifies the link and unlink commands to handle the "cmsHref" attribute, ensuring consistent behavior and undo support.
 * - `_enableLinkAutocomplete`: Integrates autocomplete functionality for "CMS links" with proper synchronization and UI updating.
 */

export default class CmsLink extends Plugin {
    init() {
        const {editor} = this;
        // TRICKY: Work-around until the CKEditor team offers a better solution:
        // force the ContextualBalloon to get instantiated early thanks to imageBlock
        // not yet being optimized like
        // https://github.com/ckeditor/ckeditor5/commit/c276c45a934e4ad7c2a8ccd0bd9a01f6442d4cd3#diff-1753317a1a0b947ca8b66581b533616a5309f6d4236a527b9d21ba03e13a78d8.
        editor.plugins.get('LinkUI')._createViews();

        this.LinkField = window.CMS_Editor.API.LinkField;

        this._enableLinkAutocomplete();
        this._defineConverters();

        this._handleExtraAttributeValues();
        this._handleExtraFormFieldSubmit();
    }

    createLinkElement(value, { writer }) {
        // Priority 5 - https://github.com/ckeditor/ckeditor5-link/issues/121.
        const attrs = { href: value?.href };
        if (value?.cmsHref) {
            attrs['data-cms-href'] = value.cmsHref;
        }

        const linkElement = writer.createAttributeElement('a', attrs, { priority: 5 });
        writer.setCustomProperty('link', true, linkElement);
        return linkElement;
    }

    _defineConverters() {
       const {editor} = this;

        // DOWNCAST: From model to view (HTML)
        editor.conversion.for('downcast').attributeToElement({
            model: 'linkHref',
            view: this.createLinkElement,
            converterPriority: 'high',
        });

        // UPCAST: From view (HTML) to the model
        editor.conversion.for('upcast').elementToAttribute({
            view: {
                name: 'a',
                attributes: {
                    'href': true,
                },
            },
            model: {
                key: 'linkHref',
                value: (viewElement) => {
                    /*
                     * This function extracts the link href and the custom cmsHref attribute from the view element.
                     * It returns an object with both attributes.
                     */
                    const href = viewElement.getAttribute('href');
                    const cmsHref = viewElement.getAttribute('data-cms-href');
                    if (cmsHref) {
                        return {href: href, cmsHref: cmsHref};
                    }
                    return {href: href || '#'};
                },
            },
            converterPriority: 'high',
        });
    }

    _handleExtraAttributeValues() {
        /*
         * This method adds the handling of the extra attribute values for "data-cms-href" to the
         * link and unlink commands.
         */
        const {editor} = this;
        const linkCommand = editor.commands.get('link');

        linkCommand.on(
            'execute',
            (evt, args) => {
                if (args.length > 0 && args[0] && typeof args[0] === 'object') {
                    args[0] = { href: args[0] };
                }
            },
            {priority: 'high'},
        );
    }

    _enableLinkAutocomplete() {
        /*
         * This method listens to the visibility of the link form and actions view and adds the autocomplete
         * functionality when needed
         */
        const {editor} = this;
        const linkFormView = editor.plugins.get('LinkUI').formView;
        const linkToolbarView = editor.plugins.get('LinkUI').toolbarView;

        let autoComplete = null;

        editor.plugins
            .get('ContextualBalloon')
            .on('set:visibleView', (evt, propertyName, newValue) => {
                if (newValue !== linkFormView && newValue !== linkToolbarView) {
                    // Only run on the two link views
                    return;
                }
                const {selection} = editor.model.document;
                const linkHref = selection.getAttribute('linkHref') || {};
                const linkLabel = linkToolbarView.element.querySelector('span.ck.ck-button__label');
                if (newValue === linkToolbarView && linkLabel) {
                    // Patch the toolbar view to show the link target name of a cms link
                    const previewButtonView = linkToolbarView.items.find(
                        item => item.element && item.element.classList.contains('ck-link-toolbar__preview')
                    );
                    if (linkHref.cmsHref && editor.config.get('url_endpoint')) {
                        // Find the preview button in the toolbar view (CKEditor 5 >= v40)
                        if (previewButtonView) {
                            previewButtonView.label = '...';
                            editor.ui.update();  // Update the UI to account for the new button label
                            this._getLinkName(editor, linkHref.cmsHref, (text) => {
                                previewButtonView.label = text;
                                previewButtonView.href = linkHref.href || null;
                            });
                        }
                    } else {
                        previewButtonView.label = linkHref.href || '';
                        previewButtonView.href = linkHref.href || '';
                    }
                    return;
                }
                if (newValue === linkFormView) {
                    // Patch the link form view to add the autocomplete functionality
                    if (autoComplete !== null) {
                        // AutoComplete already added, just reset it, if no link exists
                        autoComplete.selectElement.value = linkHref.cmsHref || '';
                        autoComplete.urlElement.value = linkHref.href || '';
                        autoComplete.populateField();
                        autoComplete.inputElement.focus();
                        return;
                    }
                    const hiddenInput = document.createElement('input');

                    hiddenInput.setAttribute('type', 'hidden');
                    hiddenInput.setAttribute('name', linkFormView.urlInputView.fieldView.element.id + '_select');
                    hiddenInput.value = linkHref.cmsHref || '';
                    linkFormView.urlInputView.fieldView.element.name = linkFormView.urlInputView.fieldView.element.id;;
                    linkFormView.urlInputView.fieldView.element.parentNode.insertBefore(
                        hiddenInput,
                        linkFormView.urlInputView.fieldView.element
                    );
                    // Label is misleading - remove it
                    linkFormView.urlInputView.fieldView.element.parentNode.querySelector(`label[for="${linkFormView.urlInputView.fieldView.element.id}"]`)?.remove();
                    autoComplete = new this.LinkField(linkFormView.urlInputView.fieldView.element, {
                        url: editor.config.get('url_endpoint') || ''
                    });
                    autoComplete.inputElement.focus();
                }
            });
    }

    _getLinkName(editor, cmsHref, setLabel) {
        if (cmsHref) {
            fetch(editor.config.get('url_endpoint') + '?g=' + encodeURIComponent(cmsHref))
            .then(response => response.json())
            .then(data => {
                setLabel(data.text);
                editor.ui.update();  // Update the UI to account for the new button label
            })
            .catch(error => {
                console.error('Failed to fetch link name:', error);
                // Optionally, set a fallback label or notify the user
                setLabel('Link');
                editor.ui.update();
            });
        }
    }

    _handleExtraFormFieldSubmit() {
        /*
         * This method listens to the submit event of the link form, captures the selected cms reference
         * and injects the extra attribute values
         */
        const {editor} = this;
        const linkFormView = editor.plugins.get('LinkUI').formView;
        const linkCommand = editor.commands.get('link');

        this.listenTo(
            linkFormView,
            'submit',
            (ev) => {
                const id = linkFormView.urlInputView.fieldView.element.id + '_select';
                const selectElement = linkFormView.urlInputView.fieldView.element.closest('form').querySelector(`input[name="${id}"]`);
                // Stop the execution of the link command caused by closing the form.
                // Inject the extra attribute value. The highest priority listener here
                // injects the argument (here below 👇).
                // - The high priority listener in
                //   _addExtraAttributeOnLinkCommandExecute() gets that argument and sets
                //   the extra attribute.
                // - The normal (default) priority listener in ckeditor5-link sets
                //   (creates) the actual link.
                linkCommand.once(
                    'execute',
                    (evt, args) => {
                        if (args.length > 0) {
                            args[0] = {href: args[0]};
                            if (selectElement.value) {
                                args[0].cmsHref = selectElement.value;
                            }
                        }
                    },
                    {priority: 'highest'},
                );
            },
            {priority: 'high'},
        );
    }

    /**
     * @inheritdoc
     */
    static get pluginName() {
        return 'DjangoCMSDynamicLink';
    }
}
