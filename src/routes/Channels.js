const { Router } = require('express')
const express = require('express')
const router = express.Router()
const controller = require("../controllers/ChannelsController");

router.get('/', controller.view)
router.post('/list', controller.listUsers)
router.post('/add', controller.addUser)
router.post('/pop',controller.popUser)
router.post('/new', controller.newChannel)
router.post('/update_token', controller.updateToken)

module.exports = router