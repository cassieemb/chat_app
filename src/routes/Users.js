const { Router } = require('express')
const express = require('express')
const router = express.Router()
const controller = require("../controllers/UserController");

router.get('/', controller.view)
router.post('/sign_up', controller.signUp)
router.post('/sign_in',controller.signIn)

module.exports = router