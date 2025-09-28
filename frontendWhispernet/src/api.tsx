import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000", // backend URL
});

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("whispernet_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
