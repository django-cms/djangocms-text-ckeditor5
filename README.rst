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
