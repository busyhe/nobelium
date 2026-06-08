const config = require('../../blog.config')

// If we need to stripe out some private fields
const { notionAccessToken, ...clientConfig } = config

module.exports = {
  config,
  clientConfig
}
