const router = require('express').Router()
const { Router } = require('express');
const { weebHook } = require('../Controllers/weebhook');

router.post('/chat-bot', weebHook)

module.exports = router;