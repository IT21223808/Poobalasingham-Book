import api from './api';

export interface LoginDto {
  email: string;
  password: string;
}

export const login = async (data: LoginDto) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};