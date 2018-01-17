const mailer = require('../util/mailer');

const emailDraftService = require('../services/EmailDraftService');
const personService = require('../services/PersonService');

// TODO: Fix for all envs.
const SERVER_ADDRESS = 'http://localhost:3000/v2';

export async function newThesisAddedNotifyRespProf(programmeId) {
    const respProfs = await personService.getPersonsWithRoleInStudyfield(4, programmeId);
    const mails = respProfs.map(prof => sendMail('SupervisingProfessorNotification', prof.email, programmeId));

    return Promise.all(mails);
}

async function sendMail(type, email, programmeId) {
    const emailDraft = await emailDraftService.getEmailDraft(type, programmeId);

    try {
        await mailer.sendEmail(email, emailDraft.title, emailDraft.body);
    } catch (error) {
        console.error('Email send error', error);
    }
}

export async function sendInvite(emailInvite, type, programmeId) {
    const draft = await emailDraftService.getEmailDraft('InviteAuthorToLogin', programmeId);
    const body = draft.body.replace('$LOGIN_URL$', `${SERVER_ADDRESS}/invite/${type}/${emailInvite.token}`);

    try {
        await mailer.sendEmail(emailInvite.email, draft.title, body);
    } catch (error) {
        console.error('Email send error', error);
    }
}
