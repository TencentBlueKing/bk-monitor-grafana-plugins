/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const ExtractTextPluginLight = new ExtractTextPlugin('./css/grafana-monitor.light.css');
const ExtractTextPluginAntdLight = new ExtractTextPlugin('./css/grafana-antd.light.css');
const ExtractTextPluginDark = new ExtractTextPlugin('./css/grafana-monitor.dark.css');
const ExtractTextPluginAntdDark = new ExtractTextPlugin('./css/grafana-antd.dark.css');

const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const resolve = dir => path.join(__dirname, '..', dir);

module.exports = {
  target: 'node',
  context: resolve('src'),
  entry: {
    module: './module.ts',
  },
  output: {
    filename: '[name].js',
    path: resolve('dist'),
    libraryTarget: 'amd',
  },
  externals: [
    'react',
    'react-dom',
    '@grafana/ui',
    '@grafana/data',
    '@grafana/runtime',
    (context, request, callback) => {
      const prefix = 'grafana/';
      if (request.indexOf(prefix) === 0) {
        return callback(null, request.substr(prefix.length));
      }
      callback();
    },
  ],
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new CopyWebpackPlugin([{ from: '**/plugin.json' }, { from: '../README.md' }, { from: '**/img/*' }]),
    new CleanWebpackPlugin(['dist'], {
      root: resolve('.'),
    }),
    ExtractTextPluginLight,
    ExtractTextPluginDark,
    ExtractTextPluginAntdLight,
    ExtractTextPluginAntdDark,
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorPluginOptions: {
        preset: ['default', { discardComments: { removeAll: true } }],
      },
      canPrint: true,
    }),
  ],
  resolve: {
    extensions: ['.js', '.es6', '.ts', '.tsx', '.html', '.scss', '.less'],
  },
  module: {
    rules: [
      {
        test: /\.(j|t)sx?$/,
        exclude: /node_modules|external/,
        loaders: ['ts-loader'],
      },
      {
        test: /\.html$/,
        use: {
          loader: 'html-loader',
        },
      },
      {
        test: /\.light\.scss$/,
        use: ExtractTextPluginLight.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader'],
        }),
      },
      {
        test: /\.dark\.scss$/,
        use: ExtractTextPluginDark.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader'],
        }),
      },
      {
        test: /\.light\.less$/,
        use: ExtractTextPluginAntdLight.extract({
          fallback: 'style-loader',
          use: [
            'css-loader',
            {
              loader: 'less-loader',
              options: {
                modifyVars: {
                  hack: 'true; @import "./custom-antd-theme.less";',
                },
                javascriptEnabled: true,
              },
            },
          ],
        }),
      },
      {
        test: /\.dark\.less$/,
        use: ExtractTextPluginAntdDark.extract({
          fallback: 'style-loader',
          use: [
            'css-loader',
            {
              loader: 'less-loader',
              options: {
                modifyVars: {
                  hack: 'true; @import "./custom-antd-theme.less";',
                },
                javascriptEnabled: true,
              },
            },
          ],
        }),
      },
    ],
  },
};
