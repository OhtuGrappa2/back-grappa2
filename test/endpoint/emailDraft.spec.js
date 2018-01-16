import test from 'ava';
const request = require('supertest');
const express = require('express');
const emailDrafts = require('../../src/routes/emailDrafts');
const knex = require('../../src/db/connection');

const makeApp = (userId) => {
    const app = express();
    app.use('/emailDrafts', (req, res, next) => {
        req.session = {};
        req.session.user_id = userId;
        next();
    }, emailDrafts);
    return app;
};

test.before(async t => {
    await knex.migrate.latest();
    await knex.seed.run();
});

test('emailDrafts get all', async t => {
    t.plan(3);
    const res = await request(makeApp(1)).get('/emailDrafts');
    t.is(res.status, 200);
    const emailDrafts = res.body;
    t.truthy(emailDrafts.length > 0);
    t.truthy(emailDrafts[0].type);
});

test('emailDraft update', async t => {
    const emailDraft = await knex.insert({ type: 'endpointTestUpdate', title: 'foo', body: 'bar' })
        .into('emailDraft')
        .returning('emailDraftId');
    const draftId = emailDraft[0];

    const res = await request(makeApp(1))
        .post(`/emailDrafts/${draftId}`)
        .send({ title: 'test title', body: 'test body' });

    t.is(res.status, 200);
});

test('emailDraft save', async t => {
    const res = await request(makeApp(1))
        .post(`/emailDrafts`)
        .send({ type: 'endpointTest', title: 'test title', body: 'test body' });

    t.is(res.status, 200);
    t.truthy(res.body.emailDraftId);
});

test('emailDraft delete', async t => {
    const emailDraft = await knex.insert({ type: 'endpointTestDelete', title: 'foo', body: 'bar' })
        .into('emailDraft')
        .returning('emailDraftId');
    const draftId = emailDraft[0];
    const res = await request(makeApp(1))
        .delete(`/emailDrafts/${draftId}`);

    t.is(res.status, 200);
});

test('programme is saved', async t => {
    const res = await request(makeApp(1))
        .post(`/emailDrafts`)
        .send({ type: 'endpointTest', title: 'test title', body: 'test body', programme: 1 });

    t.is(res.status, 200);
    const emailDraftId = res.body.emailDraftId;

    const draft = await knex('emailDraft').select().where('emailDraftId', emailDraftId).first();
    t.is(draft.programme, 1);
});
