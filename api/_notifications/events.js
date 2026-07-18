/** Notification event types — publishing triggers events; channels subscribe independently. */

export const NOTIFICATION_EVENTS = {
  FREE_PICK_PUBLISHED: 'free_pick_published',
  PREMIUM_PICK_PUBLISHED: 'premium_pick_published',
  NO_FREE_PICK_TODAY: 'no_free_pick_today',
}

export const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  PUSH: 'push',
  SMS: 'sms',
  BROWSER: 'browser',
}
