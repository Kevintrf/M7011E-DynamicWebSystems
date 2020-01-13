'use strict';

module.exports = function(app) {
  var controller = require('../controllers/appController');

  app.route('/api/checkSession/')
  .get(controller.checkSession);

  app.route('/api/getProsumerInfo/:query')
  .get(controller.getProsumerInfo);

  app.route('/api/get')
  .get(controller.getProsumerById);

  app.route('/api/getMyProsumer')
  .get(controller.getMyProsumer);

  app.route('/api/registerUser/:query')
  .post(controller.registerUser);

  app.route('/api/login/:query')
  .post(controller.login);

  app.route('/api/logout')
  .get(controller.logout);

  app.route('/api/getAll')
  .get(controller.getAllProsumers);

  app.route('/api/createProsumer/:query')
  .post(controller.createProsumer);
   
  app.route('/api/getById/:query')
  .get(controller.getProsumerById)
};