var englishTime = require("english-time");
var io = require("./io")();
var keyOf = require("./key-of");

module.exports = define;
module.exports.read = read;

function define (name, options, callback) {
  var record = {
    name: name,
    currency: options.currency || 'usd',
    period: englishTime(options.period),
    price: options.price
  };

  io.set(keyOf({ subscription: name }), record, function (error) {
    if (error) return callback(error);
    callback(undefined, record);
  });
}

function read (name, callback) {
  io(keyOf({ subscription: name }), callback);
}
