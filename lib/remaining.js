var debug = require("local-debug")('remaining');
var charges = require("./charges");
var fatal = require("./fatal");

module.exports = remaining;

function remaining (customer, subscription, callback) {
  debug('Calculating the remaining time of %s\'s subscription to %s.', customer, subscription);

  charges.last(customer, subscription, function (error, charge) {
    if (error) {
      fatal(error.message);
      fatal(error.stack);
      return callback(error);
    }

    callback(undefined, charge.expire_ts - Date.now());
  });
}
