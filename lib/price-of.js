var englishTime = require("english-time");

module.exports = priceOf;

function priceOf (subscription, englishLength) {
  var length = englishTime(englishLength);
  var amount = Math.floor(length / subscription.period);

  return subscription.price * amount;
}
