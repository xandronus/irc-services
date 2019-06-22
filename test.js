const micro = require("micro")
const http = require('http')
const test = require('ava')
const listen = require('test-listen')
const request = require('request-promise')
const api = require("./index.js")

test('test_valid_command', async t => {
  const service = new http.Server(micro(async (req, res) => {
    api(req, res)
  }))
  
  var url = await listen(service)
  url += '?command=test'
  var options = {
    method: 'GET',
    uri: url,
    json: true,
    headers: {
      'api_key': process.env.API_KEY
    }
  }  
  const body = await request(options)
  t.is(body.success, true, JSON.stringify(body))
  service.close()
})

test('test_unknown_command', async t => {
  const service = new http.Server(micro(async (req, res) => {
    api(req, res)
  }))

  var url = await listen(service)
  url += '?command=dogshirt'
  var options = {
    method: 'GET',
    uri: url,
    json: true,
    headers: {
      'api_key': process.env.API_KEY
    }
  }

  await request(options)
    .then(response => {
      t.fail('Test should have errored');
    })
    .catch(response => {
      const body = response.error
      t.is(body.success, false, JSON.stringify(body))
      service.close()
    })
})

test('test_connectdb', async t => {
  const service = new http.Server(micro(async (req, res) => {
    api(req, res)
  }))
  
  var url = await listen(service)
  url += '?command=connectdb'
  var options = {
    method: 'GET',
    uri: url,
    json: true,
    headers: {
      'api_key': process.env.API_KEY
    }
  }
  const body = await request(options)

  t.is(body.success, true, JSON.stringify(body))
  service.close()
})

/*
test('test_createuser', async t => {
  const service = new http.Server(micro(async (req, res) => {    
    api(req, res)
  }))
  
  var url = await listen(service)
  url += '?command=createuser'
  var options = {
    method: 'POST',
    uri: url,
    body: {'nick': 'satoshi'},
    json: true,
    headers: {
      'api_key': process.env.API_KEY
    }
  }
  const body = await request(options)

  t.is(body.success, true, JSON.stringify(body))
  service.close()
})
*/

/*
test('test_createmessage', async t => {
  const service = new http.Server(micro(async (req, res) => {    
    api(req, res)
  }))
  
  var url = await listen(service)
  url += '?command=createmessage'
  var options = {
    method: 'POST',
    uri: url,
    body: {
      userid: '5d0e79ecc5273510bd04aaa3',
      text: 'This is a test message 3'
    },
    json: true,
    headers: {
      api_key: process.env.API_KEY
    }
  }
  const body = await request(options)

  t.is(body.success, true, JSON.stringify(body))
  service.close()
})
*/


test('test_getuser', async t => {
  const service = new http.Server(micro(async (req, res) => {    
    api(req, res)
  }))
  
  var url = await listen(service)
  url += '?command=getuser&nick=satoshi'
  var options = {
    method: 'GET',
    uri: url,
    json: true,
    headers: {
      api_key: process.env.API_KEY
    }
  }
  const body = await request(options)

  t.is(body.success, true, JSON.stringify(body))
  service.close()
})


test('test_getmessages', async t => {
  const service = new http.Server(micro(async (req, res) => {    
    api(req, res)
  }))
  
  var url = await listen(service)
  url += '?command=getmessages&after=2019-06-22'
  var options = {
    method: 'GET',
    uri: url,
    json: true,
    headers: {
      api_key: process.env.API_KEY
    }
  }
  const body = await request(options)

  t.is(body.success, true, JSON.stringify(body))
  service.close()
})

test('test_unauthorized', async t => {
  const service = new http.Server(micro(async (req, res) => {
    api(req, res)
  }))
  
  var url = await listen(service)
  url += '?command=test'
  var options = {
    method: 'GET',
    uri: url,
    json: true
  }
  await request(options)
    .then(() =>{
      t.fail
    })
    .catch( resp =>{
      const body = resp.error
      t.is(body.success, false, JSON.stringify(body))
  })  
  
  service.close()
})
