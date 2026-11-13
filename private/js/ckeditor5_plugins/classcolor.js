import { Command, Plugin } from '@ckeditor/ckeditor5-core';
import { CKEditorError, Collection, priorities } from '@ckeditor/ckeditor5-utils';
import { addListToDropdown, createDropdown, UIModel, View } from '@ckeditor/ckeditor5-ui';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';

const palettes = new WeakMap();

// Both menus use the same conversion and command behavior, with independent
// model attributes so changing one color never clears the other.
export function createClassColorPlugins({
    attribute, inlineAttribute, configName, defaultColors, pluginName,
    label, removeLabel, icon, swatchClass,
}) {
    const ATTRIBUTE = attribute;
    class ClassColorCommand extends Command {
        constructor(editor, colors) {
            super(editor);
            this.colors = colors;
        }

        refresh() {
            const {model} = this.editor;
            this.value = model.document.selection.getAttribute(ATTRIBUTE);
            this.isEnabled = model.schema.checkAttributeInSelection(model.document.selection, ATTRIBUTE);
        }

        execute({value = null} = {}) {
            if (value !== null && !Object.hasOwn(this.colors, value)) {
                return;
            }
            const {model} = this.editor;
            const {selection} = model.document;
            model.change(writer => {
                let ranges = selection.getRanges();
                if (selection.isCollapsed) {
                    // Match Tiptap: update the whole colored section at a caret,
                    // including native inline colors, without moving the caret.
                    // Read the existing attributes before changing typing attributes.
                    const rangeAttribute = selection.hasAttribute(ATTRIBUTE) ? ATTRIBUTE : inlineAttribute;
                    const current = selection.getAttribute(rangeAttribute);
                    if (current !== undefined) {
                        ranges = [findAttributeRange(selection.getFirstPosition(), rangeAttribute, current, model)];
                    } else {
                        ranges = [];
                    }
                    writer.removeSelectionAttribute(inlineAttribute);
                    if (value) {
                        writer.setSelectionAttribute(ATTRIBUTE, value);
                    } else {
                        writer.removeSelectionAttribute(ATTRIBUTE);
                    }
                }
                for (const range of model.schema.getValidRanges(ranges, ATTRIBUTE)) {
                    // Inline colors would override the class's stylesheet rule.
                    writer.removeAttribute(inlineAttribute, range);
                    if (value) {
                        writer.setAttribute(ATTRIBUTE, value, range);
                    } else {
                        writer.removeAttribute(ATTRIBUTE, range);
                    }
                }
            });
        }
    }

    class ColorEditing extends Plugin {
        static get pluginName() {
            return `${pluginName}Editing`;
        }

        init() {
            const {editor} = this;
            // A configured palette replaces the defaults.
            const configured = editor.config.get(configName) ?? defaultColors;
            this.colors = Object.fromEntries(Object.entries(configured).filter(
                ([name, definition]) => name && !/\s/.test(name) && typeof definition?.name === 'string'
            ));
            // Content saved with the default palette keeps its classes when a site
            // configures its own: they are still read and written, just not offered.
            const known = [...new Set([...Object.keys(this.colors), ...Object.keys(defaultColors)])];
            // A shared class cannot be removed independently for text/background.
            // Include preserved defaults, since those are also recognized on import.
            if (!palettes.has(editor)) palettes.set(editor, new Map());
            const registered = palettes.get(editor);
            for (const [otherConfig, classes] of registered) {
                const overlap = known.find(name => classes.has(name));
                if (overlap) {
                    throw new CKEditorError('cms-class-color-overlapping-palettes', editor, {
                        className: overlap, palettes: [otherConfig, configName],
                    });
                }
            }
            registered.set(configName, new Set(known));
            editor.model.schema.extend('$text', {allowAttributes: ATTRIBUTE});
            editor.model.schema.setAttributeProperties(ATTRIBUTE, {
                isFormatting: true,
                copyOnEnter: true,
            });
            editor.conversion.for('upcast').add(dispatcher => {
                dispatcher.on('element', (event, data, api) => {
                    const name = known.find(name => data.viewItem.hasClass(name));
                    if (!name || !api.consumable.test(data.viewItem, {classes: [name]})) return;
                    if (!data.modelRange) {
                        Object.assign(data, api.convertChildren(data.viewItem, data.modelCursor));
                    }
                    for (const node of Array.from(data.modelRange.getItems())) {
                        if (api.schema.checkAttribute(node, ATTRIBUTE) && !node.hasAttribute(ATTRIBUTE)) {
                            api.writer.setAttribute(ATTRIBUTE, name, node);
                        }
                    }
                    // Consume only the class. Consuming the element name here would
                    // suppress other features, e.g. bold on <strong class="...">.
                    api.consumable.consume(data.viewItem, {classes: [name]});
                }, {priority: priorities.low + 3});
            });
            editor.conversion.for('downcast').attributeToElement({
                model: ATTRIBUTE,
                view: (value, {writer}) => writer.createAttributeElement('span', {class: value}, {priority: 7}),
            });
            editor.commands.add(ATTRIBUTE, new ClassColorCommand(editor, this.colors));
        }
    }

    class ColorUI extends Plugin {
        static get pluginName() {
            return pluginName;
        }

        static get requires() {
            return [ColorEditing];
        }

        init() {
            const {editor} = this;
            const colors = editor.plugins.get(ColorEditing).colors;
            const command = editor.commands.get(ATTRIBUTE);
            editor.ui.componentFactory.add(ATTRIBUTE, locale => {
                const dropdown = createDropdown(locale);
                dropdown.buttonView.set({
                    label: editor.t(label),
                    icon,
                    tooltip: true,
                    isToggleable: true,
                });
                dropdown.bind('isEnabled').to(command, 'isEnabled');

                const items = new Collection();
                for (const [value, definition] of [[null, {name: editor.t(removeLabel)}], ...Object.entries(colors)]) {
                    const model = new UIModel({
                        label: definition.name,
                        withText: true,
                        isToggleable: true,
                        commandParam: value,
                    });
                    model.bind('isOn').to(command, 'value', current => (current || null) === value);
                    items.add({type: 'button', model});
                }
                addListToDropdown(dropdown, items, {ariaLabel: editor.t(label)});

                // addListToDropdown builds its views lazily, before this listener.
                // Use a real classed span so the site's own CSS paints the preview.
                dropdown.once('change:isOpen', () => {
                    for (const item of dropdown.listView.items) {
                        const button = item.children.first;
                        if (!button.commandParam) continue;
                        const preview = new View(locale);
                        preview.setTemplate({
                            tag: 'span',
                            attributes: {
                                class: ['cms-class-color-swatch', swatchClass, 'ck-reset_all-excluded', button.commandParam],
                                'aria-hidden': 'true',
                            },
                            children: [{text: 'A'}],
                        });
                        button.children.add(preview, 0);
                    }
                });
                this.listenTo(dropdown, 'execute', event => {
                    const value = event.source.commandParam;
                    editor.execute(ATTRIBUTE, {value: value === command.value ? null : value});
                    editor.editing.view.focus();
                });
                return dropdown;
            });
        }
    }

    return {Editing: ColorEditing, UI: ColorUI};
}
