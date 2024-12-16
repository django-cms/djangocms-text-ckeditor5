/* eslint-env es6 */
/* jshint esversion: 6 */

import {Plugin} from 'ckeditor5/src/core';
import {findAttributeRange} from 'ckeditor5/src/typing';

export default class LinkSuggestionsEditing extends Plugin {
    init() {
        const editor = this.editor;
        const linkCommand = editor.commands.get('link');
        const unlinkCommand = editor.commands.get('unlink');

        this._allowAndConvertExtraAttributes();
        this._removeExtraAttributesOnUnlinkCommandExecute();
        this._refreshExtraAttributeValues();
        this._addExtraAttributesOnLinkCommandExecute();

    }

    _allowAndConvertExtraAttributes() {
        const {editor} = this;
        editor.model.schema.extend('$text', {allowAttributes: 'cmsHref'});

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

    _addExtraAttributesOnLinkCommandExecute() {
        const {editor} = this;
        const linkCommand = editor.commands.get('link');
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
                const {model} = editor;
                const {selection} = model.document;

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
    }

    _removeExtraAttributesOnUnlinkCommandExecute() {
        const {editor} = this;
        const unlinkCommand = editor.commands.get('unlink');
        const {model} = editor;
        const {selection} = model.document;

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

    _refreshExtraAttributeValues() {
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
        return 'LinkSuggestionsEditing';
    }
}
