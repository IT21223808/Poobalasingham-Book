import Cookies from 'js-cookie';

export const getToken = () => {
  return Cookies.get('access_token');
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const logout = () => {
  Cookies.remove('access_token');
};