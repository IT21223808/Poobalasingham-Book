import api from "./api";
import Cookies from "js-cookie";

export interface LoginDto {
  email: string;
  password: string;
}

export const login = async (data: LoginDto) => {
  const response = await api.post("/auth/login", data);

  const result = response.data;

  console.log("LOGIN RESPONSE:", result);

  const token = result.access_token;

  if (!token) {
    throw new Error(
      "Login successful but access_token was not returned",
    );
  }

  // Save JWT
  Cookies.set("authToken", token);

  console.log(
    "JWT saved:",
    !!Cookies.get("authToken"),
  );

  return result;
};