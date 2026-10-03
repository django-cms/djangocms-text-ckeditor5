const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {loaders} = require('@ckeditor/ckeditor5-dev-utils');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');


// Everything is emitted below the app's static directory, so the public path
// the bundle computes from its own URL also locates the translation chunks.
const distribution = path.resolve(
    __dirname, 'djangocms_text_ckeditor5/static/djangocms_text_ckeditor5'
);

// `ckeditor5/translations/*` cannot be used in a dynamic import: webpack has to
// resolve the directory, which the package's `exports` field does not expose.
const translations = path.join(
    path.dirname(require.resolve('ckeditor5/package.json')), 'dist', 'translations'
);

module.exports = {
    resolve: {
        alias: {'ckeditor5-translations': translations},
    },
    entry: {
        ckeditor5: './private/js/cms.ckeditor5.js',
    },
    plugins: [
        // Source maps for everything but the translation chunks, which are
        // generated data and would double their size on disk for nothing.
        new webpack.SourceMapDevToolPlugin({
            filename: '[file].map',
            exclude: /translations/,
        }),
        new MiniCssExtractPlugin({
            filename: 'css/bundle.[name].min.css',
        }),
    ],
    module: {
        rules: [
            {
                test: /skin\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /content\.css$/i,
                use: ['css-loader'],
            },
            {
                test: /ckeditor5[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
                use: ['raw-loader']
            },
            // Inject CKE5's theme CSS via style-loader. Matches the meta package's
            // dist/ckeditor5*.css bundle (v44+) and the legacy per-package theme/
            // paths (used by older CKE5 features).
            {
                ...loaders.getStylesLoader({
                    themePath: require.resolve('@ckeditor/ckeditor5-theme-lark'),
                    minify: true,
                }),
                test: /(ckeditor5[/\\](dist[/\\])?[^/\\]+\.css|ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css)$/,
            },
            {
                test: /\.css$/,
                exclude: /ckeditor5.*\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.(s[ac]ss)$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },

            // {
            //     test: /\.js$/,
            //     use: [{
            //         loader: 'babel-loader',
            //         options: {
            //             presets: ['es2015']
            //         }
            //     }],
            // },
            // {
            //     test: /\.ts$/,
            //     use: [{
            //         loader: 'ts-loader',
            //         options: {
            //             compilerOptions: {
            //                 declaration: false,
            //                 target: 'es5',
            //                 module: 'commonjs'
            //             },
            //             transpileOnly: true
            //         }
            //     }]
            // },
            // {
            //     test: /\.svg$/,
            //     use: [{
            //         loader: 'html-loader',
            //         options: {
            //             minimize: true
            //         }
            //     }]
            // }
        ]
    },
    optimization: {
        minimizer: [new CssMinimizerPlugin()],
    },

    output: {
        path: distribution,
        filename: 'bundles/bundle.[name].min.js',
        // One chunk per language, fetched on demand by cms.ckeditor5.language.js.
        chunkFilename: 'bundles/bundle.ckeditor5.[name].js',
        // Resolved at runtime from the bundle's own URL, see cms.ckeditor5.js.
        // webpack's `auto` is not used: it throws when it cannot find the script.
        publicPath: '',
    },
    mode: 'production',
    // By default, webpack logs warnings if the bundle is bigger than 200kb.
    performance: {hints: false}
};
