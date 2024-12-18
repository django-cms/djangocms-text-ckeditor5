/* eslint-env es11 */
/* jshint esversion: 11 */

import {Plugin} from 'ckeditor5/src/core';
import LinkSuggestionsEditing from './linksuggestionediting';
import LinkField from "./cms.linkfield";


export default class CmsLink extends Plugin {
    /**
     * @inheritdoc
     */
    static get requires() {
        return [LinkSuggestionsEditing];
    }

    init() {
        const editor = this.editor;
        // TRICKY: Work-around until the CKEditor team offers a better solution: force the ContextualBalloon to get instantiated early thanks to imageBlock not yet being optimized like https://github.com/ckeditor/ckeditor5/commit/c276c45a934e4ad7c2a8ccd0bd9a01f6442d4cd3#diff-1753317a1a0b947ca8b66581b533616a5309f6d4236a527b9d21ba03e13a78d8.
        editor.plugins.get('LinkUI')._createViews();

        this._enableLinkAutocomplete();
        this._defineConverters();

        this._handleExtraFormFieldSubmit();
        this._handleDataLoadingIntoExtraFormField();
    }

    _defineConverters() {
        const editor = this.editor;

        // UPCAST: From view (HTML) to the model
            editor.conversion.for('upcast').elementToAttribute({
            view: {
                name: 'a',
                attributes: {
                    'data-cms-href': true
                },
            },
            model: {
                key: 'cmsHref',
                value: (viewElement) => viewElement.getAttribute('data-cms-href'),
            },
        });

        // DOWNCAST: From model to view (HTML)
        editor.conversion.for('downcast').attributeToElement({
            model: 'cmsHref',
            view: (value, {writer}) => {
                const viewAttributes = {};
                viewAttributes['data-cms-href'] = value;
                const linkViewElement = writer.createAttributeElement(
                    'a',
                    viewAttributes,
                    {priority: 5},
                );

                // Without it the isLinkElement() will not recognize the link and the UI will not show up
                // when the user clicks a link.
                writer.setCustomProperty('link', true, linkViewElement);

                return linkViewElement;
            },
        });
    }

    _handleExtraAttributeValues() {
        const editor = this.editor;

        // Extend the link command to handle the custom attribute
        editor.commands.get('link').on('execute', (evt, data) => {
            if (data.linkHref) {
                const model = editor.model;
                const selection = model.document.selection;

                model.change((writer) => {
                    editor.execute('link', ...args);

                    const firstPosition = selection.getFirstPosition();
                    if (selection.isCollapsed) {
                        const node = firstPosition.textNode || firstPosition.nodeBefore;
                        if (data.cmsHref) {
                            writer.setAttribute('cmsHref', data.cmsHref, writer.createRangeOn(node));
                        } else {
                            writer.removeAttribute('cmsHref', writer.createRangeOn(node));
                        }

                        writer.removeSelectionAttribute('cmsHref');
                    } else {
                        const ranges = model.schema.getValidRanges(
                            selection.getRanges(),
                            'cmsHref',
                        );

                        // eslint-disable-next-line no-restricted-syntax
                        for (const range of ranges) {
                            if (data.cmsHref) {
                                writer.setAttribute('cmsHref', data.cmsHref, range);
                            } else {
                                writer.removeAttribute('cmsHref', range);
                            }
                        }
                    }
                });
            }
        });

    }

    _enableLinkAutocomplete() {
        const {editor} = this;
        const linkFormView = editor.plugins.get('LinkUI').formView;
        const linkActionsView = editor.plugins.get('LinkUI').actionsView;

        let autoComplete = null;

        editor.plugins
            .get('ContextualBalloon')
            .on('set:visibleView', (evt, propertyName, newValue) => {
                if (newValue !== linkFormView && newValue !== linkActionsView) {
                    return;
                }

                const selection = editor.model.document.selection;
                const cmsHref = selection.getAttribute('cmsHref');
                const linkHref = selection.getAttribute('linkHref');

                if (newValue === linkActionsView) {
                    // Add the link target name of a cms link into the action view
                    if(cmsHref && editor.config.get('url_endpoint')) {
                        fetch(editor.config.get('url_endpoint') + '?g=' + encodeURIComponent(cmsHref))
                        .then(response => response.json())
                        .then(data => {
                            const button = linkActionsView.previewButtonView.element;
                            button.firstElementChild.textContent = data.text;
                        });
                    } else if (linkHref) {
                        const button = linkActionsView.previewButtonView.element;
                        button.firstElementChild.textContent = selection.getAttribute('linkHref');
                    }
                    return;
                }

                /**
                 * Used to know if a selection was made from the autocomplete results.
                 *
                 * @type {boolean}
                 */

                if (autoComplete !== null) {
                    // Already added, just reset it, if no link exists
                    autoComplete.selectElement.value = cmsHref || '';
                    autoComplete.urlElement.value = linkHref || '';
                    autoComplete.populateField();
                    return;
                }
                const hiddenInput = document.createElement('input');
                hiddenInput.setAttribute('type', 'hidden');
                hiddenInput.setAttribute('name', linkFormView.urlInputView.fieldView.element.id + '_select');
                hiddenInput.value = cmsHref || '';
                linkFormView.urlInputView.fieldView.element.parentNode.insertBefore(
                    hiddenInput,
                    linkFormView.urlInputView.fieldView.element
                );
                linkFormView.urlInputView.fieldView.element.parentNode.querySelector('label')?.remove();
                autoComplete = new LinkField(linkFormView.urlInputView.fieldView.element, {
                    url: editor.config.get('url_endpoint') || ''
                });
            });
    }

    _handleExtraFormFieldSubmit() {
        const {editor} = this;
        const linkFormView = editor.plugins.get('LinkUI').formView;
        const linkCommand = editor.commands.get('link');

        this.listenTo(
            linkFormView,
            'submit',
            () => {

                const id = linkFormView.urlInputView.fieldView.element.id + '_select';
                const selectElement = linkFormView.urlInputView.fieldView.element.closest('form').querySelector(`input[name="${id}"]`);
                const values = {
                    'cmsHref': selectElement.value,
                };
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
                        if (args.length < 3) {
                            args.push(values);
                        } else if (args.length === 3) {
                            Object.assign(args[2], values);
                        } else {
                            throw Error('The link command has more than 3 arguments.');
                        }
                    },
                    {priority: 'highest'},
                );
            },
            {priority: 'high'},
        );
    }

    _handleDataLoadingIntoExtraFormField() {
        const {editor} = this;
        const linkCommand = editor.commands.get('link');

        this.bind('cmsHref').to(linkCommand, 'cmsHref');
    }

    /**
     * @inheritdoc
     */
    static get pluginName() {
        return 'DrupalEntityLinkSuggestions';
    }
}
