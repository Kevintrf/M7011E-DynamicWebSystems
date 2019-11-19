var express = require('express');
var router = express.router();

router.get('/', (req, res, next) => {

    res.json({ test: 'testet' })
});

module.exports = router;