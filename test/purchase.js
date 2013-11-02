var subscription = require("./subscription");
var fixtures = require("./fixtures");

describe('purchase', function(){
  var tokens, customers, services;

  before(function (done) {
    fixtures.services(function (error, _services) {
      if (error) return (error);

      services = _services;
      customers = fixtures.customers();

      fixtures.tokens(3)(function (error, _tokens) {
        if (error) return done(error);

        tokens = _tokens;
        done();
      });

    });
  });

  it('purchases subscriptions', function(done){
    subscription.purchase(services[0].name, { customer: customers[0], length: '3 months', token: tokens[0] }, function (error, purchase) {
      if (error) return done(error);
      expect(purchase.amount).to.equal(3000);
      expect(purchase.customer).to.equal(customers[0]);
      expect(purchase.currency).to.equal('usd');
      expect(purchase.create_ts).to.be.above(Date.now() - 7000);
      expect(purchase.start_ts).to.be.above(Date.now() - 5000);
      expect(purchase.expire_ts).to.be.above(Date.now() + 8035200000 - 5000);
      done();
    });
  });

  it('allows extending subscriptions', function(done){
    subscription.purchase.extension(services[0].name, { customer: customers[0], length: '5 months', token: tokens[1] }, function (error, purchase) {
      if (error) return done(error);
      expect(purchase.amount).to.equal(5000);
      expect(purchase.customer).to.equal(customers[0]);
      expect(purchase.currency).to.equal(services[0].currency);
      expect(purchase.create_ts).to.be.above(Date.now() - 10000);
      expect(purchase.start_ts).to.be.above(Date.now() + 8035200000 - 10000);
      expect(purchase.expire_ts).to.be.above(Date.now() + 21427200000 - 10000);

      subscription.remaining(customers[0], services[0].name, function (error, remaining) {
        if (error) return done(error);

        expect(remaining).to.be.above(21427200000 - 10000);

        subscription.subscriptionsOf(customers[0], function (error, subs) {
          expect(subs).to.deep.equal([services[0].name]);
          done();
        });

      });
    });
  });

  it('doesnt charge if the subscribing plan is free', function(done){
    subscription.purchase(services[2].name, { customer: customers[0], length: '1 month' }, function (error, purchase) {
      if (error) return done(error);
      expect(purchase.amount).to.not.exist;
      expect(purchase.currency).to.not.exist;
      expect(purchase.expire_ts).to.not.exist;
      expect(purchase.customer).to.equal(customers[0]);
      expect(purchase.create_ts).to.be.above(Date.now() - 10000);
      expect(purchase.start_ts).to.be.above(Date.now() - 10000);

      subscription.subscriptionsOf(customers[0], function (error, subs) {
        expect(subs).to.deep.equal([services[0].name, services[2].name]);
        done();
      });
    });
  });

  it('fails on double purchase', function(done){
    subscription.purchase(services[0].name, { customer: customers[0], length: '1 year' }, function (error, purchase) {
      expect(error.message).to.equal('You ('+customers[0]+') already paid "'+services[0].name+'". Use the "extend" option to extend your subscription.');
      expect(purchase).to.not.exist;
      done();
    });
  });

  it('fails to extend if there is no previous charge for that service', function(done){
    subscription.purchase.extension(services[1].name, { customer: customers[1], length: '1 year' }, function (error, purchase) {
      expect(error.message).to.equal('Oops, unable to extend. '+customers[1]+' doesn\'t have any active subscription to "'+services[1].name+'".');
      expect(purchase).to.not.exist;
      done();
    });
  });

  it('can upgrade a plan to another one', function(done){
    subscription.purchase.upgrade({ customer: customers[0], from: services[0].name, to: services[1].name, token: tokens[2] }, function (error, purchase) {
      if (error) return done(error);

      expect(purchase.amount).to.equal(14000);
      expect(purchase.customer).to.equal(customers[0]);
      expect(purchase.currency).to.equal(services[0].currency);
      expect(purchase.create_ts).to.be.above(Date.now() - 10000);
      expect(purchase.start_ts).to.be.above(Date.now() - 10000);
      expect(purchase.expire_ts).to.be.above(Date.now() + 18748800000 - 10000);

      subscription.subscriptionsOf(customers[0], function (error, subs) {
        expect(subs).to.deep.equal([services[2].name, services[1].name]);
        done();
      });

    });
  });

  it('can purchase by passing card info', function(done){
    subscription.purchase.extension(services[1].name, { customer: customers[0], card: fixtures.card, length: '1 year' }, function (error, purchase) {
      if (error) return done(error);

      expect(purchase.amount).to.equal(36000);
      expect(purchase.expire_ts).to.be.above(Date.now() + 32140800000 - 10000);
      done();

    });
  });

});
