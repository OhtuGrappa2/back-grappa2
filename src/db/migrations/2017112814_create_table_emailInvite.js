exports.up = (knex) => {
    return Promise.all([
        knex.schema.createTable('emailInvite', (table) => {
            table.increments('emailInviteId').primary();
            table.integer('agreement');
            table.integer('programme');
            table.integer('role');
            table.text('email').notNullable();
            table.text('token').notNullable().unique();
            table.text('type').notNullable();
            table.boolean('used').default(false);
            table.foreign('agreement').references('agreement.agreementId').onDelete('CASCADE');
            table.foreign('role').references('role.roleId').onDelete('CASCADE');
            table.foreign('programme').references('programme.programmeId').onDelete('CASCADE');
        })
    ]);
};

exports.down = async (knex) => {
    knex.schema.dropTable('emailInvite');
};
