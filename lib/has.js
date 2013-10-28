var debug = require("local-debug")('has');
var charges = require("./charges");
var fatal = require("./fatal");

module.exports = has;

function has (customer, subscription, callback) {
  debug('Checking if %s has an active %s subscription.', customer, subscription);

  charges.active(customer, subscription, function (error, charges) {
    if (error) {
      return callback();
    }

    debug('%s has %d payments for %s', customer, charges.length, subscription);

    callback(charges.length > 0);
  });
}
