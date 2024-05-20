const express = require('express');
const login = require('./controllers/login');
const users = require('./controllers/users');

const roots = express();
roots.post('/cadastro', users.createUser);

roots.post('/login', login.login);

module.exports = roots;