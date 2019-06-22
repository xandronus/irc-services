// Environment Variables:
// DB_CONN - connection string to mongoDB
// API_KEY - Api key required in API_KEY header
const micro = require('micro')
const { parse } = require('url')
const querystring = require('querystring')
//const config = require('./config.json')
const mongoose = require('mongoose')
const uuidv4 = require('uuid/v4');

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
        _id:  mongoose.Schema.Types.ObjectId,
        text: String
      })
    }

    if (!messageSchema) {
      messageSchema = new mongoose.Schema({
        _id:  mongoose.Schema.Types.ObjectId,
        channelid: String,
        parentid: String,
        postedbyid: String,
        timestamp: Date,
        content: [
          { type: String, id: String }
        ]
      })
    }

    if (!userSchema) {
      userSchema = new mongoose.Schema({
        _id:  mongoose.Schema.Types.ObjectId,
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
      var newId = new mongoose.Types.ObjectId;
      var newUser = new model.User({_id: newId, nick: user.nick})
      newUser.save(function(err) {
        if (err) 
          callback({'success': false, message: `Cannot create user ${user.nick}.`}, false)
        else {
          var returnVal = {id: newId}
          callback(false, {'success': true, 'message': returnVal})
        }
      });
    } else {
      callback({'success': false, message: 'No model for user.'}, false)
    }
  })
}

/*
async function requestCreateMessage(options, callback) {
  database.connect(async() => {
   const model = await database.getModels()
    if (model) {
      var contentId = uuidv4();
      var messageId = uuidv4();
      var messageContent = new model.Text({ _id: contentId, text: options.text })
      var newMessage = new model.Message({ 
        _id: messageId, 
        postedbyid: options.userid, 
        timestamp: Date.now(),
        content: [
          {type: 'text', id: 'contentId'}
        ] 
      })

      messageContent.save(function(err) {
        if (err) 
          callback({'success': false, message: `Cannot save message content for user ${options.userid}.`}, false)
        else {
          newMessage.save(function(err) {
            if (err) {            
              callback({'success': false, message: `Cannot save message for user ${options.userid}.`}, false)
            } else{
              var results = {contentid: messageContent._id, }
              callback(false, {'success': true, 'message': ''})
            }
          })
        }
      });
    } else {
      callback({'success': false, message: 'No model for user.'}, false)
    }
  })
}
*/


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