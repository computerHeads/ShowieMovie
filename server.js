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

// default route for loading the page
app.get('/', (req, res, next) => {
  res.render('home');
});

// route for rendering search page
app.get('/search', (req, res, next) => {
  res.render('search');
});

// route for serach form data
app.post('/search', (req, res) => {
  const type = req.body.type;
  const title = req.body.search;
  var id;
  var payload = {};
  payload.title = title;
  payload.stream = [];
  // searching for shows
  if (type == "Shows") {
    mysql.pool.query("SELECT showID FROM Shows WHERE title=?", [title], (err, result) => {
      if (err) {
        next(err);
        return;
      }
      id = result[0].showID;
      mysql.pool.query("SELECT streamingServiceID FROM StreamingService_Shows WHERE showID=?", [id], (err, result) => {
        if (err) {
          next(err);
          return;
        }
        for (let i = 0; i < result.length; i++) {
          if (result[i].streamingServiceID == 1) {
            payload.stream.push({ netflix: result[i].streamingServiceID });
          } else if (result[i].streamingServiceID == 2) {
            payload.stream.push({ hulu: result[i].streamingServiceID });
          } else if (result[i].streamingServiceID == 3) {
            payload.stream.push({ prime: result[i].streamingServiceID });
          } else if (result[i].streamingServiceID == 4) {
            payload.stream.push({ disney: result[i].streamingServiceID });
          }
        }
      });
    });
    mysql.pool.query("SELECT score FROM IMDB WHERE title=?", [title], (err, result) => {
      if (err) {
        next(err);
        return;
      }
      payload.score = result[0].score;
      if (id) {
        payload.result = true;
      }
      res.render('search', payload);
    });
    // searching for movies
  } else if (type == 'Movies') {
    mysql.pool.query("SELECT movieID FROM Movies WHERE title=?", [title], (err, result) => {
      if (err) {
        next(err);
        return;
      }
      id = result[0].movieID;
      mysql.pool.query("SELECT streamingServiceID FROM StreamingService_Movies WHERE movieID=?", [id], (err, result) => {
        if (err) {
          next(err);
          return;
        }
        for (let i = 0; i < result.length; i++) {
          if (result[i].streamingServiceID == 1) {
            payload.stream.push({ netflix: result[i].streamingServiceID });
          } else if (result[i].streamingServiceID == 2) {
            payload.stream.push({ hulu: result[i].streamingServiceID });
          } else if (result[i].streamingServiceID == 3) {
            payload.stream.push({ prime: result[i].streamingServiceID });
          } else if (result[i].streamingServiceID == 4) {
            payload.stream.push({ disney: result[i].streamingServiceID });
          }
        }
      });
    });
    mysql.pool.query("SELECT score FROM IMDB WHERE title=?", [title], (err, result) => {
      if (err) {
        next(err);
        return;
      }
      payload.score = result[0].score;
      if (id) {
        payload.result = true;
      }
      res.render('search', payload);
    });
  }
});

// route for saving a title to the saved list
app.post('/saved', (req, res) => {
  var { score, title, netflix, hulu, prime, disney } = req.body;
  if (netflix == undefined) {
    netflix = 0;
  }
  if (hulu == undefined) {
    hulu = 0;
  }
  if (prime == undefined) {
    prime = 0;
  }
  if (disney == undefined) {
    disney = 0;
  }
  mysql.pool.query('INSERT INTO Search_List_Showie_Movie (`imdb_score`, `title`, `netflix`, `hulu`, `prime`, `disney`) VALUES (?,?,?,?,?,?)', [score, title, netflix, hulu, prime, disney], (err, result) => {
    if (err) {
      next(err);
      return;
    }
    res.render('search');
  });
});

// route for rendering the saved page
app.get('/saved', (req, res, next) => {
  var payload = {};
  payload.data = []
  var list = [];
  mysql.pool.query('SELECT * FROM Search_List_Showie_Movie', (err, result) => {
    if (err) {
      next(err);
      return;
    }
    for (var i = 0; i < result.length; i++) {
      payload.data.push({ id: result[i].id, score: result[i].imdb_score, title: result[i].title, netflix: result[i].netflix, hulu: result[i].hulu, prime: result[i].prime, disney: result[i].disney });

    }
    // console.log(payload.data);
    res.render('saved', payload);
  });
});

// route for removing items from the saved list (Search_List_Showie_Movie table)
app.delete('/saved', (req, res, next) => {
  // console.log(req.body.id);
  mysql.pool.query('DELETE FROM Search_List_Showie_Movie WHERE id=?', [req.body.id], (err, result) => {
    if (err) {
      next(err);
      return;
    }
    res.json({ result: true });
  });
});

