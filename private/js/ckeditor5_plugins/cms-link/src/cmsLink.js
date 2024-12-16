/* eslint-env es11 */
/* jshint esversion: 11 */

import {Plugin} from 'ckeditor5/src/core';
import {SwitchButtonView, View, ViewCollection} from 'ckeditor5/src/ui';
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
        this._handleExtraFormFieldSubmit();
        this._handleDataLoadingIntoExtraFormField();
    }

    _enableLinkAutocomplete() {
        const {editor} = this;
        const linkFormView = editor.plugins.get('LinkUI').formView;
        const linkActionsView = editor.plugins.get('LinkUI').actionsView;

        let wasAutocompleteAdded = false;

        editor.plugins
            .get('ContextualBalloon')
            .on('set:visibleView', (evt, propertyName, newValue) => {
                const selection = editor.model.document.selection;
                const cmsHref = selection.getAttribute('cmsHref');

                if (newValue === linkActionsView) {
                    // Add the link target name of a cms link into the action view
                    if(cmsHref && editor.config.get('url_endpoint')) {
                        fetch(editor.config.get('url_endpoint') + '?g=' + encodeURIComponent(cmsHref))
                        .then(response => response.json())
                        .then(data => {
                            const button = linkActionsView.previewButtonView.element;
                            button.firstElementChild.textContent = data.text;
                        });
                    }
                    return;
                }

                /**
                 * Used to know if a selection was made from the autocomplete results.
                 *
                 * @type {boolean}
                 */

                if (wasAutocompleteAdded) {
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
                new LinkField(linkFormView.urlInputView.fieldView.element, {
                    url: editor.config.get('url_endpoint') || ''
                });
                wasAutocompleteAdded = true;
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
