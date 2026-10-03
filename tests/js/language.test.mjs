import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import { translationCandidates, uiLanguage } from '../../private/js/cms.ckeditor5.language.js';

describe('uiLanguage', () => {
    it('passes a plain language code through', () => {
        assert.equal(uiLanguage('de'), 'de');
    });

    it('reads the ui key of the object form, falling back to content', () => {
        assert.equal(uiLanguage({ui: 'de', content: 'fr'}), 'de');
        assert.equal(uiLanguage({content: 'fr'}), 'fr');
    });

    it('returns an empty string for missing input', () => {
        assert.equal(uiLanguage(undefined), '');
        assert.equal(uiLanguage(null), '');
        assert.equal(uiLanguage({}), '');
    });
});

describe('translationCandidates', () => {
    it('returns nothing for English or no language', () => {
        assert.deepEqual(translationCandidates('en'), []);
        assert.deepEqual(translationCandidates(''), []);
        assert.deepEqual(translationCandidates(undefined), []);
    });

    it('returns the code itself for a plain language', () => {
        assert.deepEqual(translationCandidates('de'), ['de']);
    });

    it('falls back from a regional code to its base language', () => {
        assert.deepEqual(translationCandidates('de-at'), ['de-at', 'de']);
    });

    it('normalises case and underscores', () => {
        assert.deepEqual(translationCandidates('pt_BR'), ['pt-br', 'pt']);
    });

    it('maps Django script codes onto CKEditor 5 file names', () => {
        assert.deepEqual(translationCandidates('zh-hans'), ['zh-cn', 'zh-hans', 'zh']);
        assert.deepEqual(translationCandidates('zh-hant'), ['zh', 'zh-hant']);
        assert.deepEqual(translationCandidates('nn'), ['no', 'nn']);
    });

    it('never asks for an English translation file', () => {
        assert.deepEqual(translationCandidates('en-gb'), ['en-gb']);
    });

    it('accepts the object form of the language config', () => {
        assert.deepEqual(translationCandidates({ui: 'de'}), ['de']);
    });
});
