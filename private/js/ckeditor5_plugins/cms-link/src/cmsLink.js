/* eslint-env es8 */
/* jshint esversion: 8 */

import {Plugin} from 'ckeditor5/src/core';
import {SwitchButtonView, View, ViewCollection} from 'ckeditor5/src/ui';
import LinkSuggestionsEditing from './linksuggestionediting';
import initializeAutocomplete from './autocomplete';

export default class CmsLinkPlugin extends Plugin {
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

        this._buttonViews = new ViewCollection();

        this._enableLinkAutocomplete();
        this._handleExtraFormFieldSubmit();
        this._handleDataLoadingIntoExtraFormField();
        this._handleEntityLinkPreviews();
    }

    _handleEntityLinkPreviews() {
        const {editor} = this;
        const linkActionsView = editor.plugins.get('LinkUI').actionsView;
        const previewButton = linkActionsView.previewButtonView;
        previewButton.set('parentHref');

        previewButton
            .bind('parentHref')
            .to(linkActionsView, 'href', this, 'entityMetadata', (value) => value);
        previewButton.unbind('isEnabled');
        previewButton
            .bind('isEnabled')
            .to(
                linkActionsView,
                'href',
                (href) => !!href && !href.startsWith('entity:'),
            );
        previewButton.unbind('label');

        const bind = previewButton.bindTemplate;

        previewButton.setTemplate({
            tag: 'a',
            attributes: {
                href: bind.to('parentHref', (hrefValue, another) => {
                    const {selection} = this.editor.model.document;
                    // If the active selection is image or media, the link metadata is
                    // stored in the drupalLinkEntityMetadata property.
                    if (
                        selection.getSelectedElement() &&
                        ['imageBlock', 'drupalMedia'].includes(
                            selection.getSelectedElement().name,
                        ) &&
                        selection
                            .getSelectedElement()
                            .hasAttribute('drupalLinkEntityMetadata')
                    ) {
                        const entityMetadata = JSON.parse(
                            selection
                                .getSelectedElement()
                                .getAttribute('drupalLinkEntityMetadata'),
                        );
                        if (entityMetadata.path) {
                            return `${
                                drupalSettings.path.baseUrl
                            }${entityMetadata.path.replace('entity:', '')}`;
                        }
                    } else if (selection.hasAttribute('data-entity-metadata')) {
                        // If the active selection is the link itself, the metadata is
                        // available in its data-entity-metadata attribute.
                        const entityMetadata = JSON.parse(
                            selection.getAttribute('data-entity-metadata'),
                        );
                        if (entityMetadata.path) {
                            return `${
                                drupalSettings.path.baseUrl
                            }${entityMetadata.path.replace('entity:', '')}`;
                        }
                    }

                    // If path is not available via metadata, use the hrefValue directly.
                    if (hrefValue && hrefValue.startsWith('entity:')) {
                        return `${drupalSettings.path.baseUrl}/${hrefValue.replace(
                            'entity:',
                            '',
                        )}`;
                    }

                    return hrefValue;
                }),
                target: '_blank',
                class: ['ck', 'ck-link-actions__preview'],
                'aria-labelledby': 'ck-aria-label-preview-button',
            },
            children: [
                {
                    tag: 'span',
                    attributes: {
                        class: ['ck', 'ck-button'],
                        id: 'ck-aria-label-preview-button',
                    },
                    children: [
                        {
                            text: bind.to('parentHref', (parentHref) => {
                                const {selection} = this.editor.model.document;

                                let entityMetadata = {};
                                if (
                                    selection.getSelectedElement() &&
                                    ['imageBlock', 'drupalMedia'].includes(
                                        selection.getSelectedElement().name,
                                    ) &&
                                    selection
                                        .getSelectedElement()
                                        .hasAttribute('drupalLinkEntityMetadata')
                                ) {
                                    entityMetadata = JSON.parse(
                                        selection
                                            .getSelectedElement()
                                            .getAttribute('drupalLinkEntityMetadata'),
                                    );
                                } else if (selection.hasAttribute('data-entity-metadata')) {
                                    entityMetadata = JSON.parse(
                                        selection.getAttribute('data-entity-metadata'),
                                    );
                                }

                                if (
                                    entityMetadata.label &&
                                    (!parentHref ||
                                        parentHref.startsWith('entity:') ||
                                        entityMetadata.path.startsWith('entity:'))
                                ) {
                                    const group = entityMetadata.group
                                        ? ` (${entityMetadata.group})`
                                        : '';
                                    const element = document.createElement('div');
                                    element.innerHTML = entityMetadata.label;
                                    return `${element.textContent}${group.replace(' - )', ')')}`;
                                }
                                return parentHref;
                            }),
                        },
                    ],
                },
            ],
        });
    }

    _createExtraButtonView(modelName, options) {
        const {editor} = this;
        const linkFormView = editor.plugins.get('LinkUI').formView;

        const buttonView = new SwitchButtonView(editor.locale);
        buttonView.set({
            name: modelName,
            label: options.label,
            withText: true,
        });
        buttonView.on('execute', () => {
            this.set(modelName, !buttonView.isOn);
        });
        this.on(`change:${modelName}`, (evt, propertyName, newValue) => {
            buttonView.isOn = newValue === true;
            buttonView.isVisible = typeof newValue === 'boolean';
        });

        linkFormView.on('render', () => {
            linkFormView._focusables.add(buttonView, 1);
            linkFormView.focusTracker.add(buttonView.element);
        });

        this._buttonViews.add(buttonView);
        linkFormView[modelName] = buttonView;
    }

    _enableLinkAutocomplete() {
        const {editor} = this;
        const hostEntityTypeId = editor.sourceElement.getAttribute(
            'data-ckeditor5-host-entity-type',
        );
        const hostEntityLangcode = editor.sourceElement.getAttribute(
            'data-ckeditor5-host-entity-langcode',
        );
        const linkFormView = editor.plugins.get('LinkUI').formView;
        const linkActionsView = editor.plugins.get('LinkUI').actionsView;

        let wasAutocompleteAdded = false;

        linkFormView.extendTemplate({
            attributes: {
                class: ['ck-vertical-form', 'ck-link-form_layout-vertical'],
            },
        });

        const additionalButtonsView = new View();
        additionalButtonsView.setTemplate({
            tag: 'ul',
            children: this._buttonViews.map((buttonView) => ({
                tag: 'li',
                children: [buttonView],
                attributes: {
                    class: ['ck', 'ck-list__item'],
                },
            })),
            attributes: {
                class: ['ck', 'ck-reset', 'ck-list'],
            },
        });
        linkFormView.children.add(additionalButtonsView, 1);

        editor.plugins
            .get('ContextualBalloon')
            .on('set:visibleView', (evt, propertyName, newValue) => {
                if (newValue === linkActionsView && this.entityMetadata) {
                    linkActionsView.set('metadata', this.entityMetadata);
                }

                if (newValue !== linkFormView || wasAutocompleteAdded) {
                    return;
                }

                /**
                 * Used to know if a selection was made from the autocomplete results.
                 *
                 * @type {boolean}
                 */
                let selected;

                initializeAutocomplete(linkFormView.urlInputView.fieldView.element, {
                    // @see \Drupal\ckeditor5\Plugin\CKEditor5Plugin\EntityLinkSuggestions::getDynamicPluginConfig()
                    autocompleteUrl: this.editor.config.get('drupalEntityLinkSuggestions')
                        .suggestionsUrl,
                    queryParams: {
                        hostEntityLangcode,
                        hostEntityTypeId,
                    },
                    selectHandler: (event, {item}) => {
                        if (!item.path && !item.href) {
                            // eslint-disable-next-line no-throw-literal
                            throw `Missing path or href param. ${JSON.stringify(item)}`;
                        }

                        if (item.entity_type_id || item.entity_uuid) {
                            if (!item.entity_type_id || !item.entity_uuid) {
                                // eslint-disable-next-line no-throw-literal
                                throw `Missing entity type id and/or entity uuid. ${JSON.stringify(
                                    item,
                                )}`;
                            }

                            this.set('entityType', item.entity_type_id);
                            this.set('entityUuid', item.entity_uuid);
                            this.set('entityMetadata', JSON.stringify(item));
                        } else {
                            this.set('entityType', null);
                            this.set('entityUuid', null);
                            this.set('entityMetadata', null);
                        }

                        event.target.value = item.path ?? item.href;
                        selected = true;
                        return false;
                    },
                    openHandler: () => {
                        selected = false;
                    },
                    closeHandler: () => {
                        if (!selected) {
                            this.set('entityType', null);
                            this.set('entityUuid', null);
                            this.set('entityMetadata', null);
                        }
                        selected = false;
                    },
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
                const values = {
                    'data-entity-type': this.entityType,
                    'data-entity-uuid': this.entityUuid,
                    'data-entity-metadata': this.entityMetadata,
                    'data-link-entity-type': this.entityType,
                    'data-link-entity-uuid': this.entityUuid,
                    'data-link-entity-metadata': this.entityMetadata,
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

        this.bind('entityType').to(linkCommand, 'data-entity-type');
        this.bind('entityUuid').to(linkCommand, 'data-entity-uuid');
        this.bind('entityMetadata').to(linkCommand, 'data-entity-metadata');
    }

    /**
     * @inheritdoc
     */
    static get pluginName() {
        return 'DrupalEntityLinkSuggestions';
    }
}
