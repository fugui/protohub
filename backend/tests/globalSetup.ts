/**
 * Global test setup for Vitest
 * Ensures database is properly initialized before all tests
 */

import { beforeAll } from 'vitest';
import { getDatabase, initDatabase } from '../src/config/db';

beforeAll(() => {
  // Ensure database connection is initialized
  // This runs once before all test files
  getDatabase();

  // Initialize database schema if not already done
  // This ensures the database tables exist before tests run
  try {
    initDatabase();
  } catch (error) {
    // Database might already be initialized, ignore error
    console.log('Database initialization skipped:', (error as Error).message);
  }
});
