const micro = require("micro")
const http = require('http')
const test = require('ava')
const listen = require('test-listen')
const request = require('request-promise')
const api = require("./index.js")

test('test', async t => {
  const service = new http.Server(micro(async (req, res) => {
    req.method = 'GET'
    req.url = 'https://example.org/?command=go' 
    api(req, res)
  }))
  
  const url = await listen(service)
  const body = JSON.parse(await request(url))

  t.is(body.command, 'go', JSON.stringify(body))
  service.close()
})