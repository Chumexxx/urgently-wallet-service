import db from '../config/database';

export async function setupTestDb() {
  try {
    await db.migrate.latest();
    console.log('Test database migrated');
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
}

export async function teardownTestDb() {
  try {
    await db.migrate.rollback();
    await db.destroy();
    console.log('Test database cleaned up');
  } catch (error) {
    console.error('Test database teardown failed:', error);
  }
}

export async function clearTestDb() {
  await db('transactions').del();
  await db('wallets').del();
  await db('users').del();
}