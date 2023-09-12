/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
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
module.exports = {
  extends: ['stylelint-config-recess-order'],
  overrides: [
    {
      customSyntax: 'postcss-scss',
      files: ['*.scss', '*.css', './**/*.scss']
    }
  ],
  plugins: ['stylelint-scss', 'stylelint-order'],
  rules: {
    'at-rule-empty-line-before': [
      'always',
      {
        except: ['first-nested', 'blockless-after-blockless'],
        ignore: ['after-comment']
      }
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['/.*/']
      }
    ],
    'at-rule-no-vendor-prefix': true,
    'block-opening-brace-space-before': 'always',
    // 颜色值要小写
    'color-hex-case': 'lower',
    // 颜色值能短则短
    'color-hex-length': 'short',
    'comment-empty-line-before': ['always', { except: ['first-nested'] }],
    'declaration-block-single-line-max-declarations': 1,
    'declaration-colon-space-after': 'always',
    'declaration-colon-space-before': 'never',
    // 不能用important
    'declaration-no-important': true,
    // Base rules
    indentation: 2,
    // Sass rules
    'max-nesting-depth': 10,
    // 不要使用已被 autoprefixer 支持的浏览器前缀
    'media-feature-name-no-vendor-prefix': true,

    'number-leading-zero': 'never',
    'order/order': ['declarations', { type: 'at-rule' }, { hasBlock: true, type: 'at-rule' }, 'rules'],
    'property-no-vendor-prefix': true,
    // 去掉多个import、extends、父子声明之间的空行 --开始
    'rule-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['after-comment']
      }
    ],
    'scss/at-extend-no-missing-placeholder': true,
    'scss/dollar-variable-pattern': '^_?[a-z]+[\\w-]*$',
    'selector-list-comma-newline-after': 'always',
    'selector-max-id': 3,
    'selector-no-vendor-prefix': true,
    'string-quotes': 'single',
    'value-no-vendor-prefix': true
  }
};
