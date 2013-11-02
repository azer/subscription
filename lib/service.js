var englishTime = require("english-time");
var io = require("./io")();
var keyOf = require("./key-of");
var key = keyOf({ services: true });
var newError = require("new-error");
var debug = require("local-debug")('service');

module.exports = {
  define: define,
  get: get,
  all: all
};

function all (callback) {
  io.get(key, callback);
}

function define (name, options, callback) {
  io.get(key, function (error, services) {

    var record = {
      name: name,
      currency: options.currency || 'usd',
      period: englishTime(options.period),
      price: options.price
    };


    if (error && !services) {
      debug('Resetting...');
      services = {};
    }

    debug('Defining %s', name);
    services[name] = record;

    io.set(key, services, function (error) {
      if (error) return callback(error);
      callback(undefined, record);
    });

  });
}

function get (name, callback) {
  all(function (error, services) {
    if(error) return callback(error);

    if (!services[name]) {
      debug('"%s" is not an existing service.', name);
      return callback(newError('"{0}" is not an existing service.', name));
    }

    callback(undefined, services[name]);
  });
}
