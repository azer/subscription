var debug = require("local-debug")('subscriptions');
var io = require("./io")();
var charges = require("./charges");
var keyOf = require("./key-of");

module.exports = {
  add: add,
  has: has,
  read: read
};

function add (customer, subscription, callback) {
  var key = keyOf({ subscriptions: customer });

  debug('Adding %s into %s', subscription, key);

  io.get(key, function (error, subscriptions) {
    if (error) return create(customer, subscription, callback);

    if (subscriptions.indexOf(subscription) > -1) {
      return callback();
    }

    subscriptions.push(subscription);

    io.set(key, subscriptions, callback);
  });
}

function create (customer, subscription, callback) {
  var key = keyOf({ subscriptions: customer });
  var subs = [subscription];

  io.set(key, subs, function (error) {
    if(error) return callback(error);

    callback(undefined, subs);
  });
}

function read (customer, callback) {
  var key = keyOf({ subscriptions: customer });

  io.get(key, callback);
}

function has (customer, subscription, callback) {
  read(customer, function (error, all) {
    if (error) return callback();

    callback(all.indexOf(subscription) > -1);
  });
}
