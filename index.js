require('dotenv').config();
const express = require('express'),
    fs = require('fs'),
    morgan = require('morgan'),
    path = require('path'),
    mongoose = require('mongoose'),
    Models = require('./models.js'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    { check, validationResult } = require('express-validator');

const Movies = Models.Movie;
const Users = Models.User;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
let allowedOrigins = ['http://localhost:8080', 'http://localhost:1234', 'http://localhost:4200', 'https://dacflix.netlify.app', 'https://dangermouse121985.github.io'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn't found on the list of allowed origins
            let message = `The CORS policy for this application doesn't allow access from origin ` + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');


mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));
app.use(express.static('public'));

/** 
* @name GET - Return all Movies
* @description Return a list of all movies to the user
* @function
* @returns {array} Lis of all movie objects containing an id, title, and url of each.
* @example
*[{
    id: 1234,
    title: "Batman Begins",
    url: "/movies/Batman%20Begins",
}, {
    id: 1235,
    title: "The Dark Knight",
    url: "/moview/Batman%20Begins",
}]
*/
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find()
        .then((movies) => {
            res.json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/** 
 * @name GET - Return One Movie by Title
 * @description Return data (description, genre, director, image URL, whether it’s featured or not) about a single movie by title to the userv
 * @function
 * @param {string} title - Movie Title
 * @returns {Object|null} - Movie object containing id, title, url. description, director, actors, genre, imageUrl and featured status.
 * @example 
 * {
    id: 1234,
    title: "Batman Begins",
    url: "/movies/Batman%20Begins",
    description "After witnessing his parents' death, Bruce learns the art of fighting to confront injustice. When he returns to Gotham as Batman, he must stop a secret society that intends to destroy the city.",
    director:
    {
        name: "Christopher Nolan",
        bio: "Christopher Edward Nolan CBE is a British and American filmmaker. Known for his Hollywood blockbusters with complex storytelling, Nolan is considered a leading filmmaker of the 21st century. His films have grossed $5 billion worldwide.",
        birth: "1970-07-30T00:00:00.000Z",
        death "1970-07-30T00:00:00.000Z"
    },
    actors:
    [
        {
            name: "Christian Bale",
            bio: "Christian Charles Philip Bale is an English actor. Known for his versatility and physical transformations for his roles, he has been a leading man in films of several genres. He has received various accolades, including an Academy Award and two Golden Globe Awards."
            birth: "1970-07-30T00:00:00.000Z",
            death: "1970-07-30T00:00:00.000Z"
        },
        {
            ...
        }
    ],
    genre:
    {
        name: "Action",
        description: "Movies in the action genre are fast-paced and include a lot of action like fight scenes, chase scenes, and slow-motion shots. They can feature superheroes, martial arts, or exciting stunts. These high-octane films are more about the execution of the plot rather than the plot itself. Action movies are thrilling to watch and leave audience members on the edge of their seats."
    },
    imagePath: "https://image.com/image.png",
    featured: true
}
*/
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ title: req.params.title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/** 
 * @name GET - Return All Genres 
 * @description Return a list of all genres including their description
 * @function
 * @returns {array} - List of all Genres with names and descriptions
 * @example 
 * 
 * [{
    title: "Action",
    description: "Action film is a film genre in which the protagonist is thrust into a series of events that typically involve violence and physical feats."
},
{
    ...
}]
*/
app.get('/genres', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.distinct("genre")
        .then((movies) => {
            res.json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/** 
 * @name GET - Return A Genre by Name
 * @description Return a list of all genres including their description
 * @function
 * @param {string} name - Genre Name
 * @returns {object} - One genre with name and description
 * @example
 * {
    title: "Action",
    description: "Action film is a film genre in which the protagonist is thrust into a series of events that typically involve violence and physical feats."
}
 */
app.get('/genres/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ "genre.name": req.params.name }, { "genre.name": 1, "genre.description": 1 })
        .then((movies) => {
            res.json(movies.genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

/** 
 * @name GET - Return All Directors 
 * @description Return a list of all directors including their data (bio, birth year, death year)
 * @function
 * @returns {array} - List of director objects with name, bio, birthYear, and deathYear of each director.
 * @example 
 * [{
    name: "Christopher Nolan",
    bio: "Christopher Edward Nolan CBE is a British and American filmmaker. Known for his Hollywood blockbusters with complex storytelling, Nolan is considered a leading filmmaker of the 21st century. His films have grossed $5 billion worldwide.",
    birthYear: 1970,
    deathYear: null
}, {
    ...
}]
*/
app.get('/directors', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.distinct("director")
        .then((movies) => {
            res.json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

/** 
 * @name GET - Return one Director by Name 
 * @description Return data about a director (bio, birth year, death year) by name
 * @function
 * @param {string} name - Director Name
 * @returns {object} - One Director with name, bio, birthYear, and deathYear.
 * @example 
 * {
    name: "Christopher Nolan",
    bio: "Christopher Edward Nolan CBE is a British and American filmmaker. Known for his Hollywood blockbusters with complex storytelling, Nolan is considered a leading filmmaker of the 21st century. His films have grossed $5 billion worldwide.",
    birthYear: 1970,
    deathYear: null
}
*/
app.get('/directors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ "director.name": req.params.name }, { "director": 1 })
        .then((movies) => {
            res.json(movies.director);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

/** 
 * @name GET - Return All Actors 
 * @description Return a list of all actors including their data (bio, birth year, death year) by name
 * @function
 * @returns {array} - List of Actor objects with name, bio, birthYear, and deathYear of each.
 * @example
 * [{
    name: "Christian Bale",
    bio: "Christian Charles Philip Bale is an English actor. Known for his versatility and physical transformations for his roles, he has been a leading man in films of several genres. He has received various accolades, including an Academy Award and two Golden Globe Awards.",
    birthYear: 1974,
    deathYear: null
},
{
    ...
}]
 */
app.get('/actors', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.distinct("actors")
        .then((movies) => {
            res.json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

/** 
 * @name GET - Return One Actor
 * @description Return data about an actor (bio, birth year, death year) by name
 * @function
 * @param {string} name - Actor Name
 * @return {object|null} - One Actor with name, bio, birthYear, and deathYear.
 * @example
 * {
    _id: "6514a9b77707cd8d539df844",
    name: "Christian Bale",
    bio: "Christian Charles Philip Bale is an English actor. Known for his versatility and physical transformations for his roles, he has been a leading man in films of several genres. He has received various accolades, including an Academy Award and two Golden Globe Awards.",
    birthYear: 1974,
    deathYear: null
}
 */
app.get('/actors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ "actors.name": req.params.name }, { "actors.$": 1 })
        .then((movies) => {
            res.json(movies.actors);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

/** 
 * @name GET - Return all Users
 * @description Returns a list of all users including their data (username, password, first name, last name, email, birthdate). `@dcrichlow1985` user is required for access
 * @function
 * @returns {array} - List of all users with id, username, first name, last name, email, and birth date
 * @example
 * [{
    id: 1234,
    username: "jdoe123",
    first name: "John ",
    last name: "Doe",
    email: "johndoe@gmail.com",
    birth: "1991-01-23"
}
{
...
}]
 */
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.username !== 'dcrichlow1985') {
        console.log(req.user.username)
        return res.status(400).send('Permission Denied');
    }
    await Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/** 
 * @name GET - Return one User by Username 
 * @description Return one user including data (username, password, first name, last name, email, birthdate), by name
 * @function
 * @param {string} username - User's Username
 * @param {password} Password - User's Password
 * @return {string|object} - Permission Denied | User object containing their id, username, first name, last name, email, and birth year.
 * @example
 *  {
    username: String, (required),
    password: String, (required),
    first_name: String, (required),
    last_name: String, (required),
    email: String, (required),
    birth: Date
 }
*/
app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.username !== req.params.username) {
        return res.status(400).send('Permission Denied');
    }

    await Users.findOne({ username: req.params.username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/** 
 * @name POST - Create a New User Account
 * @description Allow New Users to register
 * @function
 * @param {object} User
 {
    username: String, (required),
    password: String, (required),
    first_name: String, (required),
    last_name: String, (required),
    email: String, (required),
    birth: Date
 }
 @returns {string|object} - Required Field Error | User object containing the user's information
 @example
  {
    username: String, (required),
    password: String, (required),
    first_name: String, (required),
    last_name: String, (required),
    email: String, (required),
    birth: Date
 }
 */
app.post('/users',
    /* Validation logic here for request
     * you can either use a chain of methods like .not().isEmpty()
     * which means "opposite of isEmpty" in plain english "is not empty"
     * or use .isLength9({min: 5}) which means
     * minimum value of 5 characters are only allowed */
    [
        check('username', 'Username is required').isLength({ min: 5 }),
        check('username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('password', 'Password is required').not().isEmpty(),
        check('first_name', 'First Name is required').not().isEmpty(),
        check('last_name', 'Last Name is required').not().isEmpty(),
        check('email', 'Email does not appear to be valid').isEmail()
    ], async (req, res) => {
        // Check the validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.password);
        await Users.findOne({ username: req.body.username })
            .then((user) => {
                if (user) {
                    return res.status(400).send(req.body.username + ' already exists');
                } else {
                    Users.create({
                        username: req.body.username,
                        password: hashedPassword,
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        email: req.body.email,
                        birth: req.body.birth
                    })
                        .then((user) => { res.status(201).json(user) })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).send('Error: ' + err);
                        })
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    });

/** 
 * @name PUT - Update User Info
 * @description Allow users to update their user info (username)
 * @function
 * @param {object} - An object containing the field and new value to be updated
 * {
    username: String, (required)
    password: String, (required)
    email: String, (required)
    birth: Date
 * }
 * @returns {object}
 * @example {
    id: 1234,
    username: "jdoe123",
    password: "password"
    first name: "John ",
    last name: "Doe",
    email: "johndoe@gmail.com",
    birth: "1991-01-23"
    favorites:
    [
        "1234", "5678"
    ]
*}
 */
app.put('/users/:username', passport.authenticate('jwt', { session: false }),
    [
        check('username', 'Username is requierd').isLength({ min: 5 }),
        check('username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('password', 'Password is required to verify changes').not().isEmpty(),
        check('email', 'Email does not appear to be valid').isEmail()
    ], async (req, res) => {

        if (req.user.username !== req.params.username) {
            res.status(400).send('Permission Denied');
        }

        //check the validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.password);
        await Users.findOneAndUpdate({ username: req.params.username }, {
            $set:
            {
                username: req.body.username,
                password: hashedPassword,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                email: req.body.email,
                birth: req.body.birth
            }
        },
            { new: true }) //this line makes sure that the update document is returned
            .then((updatedUser) => {
                res.json(updatedUser);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send("Error: " + err);
            })
    });

/** 
 * @name PUT - Add a Movie to a User's Favorites List
 * @description Allow users to add a movie to their list of favorites
 * @function
 * @api_endpoint test
 * @param {string} username - User's Username
 * @param {string} movieId - ID of favorited movie
 * @returns {object}
 * @example {
    id: 1234,
    username: "jdoe123",
    password: "password"
    first name: "John ",
    last name: "Doe",
    email: "johndoe@gmail.com",
    birth: "1991-01-23"
    favorites:
    [
        "1234", "5678"
    ]
}
 */
app.put('/users/:username/favorites/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.username !== req.params.username) {
        res.status(400).send('Permission Denied');
    }
    await Users.findOneAndUpdate({ username: req.params.username }, {
        //Used $addToSet instead of $push to prevent duplicates from being added to the array
        $addToSet: { favorites: new mongoose.Types.ObjectId(req.params.movieID) }
    },
        { new: true }) //this line makes sure that the update document is returned true
        .then((updatedUser) => {
            res.json(updatedUser);
            return req.body;
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

/** 
 * @name DELETE - Remove a Movie from a user's favorite's list
 * @description Allow users to remove a movie from their list of favorites (showing only a text that a movie has been removed).
 * @function
 * @param {string} username - User's Username
 * @param {string} movieId - ID of favorited movie
 * @returns {object}
 * @example {
    id: 1234,
    username: "jdoe123",
    password: "password"
    first name: "John ",
    last name: "Doe",
    email: "johndoe@gmail.com",
    birth: "1991-01-23"
    favorites:
    [
        "1234", "5678"
    ]
}
*/
app.delete('/users/:username/favorites/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.username !== req.params.username) {
        res.status(400).send('Permission Denied');
    }
    await Users.findOneAndUpdate({ username: req.params.username }, {
        $pull: { favorites: new mongoose.Types.ObjectId(req.params.movieID) }
    },
        { new: true }) //this line makes sure that the update document is returned true
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

/** 
 * @name DELETE - Delete User
 * @description Allow existing users to deregister (showing only a text that a user email has been removed).
 * @function
 * @param {string} Username - User's Username
 * @returns {string} Text message indicating user was deregistered.
*/
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.username !== req.params.username || req.user.username === "dcrichlow1985") {
        res.status(400).send('Permission Denied');
    }
    await Users.findOneAndRemove({ username: req.params.username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.username + " was not found.");
            } else {
                res.status(200).send(req.params.username + " was deleted.");
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err)
        });
});

app.get('/', (req, res) => {
    res.send('Welcome to Movie Flix');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something Broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});
