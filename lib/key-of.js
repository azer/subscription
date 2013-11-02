var prefix = 'subscription/';

module.exports = keyOf;

function keyOf (options) {
  if (options.customer && options.service)
    return prefix + options.customer + '/charges/' + options.service;

  if (options.service) return prefix + 'services/' + options.service;

  if (options.services) return prefix + 'services';

  if (options.subscriptionsOf) return prefix + options.subscriptionsOf + '/subscriptions';

  if (options.balance) return prefix + options.balance + '/balance';
}
