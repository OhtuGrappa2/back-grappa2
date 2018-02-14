import test from 'ava'
import { initDb } from '../utils'

process.env.DB_SCHEMA = 'persons_test'

const request = require('supertest')
const express = require('express')
const persons = require('../../src/routes/persons')
const knex = require('../../src/db/connection').getKnex()
const errorHandler = require('../../src/util/errorHandler')

const makeApp = (userId) => {
    const app = express()
    app.use('/persons', (req, res, next) => {
        req.session = {}
        req.session.user_id = userId
        next()
    }, persons)

    app.use(errorHandler)
    return app
}

test.before(async () => {
    await initDb()
})

test('person get all for admin', async (t) => {
    t.plan(3)

    const allPersons = await knex('person').select()

    const res = await request(makeApp(1))
        .get('/persons')
    t.is(res.status, 200)
    const { persons, roles } = res.body
    t.truthy(roles.length > 10)
    t.is(persons.length, allPersons.length + 1) // Test below creates new person
})

test('person get all for student', async (t) => {
    t.plan(3)

    const person = await knex('person').insert({ email: 'ei@ole.com' }).returning('personId')
    const personId = person[0]
    const res = await request(makeApp(personId)).get('/persons')

    t.is(res.status, 200)
    const { persons, roles } = res.body

    t.truthy(roles.length > 10)
    t.is(persons.length, 5)
})

test('manager can get thesis authors', async (t) => {
    const res = await request(makeApp(2)).get('/persons')

    t.is(res.status, 200)
    t.is(res.body.persons.length, 6)
})
