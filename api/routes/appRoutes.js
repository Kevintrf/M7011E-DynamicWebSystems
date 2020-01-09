'use strict';

module.exports = function(app) {
  var controller = require('../controllers/appController');

  app.route('/api/getProsumerInfo/:query')
  .get(controller.getProsumerInfo);

  app.route('/api/get')
  .get(controller.getProsumerById);

  //Skicka JSON objeckt, som tex: {"id":"8", "username":"tjena", "password":"safepassword"}
  app.route('/api/insertUser/:query')
  .post(controller.insertUser);

  app.route('/api/registerUser/:query')
  .post(controller.registerUser);

  app.route('/api/login/:query')
  .post(controller.login);

  app.route('/api/getAll')
  .get(controller.getAllProsumers);

  app.route('/api/insertProsumer/:query')
  .post(controller.insertProsumer);
   
  app.route('/api/getById/:query')
  .get(controller.getProsumerById)
};