/**
 * Express app entry
 * Configure all routes and middleware
 */

import { createApp, registerErrorHandlers, startServer } from './config';
import { registerRoutes } from './api/routes';
import { initCheckRules } from './services/rulesInit';

/**
 * Initialize app
 * Use a factory function to ensure each call returns a new app instance
 */
export function initApp() {
  const app = createApp();

  // Initialize check rules
  initCheckRules();

  // API v1 routes
  app.use('/api/v1', registerRoutes());

  // Register error handlers
  registerErrorHandlers(app);

  return app;
}

/**
 * Start server
 */
export { startServer };

// Default export for test compatibility
export default initApp();

