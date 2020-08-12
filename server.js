const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const mysql = require('./scripts/dbcon.js');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('css'));
app.use(express.static('scripts'));

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.set('port', 6548);

const selectAllTitles = 'SELECT title FROM Movies UNION SELECT title FROM Shows ORDER BY title';
const selectMovie = 'SELECT * FROM Movies WHERE title=?';
const selectShow = 'SELECT * FROM Shows WHERE title=?';
const selectAllStreams = 'SELECT * FROM StreamingServices';
const getStreamIdMovies = 'SELECT streamingServiceID FROM StreamingService_Movies WHERE movieID=?';
const getStreamIdShows = 'SELECT streamingServiceID FROM StreamingService_Shows WHERE showID=?';
const getScore = 'SELECT score FROM IMDB WHERE imdbID=?';
const selectImdb = 'SELECT imdbID FROM IMDB WHERE title=?';
const getMovieId = 'SELECT movieID FROM Movies WHERE title=?';
const getShowId = 'SELECT showID FROM Shows WHERE title=?';
const selectSaved = 'SELECT * FROM Search_List_Showie_Movie';
const insertSaved = 'INSERT INTO Search_List_Showie_Movie (`title`) VALUES (?)';
const insertMovie_rel = 'INSERT INTO StreamingService_Movies (movieID, streamingServiceID) VALUES(?,?)';
const insertShow_rel = 'INSERT INTO StreamingService_Shows (showID, streamingServiceID) VALUES(?,?)';
const insertImdb = 'INSERT INTO IMDB (title, score) VALUES (?,?)';
const insertMovie = 'INSERT INTO Movies (title, imdbID) VALUES (?,?)';
const insertShow = 'INSERT INTO Shows (title, imdbID) VALUES (?,?)';
const insertService = 'INSERT INTO StreamingServices (name) VALUES (?)';
const deleteSaved = 'DELETE FROM Search_List_Showie_Movie WHERE id=?';
const deleteMovie_rel = 'DELETE FROM StreamingService_Movies WHERE movieID=?';
const deleteShow_rel = 'DELETE FROM StreamingService_Shows WHERE showID=?';
const updateMovie = 'UPDATE Movies SET title=? WHERE movieID=?';
const updateShow = 'UPDATE Shows SET title=? WHERE showID=?';
const updateScore = 'UPDATE IMDB SET score=?, title=? WHERE imdbID=?';

// DEFAULT ROUTE FOR LOADING THE HOME PAGE
app.get('/', (req, res, next) => {
  res.render('home');
});

// ROUTE TO RENDER THE SEARCH PAGE
app.get('/search', (req, res, next) => {
  displayAll(res, 'search');
});

// ROUTE FOR DISPLAYING THE SEARCH RESULTS
app.post('/search', (req, res) => {
  getATitle(req, res, 'search')
});

// ROUTE FOR SAVING A TITLE TO THE SAVED LIST
app.post('/saved', (req, res) => {
  var { title } = req.body;
  mysql.pool.query(insertSaved, [title], (err, result) => { // insert into Search_List_Showie_Movie table
    if (err) {
      next(err);
      return;
    }
    res.json({ save: true });
  });
});

// ROUTE TO RENDER SAVED TITLES
app.get('/saved', (req, res, next) => {
  mysql.pool.query(selectSaved, (err, result) => { // select from the Search_List_Showie_Movie table
    if (err) {
      next(err);
      return;
    }
    if (result.length === 0) {
      res.render('saved');
    } else {
      getTitleInfo(res, result)
    }
  });
});

// ROUTE TO DELETE TITLES FROM THE SAVED LIST (Search_List_Showie_Movie table)
app.delete('/saved', (req, res, next) => {
  mysql.pool.query(deleteSaved, [req.body.id], (err, result) => {
    if (err) {
      next(err);
      return;
    }
    res.json({ result: true });
  });
});

// ROUTE FOR LOADING THE EDIT PAGE
app.get('/edit', (req, res, next) => {
  displayAll(res, 'edit')
});

// ROUTE FOR SELECTING A TITLE TO EDIT
app.post('/edit', (req, res, next) => {
  getATitle(req, res, 'edit');
});

