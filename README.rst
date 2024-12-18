extension-text-ckeditor5
========================

|pypi| |djangocms| |djangocms4|

djangocms-text-ckeditor5 is an extension to ``djangocms-text`` offering CKEditor5 as
a rich text editor to djangocms-text.

Features
--------

- **CKEditor5**: Look and feel of CKEditor5.
- **Inline exiting**: CKEditor5 supports inline editing.
- **Dynamic HTML attributes**: Supported for the Link plugin
- **Text-enabled plugins**: (not yet supported - help needed)


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
    npx webpack --mode development

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


Contributing
------------

Contributions to djangocms-text-ckeditor5 are welcome! Please read our contributing guidelines
to get started.

License
-------

The CKEditor 5 and this package are licensed under the GPL-2.0 License.

.. |pypi| image:: https://img.shields.io/pypi/v/djangocms-text-ckeditor5
   :target: https://pypi.org/project/djangocms-text-ckeditor5/

.. |djangocms| image:: https://img.shields.io/badge/django--cms-3.11+-blue
   :target: https://pypi.org/project/djangocms/

.. |djangocms4| image:: https://img.shields.io/badge/django--cms-4-blue
