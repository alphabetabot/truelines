/**
 * Legacy URL for external schedulers (e.g. cron-job.org).
 * Replaced by /api/cron-posts?evening=true — kept so old jobs do not 404.
 */
import cronPosts from './cron-posts.js'

export default async function handler(req, res) {
  const query = { ...req.query, evening: 'true' }
  return cronPosts({ ...req, query }, res)
}
