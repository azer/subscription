var debug = require("local-debug")('cancel');
var newError = require("new-error");
var getService = require("./service").get;
var priceOf = require("./price-of");
var remaining = require("./remaining");
var charges = require('./charges');
var subscriptions = require("./subscriptions");
var fatal = require("./fatal");
var balance = require("./balance");


module.exports = cancel;
module.exports.balanceToReturn = balanceToReturn;

function cancel (customer, serviceName, callback) {
  debug('Cancelling %s\'s subscription to %s', customer, serviceName);

  getService(serviceName, function (error, service) {
    if (error) return callback(error);

    balanceToReturn(customer, service, function (error, restBalance, remainingTime) {
      if (error) return callback(error);

      balance.update(customer, restBalance, function (error) {
        if (error) {
          fatal('Unable to add %s to %s\'s balance', balance, customer);
          return callback(newError('Oops, things are messed up. We weren\'t able to update your balance at this time.'));
        }

        charges.markAsCancelled(customer, serviceName, function (error) {
          if (error) return callback(error);

          subscriptions.remove(customer, serviceName, function (error) {
            if (error) return callback(error);

            callback(undefined, {
              balance: balance,
              remainingTime: remainingTime
            });
          });
        });
      });
    });
  });
}

function balanceToReturn (customer, service, callback) {
  remaining(customer, service.name, function (error, remainingTime) {
    if (error) return callback(error);

    callback(undefined, priceOf(service, remainingTime), remainingTime);
  });
}
