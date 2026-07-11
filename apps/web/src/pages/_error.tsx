import type { GetStaticProps } from 'next';

interface ErrorProps {
  statusCode?: number;
}

export const getStaticProps: GetStaticProps<ErrorProps> = async () => ({
  props: { statusCode: 500 },
});

export default function PagesError({ statusCode }: ErrorProps): React.JSX.Element {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', background: '#0a0f1a', color: '#e2e8f0' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{statusCode ?? 500}</h1>
        <p style={{ color: '#94a3b8' }}>Something went wrong.</p>
      </div>
    </div>
  );
}
