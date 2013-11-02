var debug = require("local-debug")('subscriptions');
var newError = require("new-error");
var io = require("./io")();
var charges = require("./charges");
var keyOf = require("./key-of");
var fatal = require("./fatal");

module.exports = {
  add: add,
  has: has,
  read: read,
  remove: remove
};

function add (customer, serviceName, callback) {
  var key = keyOf({ subscriptionsOf: customer });

  debug('Adding %s into %s', serviceName, key);

  io.get(key, function (error, subscriptions) {
    if (error) return create(customer, serviceName, callback);

    if (subscriptions.indexOf(serviceName) > -1) {
      return callback();
    }

    subscriptions.push(serviceName);

    io.set(key, subscriptions, callback);
  });
}

function create (customer, serviceName, callback) {
  var key = keyOf({ subscriptionsOf: customer });
  var subs = [serviceName];

  io.set(key, subs, function (error) {
    if(error) return callback(error);

    callback(undefined, subs);
  });
}

function remove (customer, serviceName, callback) {
  var key = keyOf({ subscriptionsOf: customer });

  debug('Removing %s from %s', serviceName, key);

  io.get(key, function (error, subscriptions) {
    if (error) {
      fatal(error);
      return callback(error);
    }

    var index = subscriptions.indexOf(serviceName);

    if (index == -1) {
      return callback(newError('{0} already doesn\'t have any subscription to {1}', customer, serviceName));
    }

    subscriptions.splice(index, 1);

    io.set(key, subscriptions, callback);
  });
}


function read (customer, callback) {
  var key = keyOf({ subscriptionsOf: customer });

  io.get(key, callback);
}

function has (customer, serviceName, callback) {
  read(customer, function (error, all) {
    if (error) return callback();

    callback(all.indexOf(serviceName) > -1);
  });
}
