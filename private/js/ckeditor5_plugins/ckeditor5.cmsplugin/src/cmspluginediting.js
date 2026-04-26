/* eslint-env es11 */
/* jshint esversion: 11 */


import { Plugin } from '@ckeditor/ckeditor5-core';
import { _stringifyView as stringify } from '@ckeditor/ckeditor5-engine';
import { Widget, toWidget } from '@ckeditor/ckeditor5-widget';

const blockTags = ((str) => str.toUpperCase().substring(1, str.length-1).split("><"))(
    "<address><article><aside><blockquote><canvas><dd><div><dl><dt><fieldset><figcaption><figure><footer><form>" +
    "<h1><h2><h3><h4><h5><h6><header><hr><li><main><nav><noscript><ol><p><pre><section><table><tfoot><ul><video>"
);


function blockContent( children ) {
    for (const item of children) {
        if (item.name) {
            return blockTags.includes(item?.name.toUpperCase());
        }
    }
    return false;
}

const inlinePluginSchema = 'cms-inline-plugin';
const blockPluginSchema = 'cms-block-plugin';
const pluginAttributes = [ 'id', 'render_plugin', 'plugin_title', 'type', 'plugin_content' ];

export default class CMSPluginEditing extends Plugin {
    static get requires() {
        return [ Widget ];
    }

    init() {
        this._defineSchema();
        this._defineConverters();
    }

    _defineSchema() {
        /*
         * Define two schemas for the CMS plugin, one for inline and one for block content
         */
        const schema = this.editor.model.schema;

        schema.register( inlinePluginSchema, {
            isObject: true,
            isInline: true,
            allowWhere: '$text',
            allowAttributesOf: '$text',
            allowAttributes: pluginAttributes
        } );

        schema.register( blockPluginSchema, {
            isObject: true,
            isBlock: true,
            allowWhere: '$block',
            allowAttributes: pluginAttributes
        } );
    }

    _defineConverters() {                                                      // ADDED
        const conversion = this.editor.conversion;

        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'cms-plugin',
            },
            model: ( viewElement, { writer: modelWriter } ) => {
                // Extract the "name" from "{name}".
                const children = Array.from(viewElement.getChildren());
                const schema = blockContent(children) ? blockPluginSchema : inlinePluginSchema;

                let innerHTML = '';
                for (const child of children) {
                    innerHTML += stringify(child);
                }
                console.log('modelWriter', modelWriter);
                return modelWriter.createElement( schema, {
                    id: viewElement.getAttribute("id"),
                    plugin_title: viewElement.getAttribute('title') || '',
                    render_plugin: viewElement.getAttribute('render-plugin') || true,
                    type: viewElement.getAttribute('type') || 'CmsPluginBase',
                    plugin_content: innerHTML,
                } );
            }
        } );

        conversion.for( 'editingDowncast' )
            .elementToElement({
                model: inlinePluginSchema,
                view: (modelItem, {writer: viewWriter}) =>
                    toWidget(createCMSPluginView(modelItem, viewWriter, true), viewWriter, {
                        label: modelItem.getAttribute('plugin_title'),
                    })
            } )
            .elementToElement({
                model: blockPluginSchema,
                view: (modelItem, {writer: viewWriter}) =>
                    toWidget(createCMSPluginView(modelItem, viewWriter, true), viewWriter, {
                        label: modelItem.getAttribute('plugin_title'),
                    })
            });

        conversion.for( 'dataDowncast' )
            .elementToElement( {
                model: inlinePluginSchema,
                view: (modelItem, {writer: viewWriter}) =>
                    createCMSPluginView(modelItem, viewWriter)
            } )
            .elementToElement({
                model: blockPluginSchema,
                view: (modelItem, {writer: viewWriter}) =>
                    createCMSPluginView(modelItem, viewWriter)
            } );

        // Helper method for both downcast converters.
        function createCMSPluginView( modelItem, viewWriter, edit = false ) {
            const attrs = {
                'alt': modelItem.getAttribute( 'plugin_title' ),
                'id': modelItem.getAttribute( 'id' ),
                'render-plugin': modelItem.getAttribute( 'render_plugin' ),
                'title': modelItem.getAttribute( 'plugin_title' ),
                'type': modelItem.getAttribute( 'type' ),
            };
            const innerHTML = modelItem.getAttribute( 'plugin_content' );

            const plugin = viewWriter.createRawElement(
                'cms-plugin', attrs, ( domElement ) => {
                    domElement.innerHTML = innerHTML;
                }
            );

            if (edit) {
                // Artificial wrapper to add UI elements to
                const wrapper = viewWriter.createContainerElement(
                    modelItem.name === inlinePluginSchema ? 'span' : 'div'
                );
                viewWriter.insert( viewWriter.createPositionAt( wrapper, 0 ), plugin );
                return wrapper;
            }
            return plugin;
        }
    }
}
