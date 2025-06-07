import axios from 'axios';

const httpClient = axios.create({
   baseURL: `http://localhost:${process.env.SERVER_PORT || 3050}`,
});

export {httpClient}