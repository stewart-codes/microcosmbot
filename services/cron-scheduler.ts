import cron from 'node-cron'
import { updateAllEntriesDirect } from './cron-jobs/update-all-entries'
import { configureBot } from './cron-jobs/configure-bot'

/**
 * Internal cron scheduler for self-hosted deployments.
 * Replaces Vercel's cron functionality by calling job functions directly.
 */

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
  // Skip in development mode (optional - remove if you want cron in dev)
  if (process.env.NODE_ENV === 'development') {
    console.log('[CRON] Skipping cron initialization in development mode')
    return
  }

  if(process.env.CRON_MODE!=='ON'){
    console.log('[CRON] Skipping cron initialization because CRON_MODE is not ON')
    return
  }

  console.log('[CRON] Initializing cron jobs...')

  // Job 1: Update all entries - runs every 2 hours (same as Vercel config)
  cron.schedule('0 */2 * * *', () => {
    console.log('[CRON] Running: update-all-entries')
    const startTime = Date.now()
    updateAllEntriesDirect()
      .then(() => {
        console.log(
          '[CRON] Updated all entries successfully in',
          Date.now() - startTime,
          'ms'
        )
      })
      .catch((err) => {
        console.error('[CRON] Error in update-all-entries:', err)
      })
  })

  // Job 2: Bot config - runs every 30 minutes (same as Vercel config)
  cron.schedule('*/30 * * * *', () => {
    const startTime = Date.now()
    console.log('[CRON] Running: configure-bot')
    configureBot()
      .then(() => {
        console.log(
          '[CRON] Configured bot successfully in',
          Date.now() - startTime,
          'ms'
        )
      })
      .catch((err) => {
        console.error('[CRON] Error in configuring bot:', err)
      })
  })

  console.log('[CRON] Cron jobs initialized successfully')
  console.log('[CRON] - update-all-entries: 0 */2 * * * (every 2 hours)')
  console.log('[CRON] - configure-bot: */30 * * * * (every 30 minutes)')
}

/**
 * Stops all cron jobs (useful for graceful shutdown)
 */
export function stopCronJobs(): void {
  cron.getTasks().forEach((task) => {
    task.stop()
  })
  console.log('[CRON] All cron jobs stopped')
}
