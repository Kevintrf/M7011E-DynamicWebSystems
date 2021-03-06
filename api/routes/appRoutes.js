'use strict';

module.exports = function(app) {
  var controller = require('../controllers/appController');

  app.route('/api/checkSession/')
  .get(controller.checkSession);

  app.route('/api/getProsumerInfo/:query')
  .get(controller.getProsumerInfo);

  app.route('/api/get')
  .get(controller.getProsumerById);

  app.route('/api/getDashboardProsumer')
  .get(controller.getDashboardProsumer);

  app.route('/api/registerUser/:query')
  .post(controller.registerUser);

  app.route('/api/startPowerplant')
  .post(controller.startPowerplant);

  app.route('/api/updateCredentials/:query')
  .post(controller.updateCredentials)

  app.route('/api/getAllNormalUsers')
  .get(controller.getAllNormalUsers);

  app.route('/api/useCustomPrice/:query')
  .post(controller.useCustomPrice);

  app.route('/api/setCustomPrice/:query')
  .post(controller.setCustomPrice);

  app.route('/api/deleteUser/:query')
  .post(controller.deleteUser);

  app.route('/api/getBlackoutUsers')
  .get(controller.getBlackoutUsers);

  app.route('/api/stopPowerplant')
  .post(controller.stopPowerplant);

  app.route('/api/uploadImage/')
  .post(controller.uploadImage);

  app.route('/api/login/:query')
  .post(controller.login);

  app.route('/api/logout')
  .get(controller.logout);

  app.route('/api/getAll')
  .get(controller.getAllProsumers);

  app.route('/api/createProsumer/:query')
  .post(controller.createProsumer);

  app.route('/api/updateProsumer/:query')
  .post(controller.updateProsumer);
   
  app.route('/api/getProsumerById/:query')
  .get(controller.getProsumerById)

  app.route('/api/blockFromMarket/:query')
  .post(controller.blockFromMarket);

  app.route('/api/createUserAndProsumer/:query')
  .post(controller.createUserAndProsumer);
};