var debug = require("local-debug")('remaining');
var newError = require("new-error");
var charges = require("./charges");
var service = require("./service");
var fatal = require("./fatal");

module.exports = remaining;

function ofPaidSubscription (customer, service, callback) {
  debug('Calculating the remaining time of %s\'s subscription to %s.', customer, service.name);

  charges.lastUnexpired(customer, service.name, function (error, charge) {
    if (error) {
      return callback(error);
    }

    if (!charge) {
      return callback(undefined, 0);
    }

    var now = Date.now();

    if (charge.expire_ts <= now) {
      return callback(newError('{0} doesn\'t have any active subscription to {1}', customer, service.name));
    }

    debug('Remaining time of %s\'s subscription to %s is %d', customer, service.name, charge.expire_ts - now );

    callback(undefined, charge.expire_ts - now);
  });
}

function ofFreeSubscription (_, _, callback) {
  callback(undefined, 32140800000);
}

function remaining (customer, serviceName, callback) {
  service.get(serviceName, function (error, service) {
    if (error) return callback(error);

    if (service.price == 0) return ofFreeSubscription(customer, service, callback);

    ofPaidSubscription(customer, service, callback);
  });
}
