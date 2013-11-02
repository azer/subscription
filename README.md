## subscription

NodeJS library to simplify paid subscriptions with Stripe and LevelDB.

## Install

```bash
$ npm install subscription
```

## Usage

Define a new subscription:

```js
subscription = require('subscription')('stripe-api-key', 'leveldb-path')

subscription.service.define('atlas magazine', { 'price': 1000, period: '1 month', currency: 'usd' }, function (error, atlas) {

  subscription.priceOf(atlas, '1 month')
  // => 1000 (Ten dollars)

    subscription.priceOf(atlas, '1 year')
  // => 12000 (One Twenty Dollars)

})
```

Purchase a subscription:

```js
options = {
  customer: 'customer@website.com',
  length: '1 year',
  token: 'tok_2oWvm6yRBFSMSh' // obtain it with Stripe.js
}

subscription.purchase('atlas magazine', options, function (error, purchase) {
  purchase.amount
  // => 12000

  purchase.expires_ts
  // => 1390912838816
})
```

Validate a subscription:

```js
subscription.has('azer@kodfabrik.com', 'atlas magazine', function (error, has) {
  has
  // => true
})
```

Get remaining subscription of a customer:

```js
subscription.remaining('azer@kodfabrik.com', 'atlas magazine', function (error, remaining) {
  remaining
  // => 8035200000 (3 months)
})
```

List subscriptions of a user:

```js
subscription.subscriptionsOf('azer@kodfabrik.com', function (error, subs) {
  subs
  // => ['atlas magazine']
})
```

Extend a subscription:

```js
subscription.purchase.extension('atlas magazine', { customer: 'azer@kodfabrik.com', length: '2 years', token: token }, function (error, purchase) {
  purchase.amount
  // => 24000
});
```

Upgrade a subscription:

```js
subscription.purchase.upgrade({ customer: 'hi@ada.io', from: 'cheaper', to: 'more expensive service', token: token }, function (error, purchase) {
  if (error) return callback(error);
});
```

## Debugging

Verbose:

```bash
$ DEBUG=subscription:* npm test
```

Less Verbose:

```bash
$ DEBUG=subscription:fatal,subscription:purchase
```

## Running Tests

```bash
$ API_KEY=sk_test_FIvJu2hkZszNIFzGgVNAqo2x npm test
```

## More Docs

* `test.js`
* [english-time](http://github.com/azer/english-time): The library used for parsing time inputs.
