import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Register — Golden Tine" };

export default function RegisterPage() {
  return <RegisterForm />;
}
