const { Router } = require('express')
const express = require('express')
const router = express.Router()
const controller = require("../controllers/UserController");

router.get('/', controller.view)
router.post('/sign-up', controller.signUp)

module.exports = router