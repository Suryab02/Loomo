export function getToken() {
  return localStorage.getItem('token');
}

export function saveToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearSession() {
  localStorage.removeItem('token');
}

