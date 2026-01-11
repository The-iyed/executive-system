import axios, { AxiosInstance } from 'axios';

const BASE_URL =import.meta.env.VITE_API_AHKAM_BASE_URL || 'http://localhost:3000/api/v1';

export const documentSplitterClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/document-splitter`,
  timeout: 300000, // 5 minutes timeout for file uploads
});

export const conversationClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout for conversation creation
});