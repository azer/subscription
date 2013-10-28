var debug = require("local-debug")('charges');
var io = require("./io")();
var keyOf = require("./key-of");
var fatal = require("./fatal");

module.exports = {
  add: add,
  active: active,
  available: available,
  create: create,
  last: last
};

function active (customer, subscription, callback) {
  var now = Date.now();

  read(customer, subscription, function (error, all) {
    if (error) return callback(error);

    callback(undefined, all.filter(function (charge) {
      return charge.start_ts <= now && charge.expire_ts > now;
    }));
  });
}

function add (charge, callback) {
  var key = keyOf({ customer: charge.customer, charges: charge.subscription });

  debug('Adding the charge %s into %s', charge.amount + charge.currency, key);

  io.get(key, function (error, charges) {
    if (error) return create(charge, callback);

    charges.push(charge);

    io.set(key, charges, function (error) {
      if (error) return callback(error);

      callback(undefined, charge);
    });
  });
}

function available (customer, subscription, callback) {
  var now = Date.now();

  read(customer, subscription, function (error, all) {
    if (error) return callback(error);

    callback(undefined, all.filter(function (charge) {
      return charge.expire_ts > now;
    }));
  });
}

function create (charge, callback) {
  var key = keyOf({ customer: charge.customer, charges: charge.subscription });
  var charges = [charge];

  debug('Creating new list of charges to add %s into %s', charge.amount + charge.currency, key);

  io.set(key, charges, function (error) {
    if(error) {
      fatal(error.message);
      fatal(error.stack);
      return callback(error);
    }

    io.get(key, function (error, rec) {
      callback(undefined, charge);
    });

  });
}

function read (customer, subscription, callback) {
  var key = keyOf({ customer: customer, charges: subscription });
  debug('Reading %s', key);
  io.get(key, callback);
}

function last (customer, subscription, callback) {
  recent(customer, subscription, function (error, recent) {
    if(error) return callback(error);

    callback(undefined, recent[0]);
  });
}

function recent (customer, subscription, callback) {
  read(customer, subscription, function (error, all) {
    if (error) return callback(error);

    callback(undefined, all.sort(function (a, b) {
      if (a.expire_ts > b.expire_ts) return 1;
      if (a.expire_ts < b.expire_ts) return -1;
      return 0;
    }));
  });
}
