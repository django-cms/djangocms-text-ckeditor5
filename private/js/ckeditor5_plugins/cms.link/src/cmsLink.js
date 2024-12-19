/* eslint-env es11 */
/* jshint esversion: 11 */

import {Plugin} from 'ckeditor5/src/core';
import LinkField from "./cms.linkfield";
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
        const editor = this.editor;
        // TRICKY: Work-around until the CKEditor team offers a better solution: force the ContextualBalloon to get instantiated early thanks to imageBlock not yet being optimized like https://github.com/ckeditor/ckeditor5/commit/c276c45a934e4ad7c2a8ccd0bd9a01f6442d4cd3#diff-1753317a1a0b947ca8b66581b533616a5309f6d4236a527b9d21ba03e13a78d8.
        editor.plugins.get('LinkUI')._createViews();

        this._enableLinkAutocomplete();
        this._defineConverters();

        this._handleExtraAttributeValues();
        this._handleExtraFormFieldSubmit();
        this._handleDataLoadingIntoExtraFormField();
    }

    _defineConverters() {
       const {editor} = this;
        editor.model.schema.extend('$text', {allowAttributes: 'cmsHref'});

        // DOWNCAST: From model to view (HTML)
        editor.conversion.for('downcast').attributeToElement({
            model: 'cmsHref',
            view: (value, {writer}) => {
                const linkViewElement = writer.createAttributeElement(
                    'a', {'data-cms-href': value}, {priority: 5},
                );

                // Without it the isLinkElement() will not recognize the link and the UI will not show up
                // when the user clicks a link.
                writer.setCustomProperty('link', true, linkViewElement);

                return linkViewElement;
            },
        });

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
    }

    _handleExtraAttributeValues() {
        /*
         * This method adds the handling of the extra attribute values for "data-cms-href" to the
         * link and unlink commands.
         */
        const {editor} = this;
        const linkCommand = editor.commands.get('link');
        const unlinkCommand = editor.commands.get('unlink');
        const {model} = editor;
        const {selection} = model.document;

        // Add the extra attributes with the link command
        let linkCommandExecuting = false;

        linkCommand.on(
            'execute',
            (evt, args) => {
                // Custom handling is only required if an extra attribute was passed into
                // editor.execute( 'link', ... ).
                if (args.length < 3) {
                    return;
                }
                if (linkCommandExecuting) {
                    linkCommandExecuting = false;
                    return;
                }

                // If the additional attribute was passed, we stop the default execution
                // of the LinkCommand. We're going to create Model#change() block for undo
                // and execute the LinkCommand together with setting the extra attribute.
                evt.stop();

                // Prevent infinite recursion by keeping records of when link command is
                // being executed by this function.
                linkCommandExecuting = true;
                const extraAttributeValues = args[args.length - 1];

                // Wrapping the original command execution in a model.change() block to
                // ensure there is a single undo step when the extra attribute is added.
                model.change((writer) => {
                    editor.execute('link', ...args);

                    const firstPosition = selection.getFirstPosition();
                    if (selection.isCollapsed) {
                        const node = firstPosition.textNode || firstPosition.nodeBefore;
                        if (extraAttributeValues['cmsHref']) {
                            writer.setAttribute(
                                'cmsHref',
                                extraAttributeValues['cmsHref'],
                                writer.createRangeOn(node),
                            );
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
                            if (extraAttributeValues['cmsHref']) {
                                writer.setAttribute(
                                    'cmsHref',
                                    extraAttributeValues['cmsHref'],
                                    range,
                                );
                            } else {
                                writer.removeAttribute('cmsHref', range);
                            }
                        }
                    }
                 });
            },
            {priority: 'high'},
        );

        // Remove extra attributes when the unlink command is executed.
        let isUnlinkingInProgress = false;

        // Make sure all changes are in a single undo step so cancel the original unlink first in the high priority.
        unlinkCommand.on(
            'execute',
            (evt) => {
                if (isUnlinkingInProgress) {
                    return;
                }

                evt.stop();

                // This single block wraps all changes that should be in a single undo step.
                model.change(() => {
                    // Now, in this single "undo block" let the unlink command flow naturally.
                    isUnlinkingInProgress = true;

                    // Do the unlinking within a single undo step.
                    editor.execute('unlink');

                    // Let's make sure the next unlinking will also be handled.
                    isUnlinkingInProgress = false;

                    // The actual integration that removes the extra attribute.
                    model.change((writer) => {
                        // Get ranges to unlink.
                        let ranges;

                        if (selection.isCollapsed) {
                            ranges = [
                                findAttributeRange(
                                    selection.getFirstPosition(),
                                    'cmsHref',
                                    selection.getAttribute('cmsHref'),
                                    model,
                                ),
                            ];
                        } else {
                            ranges = model.schema.getValidRanges(
                                selection.getRanges(),
                                'cmsHref',
                            );
                        }

                        // Remove the extra attribute from specified ranges.
                        // eslint-disable-next-line no-restricted-syntax
                        for (const range of ranges) {
                            writer.removeAttribute('cmsHref', range);
                        }
                    });
                });
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
        const linkActionsView = editor.plugins.get('LinkUI').actionsView;

        let autoComplete = null;

        editor.plugins
            .get('ContextualBalloon')
            .on('set:visibleView', (evt, propertyName, newValue) => {
                if (newValue !== linkFormView && newValue !== linkActionsView) {
                    // Only run on the two link views
                    return;
                }

                const {selection} = editor.model.document;
                const cmsHref = selection.getAttribute('cmsHref');
                const linkHref = selection.getAttribute('linkHref');

                if (newValue === linkActionsView) {
                    // Add the link target name of a cms link into the action view
                    if(cmsHref && editor.config.get('url_endpoint')) {
                        linkActionsView.previewButtonView.label = '...';
                        fetch(editor.config.get('url_endpoint') + '?g=' + encodeURIComponent(cmsHref))
                        .then(response => response.json())
                        .then(data => {
                            linkActionsView.previewButtonView.label = data.text;
                            editor.ui.update();  // Update the UI to account for the new button label
                        });
                    } else if (linkHref) {
                        // Add the link target of a regular link into the action view
                        linkActionsView.previewButtonView.label = selection.getAttribute('linkHref');
                        editor.ui.update();  // Update the UI to account for the new button label
                    }
                    return;
                }

                if (autoComplete !== null) {
                    // AutoComplete already added, just reset it, if no link exists
                    autoComplete.selectElement.value = cmsHref || '';
                    autoComplete.urlElement.value = linkHref || '';
                    autoComplete.inputElement.value = linkActionsView.previewButtonView.label;
                    autoComplete.populateField();
                    autoComplete.inputElement.focus();
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
                // Label is misleading - remove it
                linkFormView.urlInputView.fieldView.element.parentNode.querySelector('label')?.remove();
                autoComplete = new LinkField(linkFormView.urlInputView.fieldView.element, {
                    url: editor.config.get('url_endpoint') || ''
                });
                autoComplete.inputElement.focus();
            });
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
        /*
         * This method listens to the link command and updates the extra attribute values
         */
        const {editor} = this;
        const linkCommand = editor.commands.get('link');

        this.bind('cmsHref').to(linkCommand, 'cmsHref');
    }

   _refreshExtraAttributeValues() {
        /*
         * This method listens to document changes to update the cmsHref attribute. Currently not called.
         */
        const {editor} = this;
        const linkCommand = editor.commands.get('link');
        const {model} = editor;
        const {selection} = model.document;

        linkCommand.set('cmsHref', null);
        model.document.on('change', () => {
            linkCommand['cmsHref'] = selection.getAttribute('cmsHref');
        });
    }

    /**
     * @inheritdoc
     */
    static get pluginName() {
        return 'DjangoCMSDynamicLink';
    }
}
