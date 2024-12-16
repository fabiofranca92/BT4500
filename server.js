const sql = require('mssql');
const express = require('express');
const app = express();
const cors = require('cors')

// Configure CORS
app.use(cors());

const config = {
    user: 'FF',
    password: 'Char1bury123',
    server: 'ec2-13-60-252-8.eu-north-1.compute.amazonaws.com',
    database: 'BT4500',
    options: {
        encrypt: true, // Use true if you're on Azure
        trustServerCertificate: true, // Set to true for local dev/test
    },
};

sql.connect(config).then(pool => {
    app.get('/players', async (req, res) => {
        try {
            const result = await pool.request().query('SELECT * FROM players');
            res.json(result.recordset);
        } catch (err) {
            console.error('SQL query error:', err);
            res.status(500).send('Error fetching data from database');
        }
    });
});


app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