// ROUTE FOR EDIT PAGE UPDATES
app.post('/update', (req, res, next) => {
  const title = req.body.title;
  const score = req.body.imdb;
  const type = req.body.type;
  const id = req.body.id;
  const streams = []
  const imdbID = req.body.imdbID;
  var payload = {};
  payload.titles = [];
  payload.success = false;
  mysql.pool.query(selectAllStreams, (err, result) => {  // get all streams
    if (err) {
      next(err);
      return;
    }
    var tempKeys = Object.keys(req.body)
    for (var j = 0; j < result.length; j++) {
      for (var k = 0; k < tempKeys.length; k++) {
        if (result[j].name == tempKeys[k]) {
          streams.push(result[j].streamingServiceID)
        }
      }
    }
    if (type === 'Movie') {
      mysql.pool.query(updateMovie, [title, id], (err, result) => {  // update the movie title
        if (err) {
          next(err);
          return;
        }
        mysql.pool.query(updateScore, [score, title, imdbID], (err, result) => {  // update score and title
          if (err) {
            next(err);
            return;
          }
          mysql.pool.query(deleteMovie_rel, [id], (err, result) => {  // delete all movie -> streaming service realtionships
            if (err) {
              next(err);
              return;
            }
            for (var i = 0; i < streams.length; i++) { // loop through each of the streaming services
              mysql.pool.query(insertMovie_rel, [id, streams[i]], (err, result) => {  // insert the move into the relationship table
                if (err) {
                  next(err);
                  return;
                }
              });
            }
            mysql.pool.query(selectAllTitles, (err, result) => {  // get all titles
              if (err) {
                next(err);
                return;
              }
              for (var i = 0; i < result.length; i++) {
                payload.titles.push(result[i].title);
              }
              payload.success = true;
              res.render('edit', payload);
            });
          });
        });
      });
    } else if (type === 'Show') {
      mysql.pool.query(updateShow, [title, id], (err, result) => {  // update the show title
        if (err) {
          next(err);
          return;
        }
        mysql.pool.query(updateScore, [score, title, imdbID], (err, result) => {  // update score and title
          if (err) {
            next(err);
            return;
          }
          mysql.pool.query(deleteShow_rel, [id], (err, result) => {  // delete all shows -> streaming service realtionships
            if (err) {
              next(err);
              return;
            }
            for (var i = 0; i < streams.length; i++) { // loop through each of the streaming services
              mysql.pool.query(insertShow_rel, [id, streams[i]], (err, result) => {  // add tot he show- stream relationship table
                if (err) {
                  next(err);
                  return;
                }
              });
            }
            mysql.pool.query(selectAllTitles, (err, result) => {  // get all titles
              if (err) {
                next(err);
                return;
              }
              for (var i = 0; i < result.length; i++) {
                payload.titles.push(result[i].title);
              }
              payload.success = true;
              res.render('edit', payload);
            });
          });
        });
      });
    }
  });
});

// ROUTE TO RENDER THE ADD PAGE
app.get('/add', (req, res, next) => {
  addPage(res, false);
});

// ROUTE FOR ADDING A NEW SHOW OR MOVIE
app.post('/add', (req, res, next) => {
  const title = req.body.title;
  const score = req.body.score;
  const type = req.body.types;
  var streams = [];
  var imdb;
  var movieID;
  var showID;
  mysql.pool.query(selectAllStreams, (err, result) => {  // get all streams
    if (err) {
      next(err);
      return;
    }
    var tempKeys = Object.keys(req.body)
    for (var j = 0; j < result.length; j++) {
      for (var k = 0; k < tempKeys.length; k++) {
        if (result[j].name == tempKeys[k]) {
          streams.push(result[j].streamingServiceID)
        }
      }
    }
    mysql.pool.query(insertImdb, [title, score], (err, result) => {  // insert new title and score to IMDB table
      if (err) {
        next(err);
        return;
      }
      //might not need this query???**********
      mysql.pool.query(selectImdb, [title], (err, result) => {  // get the newly inserted imdb info
        if (err) {
          next(err);
          return;
        }
        imdb = result[0].imdbID;  /// need to be careful of duplicates... make sure the set titles back to unique
        if (type == "Movie") {
          mysql.pool.query(insertMovie, [title, imdb], (err, result) => {  // insert into movies
            if (err) {
              next(err);
              return;
            }
            mysql.pool.query(getMovieId, [title], (err, result) => {  // get the newly inserted movie id
              if (err) {
                next(err);
                return;
              }
              movieID = result[0].movieID;
              for (var i = 0; i < streams.length; i++) {
                mysql.pool.query(insertMovie_rel, [movieID, streams[i]], (err, result) => {  // insert
                  if (err) {
                    next(err);
                    return;
                  }
                });
              }
              addPage(res, true);
            });
          });
        } else if (type == "Show") {
          mysql.pool.query(insertShow, [title, imdb], (err, result) => {  // get all streaming services
            if (err) {
              next(err);
              return;
            }
            mysql.pool.query(getShowId, [title], (err, result) => {  // get the newly inserted show id
              if (err) {
                next(err);
                return;
              }
              showID = result[0].showID;
              for (var i = 0; i < streams.length; i++) {
                mysql.pool.query(insertShow_rel, [showID, streams[i]], (err, result) => {  // insert streaming services shwo relationship
                  if (err) {
                    next(err);
                    return;
                  }
                });
              }
              addPage(res, true);
            });
          });
        }
      });
    });
  });
});

