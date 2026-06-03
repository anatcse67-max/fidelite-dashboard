export default async function handler(req, res) {
  const { id } = req.query
  const origin = `https://${req.headers.host}`

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')

  res.json({
    name: 'Ma carte fidélité',
    short_name: 'Fidélité',
    start_url: `${origin}/carte/${id}`,
    display: 'standalone',
    background_color: '#6c63ff',
    theme_color: '#6c63ff',
    icons: [
      { src: `${origin}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${origin}/icon-512.png`, sizes: '512x512', type: 'image/png' }
    ]
  })
}
