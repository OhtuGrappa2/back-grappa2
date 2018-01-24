import test from 'ava';
import { deleteFromDb } from '../utils';

const knex = require('../../src/db/connection');

const personService = require('../../src/services/PersonService');

test.before(async () => {
    await knex.migrate.latest();
    await deleteFromDb();
    await knex.seed.run();
});

test.serial('savePerson returns new personId', async (t) => {
    const newPerson = {
        shibbolethId: 'zippoletid10',
        email: 'firstname.lastname@gmail.com',
        firstname: 'New',
        lastname: 'Person',
        isRetired: false
    };
    const returnValue = await personService.savePerson(newPerson);
    t.true(returnValue.personId > 0);
});

test.serial('savePersonRole return new personRoleId', async (t) => {
    const newPersonRole = {
        personId: 1,
        roleId: 1,
        programmeId: 1
    }
    const returnValue = await personService.savePersonRole(newPersonRole);
    t.truthy(returnValue);
});

test.serial('updatePerson', async (t) => {
    const updatedPersonData = {
        personId: 1,
        shibbolethId: 'zippoletid11',
        email: 'firstname.lastname@gmail.com',
        firstname: 'Updated',
        lastname: 'Person',
        isRetired: false
    }
    const returnValue = await personService.updatePerson(updatedPersonData);
    t.deepEqual(returnValue, 1);
});
