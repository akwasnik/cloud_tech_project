const express = require('express');
const redis = require('redis');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { publishToQueue } = require('./amqp');



//  ----  DB PART ----



const db = new Client({
  host: 'db', 
  user: 'user',
  password: 'pass',
  database: 'mydb',
  port: process.env.DB_PORT || 5432,  
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
  url: `redis://redis:${process.env.REDIS_PORT || 6379}`,
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

// ---- AMQP ENDPOINTS ----

app.post('/enqueue', async (req, res) => {
  const payload = req.body; 
  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Brak danych do kolejki' });
  }

  try {
    await publishToQueue('tasks_queue', payload);
    res.json({ status: 'Wysłano do kolejki', queue: 'tasks_queue' });
  } catch (err) {
    console.error('Błąd publikacji do RabbitMQ:', err);
    res.status(500).json({ error: 'Nie udało się wysłać do kolejki' });
  }
});

async function startConsumer() {
  const amqp = require('amqplib');
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672');
  const channel = await connection.createChannel();
  await channel.assertQueue('tasks_queue', { durable: true });
  channel.prefetch(1);

  console.log(' [*] Oczekuję na wiadomości w kolejce tasks_queue ...');
  channel.consume('tasks_queue', async (msg) => {
    if (msg !== null) {
      const content = msg.content.toString();
      let data;
      try {
        data = JSON.parse(content);
      } catch (e) {
        console.error('Niepoprawny JSON w kolejce:', content);
        channel.ack(msg);
        return;
      }

      console.log(' [x] Otrzymano zadanie:', data);
      channel.ack(msg);
    }
  }, { noAck: false });
}


startConsumer().catch(console.error);


app.listen(process.env.PORT || 3050, () => {
  console.log(`Server listening on port ${process.env.PORT || 3050}`);
});