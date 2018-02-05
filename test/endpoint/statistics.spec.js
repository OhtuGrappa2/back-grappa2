import test from 'ava';
import { initDb } from '../utils';

process.env.DB_SCHEMA = 'statistics_test';

const request = require('supertest');
const express = require('express');
const statisctics = require('../../src/routes/statisctics');
const knex = require('../../src/db/connection').getKnex();

const makeApp = (userId) => {
    const app = express();
    app.use('/statistics', (req, res, next) => {
        req.session = {};
        req.session.user_id = userId;
        next();
    }, statisctics);
    return app;
};

test.before(async () => {
    await initDb();
});

test('statistics can be fetched', async (t) => {
    // Imported pre-grappa thesis
    const thesisId = await knex('thesis')
        .insert({ title: 'foo', printDone: true, grade: 'Laudatur' })
        .returning('thesisId');
    await knex('agreement')
        .insert({ thesisId: thesisId[0], studyfieldId: 1, completionEta: '2017-07-07' });

    // Grappa thesis
    const councilmeeting = await knex('councilmeeting').insert({ date: '2017-04-04' }).returning('councilmeetingId');
    const thesisId2 = await knex('thesis')
        .insert({ title: 'bar', printDone: true, grade: 'Lubenter Approbatur', councilmeetingId: councilmeeting[0] })
        .returning('thesisId');
    await knex('agreement').insert({ thesisId: thesisId2[0], studyfieldId: 1 });
    await knex('meetingProgramme').insert({ councilmeetingId: councilmeeting[0], programmeId: 1 });

    const res = await request(makeApp(1)).get('/statistics');

    const expectedResponse = [
        {
            studyfieldId: 1,
            year: 2017,
            grade: 'Laudatur',
            count: 1
        },
        {
            studyfieldId: 1,
            year: 2017,
            grade: 'Lubenter Approbatur',
            count: 1
        }
    ];

    t.is(res.status, 200);
    t.deepEqual(res.body, expectedResponse);
});
