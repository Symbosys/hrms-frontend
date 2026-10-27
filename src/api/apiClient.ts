import axios from "axios";

// export const BASE_URL = "http://192.168.1.7:5000/api/v1";
// export const IMAGE_BASE_URL = "http://192.168.1.8:5000"; //

export const BASE_URL = "https://lime-beaver-798212.hostingersite.com/api/v1";
export const IMAGE_BASE_URL = "https://lime-beaver-798212.hostingersite.com";
  
export const api = axios.create({
  // baseURL: Production_URL,
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor for debugging and Authorization
api.interceptors.request.use((request) => {
  const token = localStorage.getItem('token');

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  const orgId = localStorage.getItem('organizationId');
  if (orgId) {
    request.headers['x-organization-id'] = orgId;
  }
  
  // For FormData requests, delete default Content-Type so browser sets boundary automatically
  if (request.data instanceof FormData) {
    delete request.headers['Content-Type'];
    console.log('Starting Request (FormData):', request.url);
  } else {
    console.log('Starting Request:', request.url, JSON.stringify(request.data, null, 2));
  }
  
  return request;
});

// Add a response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response;
  },
  (error) => {
    console.log('Response Error:', JSON.stringify(error, null, 2));
    return Promise.reject(error);
  }
);

export default api;
