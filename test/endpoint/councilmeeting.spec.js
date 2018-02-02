import test from 'ava';
import { initDb } from '../utils';

process.env.DB_SCHEMA = 'councilmeeting_test';

const request = require('supertest');
const express = require('express');
const councilmeetings = require('../../src/routes/councilmeeting');
const errorHandler = require('../../src/util/errorHandler');

const makeApp = (userId) => {
    const app = express();
    app.use('/councilmeetings', (req, res, next) => {
        req.session = {};
        req.session.user_id = userId;
        next();
    }, councilmeetings);
    app.use(errorHandler);
    return app;
};

test.before(async () => {
    await initDb();
});

const numberFromTo = (from, to) => Math.round(Math.random() * (to - from)) + from;

const generateCouncilMeeting = () => ({
    date: `${numberFromTo(2030, 2050)}-0${numberFromTo(1, 3)}-17T22:00:00.000Z`,
    instructorDeadline: `${numberFromTo(2000, 2020)}-0${numberFromTo(1, 3)}-10T22:00:00.000Z`,
    studentDeadline: `${numberFromTo(2000, 2020)}-0${numberFromTo(1, 3)}-03T22:00:00.000Z`,
    programmes: [1]
});

const validPost = async (t, app, data) => {
    const res = await request(app)
        .post('/councilmeetings')
        .send(data);
    t.is(res.status, 200,
        `endpoint did not accept data: ${JSON.stringify(data)}`);

    const responseMeeting = Object.assign({}, res.body);
    t.truthy(responseMeeting.councilmeetingId,
        'responseMeeting does not have id');

    delete responseMeeting.councilmeetingId;
    t.deepEqual(data, responseMeeting,
        'data posted is not equal to response');
    return res.body
};

const validGet = async (t, app) => {
    const res = await request(app)
        .get('/councilmeetings');
    t.is(res.status, 200);
    return res.body
};

const validDelete = async (t, app, id) => {
    const res = await request(app)
        .del(`/councilmeetings/${id}`);
    t.is(res.status, 200);
    return res.body
};

const validUpdate = async (t, app, id) => {
    const councilMeeting2 = generateCouncilMeeting();
    const res = await request(app)
        .put(`/councilmeetings/${id}`)
        .send(councilMeeting2);
    t.is(res.status, 200,
        `endpoint did not accept data: ${JSON.stringify(councilMeeting2)}`);

    const responseMeeting = Object.assign({}, res.body);
    t.truthy(responseMeeting.councilmeetingId,
        'responseMeeting does not have id');

    delete responseMeeting.councilmeetingId;
    t.deepEqual(councilMeeting2, responseMeeting,
        'data put is not equal to response');
    return res.body
};

test('councilmeeting post returns the councilmeeting', async (t) => {
    t.plan(3);
    const councilMeeting = generateCouncilMeeting();
    const app = makeApp(1);
    await validPost(t, app, councilMeeting);
});

test('councilmeeting get', async (t) => {
    t.plan(7);
    const councilMeeting = generateCouncilMeeting();
    const app = makeApp(1);

    await validPost(t, app, councilMeeting);

    const responseMeetingArray = await validGet(t, app);

    t.truthy(responseMeetingArray.length > 0,
        `responseMeetingArray is ${typeof responseMeetingArray}, maybe its length is 0`);

    const responseMeeting = responseMeetingArray.find(meeting =>
        Object.keys(councilMeeting).find(key =>
            councilMeeting[key] === meeting[key])
    );
    t.truthy(responseMeeting,
        `councilMeeting was not found in responseMeetingArray, ${responseMeeting}`);

    delete responseMeeting.councilmeetingId;
    t.deepEqual(responseMeeting, councilMeeting,
        'data posted is not equal to response')
});

test('councilmeeting delete returns id', async (t) => {
    t.plan(7);
    const councilMeeting = generateCouncilMeeting();
    const app = makeApp(1);
    const responseMeeting = await validPost(t, app, councilMeeting);
    const councilMeetingId = responseMeeting.councilmeetingId;
    const response = await validDelete(t, app, councilMeetingId);
    t.is(Number(response.councilmeetingId), councilMeetingId);
    const meetings = await validGet(t, app);
    t.falsy(meetings.find(meeting => meeting.councilmeetingId === councilMeetingId),
        'Meeting was still found with get')
});

test('councilmeeting update', async (t) => {
    t.plan(10);
    const councilMeeting = generateCouncilMeeting();
    const app = makeApp(1);
    const responseMeeting = await validPost(t, app, councilMeeting);
    const councilMeetingId = responseMeeting.councilmeetingId;

    const updated = await validUpdate(t, app, councilMeetingId);
    t.notDeepEqual(updated, responseMeeting);
    t.is(updated.councilmeetingId, councilMeetingId);
    const meetings = await validGet(t, app);
    const foundMeeting = meetings.find(meeting => meeting.councilmeetingId === councilMeetingId);
    t.deepEqual(foundMeeting, updated)
});


test('councilmeeting with invalid data cannot be created', async (t) => {
    t.plan(3);
    const app = makeApp(1);
    //const getBefore = await validGet(t, app);

    const badMeeting1 = {
        date: '2017-02-31T22:00:00.000Z', // Invalid date
        instructorDeadline: '2016-01-10T22:00:00.000Z',
        studentDeadline: '2016-01-03T22:00:00.000Z',
        programmes: [1]
    };

    const badMeeting2 = {
        date: '2015-02-15T22:00:00.000Z', // Date before deadlines
        instructorDeadline: '2016-01-10T22:00:00.000Z',
        studentDeadline: '2016-01-03T22:00:00.000Z',
        programmes: [1]
    };

    const badMeeting3 = {
        date: '2017-02-15T22:00:00.000Z',
        instructorDeadline: '2016-01-10T22:00:00.000Z',
        studentDeadline: '2016-01-03T22:00:00.000Z',
        programmes: [143729] // Invalid programme
    };
    const responses = await Promise.all([
        request(app)
            .post('/councilmeetings')
            .send(badMeeting1),
        request(app)
            .post('/councilmeetings')
            .send(badMeeting2),
        request(app)
            .post('/councilmeetings')
            .send(badMeeting3)
    ]);
    responses.forEach((response, index) => {
        t.is(response.status, 500,
            `Response wasn't 500 at request number ${index}`)
    })

    //const getAfter = await validGet(t, app)
    /*console.log('--------------------------')
    console.log(JSON.stringify(getBefore));
    console.log('--------------------------')
    console.log(JSON.stringify(getAfter));
    console.log('--------------------------')
    t.deepEqual(getBefore, getAfter)*/
});
