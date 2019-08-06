require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const validateBearerToken = require('./validate-bearer-token');
const errorHandler = require('./error-handler');

//components
const {NODE_ENV} = require('./config');
const folderRouter = require('./folder/folder-router');
const noteRouter = require('./note/note-router');

const app = express();

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(cors());
app.use(helmet());
app.use(validateBearerToken);

app.use('/api/folder', folderRouter);
app.use('/api/note', noteRouter);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = {error: {message: 'server error'}};
  } else {
    console.error(error);
    response = {message: error.message, error};
  }
  res.status(500).json(response);
});
app.use(errorHandler);

module.exports = app;
