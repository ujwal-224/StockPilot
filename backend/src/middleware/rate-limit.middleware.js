const buckets = new Map();

export const rateLimit = ({ windowMs, max, key = (req) => req.ip }) => (req, res, next) => {
  const now = Date.now();
  const bucketKey = key(req);
  const current = buckets.get(bucketKey);
  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return next();
  }
  current.count += 1;
  if (current.count > max) {
    res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
  }
  return next();
};

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
cleanup.unref();
