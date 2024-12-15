extension-text-ckeditor5
========================

|pypi| |djangocms| |djangocms4|

djangocms-text-ckeditor5 is an extension to ``djangocms-text`` offering CKEditor5 as
a rich text editor to djangocms-text.

Features
--------

- **CKEditor5**: Look and feel of CKEditor5.
- **Inline exiting**: CKEditor5 supports inline editing.
- **Dynamic HTML attributes**: (not yet supported - help needed)
- **Text-enabled plugins**: (not yet supported - help needed)


Installation
------------

Install ``djangocms-text-ckeditor5`` using pip:
``pip install git+https://github.com/django-cms/djangocms-text-ckeditor5``.

Build latest development branch using git:

.. code-block:: bash

    git clone git@github.com:django-cms/djangocms-text-ckeditor5.git
    cd djangocms-text-ckeditor5
    nvm use
    npm install
    npx webpack --mode development

You then can install the cloned repo using ``pip install -e
/path/to/the/repo/djangocms-text-ckeditor5``.

Finally, add ``djangocms_text_ckeditor5`` to your ``INSTALLED_APPS`` in your Django project
settings:

.. code-block:: python

    INSTALLED_APPS = [..., "djangocms_text_ckeditor5", ...]

Add an editor frontend to your installed apps (if different from the
default TipTap frontend), and set the editor you want to use:

.. code-block:: python

    INSTALLED_APPS = [..., "djangocms_text_ckeditor5", ...]
    TEXT_EDITOR = "djangocms_text_ckeditor5.ckeditor5"


Contributing
------------

Contributions to djangocms-text-ckeditor5 are welcome! Please read our contributing guidelines
to get started.

License
-------

The CKEditor 5 and this package are licensed under the GPL-2.0 License.

.. |pypi| image:: https://img.shields.io/pypi/v/extension-text-ckeditor5
   :target: https://pypi.org/project/extension-text-ckeditor5/

.. |djangocms| image:: https://img.shields.io/badge/django--cms-3.11+-blue
   :target: https://pypi.org/project/djangocms/

.. |djangocms4| image:: https://img.shields.io/badge/django--cms-4-blue
