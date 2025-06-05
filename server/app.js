const express = require('express');
const redis = require('redis');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');



//  ----  DB PART ----



const db = new Client({
  host: 'db', 
  user: 'user',
  password: 'pass',
  database: 'mydb',
  port: 5432,  
  connectionTimeoutMillis: 10000
});

db.connect(err => {
  if (err) {
      console.error('ERROR: ', err);
  } else {
      console.log('Success: Connected to the database');
      db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          surname TEXT NOT NULL,
          is_adult BOOLEAN NOT NULL
        )
      `).then(() => {
        console.log('Table users ensured.');
      }).catch(console.error);
  }
});





// ---- REDIS PART ----



const redisClient = redis.createClient({
  url: 'redis://redis:6379'
});


redisClient.connect().catch(console.error);



// ---- EXPRESS PART ----



const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));



// ---- REDIS ENDPOINTS ----


app.post('/message', async (req, res) => { // Example for posting endpoint
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  await redisClient.rPush('messages', message);
  res.json({ status: 'Message added' });
});

// app.get('/message', async (req, res) => { // easier to experiment Example: http://localhost:3000/message?m=Hello%20Redis
//     const message = req.query.m;
//     if (!message) {
//       return res.status(400).json({ error: 'Message is required in query ?m=' });
//     }
  
//     await redis.rPush('messages', message);
//     res.json({ status: 'Message added', message });
//   });

app.get('/messages', async (req, res) => { // Read messages
  const messages = await redisClient.lRange('messages', 0, -1);
  res.json({ messages });
});



// ---- DB ENDPOINTS ----

app.post('/users', async (req, res) => {
  const { name, surname, isAdult } = req.body;

  if (!name || !surname || typeof isAdult !== 'boolean') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    await db.query('INSERT INTO users(name, surname, is_adult) VALUES($1, $2, $3)', [name, surname, isAdult]);
    res.json({ status: 'User added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.listen(3000, () => {
  console.log(`Server listening on port ${3000}`);
});