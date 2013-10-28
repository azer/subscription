var subscription = require("./")('sk_test_FIvJu2hkZszNIFzGgVNAqo2x', './data-test');
var call = require("call-all");

var fixtures = {};
fixtures.card = {
  "number": '4242 4242 4242 4242',
  "exp_month": 12,
  "exp_year": 2014,
  "cvc": '123'
};

after(function(done){
  require('./lib/io')().destroy(done);
});

describe('define', function(){

  it('defines a new type of product or service', function(done){
    subscription.define('atlas magazine', { price: 1000, currency: 'usd', period: '1 month' }, function (error, atlas) {
      if (error) return done(error);
      expect(atlas.name).to.equal('atlas magazine');
      expect(atlas.period).to.equal(2678400000);
      expect(atlas.currency).to.equal('usd');
      expect(subscription.priceOf(atlas, '1 month')).to.equal(1000);
      expect(subscription.priceOf(atlas, '3 months and 2 weeks')).to.equal(3000);
      expect(subscription.priceOf(atlas, '1 year')).to.equal(12000);
      done();
    });
  });

});

describe('purchase', function(){
  before(function (done) {
    call(defineSubscriptions, generateCustomers)(done);
  });

  beforeEach(generateTestToken);

  it('executes a new subscription purchase', function(done){
    subscription.purchase(fixtures.subscription1, { customer: fixtures.customer1, length: '3 months', token: fixtures.token }, function (error, purchase) {
      if (error) return done(error);
      expect(purchase.amount).to.equal(3000);
      expect(purchase.customer).to.equal(fixtures.customer1);
      expect(purchase.currency).to.equal('usd');
      expect(purchase.create_ts).to.be.above(Date.now() - 3000);
      expect(purchase.start_ts).to.be.above(Date.now() - 3000);
      expect(purchase.expire_ts).to.be.above(Date.now() + 8035200000 - 5000);
      done();
    });
  });

  it('executes a new subscription extension purchase', function(done){
    subscription.purchase.extension(fixtures.subscription1, { customer: fixtures.customer1, length: '5 months', token: fixtures.token }, function (error, purchase) {
      if (error) return done(error);
      expect(purchase.amount).to.equal(5000);
      expect(purchase.customer).to.equal(fixtures.customer1);
      expect(purchase.currency).to.equal('usd');
      expect(purchase.create_ts).to.be.above(Date.now() - 10000);
      expect(purchase.start_ts).to.be.above(Date.now() + 8035200000 - 10000);
      expect(purchase.expire_ts).to.be.above(Date.now() + 21427200000 - 10000);
      done();
    });
  });

});

describe('has', function(){
  before(function (done) {
    call(generateTestToken, defineSubscriptions, generateCustomers, makePurchases)(done);
  });

  beforeEach(generateTestToken);

  it('checks if given user has an active subscription', function(done){
    subscription.has(fixtures.customer1, fixtures.subscription1, function (has) {
      expect(has).to.be.true;

      subscription.purchase(fixtures.subscription2, { customer: fixtures.customer2, length: '3 months', token: fixtures.token, startTS: Date.now() - 8035200000 }, function (error, purchase) {
        if (error) return done(error);

        subscription.has(fixtures.customer2, fixtures.subscription2, function (has) {
          if (error) return done(error);
          expect(has).to.be.false;
          done();
        });
      });
    });
  });
});

describe('subscriptionsOf', function(){
  before(function (done) {
    call(generateTestToken, defineSubscriptions, generateCustomers, makePurchases)(done);
  });

  it('checks if a customer has any active subscription', function(done){
    subscription.subscriptionsOf(fixtures.customer1, function (error, all) {
      if (error) return done(error);
      expect(all).to.deep.equal([fixtures.subscription1, fixtures.subscription2]);
      done();
    });
  });
});

describe('remaining', function(){
  before(function (done) {
    call(generateTestToken, defineSubscriptions, generateCustomers, makePurchases)(done);
  });

  it('returns the remaining valid subscription time', function(done){
    subscription.remaining(fixtures.customer1, fixtures.subscription1, function (error, remaining) {
      if (error) return done(error);
      expect(remaining).to.be.above(5356800000 - 5000);
      done();
    });
  });
});

function defineSubscriptions (callback) {
  var name = 'atlas magazine ' + random();
  subscription.define(name, { price: 1000, currency: 'usd', period: '1 month' }, function (error, atlas) {
    fixtures.subscription1 = name;

    name = 'the newyorker magazine ' + random();

    subscription.define(name, { price: 1000, currency: 'usd', period: '1 month' }, function (error, atlas) {
      fixtures.subscription2 = name;
      callback();
    });
  });
}

function generateCustomers (callback) {
  fixtures.customer1 = 'customer' + random() + '@ada.io';
  fixtures.customer2 = 'customer' + random() + '@ada.io';
  fixtures.customer3 = 'customer' + random() + '@ada.io';
  callback();
}

function makePurchases (callback) {
  subscription.purchase(fixtures.subscription1, { customer: fixtures.customer1, length: '2 months', token: fixtures.token1 }, function (error, purchase) {
    if (error)  throw error;

    subscription.purchase(fixtures.subscription2, { customer: fixtures.customer1, length: '6 months', token: fixtures.token2 }, function (error, purchase) {
      if (error) throw error;

      callback();
    });
  });
}


function random () {
  return Math.floor(Math.random()*999999);
}

function generateTestToken (callback) {
  subscription.stripe().tokens.create({ card: fixtures.card }, function (error, token) {
    if (error) return callback(error);
    fixtures.token = fixtures.token1 = token.id;

    subscription.stripe().tokens.create({ card: fixtures.card }, function (error, token) {
      if (error) return callback(error);
      fixtures.token2 = token.id;
      callback();
    });
  });
}
