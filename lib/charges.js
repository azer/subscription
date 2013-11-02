var debug = require("local-debug")('charges');
var io = require("./io")();
var keyOf = require("./key-of");
var fatal = require("./fatal");
var newError = require("new-error");

module.exports = {
  add: add,
  active: active,
  create: create,
  lastUnexpired: lastUnexpired,
  markAsCancelled: markAsCancelled,
  notExpired: notExpired,
  read: read
};

function active (customer, service, callback) {
  var now = Date.now();

  read(customer, service, function (error, all) {
    if (error) return callback(error);

    callback(undefined, all.filter(function (charge) {
      return !charge.cancelled && charge.start_ts <= now && charge.expire_ts > now;
    }));
  });
}

function add (charge, callback) {
  var key = keyOf({ customer: charge.customer, service: charge.service });

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

function create (charge, callback) {
  var key = keyOf({ customer: charge.customer, service: charge.service });
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

function markAsCancelled (customer, service, callback) {
  debug('Marking all unexpired charges by %s to "%s" as cancelled', customer, service);

  var now = Date.now();

  read(customer, service, function (error, charges) {
    if (error) return callback(error);

    var save = charges.map(function (charge) {
      if (charge.expire_ts < now) return charge;

      debug('Cancelling %s%s made by %s for "%s', charge.amount, charge.currency, customer, service);
      charge.cancelled = Date.now();
      return charge;
    });

    var key = keyOf({ customer: customer, service: service });

    io.set(key, save, callback);
  });
}

function read (customer, service, callback) {
  var key = keyOf({ customer: customer, service: service });
  debug('Reading %s', key);
  io.get(key, function (error, result) {
    if (error) {
      return callback(newError('{0} has no charge records for "{1}"', customer, service));
    };

    callback(undefined, result);
  });
}

function lastUnexpired (customer, service, callback) {
  recent(customer, service, function (error, recent) {
    if(error) return callback(error);

    callback(undefined, recent[recent.length - 1]);
  });
}

function recent (customer, service, callback) {
  read(customer, service, function (error, all) {
    if (error) return callback(error);

    callback(undefined, all
             .filter(function (charge) {
               return !charge.cancelled;
             })
             .sort(function (a, b) {
               if (a.expire_ts > b.expire_ts) return 1;
               if (a.expire_ts < b.expire_ts) return -1;
               return 0;
             }));
  });
}

function notExpired (customer, service, callback) {
  var now = Date.now();

  read(customer, service, function (error, all) {
    if (error) return callback(error);

    callback(undefined, all.filter(function (charge) {
      return !charge.cancelled && charge.expire_ts > now;
    }));
  });
}
