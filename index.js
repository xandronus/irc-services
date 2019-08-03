// Environment Variables:
// DB_CONN - connection string to mongoDB
// API_KEY - Api key required in API_KEY header
const micro = require('micro')
const { parse } = require('url')
const querystring = require('querystring')
//const config = require('./config.json')
const mongoose = require('mongoose')

// ---------------------------------------------
// Config
// ---------------------------------------------

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// ---------------------------------------------
// Database
// ---------------------------------------------

var userSchema = null 
var messageSchema = null
var appSchema = null
var visitSchema = null

const database = {   
  getModels: async function() {    
    var User = await mongoose.model('User', userSchema)
    var Message = await mongoose.model('Message', messageSchema)
    var App = await mongoose.model('App', appSchema)
    var Visit = await mongoose.model('Visit', visitSchema)
  
    return {'User': User, 'Message': Message, 'App': App, 'Visit': Visit}
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
    if (!messageSchema) {
      messageSchema = new mongoose.Schema({
        _id:  mongoose.Schema.Types.ObjectId,
        postedbyid: mongoose.Schema.Types.ObjectId,
        postedby: {userid: mongoose.Schema.Types.ObjectId, nick: String},
        timestamp: Date,
        content: [
        ]
      })
    }

    if (!userSchema) {
      userSchema = new mongoose.Schema({
        _id:  mongoose.Schema.Types.ObjectId,
        nick: String
      })
    }

    if (!appSchema) {
      appSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        name: String
      })
    }

    if (!visitSchema) {
      visitSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        nickid: mongoose.Schema.Types.ObjectId,
        appid: mongoose.Schema.Types.ObjectId,
        parcel: {x:Number, y:Number},
        visits: Number
      })
    }
  }
}

// ---------------------------------------------
// Requests
// ---------------------------------------------

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
      var newId = new mongoose.Types.ObjectId;
      var newUser = new model.User({_id: newId, nick: user.nick})
      newUser.save(function(err) {
        if (err) 
          callback({'success': false, message: `Cannot create user ${user.nick}.`}, false)
        else {
          var returnVal = {_id: newId, nick: user.nick}
          callback(false, {'success': true, 'message': returnVal})
        }
      });
    } else {
      callback({'success': false, message: 'No model for user.'}, false)
    }
  })
}

async function requestCreateMessage(options, callback) {
  database.connect(async() => {
   const model = await database.getModels()
    if (model) {
      var messageId = new mongoose.Types.ObjectId;
      var newMessage = new model.Message({ 
        _id: messageId,
        timestamp: Date.now(),
        content: [
           {contenttype: 'text', text: options.text}
        ] 
      })

      model.User.findById(new mongoose.Types.ObjectId(options.userid), function(err, user) {
        if (err){
          callback(false, {'success': false, 'message': `User record not found ${options.userid}`})        
        } else {
          newMessage.postedby = {userid: user._id, nick: user.nick}
          newMessage.save(function(err) {
            if (err) {            
              callback({'success': false, message: `Cannot save message for user ${options.userid}.`}, false)
            } else{
              var result = {messageid: messageId }
              callback(false, {'success': true, 'message': result})
            }
          })
        }
      })
    } else {
      callback({'success': false, message: 'No model for messages.'}, false)
    }
  })
}

async function requestGetUser(user, callback) {
  database.connect(async() => {
   const model = await database.getModels()
    if (model) {
      model.User.find({ nick: user.nick }, function (err, users) {
        if (err) {
          if (user.create) {
            requestCreateUser(user, callback)
          } else {          
            callback({'success': false, message: `No user found by nick ${user.nick}.`}, false)
          }
        }
        else {
          var returnVal = users
          callback(false, {'success': true, 'message': returnVal})        
        }
      })
    } else {
      callback({'success': false, message: 'No model for user.'}, false)
    }
  })
}

async function requestGetMessages(options, callback) {
  database.connect(async() => {
   const model = await database.getModels()
    if (model) {
      var search = {}
      if (options.after)
        search = {timestamp: {$gt: options.after}}
      model.Message.find(search,function (err, messages) {
        if (err) {
          callback({'success': false, message: `No messages found.`}, false)
        }
        else {
          callback(false, {'success': true, 'message': messages})        
        }
      })
    } else {
      callback({'success': false, message: 'No model for user.'}, false)
    }
  })
}

// ---------------------------------------------
// Command Dispatcher
// ---------------------------------------------

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
    createmessage: function(options) {
      return new Promise(function(resolve, reject) {
        requestCreateMessage(options, function(err, result) {
          if (err) {
              reject(err)
          } else {
              resolve(result)
          }
        })
      })
    },
    getuser: function(options) {
      return new Promise(function(resolve, reject) {
        requestGetUser(options, function(err, result) {
          if (err) {
              reject(err)
          } else {
              resolve(result)
          }
        })
      })
    },
    getmessages: function(options) {
      return new Promise(function(resolve, reject) {
        requestGetMessages(options, function(err, result) {
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

// ---------------------------------------------
// Entry
// ---------------------------------------------

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    micro.send(res, 200);
  }
  else {
    const url = await parse(req.url)
    const query = await querystring.parse(url.query)
    const apikey = req.headers.api_key
    if (!apikey || apikey !== process.env.API_KEY)
      micro.send(res, 401, {'success': false, 'message': 'Authorization failure.'})
    else {
      if (query.command in commandDispatcher) {
        var options = query
        var method = req.method     
        if (method !== 'GET')
          options = await micro.json(req)
        commandDispatcher[query.command](options)
          .then(result => {
            micro.send(res, 200, result)
          })
      } else {
        micro.send(res, 501, {'success': false, 'message': 'key does not exist'})
      }
    }
  }
}