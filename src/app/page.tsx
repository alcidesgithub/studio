import { redirect } from 'next/navigation';

export default function HomePage() {
  // In a real app, you would check authentication status here
  // and redirect to /dashboard if logged in, or /login if not.
  // For this scaffold, we'll redirect to /login by default.
  redirect('/login');
}
