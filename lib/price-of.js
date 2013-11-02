var englishTime = require("english-time");

module.exports = priceOf;

function priceOf (service, length) {
  typeof length == 'string' && ( length = englishTime(length) );

  var amount = Math.floor(length / service.period);

  return service.price * amount;
}
