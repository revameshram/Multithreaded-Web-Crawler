import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8080/api' : `${window.location.protocol}//${window.location.host}/api`),
});

export async function createCrawlJob(payload) {
  const response = await api.post('/crawls', payload);
  return response.data;
}

export async function fetchCrawlJob(jobId) {
  const response = await api.get(`/crawls/${jobId}`);
  return response.data;
}

export async function fetchCrawlSummary(jobId) {
  const response = await api.get(`/crawls/${jobId}/summary`);
  return response.data;
}

export default api;
