import { IconFontColor } from '@ckeditor/ckeditor5-icons';
import { createClassColorPlugins } from '../classcolor.js';

// Keep these classes and labels in sync with djangocms-text's TextColor mark.
const DEFAULT_COLORS = {
    'text-primary': {name: 'Primary'},
    'text-secondary': {name: 'Secondary'},
    'text-success': {name: 'Success'},
    'text-danger': {name: 'Danger'},
    'text-warning': {name: 'Warning'},
    'text-info': {name: 'Info'},
    'text-light': {name: 'Light'},
    'text-dark': {name: 'Dark'},
    'text-body': {name: 'Body'},
    'text-muted': {name: 'Muted'},
};

const {Editing, UI} = createClassColorPlugins({
    attribute: 'cmsTextColor',
    inlineAttribute: 'fontColor',
    configName: 'textColors',
    defaultColors: DEFAULT_COLORS,
    pluginName: 'CMSTextColor',
    label: 'Text color',
    removeLabel: 'Remove color',
    icon: IconFontColor,
    swatchClass: 'cms-text-color-swatch',
});

export {Editing as CMSTextColorEditing};
export default UI;
