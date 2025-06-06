// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import './style.css';                          // <-- nowy, ładniejszy CSS
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import 'primeflex/primeflex.css';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { httpClient } from './HttpClient';
import Keycloak from 'keycloak-js';

/* ---------------------- Keycloak setup ---------------------- */
let initOptions = {
  url: 'http://localhost:8080/',
  realm: 'master',
  clientId: 'myclient',
};

let kc = new Keycloak(initOptions);

kc.init({
  onLoad: 'login-required',
  checkLoginIframe: true,
  pkceMethod: 'S256'
}).then((auth) => {
  if (!auth) {
    window.location.reload();
  } else {
    console.info("Authenticated");
    httpClient.defaults.headers.common['Authorization'] = `Bearer ${kc.token}`;
    kc.onTokenExpired = () => {
      console.log('token expired');
    };
  }
}, () => {
  console.error("Authentication Failed");
});
/* ----------------------------------------------------------- */

function App() {
  /* --------- stany ogólne --------- */
  const [infoMessage, setInfoMessage] = useState('');

  /* ------------- stany dla użytkowników PostgreSQL (Admin) -------------- */
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [usersList, setUsersList] = useState('');

  /* ------------- stany dla wiadomości Redis -------------- */
  const [message, setMessage] = useState('');
  const [messagesList, setMessagesList] = useState('');

  /* ------------- stany dot. panelu Admin ------------- */
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  /* ------------- sprawdzenie roli po zalogowaniu  ------------- */
  useEffect(() => {
    if (kc.authenticated) {
      setIsAdmin(kc.hasRealmRole('admin'));
    }
  }, [kc.authenticated, kc.token]);

  /* ------- obsługa dodawania użytkownika (do PostgreSQL!) ------- */
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, surname, isAdult };
      const res = await fetch('http://localhost:3050/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      alert(result.status || result.error);
      setName('');
      setSurname('');
      setIsAdult(false);
    } catch (err) {
      console.error(err);
      alert('Błąd podczas dodawania użytkownika');
    }
  };

  /* ---------------- pobierz wszystkich użytkowników z PostgreSQL --------------- */
  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3050/users');
      const users = await res.json();
      setUsersList(JSON.stringify(users, null, 2));
    } catch (err) {
      console.error(err);
      setUsersList('Błąd podczas pobierania użytkowników.');
    }
  };

  /* --------------- obsługa wysyłania wiadomości do Redis (POST) --------------- */
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3050/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const result = await res.json();
      alert(result.status || result.error);
      setMessage('');
    } catch (err) {
      console.error(err);
      alert('Błąd podczas wysyłania wiadomości');
    }
  };

  /* ---------------- pobierz wszystkie wiadomości z Redis --------------- */
  const fetchMessages = async () => {
    try {
      const res = await fetch('http://localhost:3050/messages');
      const data = await res.json();
      setMessagesList(JSON.stringify(data.messages, null, 2));
    } catch (err) {
      console.error(err);
      setMessagesList('Błąd podczas pobierania wiadomości.');
    }
  };

  /* --------------- toggle dla panelu Admin --------------- */
  const toggleAdminPanel = () => {
    setShowAdminPanel(prev => !prev);
  };

  return (
    <div className="App">
      {/* ========== Nagłówek ========== */}
      <header className="app-header">
        <h1>My Secured React App</h1>

        <div className="kc-buttons">
          <Button
            onClick={() => setInfoMessage(kc.authenticated ? 'Authenticated: TRUE' : 'Authenticated: FALSE')}
            label="Is Authenticated"
            className="p-m-2"
          />
          <Button
            onClick={() => kc.login()}
            label="Login"
            severity="success"
            className="p-m-2"
          />
          <Button
            onClick={() => kc.logout({ redirectUri: 'http://localhost/' })}
            label="Logout"
            severity="danger"
            className="p-m-2"
          />
          <Button
            onClick={() => setInfoMessage(kc.isTokenExpired(5).toString())}
            label="Check Token Expired"
            severity="info"
            className="p-m-2"
          />
          <Button
            onClick={() => {
              kc.updateToken(10).then(
                (refreshed) => setInfoMessage('Token Refreshed: ' + refreshed.toString()),
                () => setInfoMessage('Refresh Error')
              );
            }}
            label="Update Token"
            className="p-m-2"
          />
        </div>

        {isAdmin && (
          <div>
            <Button
              onClick={toggleAdminPanel}
              label={showAdminPanel ? 'Close Admin Panel' : 'Open Admin Panel'}
              className="admin-toggle-btn p-m-2"
            />
          </div>
        )}
      </header>

      {/* ========== Panel z InfoMessage (dla wszystkich) ========== */}
      <section className="info-panel">
        <Card>
          <p>{infoMessage}</p>
        </Card>
      </section>

      {/* ========== Panel Admin (pokazywany po kliknięciu) ========== */}
      {isAdmin && showAdminPanel && (
        <section className="admin-panel">
          <h2>👑 Admin Panel</h2>

          {/* -- Przycisk do wyświetlenia tokenów -- */}
          <div className="p-grid p-justify-center p-mb-4">
            <div className="p-col-12 p-text-center">
              <Button
                onClick={() => setInfoMessage(kc.token)}
                label="Show Access Token"
                severity="info"
                className="p-m-2"
              />
              <Button
                onClick={() => setInfoMessage(JSON.stringify(kc.tokenParsed))}
                label="Show Parsed Token"
                severity="warning"
                className="p-m-2"
              />
            </div>
          </div>

          {/* -- Formularz do pracy z PostgreSQL -- */}
          <div className="p-grid p-justify-center">
            <div className="p-col-8">
              <Card className="p-shadow-3">
                <h3>➕ Add User to PostgreSQL</h3>
                <form onSubmit={handleUserSubmit}>
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="p-inputtext"
                  />
                  <input
                    type="text"
                    placeholder="Surname"
                    required
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="p-inputtext"
                  />
                  <div className="p-field-checkbox">
                    <input
                      type="checkbox"
                      id="isAdult"
                      checked={isAdult}
                      onChange={(e) => setIsAdult(e.target.checked)}
                    />
                    <label htmlFor="isAdult">Is Adult</label>
                  </div>
                  <Button type="submit" label="Add User" className="p-mt-2" />
                </form>

                <Button onClick={fetchUsers} label="📄 Get Users" className="p-mt-4 p-button-outlined" />

                <div className="result-box">
                  <pre>{usersList}</pre>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}


      {/* ========== Sekcja Redis Messages (dla wszystkich) ========== */}
      <section className="redis-container">
        <h2>💬 Redis Messages</h2>
        <form onSubmit={handleMessageSubmit}>
          <input
            type="text"
            name="message"
            placeholder="Enter message"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="p-inputtext"
          />
          <Button type="submit" label="Send Message" className="p-mt-2 p-button-primary" />
        </form>

        <Button onClick={fetchMessages} label="📥 Get Messages" className="p-mt-4 p-button-outlined" />

        <div className="result-box">
          <pre>{messagesList}</pre>
        </div>
      </section>

    </div>
  );
}

export default App;