// route for edit
app.get('/edit', (req, res, next) => {
  var payload = {};
  payload.titles = [];
  mysql.pool.query('SELECT title FROM Movies UNION SELECT title FROM Shows ORDER BY title', (err, result) => {
    if (err) {
      next(err);
      return;
    }
    // console.log(result)
    for (var i = 0; i < result.length; i++) {
      payload.titles.push(result[i].title);
    }
    // console.log(payload)
    res.render('edit', payload);
  });
});

// route for selecting a title to edit
app.post('/edit', (req, res, next) => {
  var title = req.body.titles;
  var payload = {};
  payload.titles = [];
  payload.title = title;
  payload.streams = {};
  var selected = [];
  payload.titles = [];
  payload.score;
  mysql.pool.query('SELECT title FROM Movies UNION SELECT title FROM Shows ORDER BY title', (err, result) => {
    if (err) {
      next(err);
      return;
    }
    // console.log(result)
    for (var i = 0; i < result.length; i++) {
      payload.titles.push(result[i].title);
    }
    mysql.pool.query('SELECT * FROM Movies WHERE title=?', [title], (err, result) => {  // query to see if a movie matches the title
      if (err) {
        next(err);
        return;
      }
      if (result[0] != undefined) {  // the movie exists
        payload.id = result[0].movieID;
        payload.imdbID = result[0].imdbID;
        payload.movie = true;
        mysql.pool.query('SELECT * FROM StreamingServices', (err, result) => {  // get all streaming services
          if (err) {
            next(err);
            return;
          }
          for (var i = 0; i < result.length; i++) {
            payload.streams[result[i].streamingServiceID] = { selected: false, streamingServiceID: result[i].streamingServiceID, name: result[i].name };
          }
          mysql.pool.query('SELECT streamingServiceID FROM StreamingService_Movies WHERE movieID=?', [payload.id], (err, result) => {  // get streaming services
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
            mysql.pool.query('SELECT score FROM IMDB WHERE imdbID=?', [payload.imdbID], (err, result) => {  // get streaming services
              if (err) {
                next(err);
                return;
              }
              payload.score = result[0].score;
              res.render('edit', payload);
            });


          });
        });
      }
    });
    mysql.pool.query('SELECT * FROM Shows WHERE title=?', [title], (err, result) => {  // query to see if a movie matches the title
      if (err) {
        next(err);
        return;
      }
      if (result[0] != undefined) {  // the show exists
        payload.id = result[0].showID;
        payload.imdbID = result[0].imdbID;
        payload.show = true;
        mysql.pool.query('SELECT * FROM StreamingServices', (err, result) => {  // get all streaming services
          if (err) {
            next(err);
            return;
          }
          for (var i = 0; i < result.length; i++) {
            payload.streams[result[i].streamingServiceID] = { selected: false, streamingServiceID: result[i].streamingServiceID, name: result[i].name };
          }
          mysql.pool.query('SELECT streamingServiceID FROM StreamingService_Shows WHERE showID=?', [payload.id], (err, result) => {  // get streaming services
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
            mysql.pool.query('SELECT score FROM IMDB WHERE imdbID=?', [payload.imdbID], (err, result) => {  // get streaming services
              if (err) {
                next(err);
                return;
              }
              payload.score = result[0].score;
              res.render('edit', payload);
            });
          });
        });
      }
    });
  });
});

