require('dotenv').config()
var express  = require('express');
var database = require('./config/database');
var mongoose = require('mongoose');
var app      = express();
var bodyParser = require('body-parser');         
const exphbs = require("express-handlebars");

var cors = require('cors')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
var port     = process.env.PORT || 8000;
app.use(cors());
app.use(bodyParser.urlencoded({'extended':'true'}));            
app.use(bodyParser.json());                                     
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); 

const dbConnectionString = process.env.DB_CONNECTION_STRING;

database.initialize(dbConnectionString)
  .then(() => {
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
      console.log("--------------------------------------------------------------------------------");
    });
  })
  .catch(error => {
    console.error("Unable to initialize movie database:", error);
  });

app.engine(
    ".hbs",
    exphbs.engine({
      extname: ".hbs",
      helpers: {
        getProperty: function(propertyName){
          if(propertyName==="imdb") return this.imdb.rating;
          return this[propertyName];
        },
        gt: function(a, b) {
          if (a > b) return true
          else return false
        },
        lt: function(a, b) {
          if (a < b) return true
          else return false
        },
      }
    })
);
  
app.set("view engine", "hbs");
// mongoose.connect(database.url);
// console.log("--------------------------------------------------------------------------------");
// console.log("Connection established: " + database.url);
// console.log("--------------------------------------------------------------------------------");

const Movie = require('./models/movies');
const User = require('./models/users');

const user= {
  staticUsername : 'admin',
  staticPassword : 'admin'
}
async function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

  if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // const user = await User.findById(decoded.userId);

      if (!user) {
          return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
      req.user = user;
      next();
  } catch (error) {
      return res.status(401).json({ message: 'Access denied!' });
  }
}

function generateToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
}

app.get('/signup', (req, res) => {
  res.render("signup");
});

app.get('/login', (req, res) => {
  res.render("login");
});
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === user.staticUsername && password === user.staticPassword) {
      const token = generateToken(user);
      return res.status(200).json({ token });
  } else {
      return res.status(401).json({ message: 'Invalid username or password' });
  }
});


app.get('/', (req, res) => {
    const data = {
        pageTitle: 'Movies'
    };
    res.redirect("/api/Movies?page=1&perPage=8&title=")
});

const maxPagesToShow = 15; 

app.get('/api/Movies', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 8;
  const title = req.query.title || '';

  try {
    // Call getAllMovies function to retrieve movies
    const movies = await database.getAllMovies(page, perPage, title);

    // Count total documents matching the query
    const count = await Movie.countDocuments(title ? { title: { $regex: title, $options: 'i' } } : {});

    // Calculate total pages and pagination
    const totalPages = Math.ceil(count / perPage);
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const paginationArray = [];
    for (let i = startPage; i <= endPage; i++) {
      paginationArray.push({
        pageNumber: i,
        isCurrent: i === page
      });
    }

    const data = {
      pageTitle: 'Welcome to Sample Movie App',
      message: 'This is the homepage!',
      movies: movies,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalMovies: count,
        perPage: perPage,
        paginationArray: paginationArray,
        previousPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null,
      }
    };

    if (req.xhr) {
      return res.json(data);
    }
    res.render('index', data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Display add form.
app.get('/api/Movies/add', async (req, res) => {
  try {
    res.render('addMovie', {pageTitle: 'Add a Movie'});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Add movie to the database and redirect to Home page.
app.post('/api/Movies', async (req, res) => {
  const { title, runtime, type, plot, poster, fullplot, genres, languages, directors, casts, countries, released, rated, year, imdbRating, imdbVotes, imdbId, awardWins, awardNominations, awardText, viewerRating, viewerNumReviews, viewerMeter, criticRating, criticNumReviews, criticMeter, tomatoesFresh, tomatoesRotten } = req.body;

  try {
    const lastupdated = new Date();
    const movie = new Movie({
      plot,
      genres: Array.isArray(genres) ? genres : [genres],
      runtime,
      cast: Array.isArray(casts) ? casts : [casts],
      poster,
      title,
      fullplot,
      languages: Array.isArray(languages) ? languages : [languages],
      released: new Date(released).getTime().toString(),
      directors: Array.isArray(directors) ? directors : [directors],
      rated,
      awards: {
        wins: awardWins,
        nominations: awardNominations,
        text: awardText
      },
      lastupdated: lastupdated,
      year,
      imdb: {
        rating: imdbRating,
        votes: imdbVotes,
        id: imdbId
      },
      countries: Array.isArray(countries) ? countries : [countries],
      type,
      tomatoes: {
        viewer: {
          rating: viewerRating,
          numReviews: viewerNumReviews,
          meter: viewerMeter
        },
        fresh: tomatoesFresh,
        critic: {
          rating: criticRating,
          numReviews: criticNumReviews,
          meter: criticMeter
        },
        rotten: tomatoesRotten,
        lastUpdated: lastupdated
      }
    });
    const savedMovie = await database.addNewMovie(movie);
    return redirect("/");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Movie Details by Id
app.get('/api/Movies/:id', async (req, res) => {
  try{
    const movies = await database.getMovieById(req.params.id);
    res.render('movieDetails', { pageTitle: "Movie Details", movies: movies});
  }
  catch(error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to display update data form
app.get('/api/Movies/:id/update', async (req, res) => {
  console.log(req.params.id);
  const movieId = req.params.id;
  try {
      const movie = await Movie.findById(movieId);
      if (!movie) {
          return res.status(404).json({ messaaaage: 'Movie not found' });
      }
      movieData = {
        title: movie.title,
        plot: movie.plot,
        genres: movie.genres,
        runtime: movie.runtime,
        cast: movie.cast,
        poster: movie.poster,
        fullplot: movie.fullplot,
        languages: movie.languages,
        released: movie.released,
        directors: movie.directors,
        rated: movie.rated,
        awardsWins: movie.awards.wins,
        awardsNominations: movie.awards.nominations,
        awardsText: movie.awards.text,
        year: movie.year,
        imdbRating: movie.imdb.rating,
        imdbVotes: movie.imdb.votes,
        imdbId: movie.imdb.id,
        countries: movie.countries,
        type: movie.type,
        tomatoesFresh: movie.tomatoes.fresh,
        tomatoesRotten: movie.tomatoes.rotten,
        viewerRating: movie.tomatoes.viewer.rating,
        viewerNumReviews: movie.tomatoes.viewer.numReviews,
        viewerMeter: movie.tomatoes.viewer.meter,
        criticRating: movie.tomatoes.critic.rating,
        criticNumReviews: movie.tomatoes.critic.numReviews,
        criticMeter: movie.tomatoes.critic.meter,
      }
      res.render('updateMovie', { pageTitle: "Update movie details", movie: movieData , movieId: "573a1390f29313caabcd42e8"});
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Route to update data
app.put('/api/Movies/:id', authenticateUser, async (req, res) => {
  const lastupdated = new Date();
  var movieUpdated = req.body;
  movieUpdated.lastupdated = movieUpdated.tomatoes.lastUpdated = lastupdated;

  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, movieUpdated, { new: true });
    if (!movie) {
        return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(req.params.id);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

app.delete('/api/Movies/:id', authenticateUser, async (req, res) => {
  try {
    const movie = await database.deleteMovieById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    console.log('Movie deleted successfully.');
    res.status(200).json();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = app;
