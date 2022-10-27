module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/react'],
  plugins: [
    [
      'import',
      {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: 'css'
      }
    ]
  ],
  retainLines: true
};
