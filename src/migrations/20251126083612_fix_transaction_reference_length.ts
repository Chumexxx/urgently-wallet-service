import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Step 1: Drop the old unique constraint (it has the old CHAR(36) type)
  await knex.schema.alterTable('transactions', (table) => {
    table.dropUnique(['reference']); // This removes the old unique index
  });

  // Step 2: Change column type from CHAR(36) to VARCHAR(64)
  await knex.schema.alterTable('transactions', (table) => {
    table.string('reference', 64).notNullable().alter({ alterType: true });
  });

  // Step 3: Re-add the unique constraint (now on VARCHAR(64))
  await knex.schema.alterTable('transactions', (table) => {
    table.unique('reference');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('transactions', (table) => {
    table.dropUnique(['reference']);
    table.uuid('reference').notNullable().alter({ alterType: true });
    table.unique('reference');
  });
}