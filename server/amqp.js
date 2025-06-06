const amqp = require('amqplib');

const RABBIT_URL = `amqp://guest:guest@rabbitmq:${process.env.RABBITMQ_PORT || 5672}`;

async function publishToQueue(queueName, messageObj) {
  // 1) Połącz się z RabbitMQ
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();

  // 2) Upewnij się, że kolejka istnieje (durable: true -> kolejka przetrwa restart)
  await channel.assertQueue(queueName, { durable: true });

  // 3) Wyślij wiadomość (zamienioną na Buffer)
  const buffer = Buffer.from(JSON.stringify(messageObj));
  channel.sendToQueue(queueName, buffer, { persistent: true });

  // 4) Zamknij kanał i połączenie (po krótkim delay)
  setTimeout(() => {
    channel.close().catch(() => {});
    connection.close().catch(() => {});
  }, 500);
}

module.exports = { publishToQueue };
