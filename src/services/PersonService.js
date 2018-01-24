const knex = require('../db/connection');

const personSchema = [
    'person.personId',
    'shibbolethId',
    'email',
    'firstname',
    'lastname',
    'isRetired',
    'studentNumber',
    'phone'
];

export function getAllPersons() {
    return knex.select(personSchema).from('person');
}

export function getPersonsWithRole(roleId) {
    return knex.table('person').distinct('person.personId')
        .innerJoin('personWithRole', 'person.personId', '=', 'personWithRole.personId')
        .where('roleId', roleId)
        .select(personSchema);
}

export function getPersonsWithRoleInStudyfield(roleId, programmeId) {
    return knex.table('person').distinct('person.personId')
        .join('personWithRole', 'person.personId', '=', 'personWithRole.personId')
        .where('roleId', roleId)
        .where('personWithRole.programmeId', programmeId)
        .select(personSchema);
}

export async function getLoggedPerson(req) {
    if (req.session.user_id) {
        const userId = req.session.user_id;
        return getPersonById(userId);
    } else if (req.headers.uid) {
        const shibbolethId = req.headers.uid;
        return getPersonByShibbolethId(shibbolethId);
    }
}

export const getPersonById = id => knex.select().from('person').where('personId', id).first();

export const getPersonByShibbolethId = shibbolethId => knex.select().from('person').where('shibbolethId', shibbolethId).first();

export async function savePerson(personData) {
    // If already exists then return that person
    let person = await knex.select(personSchema).from('person').where({
        email: personData.email,
        firstname: personData.firstname,
        lastname: personData.lastname
    }).first();
    if (!person) {
        const personIds = await knex('person')
            .returning('personId')
            .insert(personData);
        const personId = personIds[0];
        person = knex.select(personSchema).from('person').where('personId', personId).first();
    }
    return person;
}

export function savePersonRole(personRoleData) {
    return knex('personWithRole')
        .returning('personRoleId')
        .insert(personRoleData)
        .then(personRoleId => personRoleId[0])
        .catch((error) => {
            throw error
        });
}

export function updatePerson(personData) {
    return knex('person')
        .returning('personId')
        .where('personId', '=', personData.personId)
        .update(personData)
        .then(personId => personId[0])
        .catch((error) => {
            throw error
        });
}

export const getPersonsWithAgreementPerson = agreementpersonId => knex.select(personSchema).from('person')
    .innerJoin('agreement', 'agreement.authorId', '=', 'person.personId')
    .innerJoin('agreementPerson', 'agreementPerson.agreementId', '=', 'agreement.agreementId')
    .innerJoin('personWithRole', 'personWithRole.personRoleId', '=', 'agreementPerson.personRoleId')
    .where('personWithRole.personId', agreementpersonId);

export const getPersonsWithAgreementInStudyfield = programmeId => knex.select(personSchema).from('person')
    .innerJoin('agreement', 'agreement.authorId', '=', 'person.personId')
    .innerJoin('agreementPerson', 'agreementPerson.agreementId', '=', 'agreement.agreementId')
    .innerJoin('personWithRole', 'personWithRole.personRoleId', '=', 'agreementPerson.personRoleId')
    .where('personWithRole.programmeId', programmeId);

export const getPersonsAsAgreementPersonInStudyfield = programmeId => knex.select(personSchema).from('person')
    .innerJoin('personWithRole', 'personWithRole.personId', '=', 'person.personId')
    .where('personWithRole.programmeId', programmeId);

export const getPersonByPersonRoleId = personRoleId => knex.select().from('person')
    .innerJoin('personWithRole', 'person.personId', '=', 'personWithRole.personId')
    .where('personRoleId', personRoleId)
    .then(persons => persons[0])
    .catch((error) => {
        console.log(error);
        throw error;
    });

export const getAgreementPersonsByPersonRoleId = personRoleId => knex.select().from('agreementPerson')
    .where('personRoleId', personRoleId)
    .then(persons => persons);
