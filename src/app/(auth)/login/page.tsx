import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Hiperfarma Business Meeting Manager',
};

export default function LoginPage() {
  return <LoginForm />;
}