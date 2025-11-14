export const EMAIL_QUEUE = {
  // Queue name
  NAME: 'email',

  // Job names
  JOB: {
    SEND_EMAIL: 'sendEmail',
  },

  // Job options
  JOB_OPTIONS: {
    // Default job options
    DEFAULT: {
      attempts: 3, // Retry 3 times
      backoff: {
        type: 'exponential',
        delay: 5000, // 5 seconds
      },
      removeOnComplete: true,
      removeOnFail: true,
    },
  },

  // Concurrency settings
  CONCURRENCY: 5, // Process 5 emails in parallel

  // Rate limiting
  LIMITER: {
    max: 100, // Max emails
    duration: 1000, // Per second
  },
};
