import { ReactNode } from 'react';

export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, lineHeight: 1.05 }}>{title}</h1>
        {sub && <p className="cap" style={{ margin: '8px 0 0' }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}
