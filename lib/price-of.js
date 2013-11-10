var englishTime = require("english-time");
var getService = require("./service").get;
var cancel;

module.exports = purchase;
module.exports.upgrade = upgrade;

function purchase (service, length) {
  typeof length == 'string' && ( length = englishTime(length) );

  var amount = Math.floor(length / service.period);

  return service.price * amount;
}

function upgrade (customer, oldService, newService, callback) {
  cancel || (cancel = require("./cancel"));

  cancel.balanceToReturn(customer, oldService, function (error, restBalance, remainingTime) {
    if (error) return callback(error);
    callback(undefined, purchase(newService, remainingTime) - restBalance);
  });
}
