var debug = require("local-debug")('balance');
var io = require("./io")();
var keyOf = require("./key-of");

module.exports = get;
module.exports.update = update;
module.exports.set = set;
module.exports.charge = charge;

function charge (customer, amount, callback) {
  get(customer, function (error, balance) {
    if (error) return callback(error);

    if (balance == 0) return callback(undefined, amount, 0);

    var rest = amount - balance;
    var newBalance = balance - amount;

    if (rest < 0) {
      rest = 0;
    }

    if (newBalance < 0) {
      newBalance = 0;
    }

    set(customer, newBalance, function (error) {
      if (error) return callback(error);

      callback(undefined, rest, balance - newBalance);
    });

  });
}

function get (customer, callback) {
  var key = keyOf({ balance: customer });

  io.get(key, function (error, balance) {
    callback(undefined, balance || 0);
  });
}

function update (customer, change, callback) {
  get(customer, function (error, value) {
    if (error) return callback(error);

    var newValue = value + change;

    debug('Updating %s\'s balance from %s to %s', customer, value, newValue);

    set(customer, value + change, callback);
  });
}

function set (customer, value, callback) {
  var key = keyOf({ balance: customer });

  io.set(key, value, callback);
}
