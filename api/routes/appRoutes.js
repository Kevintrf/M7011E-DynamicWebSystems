'use strict';

module.exports = function(app) {
  var controller = require('../controllers/appController');

  app.route('/api/getProsumerInfo/:id')
  .get(controller.getProsumerInfo);

  app.route('/api/get')
  .get(controller.getProsumerById);

  //Skicka JSON objeckt, som tex: {"id":"8", "username":"tjena", "password":"safepassword"}
  app.route('/api/insertUser/:object')
  .post(controller.insertUser);

  app.route('/api/getAll')
  .get(controller.getAllProsumers);

  app.route('/api/insertProsumer/:id')
  .post(controller.insertProsumer);
   
  app.route('/api/getById/:apiQuery')
  .get(controller.getProsumerById)
};