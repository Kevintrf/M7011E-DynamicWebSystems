'use strict';

var Task = require('../model/appModel.js');

exports.checkSession = function(req, res){
  Task.checkSession(req, function(err, result) {
    if (err)
      res.send(err);

    res.send(result);
  });
};

exports.getMyProsumer = function(req, res){
  Task.getMyProsumer(req, function(err, result) {
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
