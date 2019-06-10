const micro = require("micro")
const http = require('http')
const test = require('ava')
const listen = require('test-listen')
const request = require('request-promise')
const api = require("./index.js")

test('test_valid_command', async t => {
  const service = new http.Server(micro(async (req, res) => {
    req.method = 'GET'
    req.headers.API_KEY = process.env.API_KEY
    req.url = 'https://example.org/?command=test' 
    api(req, res)
  }))
  
  const url = await listen(service)
  const body = JSON.parse(await request(url))

  t.is(body.success, true, JSON.stringify(body))
  service.close()
})

test('test_unknown_command', async t => {
  const service = new http.Server(micro(async (req, res) => {
    req.method = 'GET'
    req.headers.API_KEY = process.env.API_KEY
    req.url = 'https://example.org/?command=dogshirt' 
    api(req, res)
  }))
  
  const url = await listen(service)
  await request(url)
    .then(response => {
      t.fail('Test should have errored');
    })
    .catch(response => {
      const body = JSON.parse(response.error)
      t.is(body.success, false, JSON.stringify(body))
      service.close()
    })
})

test('test_connectdb', async t => {
  const service = new http.Server(micro(async (req, res) => {
    req.method = 'GET'
    req.headers.API_KEY = process.env.API_KEY
    req.url = 'https://example.org/?command=connectdb' 
    api(req, res)
  }))
  
  const url = await listen(service)
  const body = JSON.parse(await request(url))

  t.is(body.success, true, JSON.stringify(body))
  service.close()
})

test('test_createuser', async t => {
  const service = new http.Server(micro(async (req, res) => {
    req.method = 'POST'
    req.headers.API_KEY = process.env.API_KEY
    req.url = 'https://example.org/?command=createuser'
    req.body = JSON.stringify({'id':1, 'nick': 'satoshi'});
    api(req, res)
  }))
  
  const url = await listen(service)
  const body = JSON.parse(await request(url))

  t.is(body.success, true, JSON.stringify(body))
  service.close()
})

test('test_unauthorized', async t => {
  const service = new http.Server(micro(async (req, res) => {
    req.method = 'GET'
    req.url = 'https://example.org/?command=test' 
    api(req, res)
  }))
  
  const url = await listen(service)
  await request(url)
    .then(() =>{
      t.fail
    })
    .catch( resp =>{
      const body = JSON.parse(resp.error)
      t.is(body.success, false, JSON.stringify(body))
  })  
  
  service.close()
})
