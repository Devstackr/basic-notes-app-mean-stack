const express = require('express');
const bodyParser = require('body-parser');

const jwt = require('jsonwebtoken');

const app = express();

const { Note, User } = require('./models');

require('./helpers/db-connect'); // connect to MongoDB

app.use(bodyParser.json());

const cors = require('cors');
app.use(cors({
    exposedHeaders: ['x-access-token', 'x-refresh-token']
}));



// Check whether the request has a valid JWT Access Token
const authenticate = (req, res, next) => {
    // Grab the access token from the request header
    const accessToken = req.header('x-access-token');

    // Verify the JWT
    jwt.verify(accessToken, User.getJWTSecret(), (error, decoded) => {
        if (error) {
            // there was an error
            // jwt is invalid - DO NOT AUTHENTICATE
            res.status(401).send({ error });
        } else {
            // JWT is valid
            req.userId = decoded._id;
            next();
        }
    })
}

// Verify Refresh Token middleware (which will be verifying the session) 
const verifySession = (req, res, next) => {
    // grab the refresh token from the request header
    const refreshToken = req.header('x-refresh-token');

    // grab the _id from the request header
    const _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            // user couldn't be found
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct.'
            })
        }

        // if the code reaches here, then the user was found
        // therefore the refresh token exists in the database
        // but we still have to check whether or not it has expired

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                // check if the session has expired
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    // the refresh token hasn't expired
                    isSessionValid = true;
                }
            }
        })

        if (isSessionValid) {
            // the session is VALID

            // set properties on the request object
            req.userId = user._id;
            req.userObj = user;
            req.refreshToken = refreshToken;

            next();
        } else {
            // the session is NOT valid
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }
    }).catch(e => {
        res.status(401).send(e);
    })
}


/* ROUTES */

/**
 * Retrieve all notes
 */
app.get('/notes', authenticate, (req, res) => {
    Note.find({
        _userId: req.userId
    }).then((notes) => {
        res.send(notes);
    }).catch((e) => {
        res.status(400).send(e);
    })
})

/**
 * Retrieves a specific note (by id)
 */
app.get('/notes/:id', authenticate, (req, res) => {
    Note.findOne({
        _id: req.params.id,
        _userId: req.userId
    }).then((note) => {
        res.send(note);
    }).catch(e => {
        res.status(400).send(e);
    })
})

/**
 * Create a new note
 */
app.post('/notes', authenticate, (req, res) => {
    let noteInfo = req.body;
    noteInfo._userId = req.userId;

    let newNote = new Note(noteInfo);
    newNote.save().then((newNoteDoc) => {
        // the full note document (incl. id) is passed to this callback
        res.send(newNoteDoc);
    }).catch((e) => {
        res.status(400).send(e);
    })
})

/**
 * Update a note
 */
app.patch('/notes/:id', authenticate, (req, res) => {
    Note.findOneAndUpdate({
        _id: req.params.id,
        _userId: req.userId
    }, {
            $set: req.body
        }).then(() => {
            res.send();
        }).catch((e) => {
            res.status(400).send(e);
        })
})

/**
 * Delete a note
 */
app.delete('/notes/:id', authenticate, (req, res) => {
    Note.findOneAndRemove({
        _id: req.params.id,
        _userId: req.userId
    }).then((removedNoteDoc) => {
        res.send(removedNoteDoc);
    })
})


/* USER ROUTES */

/**
 * Create a user (Sign up)
 */
app.post('/users', (req, res) => {
    const userInfo = req.body;
    const newUser = new User(userInfo);

    newUser.save().then(() => {
        res.send(newUser);
    }).catch(e => {
        res.status(400).send(e);
    })
})

/**
 * Log in
 */
app.post('/users/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            // Session has been created successfully
            // and the refresh token has been returned
            return user.generateAccessToken().then((accessToken) => {
                // access token has been generated successfully
                // so now we return an object containing the auth tokens
                return { accessToken, refreshToken }
            })
        }).then((authTokens) => {
            // now construct and send the response to the caller
            // with their auth tokens in the response headers
            // and the user object in the response body
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch(e => {
        res.status(400).send(e);
    })
})


/**
 * Generating a fresh access token
 */
app.get('/users/me/access-token', verifySession, (req, res) => {
    // we can use the user object to generate a new access token
    // we have access to the user object because of verifySession
    req.userObj.generateAccessToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send();
    }).catch((e) => {
        res.status(400).send(e);
    })
})

/**
 * Update user details
 */
app.patch('/users/me', authenticate, (req, res) => {
    let body = req.body;
    delete body.sessions;

    User.findById(req.userId).then((userDoc) => {
        Object.assign(userDoc, body);
        userDoc.save().then(() => {
            res.status(200).send();
        })
    }).catch(e => {
        res.status(400).send(e);
    })
})


/**
 * Logout (Delete a session from the database)
 */
app.delete('/users/me/session', verifySession, (req, res) => {
    let _id = req.userId;
    let refreshToken = req.refreshToken; // this is the token we have to invalidate

    User.findOneAndUpdate({ _id }, {
        $pull: {
            sessions: {
                token: refreshToken
            }
        }
    }).then(() => {
        res.status(200).send();
    })
})



app.listen(3000, () => {
    console.log('API is running on port 3000')
})