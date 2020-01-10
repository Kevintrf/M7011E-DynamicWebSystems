'use strict';

var Task = require('../model/appModel.js');

exports.getProsumerInfo = function(req, res){
  Task.getProsumerInfo(req.params.query, function(err, task) {
    if (err)
      res.send(err);

    res.send(task);
  });
};

exports.registerUser = function(req, res){
  Task.registerUser(req.params.query, function(err, task) {
    if (err)
      res.send(err);

    res.send(task);
  });
};

exports.login = function(req, res){
  Task.login(req.params.query, function(err, task) {
    if (err)
      res.send(err);

    res.send(task);
  });
};

exports.insertUser = function(req, res){
  Task.insertUser(req.params.query, function(err, task) {
    if (err)
      res.send(err);

    res.send(task);
  });
};

exports.getAllProsumers = function(req, res) {
  Task.getAllProsumers(function(err, task) {
    console.log("reqsession: " + req.session)
    if (err)
      res.send(err);
      console.log('res', task);
    res.send(task);
  });
};

exports.insertProsumer = function(req, res) {
  Task.insertProsumer(req.params.query, function(err, task) {
    if (err){
      res.send(err);
    }

    res.send(task);
  });
};

exports.getProsumerById = function(req, res) {
  Task.getProsumerById(req.params.query, function(err, task) {
    if (err)
      res.send(err);
    
    res.json(task);
  });
};
