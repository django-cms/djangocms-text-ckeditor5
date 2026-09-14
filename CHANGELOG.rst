=========
Changelog
=========

0.48.2 (unreleased)
===================

* fix: Do not put toolbar items into the CKEditor 5 toolbar that have no
  counterpart in CKEditor 5 (``BlockStyles``, ``InlineStyles``,
  ``InlineQuote``, ``cmswidget``, buttons for CMS plugins that are not
  installed). They made CKEditor 5 log ``toolbarview-item-unavailable``.
* fix: Map ``TextColor`` and ``BGColor`` to the CKEditor 5 font color
  components and add the ``Highlight`` plugin to the build, so the default
  toolbar's color buttons work.
* fix: Show the format dropdown in the classic (modal) editor again -- the
  ``Format`` toolbar item was silently dropped.
* fix: Translate the editor user interface. Translations are loaded on demand
  for the active Django language.
* feat: Allow ``shouldNotGroupWhenFull`` in ``TEXT_EDITOR_SETTINGS`` and accept
  the ``{"items": [...]}`` object form of a toolbar configuration.

0.48.1 (2026-09-14)
===================

* feat: Honor djangocms-text's ``bodyClass`` setting by applying the class names
  to the editing root element

0.48.0 (2026-04-26)

* feat: Add full support for text-enabled CMS plugins
* chore: Switch versioning to x.<ckeditor-version>.y

0.2.6 (2025-06-17)
==================
* fix: Link dialog raised JS exception when saving

0.2.5 (2025-06-14)
==================
* feat: Add support to view text-enabled plugins
* feat: Add support for CKEditor style plugin

0.2.0 (2024-12-12)
==================

* feat: Add dynamic links to Text plugins and HTMLFields with CKEditor 5

0.1.0 (2024-12-16)
==================

* Initial build
