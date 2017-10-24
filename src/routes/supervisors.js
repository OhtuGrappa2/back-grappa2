
const router = require('express').Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const supervisorController = require('../controllers/SupervisorController');
    
router.get('/', (req, res) => {
    supervisorController.getAllSupervisors(req, res);
});

router.post('/', jsonParser, (req, res) => {
    supervisorController.saveSupervisor(req, res);
});
    
module.exports = router;