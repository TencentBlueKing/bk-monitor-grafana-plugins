import CopyWebpackPlugin from 'copy-webpack-plugin';
import LiveReloadPlugin from 'webpack-livereload-plugin';
import path from 'node:path';
import ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type { Configuration } from 'webpack';

import { getPackageJson, getPluginJson, hasReadme, getEntries, isWSL } from './utils';
import { SOURCE_DIR, DIST_DIR } from './constants';
import { getThemeVariables } from 'antd/dist/theme';
import darkVariables from 'common/style/dark/antd-variables';
import lightVariables from 'common/style/light/antd-variables';
const pluginJson = getPluginJson();

const config = async (env): Promise<Configuration> => {
  const baseConfig: Configuration = {
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    },

    context: path.join(process.cwd(), SOURCE_DIR),

    devtool: env.production ? 'source-map' : 'eval-source-map',

    entry: {
      ...(await getEntries()),
      dark: './dark.ts',
      light: './light.ts',
    },

    externals: [
      'lodash',
      'jquery',
      'moment',
      'slate',
      'emotion',
      '@emotion/react',
      '@emotion/css',
      'prismjs',
      'slate-plain-serializer',
      '@grafana/slate-react',
      'react',
      'react-dom',
      'react-redux',
      'redux',
      'rxjs',
      'react-router',
      'react-router-dom',
      'd3',
      'angular',
      '@grafana/ui',
      '@grafana/runtime',
      '@grafana/data',

      // Mark legacy SDK imports as external if their name starts with the "grafana/" prefix
      ({ request }, callback) => {
        const prefix = 'grafana/';
        const hasPrefix = request => request.indexOf(prefix) === 0;
        const stripPrefix = request => request.substr(prefix.length);

        if (hasPrefix(request)) {
          return callback(undefined, stripPrefix(request));
        }

        callback();
      },
    ],

    mode: env.production ? 'production' : 'development',

    module: {
      rules: [
        {
          exclude: /(node_modules)/,
          test: /\.[tj]sx?$/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                baseUrl: path.resolve(__dirname, 'src'),
                target: 'es2015',
                loose: false,
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                  decorators: false,
                  dynamicImport: true,
                },
              },
            },
          },
        },
        {
          test: /.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                additionalData: '$plugin-name: monitor-profiling;',
              },
            },
          ],
        },
        {
          test: /light\.less$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  modifyVars: {
                    ...lightVariables,
                  },
                  javascriptEnabled: true,
                },
              },
            },
          ],
        },
        {
          test: /dark\.less$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  modifyVars: {
                    ...getThemeVariables({
                      dark: true,
                    }),
                    ...darkVariables,
                  },
                  javascriptEnabled: true,
                },
              },
            },
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            publicPath: `public/plugins/${pluginJson.id}/img/`,
            outputPath: 'img/',
            filename: env.production ? '[hash][ext]' : '[file]',
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset/resource',
          generator: {
            publicPath: `public/plugins/${pluginJson.id}/fonts/`,
            outputPath: 'fonts/',
            filename: env.production ? '[hash][ext]' : '[name][ext]',
          },
        },
      ],
    },

    output: {
      clean: {
        keep: /(.*?_(amd64|arm(64)?)(.exe)?|go_plugin_build_manifest)/,
      },
      filename: '[name].js',
      path: path.resolve(process.cwd(), DIST_DIR),
      publicPath: `public/plugins/${pluginJson.id}/`,
      libraryTarget: 'amd',
      uniqueName: pluginJson.id,
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: hasReadme() ? 'README.md' : '../README.md', to: '.', force: true },
          { from: 'plugin.json', to: '.' },
          { from: '../LICENSE', to: '.' },
          { from: '../CHANGELOG.md', to: '.', force: true },
          { from: '**/*.json', to: '.' }, // TODO<Add an error for checking the basic structure of the repo>
          { from: '**/*.svg', to: '.', noErrorOnMissing: true }, // Optional
          { from: '**/*.png', to: '.', noErrorOnMissing: true }, // Optional
          { from: '**/*.html', to: '.', noErrorOnMissing: true }, // Optional
          { from: 'img/**/*', to: '.', noErrorOnMissing: true }, // Optional
          { from: 'libs/**/*', to: '.', noErrorOnMissing: true }, // Optional
          { from: 'static/**/*', to: '.', noErrorOnMissing: true }, // Optional
          { from: '**/query_help.md', to: '.', noErrorOnMissing: true }, // Optional
        ],
      }),
      new ReplaceInFileWebpackPlugin([
        {
          dir: DIST_DIR,
          files: ['plugin.json', 'README.md'],
          rules: [
            {
              search: /\%VERSION\%/g,
              replace: getPackageJson().version,
            },
            {
              search: /\%TODAY\%/g,
              replace: new Date().toISOString().substring(0, 10),
            },
            {
              search: /\%PLUGIN_ID\%/g,
              replace: pluginJson.id,
            },
          ],
        },
      ]),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),
      ...(env.development
        ? [
            new LiveReloadPlugin({
              port: 35734,
            }),
          ]
        : []),
    ],
    optimization: {
      splitChunks: {
        cacheGroups: {
          dark: {
            type: 'css/mini-extract',
            name: 'dark',
            filename: 'dark.css',
            enforce: true,
          },
          light: {
            type: 'css/mini-extract',
            name: 'light',
            filename: 'light.css',
            enforce: true,
          },
        },
      },
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      modules: [path.resolve(process.cwd(), 'src'), 'node_modules'],
      unsafeCache: true,
    },
  };

  if (isWSL()) {
    baseConfig.watchOptions = {
      poll: 3000,
      ignored: /node_modules/,
    };
  }
  return baseConfig;
};

export default config;
