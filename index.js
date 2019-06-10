// Environment Variables:
// DB_CONN - connection string to mongoDB
// API_KEY - Api key required in API_KEY header
const micro = require('micro')
const { parse } = require('url')
const querystring = require('querystring')
//const config = require('./config.json')
const mongoose = require('mongoose')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

var userSchema = null 
var messageSchema = null
var textSchema = null

const database = {   
  getModels: async function() {    
    var User = await mongoose.model('User', userSchema)
    var Message = await mongoose.model('Message', messageSchema)
    var Text = await mongoose.model('Text', textSchema)
  
    return {'User': User, 'Message': Message, 'Text': Text}
  },

  connect: async function(onConnected) {
    if (mongoose.connection.readyState != 1) {
      mongoose.connect(process.env.DB_CONN, { useNewUrlParser: true })
        .then(() => {
          database.createSchema()
          onConnected()
        })        
    } else {      
      onConnected()
    }
  },

  createSchema: function() {
    if (!textSchema) {
      textSchema = new mongoose.Schema({
        _id:  String,
        postedby: String,
        date: Date,
        content: [
          { type: String, id: String }
        ]
      })
    }

    if (!messageSchema) {
      messageSchema = new mongoose.Schema({
        _id:  String,
        postedby: String,
        date: Date,
        content: [
          { type: String, id: String }
        ]
      })
    }

    if (!userSchema) {
      userSchema = new mongoose.Schema({
        _id:  String,
        nick: String
      })
    }
  }
}

async function requestTest(option, callback) {
  callback(false, {'success': true, 'message': option})
}

async function requestConnectDb(option, callback) {
  database.connect(async() => {    
     const model = await database.getModels()
     if (model) {
       callback(false, {'success': true, 'message': ''})
     } else {
       callback({'success': false, message: 'Cannot create model.'}, false)
     }
  })
}

async function requestCreateUser(user, callback) {
  database.connect(async() => {
   const model = await database.getModels()
    if (model) {
      var newUser = new model.User({_id: user.id, nick: user.nick})
      newUser.save(function(err) {
        if (err) 
          callback({'success': false, message: `Cannot create user ${user.id}.`}, false)
        
        callback(false, {'success': true, 'message': ''})
      });
    } else {
      callback({'success': false, message: 'No model for user.'}, false)
    }
  })
}

var commandDispatcher = {
    connectdb: function(options) {
      return new Promise(function(resolve, reject) {
        requestConnectDb(options, function(err, result) {
          if (err) {
              reject(err)
          } else {
              resolve(result)
          }
        })
      })
    }, 
    createuser: function(options) {
      return new Promise(function(resolve, reject) {
        requestCreateUser(options, function(err, result) {
          if (err) {
              reject(err)
          } else {
              resolve(result)
          }
        })
      })
    },
    test: function(options) {
      return new Promise(function(resolve, reject) {
        requestTest(options, function(err, result) {
          if (err) {
              reject(err)
          } else {
              resolve(result)
          }
        })
      })
    }
}

module.exports = async (req, res) => {
  const url = await parse(req.url)
  const query = await querystring.parse(url.query)
  if (!req.headers.API_KEY || req.headers.API_KEY !== process.env.API_KEY)
    micro.send(res, 401, {'success': false, 'message': 'Authorization failure.'})
  else {
    if (query.command in commandDispatcher) {
      var options = query
      if (req.method !== 'GET') {
        options = JSON.parse(req.body)
      }
      commandDispatcher[query.command](options)
        .then(result => {
          micro.send(res, 200, result)
        })
    } else {
      micro.send(res, 501, {'success': false, 'message': 'key does not exist'})
    }
  }
}