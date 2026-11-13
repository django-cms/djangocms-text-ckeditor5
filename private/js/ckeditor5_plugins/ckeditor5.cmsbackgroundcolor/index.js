import { IconFontBackground } from '@ckeditor/ckeditor5-icons';
import { createClassColorPlugins } from '../classcolor.js';

const DEFAULT_COLORS = {
    'bg-primary': {name: 'Primary'},
    'bg-secondary': {name: 'Secondary'},
    'bg-success': {name: 'Success'},
    'bg-danger': {name: 'Danger'},
    'bg-warning': {name: 'Warning'},
    'bg-info': {name: 'Info'},
    'bg-light': {name: 'Light'},
    'bg-dark': {name: 'Dark'},
    'bg-body': {name: 'Body'},
    'bg-transparent': {name: 'Transparent'},
};

const {Editing, UI} = createClassColorPlugins({
    attribute: 'cmsBackgroundColor',
    inlineAttribute: 'fontBackgroundColor',
    configName: 'backgroundColors',
    defaultColors: DEFAULT_COLORS,
    pluginName: 'CMSBackgroundColor',
    label: 'Background color',
    removeLabel: 'Remove background color',
    icon: IconFontBackground,
    swatchClass: 'cms-background-color-swatch',
});

export {Editing as CMSBackgroundColorEditing};
export default UI;
