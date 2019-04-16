const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

//const { BadRequest } = require('@feathersjs/errors');

class Messages {
  constructor() {
    this.messages = [];
    this.currentId = 0;
  }

  async find(params) {
    // Return the list of all messages
    return this.messages;
  }

  async get(id, params) {
    // Find the message by id
    const message = this.messages.find(message => message.id === parseInt(id, 10));

    // Throw an error if it wasn't found
    if(!message) {
      throw new Error(`Message with id ${id} not found`);
    }

    // Otherwise return the message
    return message;
  }

  async create(data, params) {
    // Create a new object with the original data and an id
    // taken from the incrementing `currentId` counter
    const message = Object.assign({
      id: ++this.currentId
    }, data);

    this.messages.push(message);

    return message;
  }

  async patch(id, data, params) {
    // Get the existing message. Will throw an error if not found
    const message = await this.get(id);

    // Merge the existing message with the new data
    // and return the result
    return Object.assign(message, data);
  }

  async remove(id, params) {
    // Get the message by id (will throw an error if not found)
    const message = await this.get(id);
    // Find the index of the message in our message array
    const index = this.messages.indexOf(message);

    // Remove the found message from our array
    this.messages.splice(index, 1);

    // Return the removed message
    return message;
  }
}




const app = express(feathers());


// Turn on JSON body parsing for REST services
app.use(express.json());
// Turn on URL-encoded body parsing for REST services
app.use(express.urlencoded({ extended: true }));
// Set up REST transport using Express
app.configure(express.rest());
// Configure the Socket.io transport
app.configure(socketio());

const helmet = require('helmet');
var session = require('express-session');
var FileStore = require('session-file-store')(session); //storage only for sessions
require('dotenv').config();
require('dotenv').config();

app.use(helmet());

const cookieKey = 'user_sid';
app.use(session({
  store: new FileStore({path:'./db/sessions'}),
  key: cookieKey,
  saveUninitialized: false,
  resave: false,
  secret: process.env.COOKIE_SECRET, //secret passphrase for signing cookie
  cookie: {
      maxAge: 1000 * 60 * 60 * 2, //two hours
      sameSite: true,
      //secure: process.env.NODE_ENV === 'production'  // true when in production
      // Does not work. Probably dude to the ngix reverse proxy connection with node app is not https
  }
}));


const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf((info) => {
      const {
        timestamp, level, message, ...args
      } = info;
      const ts = new Date().toLocaleTimeString();
      //const ts = timestamp.slice(0, 19).replace('T', ' ');
      return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logfile.log' })
  ]
});




// Set up an error handler that gives us nicer errors
app.use(express.errorHandler());

// Start the server on port 3030
const server = app.listen(process.env.APP_PORT);
server.on('listening', () => logger.info(`Feathers API started at localhost:${process.env.APP_PORT}`));

/* HTTPS
const https  = require('https');

const server = https.createServer({
  key: fs.readFileSync('privatekey.pem'),
  cert: fs.readFileSync('certificate.pem')
}, app).listen(443);

// Call app.setup to initialize all services and SocketIO
app.setup(server); */




// Initialize the messages service by creating
// a new instance of our class
app.use('messages', new Messages());





async function processMessages() {
  app.service('messages').on('created', message => {
    logger.info('Created a new message', message);
  });

  app.service('messages').on('removed', message => {
    logger.info('Deleted message', message);
  });

  await app.service('messages').create({
    text: 'First message'
  });

  const lastMessage = await app.service('messages').create({
    text: 'Second message'
  });

  // Remove the message we just created
  await app.service('messages').remove(lastMessage.id);

  const messageList = await app.service('messages').find();

  logger.info('Available messages', messageList);
}




processMessages();