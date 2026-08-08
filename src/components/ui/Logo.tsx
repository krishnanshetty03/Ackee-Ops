export function Logo({ size = 32 }: { size?: number }) {
  return <img src="./logo.png" alt="Tallawah Foods Ghana Ltd" width={size} height={size} style={{ objectFit: 'contain', flex: 'none' }} />
}

export function Wordmark({ size = 15 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: size }}>
      <span style={{ color: 'var(--gold)' }}>Tallawah</span>
      <span style={{ color: 'var(--green)' }}>Foods</span>
    </span>
  )
}
