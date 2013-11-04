var debug = require("local-debug")('purchase');
var newError = require("new-error");
var getService = require("./service").get;
var stripe = require("./stripe-sdk")();
var priceOf = require("./price-of");
var keyOf = require("./key-of");
var charges = require("./charges");
var subscriptions = require("./subscriptions");
var fatal = require("./fatal");
var remaining = require("./remaining");
var cancel = require("./cancel");
var balance = require("./balance");

module.exports = subscription;
module.exports.extension = extension;
module.exports.upgrade = upgrade;

function extension (serviceName, options, callback) {
  charges.lastUnexpired(options.customer, serviceName, function (error, lastCharge) {
    if (error) {
      return callback(newError('Oops, unable to extend. {0} doesn\'t have any active subscription to "{1}".', options.customer, serviceName));
    }

    options.startTS = lastCharge.expire_ts;

    subscription(serviceName, options, callback);
  });
}

function upgrade (options, callback) {
  debug('%s is upgrading from %s to %s', options.customer, options.from, options.to);

  cancel(options.customer, options.from, function (error, result) {
    if (error) return callback(error);

    debug('Cancelled %s\'s subscription to %s. Now purchasing %s, for %s', options.customer, options.from, options.to, result.remainingTime);

    subscription(options.to, { token: options.token, customer: options.customer, length: result.remainingTime, card: options.card }, callback);
  });
}

function subscription (serviceName, options, callback) {
  debug('%s is purchasing %s subscription for %s', options.customer, serviceName, options.length);

  options.startTS || (options.startTS = Date.now());

  charges.lastUnexpired(options.customer, serviceName, function (error, lastCharge) {

    getService(serviceName, function (error, service) {
      if (error) {
        return callback(error);
      }

      if (lastCharge && lastCharge.expire_ts > options.startTS) {
        return callback(newError('You ({0}) already paid "{1}". Use the "extend" option to extend your subscription.', options.customer, serviceName));
      }

      charge(service, options, function (error, chargeRecord) {
        if (error) return callback(error);

        subscriptions.add(options.customer, serviceName, function (error) {
          if(error) return callback(error);
          callback(undefined, chargeRecord);
        });
      });
    });

  });

}

function charge (service, options, callback) {
  if (!service.price) {
    return callback(undefined, {
      customer: options.customer,
      service: service.name,
      create_ts: Date.now(),
      start_ts: options.startTS
    });
  }

  if (!options.card && !options.token) {
    return callback(newError('Either card info or a valid Stripe token has to be provided for purchasing a subscription.'));
  }

  var totalPrice = priceOf(service, options.length);

  var stripeOptions = {
    amount: totalPrice,
    currency: service.currency,
    card: options.token || options.card,
    description: 'Subscribe "' + service.name + '" for ' + options.length
  };

  balance.charge(options.customer, stripeOptions.amount, function (error, restMoney, usedBalance) {
    if (error) {
      fatal('Unable to charge existing balance of %s', options.customer);
      fatal(error.message);
      fatal(error.stack);
    };

    if (restMoney != stripeOptions.amount) {
      debug('%s used %s%s from his/her balance to pay %s', options.customer, usedBalance, stripeOptions.currency, stripeOptions.amount);
      stripeOptions.amount = restMoney;
    }

    stripe.charges.create(stripeOptions, function (error, charge) {
      if (error) return callback(error);

      debug('%s%s was paid by %s for "%s". (ID: %s)', charge.amount, charge.currency, options.customer, charge.description, charge.id);

      var stripeCharge = {
        id: charge.id,
        customer: options.customer,
        service: service.name,
        amount: charge.amount,
        currency: charge.currency,
        description: charge.description,
        create_ts: Date.now(),
        start_ts: options.startTS,
        expire_ts: (totalPrice / service.price) * service.period + options.startTS
      };

      charges.add(stripeCharge, function (error, chargeRecord) {
        if (error) {
          fatal(error.message);
          fatal(error.stack);
        }

        callback(undefined, chargeRecord);
      });

    });
  });
}
