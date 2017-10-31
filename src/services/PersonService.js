require('babel-polyfill');
const knex = require('../../connection');

export async function savePerson(personData) {
    return await knex('person')
        .returning('personId')
        .insert(personData)
        .then(personId => personId[0])
        .catch(err => err);
}

export async function savePersonRole(personRoleData) {
    return await knex('personRoleField')
        .returning('personRoleId')
        .insert(personRoleData)
        .then(personRoleId => personRoleId[0])
        .catch(err => err);
}

export async function updatePerson(personData) {
    return await knex('person')
    .returning('personId')
    .where('personId', '=', personData.personId)
    .update(personData)
    .then(personId => personId[0])
    .catch(err => err);
}