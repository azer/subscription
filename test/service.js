var subscription = require("./subscription");
var fixtures = require("./fixtures");
var services = fixtures.serviceOptions();

describe('.define', function(){
  it('defines a new type of product or service', function(done){
    subscription.service.define(services[0].name, { price: 1000, currency: 'usd', period: '1 month' }, function (error, service) {
      if (error) return done(error);
      expect(service.name).to.equal(services[0].name);
      expect(service.period).to.equal(2678400000);
      expect(service.currency).to.equal(services[0].currency);
      expect(subscription.priceOf(service, '1 month')).to.equal(1000);
      expect(subscription.priceOf(service, '3 months and 2 weeks')).to.equal(3000);
      expect(subscription.priceOf(service, '1 year')).to.equal(12000);
      done();
    });
  });
});

describe('.get', function(){
  it('returns specified service record', function(done){
    subscription.service.get(services[0].name, function (error, service) {
      if (error) return done(error);
      expect(service.name).to.equal(services[0].name);
      expect(service.period).to.equal(2678400000);
      expect(service.currency).to.equal(services[0].currency);
      expect(subscription.priceOf(service, '1 month')).to.equal(1000);
      expect(subscription.priceOf(service, '3 months and 2 weeks')).to.equal(3000);
      expect(subscription.priceOf(service, '1 year')).to.equal(12000);
      done();
    });
  });
});

describe('.all', function(){
  it('lists all defined services', function(done){
    subscription.service.define(services[1].name, { price: 1000, currency: 'usd', period: '1 month' }, function (error, service) {
      if (error) return done(error);

      subscription.service.all(function (error, all) {
        if (error) return done(error);

        var keys = Object.keys(all);
        expect(keys.indexOf(services[0].name)).to.be.above(-1);
        expect(keys.indexOf(services[1].name)).to.be.above(-1);
        done();
      });
    });
  });
});
