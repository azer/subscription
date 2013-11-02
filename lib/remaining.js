var debug = require("local-debug")('remaining');
var newError = require("new-error");
var charges = require("./charges");
var fatal = require("./fatal");

module.exports = remaining;

function remaining (customer, service, callback) {
  debug('Calculating the remaining time of %s\'s subscription to %s.', customer, service);

  charges.lastUnexpired(customer, service, function (error, charge) {
    if (error) {
      return callback(error);
    }

    if (!charge) {
      return callback(undefined, 0);
    }

    var now = Date.now();

    if (charge.expire_ts <= now) {
      return callback(newError('{0} doesn\'t have any active subscription to {1}', customer, service));
    }

    debug('Remaining time of %s\'s subscription to %s is %d', customer, service, charge.expire_ts - now);

    callback(undefined, charge.expire_ts - now);
  });
}
