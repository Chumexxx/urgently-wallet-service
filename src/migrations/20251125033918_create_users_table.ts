import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.string('email', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('phone', 20).notNullable().unique();
    table.boolean('is_blacklisted').defaultTo(false);
    table.timestamps(true, true);
    
    table.index('email');
    table.index('phone');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}