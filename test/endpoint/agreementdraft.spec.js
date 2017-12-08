import test from 'ava';
const request = require('supertest');
const express = require('express');
const agreementdrafts = require('../../src/routes/agreementDrafts');
const config = require('../../src/db/knexfile');

const makeApp = () => {
    const app = express();
    app.use('/agreement-drafts', agreementdrafts)
    return app;
}

test.beforeEach(async t => {
    const knex = require('knex')(config['test']);
    await knex.migrate.rollback().then(() => {
        console.log("Rollback happened")
        return;
    }).catch(err => {
        console.log(err);
    })
})

const agreementDraftWithoutId = {
    mainSupervisorId: 1,
    studentEmail: 'test@tets.com',
    studentFirstname: 'Test',
    studentLastname: 'User',
    studentNumber: ('012345678'),
    studentAddress: ('Helsinginkatu'),
    studentPhone: '050 1234567',
    studentMajor: 'Kemia',
    thesisTitle: 'Thesis Title',
    thesisStartDate: '6.5.2005',
    thesisCompletionEta: '1.2.2006',
    thesisPerformancePlace: 'paikka',
    studentGradeGoal: 5,
    studentTime: "1h viikossa",
    supervisorTime: "1h kuussa",
    intermediateGoal: "hmm",
    meetingAgreement: "juu",
    other: "uuu"
};

const agreementDraftWithId = {
    agreementDraftId: 1,
    mainSupervisorId: 1,
    studentEmail: 'test@tets.com',
    studentFirstname: 'Test',
    studentLastname: 'User',
    studentNumber: '012345678',
    studentAddress: 'Helsinginkatu',
    studentPhone: '050 1234567',
    studentMajor: 'Kemia',
    thesisTitle: 'Thesis Title',
    thesisStartDate: '6.5.2005',
    thesisCompletionEta: '1.2.2006',
    thesisPerformancePlace: 'paikka',
    studentGradeGoal: 5,
    studentTime: "1h viikossa",
    supervisorTime: "1h kuussa",
    intermediateGoal: "hmm",
    meetingAgreement: "juu",
    other: "uuu"
};

const agreementDraftPersons = [{
    agreementDraftId: 1,
    personRoleId: 1
}];

test('agreementDraft post & creates id', async t => {
    t.plan(2);
    const res = await request(makeApp())
        .post('/agreement-drafts')
        .send(agreementDraftWithoutId);
    t.is(res.status, 200);
    const body = res.body;
    const draft = agreementDraftWithId
    t.is(JSON.stringify(body), JSON.stringify(draft));
});

test('get agreementDraft by ID', async t => {
    t.plan(2);
    const draft = agreementDraftWithId;
    const draftPersons = [];
    const res = await request(makeApp())
        .get('/agreement-drafts/' + draft.agreementDraftId);
    t.is(res.status, 200);
    const body = res.body;

    t.is(JSON.stringify({ agreementDraft: body.agreementDraft, agreementDraftPersons: body.agreementDraftPersons }), 
        JSON.stringify({ agreementDraft: draft, agreementDraftPersons: [] }));
})

