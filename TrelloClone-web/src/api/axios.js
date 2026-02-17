import axios from "axios";

const api = axios.create({
  baseURL: "https://trelloclone-back.onrender.com",
  withCredentials: true,
});

export default api;
