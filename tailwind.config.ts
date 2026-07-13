// Tailwind CSS v4 — JS config (referenced via @config in globals.css)
// v4 では @theme CSS が優先されますが、JS config も @config で読み込まれます。

const config = {
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#1a1508',
          secondary: '#120f05',
          card:      '#1e1a08',
        },
        gold: {
          DEFAULT: '#c4a060',
          light:   '#e8dcc8',
          muted:   '#8a7a60',
          dim:     '#6a5a40',
          dark:    '#4a3a20',
        },
        border: {
          DEFAULT: 'rgba(196,160,96,0.15)',
          strong:  'rgba(196,160,96,0.35)',
          subtle:  'rgba(196,160,96,0.08)',
        },
      },
    },
  },
}

export default config