// route for edit page updates
app.post('/update', (req, res, next) => {
  const title = req.body.title;
  const score = req.body.imdb;
  const type = req.body.type;
  const id = req.body.id;
  const streams = req.body.stream;
  const imdbID = req.body.imdbID;
  var payload = {};
  payload.titles = [];
  payload.success = false;
  payload.streams = [];
  var stream = [];
  console.log(req.body);
  mysql.pool.query('SELECT * FROM StreamingServices', (err, result) => {  // get all streaming services
    if (err) {
      next(err);
      return;
    }
    for (var i = 0; i < result.length; i++) {
      payload.streams.push({ streamingServiceID: result[i].streamingServiceID, name: result[i].name });
    }
  });
  // for (var j = 0; j < streams.length; j++) {
  //   if (streams[j] == 'Netflix') {
  //     stream.push(1);
  //   } else if (streams[j] == 'Hulu') {
  //     stream.push(2);
  //   } else if (streams[j] == 'Prime') {
  //     stream.push(3);
  //   } else if (streams[j] == 'Disney') {
  //     stream.push(4);
  //   }
  // }
  if (type === 'Movie') {
    mysql.pool.query('UPDATE Movies SET title=? WHERE movieID=?', [title, id], (err, result) => {  // update the movie title
      if (err) {
        next(err);
        return;
      }
      mysql.pool.query('UPDATE IMDB SET score=?, title=? WHERE imdbID=?', [score, title, imdbID], (err, result) => {  // update score and title
        if (err) {
          next(err);
          return;
        }
        mysql.pool.query('DELETE FROM StreamingService_Movies WHERE movieID=?', [id], (err, result) => {  // delete all movie -> streaming service realtionships
          if (err) {
            next(err);
            return;
          }
          for (var i = 0; i < stream.length; i++) { // loop through each of the streaming services
            mysql.pool.query('INSERT INTO StreamingService_Movies (movieID, streamingServiceID) VALUES(?,?)', [id, stream[i]], (err, result) => {  // update score and title
              if (err) {
                next(err);
                return;
              }
            });
          }
          mysql.pool.query('SELECT title FROM Movies UNION SELECT title FROM Shows ORDER BY title', (err, result) => {  // get all titles
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
    mysql.pool.query('UPDATE Shows SET title=? WHERE showID=?', [title, id], (err, result) => {  // update the show title
      if (err) {
        next(err);
        return;
      }
      mysql.pool.query('UPDATE IMDB SET score=?, title=? WHERE imdbID=?', [score, title, imdbID], (err, result) => {  // update score and title
        if (err) {
          next(err);
          return;
        }
        mysql.pool.query('DELETE FROM StreamingService_Shows WHERE showID=?', [id], (err, result) => {  // delete all shows -> streaming service realtionships
          if (err) {
            next(err);
            return;
          }
          for (var i = 0; i < stream.length; i++) { // loop through each of the streaming services
            mysql.pool.query('INSERT INTO StreamingService_Shows (showID, streamingServiceID) VALUES(?,?)', [id, stream[i]], (err, result) => {  // update score and title
              if (err) {
                next(err);
                return;
              }
            });
          }
          mysql.pool.query('SELECT title FROM Movies UNION SELECT title FROM Shows ORDER BY title', (err, result) => {  // get all titles
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

// route for rendering add page
app.get('/add', (req, res, next) => {
  addPage(res);
});

// route for adding a new show or movie
app.post('/add', (req, res, next) => {
  const title = req.body.title;
  const score = req.body.score;
  const type = req.body.types;
  const streams = req.body.streams;
  var imdb;
  var movieID;
  var showID;
  // console.log(req.body)
  mysql.pool.query('INSERT INTO IMDB (title, score) VALUES (?,?)', [title, score], (err, result) => {  // insert new title and score to IMDB table
    if (err) {
      next(err);
      return;
    }
    mysql.pool.query('SELECT imdbID FROM IMDB WHERE title=?', [title], (err, result) => {  // get the newly inserted imdb id
      if (err) {
        next(err);
        return;
      }
      imdb = result[0].imdbID;  /// need to be careful of duplicates... make sure the set titles back to unique
      // console.log(imdb);
      if (type == "Movie") {
        mysql.pool.query('INSERT INTO Movies (title, imdbID) VALUES (?,?)', [title, imdb], (err, result) => {  // get all streaming services
          if (err) {
            next(err);
            return;
          }
          mysql.pool.query('SELECT movieID FROM Movies WHERE title=?', [title], (err, result) => {  // get the newly inserted movie id
            if (err) {
              next(err);
              return;
            }
            movieID = result[0].movieID;
            for (var i = 0; i < streams.length; i++) {
              mysql.pool.query('INSERT INTO StreamingService_Movies (movieID, streamingServiceID) VALUES (?,?)', [movieID, streams[i]], (err, result) => {  // get all streaming services
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
        mysql.pool.query('INSERT INTO Shows (title, imdbID) VALUES (?,?)', [title, imdb], (err, result) => {  // get all streaming services
          if (err) {
            next(err);
            return;
          }
          mysql.pool.query('SELECT showID FROM Shows WHERE title=?', [title], (err, result) => {  // get the newly inserted show id
            if (err) {
              next(err);
              return;
            }
            showID = result[0].showID;
            for (var i = 0; i < streams.length; i++) {
              mysql.pool.query('INSERT INTO StreamingService_Shows (showID, streamingServiceID) VALUES (?,?)', [showID, streams[i]], (err, result) => {  // get all streaming services
                if (err) {
                  next(err);
                  return;
                }
              });
            }
            // console.log(showID)
            addPage(res, true);
          });
        });
      }
    });
  });
});

app.post('/add-new', (req, res, next) => {

});

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

function getStreams() {
  var streams = [];
  mysql.pool.query('SELECT * FROM StreamingServices', (err, result) => {  // get all streaming services
    if (err) {
      next(err);
      return;
    }
    for (var i = 0; i < result.length; i++) {
      streams.push({ selected: false, streamingServiceID: result[i].streamingServiceID, name: result[i].name });
    }
    return streams;
  });

}

app.listen(app.get('port'), function () {
  console.log(
    `Express started on http://${process.env.HOSTNAME}:${app.get(
      'port'
    )}; press Ctrl-C to terminate.`
  );
});
