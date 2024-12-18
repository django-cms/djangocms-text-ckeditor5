from djangocms_text.editors import RTEConfig


__version__ = "0.2.0"


ckeditor5 = RTEConfig(
    name="ckeditor5",
    config="CKEDITOR5",
    js=("djangocms_text_ckeditor5/bundles/bundle.ckeditor5.min.js",),
    css={
        "all": (
            "djangocms_text_ckeditor5/css/cms.ckeditor5.css",
            "djangocms_text_ckeditor5/css/cms.linkfield.css",
        )
    },
    inline_editing=True,
)
