const micro = require('micro')
const { parse } = require('url')
const querystring = require('querystring')

module.exports = async (req, res) => {
  const url = await parse(req.url)
  const query = await querystring.parse(url.query)
  micro.send(res, 200, query)
}