'use client';

const BLOOD_COMPATIBILITY = [
  { group: 'O-', giveTo: 'Tous les groupes (Donneur Universel)', receiveFrom: 'O- uniquement' },
  { group: 'O+', giveTo: 'O+, A+, B+, AB+', receiveFrom: 'O+, O-' },
  { group: 'A-', giveTo: 'A-, A+, AB-, AB+', receiveFrom: 'A-, O-' },
  { group: 'A+', giveTo: 'A+, AB+', receiveFrom: 'A+, A-, O+, O-' },
  { group: 'B-', giveTo: 'B-, B+, AB-, AB+', receiveFrom: 'B-, O-' },
  { group: 'B+', giveTo: 'B+, AB+', receiveFrom: 'B+, B-, O+, O-' },
  { group: 'AB-', giveTo: 'AB-, AB+', receiveFrom: 'AB-, A-, B-, O-' },
  { group: 'AB+', giveTo: 'AB+ uniquement', receiveFrom: 'Tous les groupes (Receveur Universel)' },
];

export function BloodChart() {
  return (
    <section className='steps-section' id='compatibilite' style={{ marginTop: '40px' }}>
      <div className='section-tag'>Règles Médicales</div>
      <h2 className='section-title'>Tableau de compatibilité sanguine</h2>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          overflowX: 'auto',
          textAlign: 'left',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B' }}>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Groupe</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Peut donner à</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Peut recevoir de</th>
            </tr>
          </thead>
          <tbody>
            {BLOOD_COMPATIBILITY.map((row, idx) => (
              <tr
                key={row.group}
                style={{
                  borderBottom: idx < BLOOD_COMPATIBILITY.length - 1 ? '1px solid #F8FAFC' : 'none',
                }}
              >
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#E24B4A' }}>
                  <span style={{ background: '#FFF1F2', padding: '4px 10px', borderRadius: '8px' }}>
                    {row.group}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: '#0F172A', fontWeight: 500 }}>
                  {row.giveTo}
                </td>
                <td style={{ padding: '14px 16px', color: '#64748B' }}>{row.receiveFrom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
