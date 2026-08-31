const REPO_URL = 'https://github.com/sic-em/vesper'

/**
 * Inline attribution chip for a changelog line: the contributor's avatar and
 * the PR number, linking to the PR. Sits at the end of a bullet.
 */
export function By({ u, pr }: { u: string; pr: number }): React.JSX.Element {
  return (
    <a
      href={`${REPO_URL}/pull/${pr}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`@${u} · PR #${pr}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        marginLeft: 6,
        padding: '2px 7px 2px 3px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        color: '#b3b3b3',
        fontSize: 11,
        fontWeight: 500,
        textDecoration: 'none',
        lineHeight: 1,
        verticalAlign: 'middle',
        fontVariantNumeric: 'tabular-nums'
      }}
    >
      <img
        src={`https://avatars.githubusercontent.com/${u}?s=32`}
        alt={`@${u}`}
        width={14}
        height={14}
        style={{ borderRadius: '50%', display: 'block' }}
      />
      <span style={{ color: '#58a6ff' }}>#{pr}</span>
    </a>
  )
}
