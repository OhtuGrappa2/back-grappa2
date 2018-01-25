import test from 'ava';
import sinon from 'sinon';

import router from '../../src/routes/theses.js';
import app from '../../index';

const reqres = require('reqres');
const request = require('supertest');

let req;
let res;
let thesisController;
let service;

test.beforeEach(async t => {
    req = reqres.req();
    res = reqres.res();
    service = require('../../src/services/ThesisService');
    thesisController = require('../../src/controllers/ThesisController');
});


test.cb('getThesisById', t => {
    const stub = sinon.stub(service, 'getThesisById');
    req.params.id = 123;
    stub.returns({ test: 'xoxo' });
    stub.withArgs(req.params.id).returns({ test: 'ok' });
    thesisController.service = service;
    thesisController.getThesisById(req, res)
        .then(() => {
            t.is(stub.calledOnce, true, 'thesisById is called once');
            t.is(stub.calledWith(req.params.id), true, 'thesisById is called with correct id');
            t.is(res.status.calledWith(200), true, 'thesisById returns status 200');
            t.is(res.json.calledWith({ test: 'ok' }), true, 'thesisById returns correct information');
            t.end();
        });
    service.getThesisById.restore();
});

test.cb('getTheses returns correct information', t => {
    const stub = sinon.stub(service, 'getAllTheses');
    stub.returns({ test: 'xoxo' });
    thesisController.service = service;
    thesisController.getTheses(req, res)
        .then(() => {
            t.is(stub.calledOnce, true, 'getAllTheses is called once');
            t.is(res.status.calledWith(200), true, 'getAllTheses returns status 200');
            t.is(res.json.calledWith({ test: 'xoxo' }), true, 'getAllTheses returns correct information');
            t.end();
        });
    service.getAllTheses.restore();
});

test('saveThesisForm calls services method', async t => {
    const body ={
        thesisTitle: 'Annin Grady',
        urkund: 'http://',
        grade: 4,
        userId: 1
    };
    req.body = body;
    const spy = sinon.spy(service, 'saveThesis');
    thesisController.saveThesisForm(req, res).then((response) => {
        t.is(spy.calledOnce, true, 'saveThesisForm calls services method saveThesis');
    })

});
