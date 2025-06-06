import axios from 'axios';

const httpClient = axios.create({
   baseURL: 'http://localhost:3050'
});

export {httpClient}