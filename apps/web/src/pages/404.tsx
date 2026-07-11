import type { GetStaticProps } from 'next';

interface NotFoundProps {
  statusCode?: number;
}

export const getStaticProps: GetStaticProps<NotFoundProps> = async () => ({
  props: { statusCode: 404 },
});

export default function Pages404({ statusCode }: NotFoundProps): React.JSX.Element {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', background: '#0a0f1a', color: '#e2e8f0' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800 }}>404</h1>
        <p style={{ color: '#94a3b8' }}>Page not found.</p>
        <a href="/" style={{ color: '#10b981', textDecoration: 'none' }}>Back home</a>
      </div>
    </div>
  );
}
