import Checkit from 'checkit';

const thesisService = require('../services/ThesisService');
const agreementService = require('../services/AgreementService');
const attachmentService = require('../services/AttachmentService');
const personService = require('../services/PersonService');
const roleService = require('../services/RoleService');
const programmeService = require('../services/ProgrammeService');
const studyfieldService = require('../services/StudyfieldService');
const notificationService = require('../services/NotificationService');
const emailService = require('../services/EmailService');
const emailInviteService = require('../services/EmailInviteService');

const checkit = new Checkit({
    authorEmail: ['required', 'email'],
    title: 'required',
    urkund: ['required', 'url'],
    grade: 'required',
    studyfieldId: 'required'
});

export async function getTheses(req, res) {
    const programmeRoles = ['resp_professor', 'print-person', 'manager'];

    const user = await personService.getLoggedPerson(req);
    let theses = [];
    let newTheses = [];

    const rolesInProgrammes = await roleService.getUsersRoles(user);
    if (rolesInProgrammes.find(item => item.role.name === 'admin')) {
        // As an admin, get all theses
        const allTheses = await thesisService.getAllTheses();
        res.status(200).json(allTheses).end();
        return;
    }

    rolesInProgrammes.forEach(async (item) => {
        if (programmeRoles.includes(item.role.name)) {
            // ... As resp_professor, manager or print-person theses in programme
            newTheses = await thesisService.getThesesInProgramme(item.programme.programmeId);
            theses = [...new Set([...theses, ...newTheses])];
        }
    });

    const thesesAsAgreementPerson = await thesisService.getThesesByAgreementPerson(user.personId);
    const thesesAsAuthor = await thesisService.getThesesByPersonId(user.personId);

    theses = [...theses, ...thesesAsAgreementPerson, ...thesesAsAuthor];

    // Remove duplicates
    const response = [];
    theses.forEach((thesis) => {
        if (!response.find(item => item.thesisId === thesis.thesisId)) {
            response.push(thesis);
        }
    });

    res.status(200).json(response).end();
}

export async function saveThesisForm(req, res) {
    const thesis = JSON.parse(req.body.json);
    try {
        await checkit.run(thesis);
    } catch (error) {
        throw new Error('Posted thesis data is not valid');
    }

    // Order so that agreementId is available to save attachments.
    const agreement = await agreementService.createFakeAgreement();
    const attachments = await attachmentService.saveAttachmentFiles(req.files, agreement.agreementId);
    const studyfieldId = thesis.studyfieldId;
    const authorEmail = thesis.authorEmail;
    const agreementId = agreement.agreementId;

    agreement.studyfieldId = thesis.studyfieldId;

    delete thesis.authorFirstname;
    delete thesis.authorLastname;
    delete thesis.studyfieldId;
    // TODO: Add email to new email send table
    delete thesis.thesisEmails;
    delete thesis.authorEmail;

    if (thesis.graders) {
        updateGraders(thesis.graders, agreement);
        delete thesis.graders;
    }
    const savedThesis = await thesisService.saveThesis(thesis);

    // Agreement was missing the thesisId completing linking.
    agreement.thesisId = savedThesis.thesisId;
    const savedAgreement = await agreementService.updateAgreement(agreement);
    const roles = await roleService.getRolesForAllPersons();
    const programme = await programmeService.getStudyfieldsProgramme(studyfieldId);
    await emailService.newThesisAddedNotifyRespProf(programme.programmeId);
    await emailInviteService.createEmailInviteForThesisAuthor(authorEmail, agreementId, programme.programmeId);

    const response = {
        thesis: savedThesis,
        agreement: savedAgreement,
        attachments,
        roles
    };

    notificationService.createNotification('THESIS_SAVE_ONE_SUCCESS', req, agreement.programmeId);
    res.status(200).json(response);
}

export async function updateThesis(req, res) {
    const updatedFields = req.body;
    let thesis = await thesisService.getThesisById(updatedFields.thesisId);
    Object.keys(thesis).forEach((key) => {
        thesis[key] = updatedFields[key];
    });
    thesis = await thesisService.updateThesis(thesis);

    const graders = updatedFields.graders;
    const agreements = await agreementService.getAgreementsByThesisId(thesis.thesisId);
    // TODO: support multiple agreements on one thesis
    await updateGraders(graders, agreements[0]);

    const roles = await roleService.getRolesForAllPersons();
    const responseObject = { thesis, roles };
    res.status(200).json(responseObject).end();
}


const updateGraders = async (graders, agreement) => {
    // To unlink person and
    const agreementPersons = await roleService.getAgreementPersonsByAgreementId(agreement.agreementId);
    await Promise.all(agreementPersons.map(async (agreementPerson) => {
        const personRole = await roleService.getPersonRoleWithId(agreementPerson.personRoleId);
        if (!graders.find(grader => grader.personId == personRole.personId)) {
            await roleService.unlinkAgreementAndPersonRole(agreementPerson.agreementId, agreementPerson.personRoleId);
        }
    }));
    // If grader not in agreementperson, link them.
    await Promise.all(graders.map(async (grader) => {
        const personRole = await roleService.getPersonRole(grader.personId, agreement.studyfieldId, 'grader');
        if (personRole) {
            // If person exists as a grader and not already linked, link them
            if (!agreementPersons.find(agreementPerson => agreementPerson.personRoleId === personRole.personRoleId)) {
                roleService.linkAgreementAndPersonRole(agreement.agreementId, personRole.personRoleId);
            }
        } else {
            // If person has no grader role, make the person a grader and link them.
            const roleId = await roleService.getRoleId('grader');
            const studyfield = await studyfieldService.getStudyfield(agreement.studyfieldId);
            let personWithRole = {
                personId: grader.personId,
                programmeId: studyfield.programmeId,
                roleId
            };
            personWithRole = await roleService.savePersonRole(personWithRole);
            roleService.linkAgreementAndPersonRole(agreement.agreementId, personWithRole.personRoleId);
        }
    }));
};
