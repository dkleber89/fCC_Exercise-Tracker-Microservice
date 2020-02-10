import mongoose from 'mongoose';

export default class DatabaseWorker {
  constructor() {
    mongoose.connect(process.env.MONGOLAB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

    mongoose.connection.on('error', err => {
      console.log(err);
    });

    this.userShema = new mongoose.Schema({
      username: { type: String, required: true },
      exercises: { type: Array({ description: String, duration: Number, date: Date }) },
    });

    this.User = mongoose.model('User', this.userShema);
  }

  addUser(username, cb) {
    if (typeof username === 'string' && username.length > 0) {
      this.User.findOne({ username }, (error, data) => {
        if (error) {
          cb({ errorCode: error.code, errorMessage: error.errmsg });
          return;
        }

        if (!data) {
          const newUser = new this.User({ username });

          newUser.save((e, d) => {
            if (e) {
              cb({ errorCode: e.code, errorMessage: e.errmsg });
            } else {
              cb(undefined, { username: d.username, _id: d._id });
            }
          });
        } else {
          cb(undefined, { username: data.username, _id: data._id });
        }
      });
    } else {
      cb({ errorCode: 400, errorMessage: 'Bad Request' });
    }
  }

  addExercise(body, cb) {
    if (
      typeof body.userId === 'string' &&
      body.userId.length > 0 &&
      typeof body.description === 'string' &&
      body.description.length > 0 &&
      Number(body.duration)
    ) {
      let date = new Date(body.date);

      if (date.toString() === 'Invalid Date') {
        date = new Date();
      }

      const exercise = { description: body.description, duration: parseInt(body.duration, 10), date };

      this.User.findByIdAndUpdate(body.userId, { $push: { exercises: exercise } }, { new: true }, (err, savedData) => {
        if (err) {
          cb({ errorCode: err.code, errorMessage: err.errmsg });
          return;
        }

        if (savedData) {
          const data = {
            _id: savedData._id,
            username: savedData.username,
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toUTCString(),
          };

          cb(undefined, data);
        } else {
          cb({ errorCode: 400, errorMessage: 'Bad Request' });
        }
      });
    } else {
      cb({ errorCode: 400, errorMessage: 'Bad Request' });
    }
  }

  getLog(query, cb) {
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    const limit = query.limit ? query.limit : null;

    if ((from && from.toString() === 'Invalid Date') || (to && to.toString() === 'Invalid Date') || (limit && !Number(limit))) {
      cb({ errorCode: 400, errorMessage: 'Bad Request' });
      return;
    }

    if (typeof query.userId === 'string' && query.userId.length > 0) {
      this.User.findById(query.userId, (err, data) => {
        if (err) {
          cb({ errorCode: err.code, errorMessage: err.errmsg });
          return;
        }

        if (data) {
          const filteredExercises = data.exercises.filter(exercise => {
            if (from !== null && exercise.date < from) {
              return false;
            }

            if (to !== null && exercise.date > to) {
              return false;
            }

            return true;
          });

          if (limit !== null && limit >= 0) {
            filteredExercises.length = Math.min(filteredExercises.length, limit);
          }

          const outputData = { log: filteredExercises, count: filteredExercises.length };

          cb(undefined, outputData);
        } else {
          cb({ errorCode: 400, errorMessage: 'Bad Request' });
        }
      });
    } else {
      cb({ errorCode: 400, errorMessage: 'Bad Request' });
    }
  }
}
