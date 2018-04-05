const knex = require('../db/connection').getKnex()
const roleService = require('./RoleService')

const personSchema = [
    'person.personId',
    'shibbolethId',
    'email',
    'firstname',
    'lastname',
    'isRetired',
    'studentNumber',
    'phone'
]

export function getAllPersons() {
    return knex.select(personSchema).from('person')
}

export function getPersonsWithRole(roleId) {
    return knex.table('person').distinct('person.personId')
        .innerJoin('personWithRole', 'person.personId', '=', 'personWithRole.personId')
        .where('roleId', roleId)
        .select(personSchema)
}

export function getPersonsWithRoleInStudyfield(roleId, programmeId) {
    return knex.table('person').distinct('person.personId')
        .join('personWithRole', 'person.personId', '=', 'personWithRole.personId')
        .where('roleId', roleId)
        .where('personWithRole.programmeId', programmeId)
        .select(personSchema)
}

export function getProgrammePersons(programmeId) {
    return knex('person')
        .join('personWithRole', 'person.personId', 'personWithRole.personId')
        .join('role', 'personWithRole.roleId', 'role.roleId')
        .where('programmeId', programmeId)
        .whereIn('role.name', ['manager', 'print_person', 'resp_professor'])
}

export async function getLoggedPerson(req) {
    if (req.decodedToken) {
        const { userId } = req.decodedToken
        return getPersonByShibbolethId(userId)
    }

    return null
}

export const getPersonById = id => knex.select().from('person').where('personId', id).first()

export const getPersonByShibbolethId = shibbolethId =>
    knex.select().from('person').where('shibbolethId', shibbolethId).first()

export async function savePerson(personData) {
    // If already exists then return that person
    let person = await knex.select(personSchema).from('person').where({
        email: personData.email,
        firstname: personData.firstname,
        lastname: personData.lastname
    }).first()
    if (!person) {
        const personIds = await knex('person')
            .returning('personId')
            .insert(personData)
        const personId = personIds[0]
        person = await getPersonById(personId)
    }
    return person
}

export const updatePerson = async (personData) => {
    const personId = await knex('person')
        .returning('personId')
        .where('personId', '=', personData.personId)
        .update(personData)
        .then(personId => personId[0])
        .catch((error) => {
            throw error
        })
    return getPersonById(personId)
}

export const getPersonsWithAgreementPerson = agreementpersonId => knex.select(personSchema).from('person')
    .innerJoin('agreement', 'agreement.authorId', '=', 'person.personId')
    .innerJoin('agreementPerson', 'agreementPerson.agreementId', '=', 'agreement.agreementId')
    .innerJoin('personWithRole', 'personWithRole.personRoleId', '=', 'agreementPerson.personRoleId')
    .where('personWithRole.personId', agreementpersonId)

export const getPersonsWithAgreementInStudyfield = programmeId => knex.select(personSchema).from('person')
    .innerJoin('agreement', 'agreement.authorId', '=', 'person.personId')
    .innerJoin('agreementPerson', 'agreementPerson.agreementId', '=', 'agreement.agreementId')
    .innerJoin('personWithRole', 'personWithRole.personRoleId', '=', 'agreementPerson.personRoleId')
    .where('personWithRole.programmeId', programmeId)

export const createOutsidePerson = async (firstname, lastname, email, programmes) => {
    try {
        const person = await savePerson({ firstname, lastname, email })
        const roleId = await roleService.getRoleId('grader')
        const personRoles = await Promise.all(programmes
            .map(programmeId =>
                roleService.savePersonRole({
                    roleId,
                    personId: person.personId,
                    programmeId
                })
            ))
        return { person, personRoles }
    } catch (error) {
        // console.log(error)
        return { errorMsg: 'Failed to create outside person with roles', error }
    }
}