// ADD A NEW STREAMING SERVICE
app.post('/add-new', (req, res, next) => {
  var name = req.body.addStream;
  var payload = {};
  mysql.pool.query(insertService, [name], (err, result) => {  // add new row to streaming services table
    if (err) {
      next(err);
      return;
    }
    payload.streams = [];
    mysql.pool.query(selectAllStreams, (err, result) => {  // get all streaming services
      if (err) {
        next(err);
        return;
      }
      for (var i = 0; i < result.length; i++) {
        payload.streams.push({ streamingServiceID: result[i].streamingServiceID, name: result[i].name });
      }
      payload.success = true;
      res.render('add', payload);
    });
  });
});

// COLLECT AND SEND ALL TITLE INFO
function getTitleInfo(res, data) {
  var titles = data;

  var payload = {};
  payload.data = []
  var streams = [];
  payload.titles = [];
  var count = 0;
  mysql.pool.query(selectAllStreams, (err, result) => {  // get all streaming services
    if (err) {
      next(err);
      return;
    }
    streams = result
    for (var n = 0; n < titles.length; n++) {
      savedMovies(n)
      function savedMovies(n) {
        mysql.pool.query(selectMovie, [titles[n].title], (err, result) => {  // query to see if a movie matches the title
          if (err) {
            next(err);
            return;
          }
          if (result[0] != undefined) {  // the movie exists
            var info = { movieID: result[0].movieID, imdbID: result[0].imdbID }
            mysql.pool.query(getScore, [info.imdbID], (err, result) => {  // get the score
              if (err) {
                next(err);
                return;
              }
              var score = result[0].score
              mysql.pool.query(getStreamIdMovies, [info.movieID], (err, result) => {  // get streaming services from the relationship table
                if (err) {
                  next(err);
                  return;
                }
                var tempStreams = []
                for (var j = 0; j < streams.length; j++) {
                  for (var i = 0; i < result.length; i++) {
                    if (streams[j].streamingServiceID == result[i].streamingServiceID) {
                      tempStreams.push(streams[j].name)
                    }
                  }
                }
                var package = { id: titles[n].id, title: titles[n].title, score: score, streams: tempStreams }
                payload.data.push(package);
                complete();
              });
            });
          }
        });
      }
      savedShows(n);
      function savedShows(n) {
        mysql.pool.query(selectShow, [titles[n].title], (err, result) => {  // query to see if a show matches the title
          if (err) {
            next(err);
            return;
          }
          if (result[0] != undefined) {  // the show exists
            var info = { showID: result[0].showID, imdbID: result[0].imdbID }
            mysql.pool.query(getScore, [info.imdbID], (err, result) => {  // get score
              if (err) {
                next(err);
                return;
              }
              var score = result[0].score
              mysql.pool.query(getStreamIdShows, [info.showID], (err, result) => {  // get streaming services from the relationship table
                if (err) {
                  next(err);
                  return;
                }
                var tempStreams = []
                for (var j = 0; j < streams.length; j++) {
                  for (var i = 0; i < result.length; i++) {
                    if (streams[j].streamingServiceID == result[i].streamingServiceID) {
                      tempStreams.push(streams[j].name)
                    }
                  }
                }
                var package = { id: titles[n].id, title: titles[n].title, score: score, streams: tempStreams }
                payload.data.push(package);
                complete();
              });
            });
          }
        });
      }
    }
  });
  function complete() { // function to ensure all title data have been colected
    count++;
    if (count >= titles.length) {
      res.render('saved', payload)
    }
  }
};

