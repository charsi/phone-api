const messages = require('./messages.service');
//const users = require('./users/users.service');
//const numbers = require('./numbers/numbers.service');
//const authentication = require('./authentication');
//const outgoing = require('./outgoing/outgoing.service');


/* // eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(messages);
  app.configure(users);
};
 */

const services = app => {
  [
    //authentication,
    //users,
    messages,
    //numbers,
    //outgoing
  ].forEach(service => app.configure(service));
};

module.exports = services;