const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/js/app.js',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/
            }
        ]
    },
    devServer: {
        contentBase: './dist',
        overlay: true,
        hot: true
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                                './src/index.html',
                                {from: './src/css', to: 'css'},
                                {from: './src/img', to: 'img'},
                                {from: './node_modules/startbootstrap-freelancer/dist/js/scripts.js', to: 'vendor/startbootstrap-freelancer/scripts.js'},
                                {from: './node_modules/startbootstrap-freelancer/dist/css/styles.css', to: 'css/freelancer.css'}
             ]
            }
        ),
        
        new webpack.HotModuleReplacementPlugin()
    ]
};