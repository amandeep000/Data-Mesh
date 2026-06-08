import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Data-Mesh: Clean EU Environmental Data APIs for developers.',
};

export default function HomePage(): JSX.Element {
  return (
    <main>
      <h1>Data-Mesh</h1>
      <p>EU Environmental Data — normalized, cached, rate-limited.</p>
      <nav>
        <Link href="/dashboard">Go to Dashboard</Link>
        <Link href="/auth/login">Sign In</Link>
      </nav>
    </main>
  );
}
