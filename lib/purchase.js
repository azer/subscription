var debug = require("local-debug")('purchase');
var getSubscription = require("./define").read;
var stripe = require("./stripe-sdk")();
var priceOf = require("./price-of");
var keyOf = require("./key-of");
var charges = require("./charges");
var subscriptions = require("./subscriptions");
var fatal = require("./fatal");

module.exports = subscription;
module.exports.extension = extension;

function extension (subscriptionName, options, callback) {
  charges.last(options.customer, subscriptionName, function (error, lastCharge) {
    if (error) return callback(error);

    options.startTS = lastCharge.expire_ts;

    subscription(subscriptionName, options, callback);
  });
}

function subscription (subscriptionName, options, callback) {
  debug('%s is purchasing %s subscription for %s', options.customer, subscriptionName, options.length);

  getSubscription(subscriptionName, function (error, subscription) {
    if (error) return callback(error);

    charge(subscription, options, function (error, stripeCharge) {
      if (error) return callback(error);

      charges.add(stripeCharge, function (error, chargeRecord) {
        subscriptions.add(options.customer, subscriptionName, function (error) {
          if(error) return callback(error);
          callback(undefined, chargeRecord);
        });
      });
    });

  });

}

function charge (subscription, options, callback) {
  var stripeOptions = {
    amount: priceOf(subscription, options.length),
    currency: subscription.currency,
    card: options.token,
    description: 'Subscribe "' + subscription.name + '" for ' + options.length
  };

  stripe.charges.create(stripeOptions, function (error, charge) {
    if (error) return callback(error);

    debug('%s%s was paid by %s for %s. (ID: %s)', charge.amount, charge.currency, charge.customer, charge.description, charge.id);

    var startTS = options.startTS || Date.now();

    callback(undefined, {
      id: charge.id,
      customer: options.customer,
      subscription: subscription.name,
      amount: charge.amount,
      currency: charge.currency,
      description: charge.description,
      create_ts: Date.now(),
      start_ts: startTS,
      expire_ts: (charge.amount / subscription.price) * subscription.period + startTS
    });

  });
}
