django CMS text CKEditor 5
==========================

|pypi| |djangocms|

djangocms-text-ckeditor5 is an extension to ``djangocms-text`` offering CKEditor5 as
a rich text editor to djangocms-text.

Features
--------

- **CKEditor 5**: Look and feel of CKEditor 5.
- **Inline editing**: CKEditor 5 supports inline editing.
- **Dynamic HTML attributes**: Supported for the Link plugin.
- **CMS plugin embedding**: Add CMS plugins from the editor toolbar
  ("CMS Plugins" dropdown, plus optional dedicated buttons for plugins
  with their own icon) and double-click an embedded plugin to edit it
  in place.
- **Translated user interface**: The CKEditor 5 UI follows the language of
  the django CMS admin.


Installation
------------

Install ``djangocms-text-ckeditor5`` using pip:

.. code-block:: bash

    pip install djangocms-text-ckeditor5

Build latest development branch using git:

.. code-block:: bash

    git clone git@github.com:django-cms/djangocms-text-ckeditor5.git
    cd djangocms-text-ckeditor5
    nvm use
    npm install
    npm run build:dev          # or `npm run build` for a production bundle
    npm test                   # Node's built-in test runner

You then can install the cloned repo using ``pip install -e
/path/to/the/repo/djangocms-text-ckeditor5``.

Finally, add ``djangocms_text_ckeditor5`` in addition to ``djangocms_text`` to
your ``INSTALLED_APPS`` in your Django project settings:

.. code-block:: python

    INSTALLED_APPS = [
        ...,
        "djangocms_text",
        "djangocms_text_ckeditor5",
        ...
    ]

and set the editor you want to use:

.. code-block:: python

    TEXT_EDITOR = "djangocms_text_ckeditor5.ckeditor5"


Configuration
-------------

The editor reads ``TEXT_EDITOR_SETTINGS`` from ``djangocms-text``. Its toolbar
uses the CKEditor 4 item names shared by all ``djangocms-text`` editors; they
are translated to the matching CKEditor 5 components (``Table`` becomes
``insertTable``, ``TextColor`` becomes ``cmsTextColor``, and so on). Items that
CKEditor 5 has no counterpart for -- ``Unlink``, ``Maximize``,
``PasteFromWord``, ``InlineQuote``, ... -- are dropped, as are buttons for CMS
plugins that are not installed. CKEditor 5 component names can be used
directly as well.

Toolbar items are grouped into a dropdown once the toolbar runs out of space.
To lay them out in several rows instead, set ``shouldNotGroupWhenFull``:

.. code-block:: python

    TEXT_EDITOR_SETTINGS = {
        "shouldNotGroupWhenFull": True,
    }

The user interface language follows the active Django language. The
translations ship with the package and are loaded on demand, so only the
language actually in use is transferred. A regional code falls back to its
base language (``de-at`` uses the German translation); languages CKEditor 5
does not translate stay in English.

Class-based text colors
----------------------

The ``TextColor`` toolbar item uses the same class-based palette as
djangocms-text's Tiptap editor. Choosing a color writes, for example,
``<span class="text-primary">...</span>``. Choosing the active color again,
or choosing ``Remove color``, removes it. With the caret inside colored text,
the choice applies to that whole colored section. Undo and redo are supported.

The default classes are ``text-primary``, ``text-secondary``, ``text-success``,
``text-danger``, ``text-warning``, ``text-info``, ``text-light``, ``text-dark``,
``text-body``, and ``text-muted``. Replace this palette using ``textColors``:

.. code-block:: python

    TEXT_EDITOR_SETTINGS = {
        "textColors": {
            "brand-ink": {"name": "Brand ink"},
            "brand-accent": {"name": "Brand accent"},
        },
    }

Define the classes in your site's CSS and load that CSS in the editor too.
Menu previews use these same classes; the plugin does not supply color values.
Configured color classes are recognized on existing spans and other HTML
elements. Applying a class clears any inline text color on the selection so
the class can take effect. Existing inline colors remain supported by
CKEditor's native ``fontColor`` toolbar item, which can be configured separately.

