const sql = require('mssql');
const express = require('express');
const app = express();
const cors = require('cors')
const bcrypt = require('bcrypt'); 
const { join } = require("path");
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');


// Configure CORS
app.use(express.json()); // This line parses incoming JSON requests

app.use(
    cors({
      origin: "http://localhost:3000/login", // restrict calls to those this address
      methods: "GET" // only allow GET requests
    })
  );

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: 'a long, randomly-generated string stored in env',
    baseURL: 'http://localhost:3000',
    clientID: 'QLYjvRLq0tHhSf7jHFujPSsGAfn1WOCJ',
    issuerBaseURL: 'https://dev-a5uwo1ni4zf2cfwq.us.auth0.com'
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ?  "Logged In" : 'Logged out');
});

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
  });

const configDB = {
    user: 'FF',
    password: 'Char1bury123',
    server: 'ec2-13-60-252-8.eu-north-1.compute.amazonaws.com',
    database: 'BT4500',
    options: {
        encrypt: true, // Use true if you're on Azure
        trustServerCertificate: true, // Set to true for local dev/test
    }
};

sql.connect(configDB).then(pool => {

    app.get('/players', async (req, res) => {
        try {
            const result = await pool.request().query('SELECT * FROM players');
            res.json(result.recordset);
        } catch (err) {
            console.error('SQL query error:', err);
            res.status(500).send('Error fetching data from database');
        }
    });

     // Endpoint to get tournaments
     app.get('/tournaments', async (req, res) => {
        try {
            const result = await pool.request().query('SELECT id,name, date FROM Tournament ORDER BY date');
            res.json(result.recordset);
        } catch (err) {
            console.error('SQL query error:', err);
            res.status(500).send('Error fetching tournaments from database');
        }
    });

    app.post('/register', async (req, res) => {
        const { tournamentId, name, lastName, phone, email, sex, category } = req.body;
    
        try {
            // Validate required fields
            if (!tournamentId || !name || !lastName || !phone || !email || !sex || !category) {
                return res.status(400).send('Missing required fields');
            }
    
            // Check for existing registration in the same tournament and category
            const checkResult = await pool.request()
                .input('tournamentId', sql.Int, tournamentId)
                .input('category', sql.NVarChar, category)
                .input('email', sql.NVarChar, email)
                .query(`
                    SELECT COUNT(*) AS count 
                    FROM registrations 
                    WHERE tournament_id = @tournamentId 
                    AND category = @category 
                    AND email = @email
                `);
    
            const registrationExists = checkResult.recordset[0].count > 0;
    
            if (registrationExists) {
                return res.status(409).send('You are already registered for this tournament and category.');
            }
    
            // Insert new registration
            await pool.request()
                .input('tournamentId', sql.Int, tournamentId)
                .input('name', sql.NVarChar, name)
                .input('lastName', sql.NVarChar, lastName)
                .input('phone', sql.NVarChar, phone)
                .input('email', sql.NVarChar, email)
                .input('sex', sql.Char, sex)
                .input('category', sql.NVarChar, category)
                .query(`
                    INSERT INTO registrations 
                    (tournament_id, first_name, last_name, phone, email, sex, category)
                    VALUES (@tournamentId, @name, @lastName, @phone, @email, @sex, @category)
                `);
    
            res.status(201).send('Registration successful');
        } catch (err) {
            console.error('Error handling registration:', err);
            res.status(500).send('Error registering for tournament');
        }
    });

    app.get('/tournaments/:id', async (req, res) => {
        const tournamentId = req.params.id;
        try {
            const result = await pool.request()
                .input('tournamentId', sql.Int, tournamentId)
                .query('SELECT name, date FROM tournament WHERE id = @tournamentId');
    
            if (result.recordset.length > 0) {
                res.json(result.recordset[0]);
            } else {
                res.status(404).send('Tournament not found');
            }
        } catch (err) {
            console.error('Error fetching tournament details:', err);
            res.status(500).send('Error fetching tournament details');
        }
    });

});






app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

