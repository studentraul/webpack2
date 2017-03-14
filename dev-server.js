const WebPackDevServer = require('webpack-dev-server')
const webpack = require('webpack')
const config = require('./webpack.config.js')

const compiler = webpack(config)
const server = new WebPackDevServer(compiler, {
  hot: true,
  filename: config.output.filename,
  publicPath: config.output.publicPath,
  stats: {
    colors: true
  }
})
server.listen(8080, 'localhost', () => {})
