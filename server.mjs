import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { gDirname } from './utils/utilityFunctions.mjs';
import DatabaseWorker from './utils/DatabaseWorker.mjs';

dotenv.config();

const app = express();

const database = new DatabaseWorker();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(`${gDirname(import.meta.url)}/views/index.html`);
});

app.post('/api/exercise/new-user', (req, res) => {
  database.addUser(req.body.username, (err, data) => {
    if (err) {
      res
        .status(err.errorCode || 500)
        .type('txt')
        .send(err.errorMessage || 'Internal Server Error');
    } else {
      res.json(data);
    }
  });
});

app.post('/api/exercise/add', (req, res) => {
  database.addExercise(req.body, (err, data) => {
    if (err) {
      res
        .status(err.errorCode || 500)
        .type('txt')
        .send(err.errorMessage || 'Internal Server Error');
    } else {
      res.json(data);
    }
  });
});

app.get('/api/exercise/log', (req, res) => {
  database.getLog(req.query, (err, data) => {
    if (err) {
      res
        .status(err.errorCode || 500)
        .type('txt')
        .send(err.errorMessage || 'Internal Server Error');
    } else {
      res.json(data);
    }
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' });
});

// Error Handling middleware
app.use((err, req, res) => {
  let errCode;
  let errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || 'Internal Server Error';
  }

  res
    .status(errCode)
    .type('txt')
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
