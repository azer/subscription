var subscription = require("./subscription");
var fixtures = require("./fixtures");

describe('balance', function(){
  var customer = fixtures.customers()[0];

  it('returns zero if customer has no balance records', function(done){
    subscription.balance(customer, function (error, value) {
      if (error) return done(error);
      expect(value).to.equal(0);
      done();
    });
  });

  it('adds/substracts later', function(done){
    subscription.balance.set(customer, 1000, function (error) {
      if (error) return done(error);

      subscription.balance.update(customer, +25, function (error) {
        if (error) return done(error);

        subscription.balance.update(customer, -125, function (error) {
          if (error) return done(error);

          subscription.balance(customer, function (error, balance) {
            if (error) return done(error);
            expect(balance).to.equal(900);
            done();
          });
        });
      });
    });
  });

});

describe('balance.charge', function(){
  var customer = fixtures.customers()[0];

  it('substracts the maxium amount of money and returns remaining amount if there is', function(done){
    subscription.balance.set(customer, 150, function (error) {
      if (error) return done(error);

      subscription.balance.charge(customer, 90, function (error, rest) {
        if (error) return done(error);

        expect(rest).to.equal(0);

        subscription.balance.charge(customer, 260, function (error, rest) {
          if (error) return done(error);

          expect(rest).to.equal(200);

          subscription.balance(customer, function (error, balance) {
            if (error) return done(error);

            expect(balance).to.equal(0);

            done();
          });
        });
      });
    });
  });

});
