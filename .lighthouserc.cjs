module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['index.html'],
      numberOfRuns: 5,
      settings: {
        formFactor: 'mobile',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 1 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
        'largest-contentful-paint': [
          'warn',
          { maxNumericValue: 1200, aggregationMethod: 'median' },
        ],
        'first-contentful-paint': [
          'warn',
          { maxNumericValue: 1000, aggregationMethod: 'median' },
        ],
        'server-response-time': [
          'error',
          { maxNumericValue: 300, aggregationMethod: 'median' },
        ],
        'total-blocking-time': [
          'error',
          { maxNumericValue: 50, aggregationMethod: 'median' },
        ],
        'cumulative-layout-shift': [
          'error',
          { maxNumericValue: 0.02, aggregationMethod: 'median' },
        ],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouse',
    },
  },
}
