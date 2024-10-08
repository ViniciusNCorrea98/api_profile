const express = require('express');
const cors = require('cors');
const roots = require('./roots');

const app = express();
app.use(express.json());
app.use(cors())
app.use(roots);

app.listen(8000);