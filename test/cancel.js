var subscription = require("./subscription");
var fixtures = require("./fixtures");

describe('cancel', function(){
  var services, customers, tokens, purchase, purchases;
  var purchaseIndex = 0;

  before(function (done) {
    fixtures.services(function (error, _services) {
      if (error) return (error);

      services = _services;
      customers = fixtures.customers();

      fixtures.tokens(2)(function (error, _tokens) {
        if (error) return done(error);

        tokens = _tokens;

        fixtures.purchases(1, services, customers, tokens)(function (error, _purchases) {
          if (error) return done(error);

          purchases = _purchases;
          done();
        });
      });

    });
  });

  beforeEach(function(done){
    purchase = purchases[purchaseIndex++];
    done();
  });

  it('moves the money on unused part of the service to the available balance', function(done){
    subscription.cancel(purchase.customer, purchase.service, function (error, result) {
      subscription.charges.notExpired(purchase.customer, purchase.service, function (error, result) {
        if (error) return done(error);
        expect(result).to.deep.equal([]);

        subscription.charges.read(purchase.customer, purchase.service, function (error, result) {
          expect(result.length).to.equal(1);
          expect(result[0].cancelled).to.be.above(Date.now()-5000);;

          subscription.remaining(purchase.customer, purchase.service, function (error, result) {
            expect(result).to.equal(0);
            subscription.subscriptionsOf(purchase.customer, function (error, subs) {
              expect(subs).to.deep.equal([]);
              done();
            });
          });
        });
      });
    });
  });

});
