import { request } from './client.js';

function login(email, password) {
  return request('POST', '/auth/login', {
    body: { email, password },
  });
}

function yo(token) {
  return request('GET', '/auth/yo', {
    token,
  });
}

export { login, yo };
