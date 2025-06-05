document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value,
      surname: form.surname.value,
      isAdult: form.isAdult.checked
    };
  
    const res = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(result.status || result.error);
    form.reset();
  });
  
  async function getUsers() {
    const res = await fetch('http://localhost:3000/users');
    const users = await res.json();
    document.getElementById('usersList').textContent = JSON.stringify(users, null, 2);
  }
  
  document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = e.target.message.value;
    const res = await fetch('http://localhost:3000/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const result = await res.json();
    alert(result.status || result.error);
    e.target.reset();
  });
  
  async function getMessages() {
    const res = await fetch('http://localhost:3000/messages');
    const messages = await res.json();
    document.getElementById('messagesList').textContent = JSON.stringify(messages.messages, null, 2);
  }