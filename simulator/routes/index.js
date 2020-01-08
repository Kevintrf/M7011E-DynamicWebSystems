var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {

    res.json({ test: 'testar get router' })
});

module.exports = router;