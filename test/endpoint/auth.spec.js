import test from 'ava';
import sinon from 'sinon';
import { deleteFromDb } from '../utils';

const request = require('supertest');
const express = require('express');
const index = require('../../src/routes/index');
const shibboleth = require('../../src/routes/auth');
const knex = require('../../src/db/connection');
const auth = require('../../src/middleware/auth');

let i = 0;

const makeApp = (user, logout) => {
    const app = express();
    i += 1;

    const { email, id, surname, firstname } = user;

    app.use((req, res, next) => {
        req.session = { destroy: logout };
        req.headers['shib-session-id'] = 'test1234';
        req.headers['unique-code'] = `urn:schac:personalUniqueCode:int:studentID:helsinki.fi:123456789${i}`;
        req.headers.sn = surname;
        req.headers.givenname = firstname;
        req.headers.uid = id;
        req.headers.mail = email;
        req.headers.shib_logout_url = 'https://example.com/logout/';
        next();
    });
    app.use(auth.shibRegister);
    app.use('/', index);
    app.use(auth.checkAuth);
    app.use('/user', shibboleth);
    return app;
};

test.before(async () => {
    await knex.migrate.latest();
    await deleteFromDb();
    await knex.seed.run();
});

const numberFromTo = (from, to) => {
    return Math.round(Math.random() * (to - from)) + from
}

const generateUser = () => ({
    email: `sahko${numberFromTo(0, 10000)}@posti.fi`,
    id: `id${numberFromTo(0, 10000)}`,
    surname: `Sukunimi${numberFromTo(0, 10000)}`,
    firstname: `Etunimi${numberFromTo(0, 10000)}`
})

test('new shibboleth login creates a new user', async (t) => {
    t.plan(2);
    const user = generateUser();
    const app = makeApp(user);
    const res = await request(app)
        .get('/');
    t.is(res.status, 200);
    const persons = await knex('person').select();
    const foundPerson = persons.find(person =>
        person.shibbolethId === user.id &&
        person.email === user.email &&
        person.firstname === user.firstname &&
        person.lastname === user.surname
    )
    t.truthy(foundPerson,
        `person ${JSON.stringify(user)} was not found in persons`)
});

test('logout gives redirect address', async (t) => {
    t.plan(3);
    const user = generateUser();
    const sessionDestroyStub = sinon.stub();
    const app = makeApp(user, sessionDestroyStub);
    const res = await request(app)
        .get('/user/logout');

    t.is(res.status, 200);
    t.is(res.body.logoutUrl, 'https://example.com/logout/');
    t.truthy(sessionDestroyStub.calledOnce)
});

test('names are saved in correct encoding', async (t) => {
    const user = {
        email: 'encoding@example.com',
        id: 'encodingTest',
        surname: 'LemstrÃ¶m',
        firstname: 'Ã¶'
    }
    const app = makeApp(user);
    const res = await request(app)
        .get('/');

    t.is(res.status, 200);

    const person = await knex('person')
        .select()
        .where('email', 'encoding@example.com')
        .where('lastname', 'Lemström')
        .where('firstname', 'ö')
        .first();

    t.truthy(person);
});
