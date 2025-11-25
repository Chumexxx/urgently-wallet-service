import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('wallet_id').notNullable();
    table.enum('type', ['credit', 'debit']).notNullable();
    table.enum('category', ['funding', 'transfer', 'withdrawal']).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.decimal('balance_before', 15, 2).notNullable();
    table.decimal('balance_after', 15, 2).notNullable();
    table.uuid('reference').notNullable().unique();
    table.string('description', 255);
    table.uuid('recipient_wallet_id').nullable();
    table.enum('status', ['pending', 'success', 'failed']).defaultTo('pending');
    table.text('metadata').nullable();
    table.timestamps(true, true);
    
    table.foreign('wallet_id').references('id').inTable('wallets').onDelete('CASCADE');
    table.foreign('recipient_wallet_id').references('id').inTable('wallets').onDelete('SET NULL');
    table.index('wallet_id');
    table.index('reference');
    table.index('type');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('transactions');
}