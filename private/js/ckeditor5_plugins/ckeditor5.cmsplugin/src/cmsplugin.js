/**
 * @module userstyle/userstyle
 */

import { Plugin } from '@ckeditor/ckeditor5-core';

import CMSPluginUI from "./cmspluginui";
import CMSPluginEditing from "./cmspluginediting";


/**
 * Glue plugin that loads the CMS plugin editing and UI plugins.
 */

export default class CMSPlugin extends Plugin {
    static get requires() {
        return [ CMSPluginEditing, CMSPluginUI ];
    }
}
