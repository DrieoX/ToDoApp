import axios from 'axios';

const api = axios.create({
  baseURL: 'https://pit4.onrender.com/',
});

export default api;
