const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {loaders} = require('@ckeditor/ckeditor5-dev-utils');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');


const distribution = {
    ckeditor5: 'djangocms_text_ckeditor5/static/djangocms_text_ckeditor5/',
};

module.exports = {
    entry: {
        ckeditor5: './private/js/cms.ckeditor5.js',
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: (pathData) => {
                return distribution[pathData.chunk.name] + 'css/bundle.' + pathData.chunk.name + '.min.css';
            },
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
        path: path.resolve(__dirname, ''),
        filename: (pathData) => {
            return distribution[pathData.chunk.name] + 'bundles/bundle.' + pathData.chunk.name + '.min.js';
        }
    },
    mode: 'production',
    devtool: 'source-map',
    // By default, webpack logs warnings if the bundle is bigger than 200kb.
    performance: {hints: false}
};