// FINDS A MATCHING TITLE WITH ALL INFO
function getATitle(req, res, page) {
  var title = req.body.titles;
  var payload = {};
  payload.titles = [];
  payload.title = title;
  payload.streams = {};
  var selected = [];
  payload.score;
  mysql.pool.query(selectAllTitles, (err, result) => {  // add all title for the serach bar
    if (err) {
      next(err);
      return;
    }
    for (var i = 0; i < result.length; i++) {
      payload.titles.push(result[i].title);
    }
    mysql.pool.query(selectMovie, [title], (err, result) => {  // query to see if a movie matches the title
      if (err) {
        next(err);
        return;
      }
      if (result[0] != undefined) {  // the movie exists
        payload.id = result[0].movieID;
        payload.imdbID = result[0].imdbID;

        mysql.pool.query(selectAllStreams, (err, result) => {  // get all streaming services
          if (err) {
            next(err);
            return;
          }
          for (var i = 0; i < result.length; i++) {
            payload.streams[result[i].streamingServiceID] = { selected: false, streamingServiceID: result[i].streamingServiceID, name: result[i].name };
          }
          mysql.pool.query(getStreamIdMovies, [payload.id], (err, result) => {  // get stream ID 
            if (err) {
              next(err);
              return;
            }
            selected = result;
            for (var i = 0; i < selected.length; i++) {
              if (selected[i].streamingServiceID == payload.streams[selected[i].streamingServiceID].streamingServiceID) {
                payload.streams[selected[i].streamingServiceID].selected = true
              }
            }
            mysql.pool.query(getScore, [payload.imdbID], (err, result) => {  // get score
              if (err) {
                next(err);
                return;
              }
              payload.result = true;
              payload.movie = true;
              payload.score = result[0].score;
              res.render(page, payload);
            });
          });
        });
      }
    });
    mysql.pool.query(selectShow, [title], (err, result) => {  // query to see if a show matches the title
      if (err) {
        next(err);
        return;
      }
      if (result[0] != undefined) {  // the show exists
        payload.id = result[0].showID;
        payload.imdbID = result[0].imdbID;

        mysql.pool.query(selectAllStreams, (err, result) => {  // get all streaming services
          if (err) {
            next(err);
            return;
          }
          for (var i = 0; i < result.length; i++) {
            payload.streams[result[i].streamingServiceID] = { selected: false, streamingServiceID: result[i].streamingServiceID, name: result[i].name };
          }
          mysql.pool.query(getStreamIdShows, [payload.id], (err, result) => {  // get streaming service id
            if (err) {
              next(err);
              return;
            }
            selected = result;
            for (var i = 0; i < selected.length; i++) {
              if (selected[i].streamingServiceID == payload.streams[selected[i].streamingServiceID].streamingServiceID) {
                payload.streams[selected[i].streamingServiceID].selected = true
              }
            }
            mysql.pool.query(getScore, [payload.imdbID], (err, result) => {  // get score
              if (err) {
                next(err);
                return;
              }
              payload.result = true;
              payload.show = true;
              payload.score = result[0].score;
              res.render(page, payload);
            });
          });
        });
      }
    });
  });
}

// COLLECTS ALL TITLES AND RENDERS A PAGE
function displayAll(res, page) {
  var payload = {};
  payload.titles = [];
  mysql.pool.query(selectAllTitles, (err, result) => {
    if (err) {
      next(err);
      return;
    }
    for (var i = 0; i < result.length; i++) {
      payload.titles.push(result[i].title);
    }
    res.render(page, payload);
  });
}

function addPage(res, success) {
  var payload = {};
  payload.notification = success;
  payload.streams = [];
  mysql.pool.query('SELECT * FROM StreamingServices', (err, result) => {  // get all streaming services
    if (err) {
      next(err);
      return;
    }
    for (var i = 0; i < result.length; i++) {
      payload.streams.push({ streamingServiceID: result[i].streamingServiceID, name: result[i].name });
    }
    res.render('add', payload);
  });
}
app.listen(app.get('port'), function () {
  console.log(
    `Express started on http://${process.env.HOSTNAME}:${app.get(
      'port'
    )}; press Ctrl-C to terminate.`
  );
});
