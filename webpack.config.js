const path = require('path')
const webpack = require('webpack')

const PRODUCTION = process.env.NODE_ENV === 'production'
const DEVELOPMENT = process.env.NODE_ENV === 'development'

const entry = PRODUCTION
  ? ['./src/index.js']
  : ['./src/index.js', 'webpack/hot/dev-server', 'webpack-dev-server/client?http://localhost:8080']

const plugins = PRODUCTION
  ? [
    new webpack
      .optimize
      .UglifyJsPlugin()
  ]
  : [new webpack.HotModuleReplacementPlugin()]

plugins.push(new webpack.DefinePlugin({
  PRODUCTION: JSON.stringify(PRODUCTION),
  DEVELOPMENT: JSON.stringify(DEVELOPMENT)
}))

const cssIdentifier = PRODUCTION
  ? '[hash:base64:10]'
  : '[path][name]---[local]'

module.exports = {
  devtool: 'source-map',
  entry: entry,
  plugins: plugins,
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: '/node_modules/'
      }, {
        test: /\.(png|jpg|gif)$/,
        loaders: ['url-loader?limit=12000&name=images/[hash:12].[ext]'],
        exclude: '/node_modules/'
      }, {
        test: /\.css$/,
        loaders: [
          'style-loader', 'css-loader?localIdentName=' + cssIdentifier
        ],
        exclude: '/node_modules/'
      }
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: 'bundle.js'
  }
}
