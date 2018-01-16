const knex = require('../db/connection');

const personService = require('./PersonService');

const notificationSchema = [
    'notificationId',
    'type',
    'userId',
    'timestamp',
    'programmeId'
];

export function getAllNotifications() {
    return knex.select(notificationSchema).from('notification');
}

export async function createNotification(type, req, programmeId) {
    const person = await personService.getLoggedPerson(req);
    const personId = person ? person.personId : null;

    return saveNotification(type, personId, programmeId);
}

export function saveNotification(type, user, programmeId) {
    return knex('notification').insert({ type, userId: user, programmeId });
}
