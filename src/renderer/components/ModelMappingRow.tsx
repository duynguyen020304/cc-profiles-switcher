import React from 'react'

interface ModelMappingRowProps {
  label: string
  value: string | null
  testId: string
}

const ModelMappingRow: React.FC<ModelMappingRowProps> = ({ label, value, testId }) => {
  return (
    <div
      data-testid={testId}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '6px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          color: '#666',
          fontWeight: 500,
          letterSpacing: '0.06em'
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontSize: '0.78rem',
          color: value ? '#2dd4bf' : '#444',
          wordBreak: 'break-all',
          textAlign: 'right',
          maxWidth: '65%'
        }}
      >
        {value || '—'}
      </span>
    </div>
  )
}

export default ModelMappingRow
