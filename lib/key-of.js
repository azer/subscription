module.exports = keyOf;

function keyOf (options) {
  if (options.customer && options.charges)
    return options.customer + '/charges/' + options.charges;

  if (options.subscription) return 'subscriptions/' + options.subscription;

  if (options.subscriptions) return options.subscriptions + '/subscriptions';
}
