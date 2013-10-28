var level = require("level-json");
var stripeSDK = require('./lib/stripe-sdk');
var io = require("./lib/io");

module.exports = subscription;

function subscription (apiKey, path) {
  if (apiKey) {
    stripeSDK(require('stripe')(apiKey));
  }

  if (typeof path == 'string') {
    io(level(path));
  } else if(path) {
    io(path);
  } else {
    io(level('./data-subscriptions'));
  }

  return {
    define: require("./lib/define"),
    priceOf: require('./lib/price-of'),
    purchase: require('./lib/purchase'),
    has: require('./lib/has'),
    remaining: require('./lib/remaining'),
    subscriptionsOf: require('./lib/subscriptions').read,
    stripe: stripeSDK
  };
}
