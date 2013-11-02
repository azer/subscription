var map = require("map");
var subscription = require("./subscription");
var iter = require("iter");

var card = {
  "number": '4242 4242 4242 4242',
  "exp_month": 12,
  "exp_year": 2014,
  "cvc": '123'
};

module.exports = {
  card: card,
  serviceOptions: serviceOptions,
  services: services,
  customers: customers,
  tokens: tokens,
  purchases: purchases
};

function customers () {
  var result = [];
  var i = 10;

  while (i--) {
    result.push('customer' + random() + '@ada.io');
  }

  return result;
}

function defineService (options, callback) {
  subscription.service.define(options.name, options, callback);
}

function services (callback) {
  map(defineService, serviceOptions(), callback);
}

function serviceOptions () {
  var result = [];

  result.push({
    name: 'atlas/' + random(),
    price: 1000,
    period: 'month',
    currency: 'usd'
  });

  result.push({
    name: 'newyorker/' + random(),
    price: 3000,
    period: 'month',
    currency: 'usd'
  });

  result.push({
    name: 'azers fanzin/' + random(),
    price: 0,
    period: 'week'
  });

  return result;
}

function purchases (n, services, customers, tokens) {
  return function (callback) {
    var result = [];

    iter.parallel(n)
      .done(function () {
        return callback(undefined, result);
      })
      .run(function (next, i) {
        var options = {
          customer: customers[customers.length % (i+1)],
          length: Math.floor(Math.random()*6) + 1 + ' months',
          token: tokens[i]
        };

        subscription.purchase(services[services.length % (i+1)].name, options, function (error, purchase) {
          if (error) return callback(error);

          result.push(purchase);
          next();
        });
      });
  };
}

function tokens (n) {
  return function (callback) {
    var result = [];

    iter(n)
      .done(function () {
        callback(undefined, result);
      })
      .run(function (next) {
        subscription.stripe().tokens.create({ card: card }, function (error, token) {
          if (error) return callback(error);
          result.push(token.id);
          next();
        });
      });
  };
}

function random () {
  return Math.floor(Math.random()*999999);
}

// 2678400000