Class-based background colors
-----------------------------

The ``BGColor`` toolbar item (``cmsBackgroundColor`` in CKEditor 5) applies
background classes with the same preview, toggle, removal, and undo behavior.
Text and background colors are independent, so either can be changed or removed
without clearing the other. Applying a background class clears an existing
inline background color on the selection.

The default palette contains ``bg-primary``, ``bg-secondary``, ``bg-success``,
``bg-danger``, ``bg-warning``, ``bg-info``, ``bg-light``, ``bg-dark``, ``bg-body``,
and ``bg-transparent``. Replace it using ``backgroundColors``:

.. code-block:: python

    TEXT_EDITOR_SETTINGS = {
        "backgroundColors": {
            "brand-fill": {"name": "Brand fill"},
            "brand-subtle": {"name": "Brand subtle"},
        },
    }

Define these background classes in CSS loaded by both the site and the editor.
For example, ``.brand-fill { background-color: #ffe599; }`` produces
``<span class="brand-fill">...</span>`` when selected. The native
``fontBackgroundColor`` toolbar item remains available for inline colors.

Activating the legacy color palettes
-----------------------------------

To use CKEditor's original palettes that write inline ``color`` and
``background-color`` styles, replace ``TextColor`` with ``fontColor`` and
``BGColor`` with ``fontBackgroundColor`` in your toolbar configuration:

.. code-block:: python

    TEXT_EDITOR_SETTINGS = {
        "toolbar": [
            ["Undo", "Redo"],
            ["Bold", "Italic", "Link"],
            ["fontColor", "fontBackgroundColor"],
        ],
    }

This example replaces the default toolbar; include any other toolbar items you
want to keep. The native plugins are already included, so no additional plugin
installation is needed. Their palettes use CKEditor's ``fontColor`` and
``fontBackgroundColor`` settings; ``textColors`` and ``backgroundColors``
configure the class-based tools only.

Styling the editor content
--------------------------

CKEditor 5 has no editing ``<iframe>``: it edits a ``contenteditable`` element
in the surrounding document, so in a modal or any admin page the admin's stylesheets
apply to the content being edited.

To scope your own content styles, use djangocms-text's ``bodyClass`` mechanism.
Give a plugin a ``child_ckeditor_body_css_class`` attribute (or a
``get_child_ckeditor_body_css_class()`` method) and every text plugin nested
below it gets those class names on the editing root:

.. code-block:: python

    class DarkSectionPlugin(CMSPluginBase):
        child_ckeditor_body_css_class = "dark-section"

.. code-block:: css

    .ck-editor__editable.dark-section {
        background: #222;
        color: #eee;
    }

A global default for every text plugin can be set through the ``bodyClass`` key
of ``TEXT_EDITOR_SETTINGS`` (or of the dict named by ``TEXT_CONFIGURATION``, if
you use one). Classes contributed by parent plugins take precedence over it.

Versioning
----------

The minor version of ``djangocms-text-ckeditor5`` reflects the major version of
CKEditor 5 included in the package. For example, ``djangocms-text-ckeditor5
0.48.x`` includes CKEditor 5 version 48.x.

Contributing
------------

Contributions to djangocms-text-ckeditor5 are welcome! Please read our contributing guidelines
to get started.

License
-------

The CKEditor 5 and this package are licensed under the GPL-2.0 License.

.. |pypi| image:: https://badge.fury.io/py/djangocms-text-ckeditor5.svg
    :target: https://badge.fury.io/py/djangocms-text-ckeditor5
.. |djangocms| image:: https://img.shields.io/pypi/frameworkversions/django-cms/djangocms-text-ckeditor5
    :alt: PyPI - django CMS Versions from Framework Classifiers
    :target: https://www.django-cms.org/
