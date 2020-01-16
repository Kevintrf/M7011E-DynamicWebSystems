'use strict';

var Task = require('../model/appModel.js');

exports.checkSession = function(req, res){
  Task.checkSession(req, function(err, result) {
    if (err)
      res.send(err);

    res.send(result);
  });
};

exports.getDashboardProsumer = function(req, res){
  Task.getDashboardProsumer(req, function(err, result) {
    if (err)
      res.send(err);

    res.send(result);
  });
};

exports.startPowerplant = function(req, res){
  Task.startPowerplant(req, function(err, result) {
    if (err)
      res.send(err);

    res.send(result);
  });
};

exports.stopPowerplant = function(req, res){
  Task.stopPowerplant(req, function(err, result) {
    if (err)
      res.send(err);

    res.send(result);
  });
};

exports.getProsumerInfo = function(req, res){
  Task.getProsumerInfo(req.params.query, function(err, result) {
    if (err)
      res.send(err);

    res.send(result);
  });
};

exports.useCustomPrice = function(req, res){
  Task.useCustomPrice(req.params.query, req, function(err, result) {
    if (err)
      res.send(err);

    res.send(result);
  });
};

exports.setCustomPrice = function(req, res){
  Task.setCustomPrice(req.params.query, req, function(err, result) {
    if (err)
      res.send(err);

    res.send(result);
  });
};

exports.getBlackoutUsers = function(req, res){
  Task.getBlackoutUsers(req.params.query, req, function(err, result) {
    if (err)
      res.send(err);

    res.send(result);
  });
};

exports.registerUser = function(req, res){
  Task.registerUser(req.params.query, function(err, result) {
    if (err)
      res.send(err);

    res.send(result);
  });
};

exports.login = function(req, res){
  Task.login(req.params.query, req, function(err, result) {
    if (err){
      res.send(err);
    }

    res.send(result);
  });
};

exports.logout = function(req, res){
  Task.logout(req, function(err, result) {
    if (err){
      res.send(err);
    }

    res.send(result);
  });
};

exports.uploadImage = function(req, res){
  Task.uploadImage(req, function(err, result){
    if(err){
      res.send(err);    
    }

    res.send(result);

  });
}

exports.getAllProsumers = function(req, res) {
  Task.getAllProsumers(function(err, result) {
    console.log("reqsession: " + req.session)
    if (err)
      res.send(err);
      console.log('res', result);
    res.send(result);
  });
};

exports.createProsumer = function(req, res) {
  Task.createProsumer(req.params.query, req, function(err, result) {
    if (err){
      res.send(err);
    }

    res.send(result);
  });
};

exports.getProsumerById = function(req, res) {
  Task.getProsumerById(req.params.query, function(err, result) {
    if (err)
      res.send(err);
    
    res.json(result);
  });
};
