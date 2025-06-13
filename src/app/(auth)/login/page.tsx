import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Hiperfarma Business Meeting Manager',
};

export default function LoginPage({
  params,
  searchParams
}: {
  params: {}; // For a static route, params is an empty object
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // params and searchParams are not used directly in this component,
  // but explicitly receiving them is good practice for Server Component pages.
  return <LoginForm />;
}
