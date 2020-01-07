'use strict';
module.exports = function(app) {
  var controller = require('../controllers/appController');

  // todoList Routes
  app.route('/api/get')
    .get(controller.list_all_tasks)
    .get(controller.getProsumerById);
   
  app.route('/api/getById/:apiQuery')
  .post(controller.createProsumers)
  .get(controller.getProsumerById)
  .put(controller.update_a_task)
  .delete(controller.delete_a_task);
  };
