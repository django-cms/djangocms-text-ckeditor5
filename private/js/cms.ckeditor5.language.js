/**
 * @module cms.ckeditor5.language
 *
 * Maps Django language codes onto the CKEditor 5 translation files. Kept free
 * of CKEditor 5 imports so it can be unit tested under plain Node.
 */

/* eslint-env es11 */
/* jshint esversion: 11 */

// Django language codes that do not match CKEditor 5's translation file names.
export const LANGUAGE_ALIASES = {
    'zh-hans': 'zh-cn',
    'zh-hant': 'zh',
    'zh-tw': 'zh',
    nn: 'no',
};

/**
 * Returns the UI language of an editor config's `language` entry, which may be
 * a plain string or the `{ui, content}` object form.
 *
 * @param {string|Object|undefined} language
 * @returns {string}
 */
export function uiLanguage(language) {
    if (typeof language === 'string') {
        return language;
    }
    if (language && typeof language === 'object') {
        return language.ui || language.content || '';
    }
    return '';
}

/**
 * Translation file names to try for a given language code, most specific first:
 * an explicit alias, the code itself, and the bare language part of a regional
 * code (so `de-at` falls back to `de`). English is the source language of the
 * bundle and therefore never needs a translation file.
 *
 * @param {string|Object|undefined} language
 * @returns {Array<string>}
 */
export function translationCandidates(language) {
    const code = uiLanguage(language).toLowerCase().replace(/_/g, '-');
    if (!code || code === 'en') {
        return [];
    }
    const base = code.split('-')[0];
    return [...new Set([LANGUAGE_ALIASES[code], code, LANGUAGE_ALIASES[base], base])]
        .filter((candidate) => candidate && candidate !== 'en');
}
