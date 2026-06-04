import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Nav */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: 'white', zIndex: 50 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5', letterSpacing: '-0.5px' }}>
          🎫 Fidélité
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Connexion</Link>
          <Link to="/register" style={{ background: '#4f46e5', color: 'white', padding: '9px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            Commencer gratuitement →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#eef2ff', color: '#4f46e5', padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
          🚀 La carte de fidélité digitale pour votre enseigne
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1, marginBottom: 24, color: '#111' }}>
          Fidélisez vos clients<br />
          <span style={{ color: '#4f46e5' }}>sans carte papier</span>
        </h1>
        <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Créez votre programme de fidélité en 2 minutes. Vos clients accumulent des points depuis leur téléphone, sans application à télécharger.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{ background: '#4f46e5', color: 'white', padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: 16, fontWeight: 700 }}>
            Créer mon enseigne →
          </Link>
          <Link to="/login" style={{ background: '#f9fafb', color: '#111', padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontSize: 16, fontWeight: 600, border: '1px solid #e5e7eb' }}>
            Se connecter
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: '#f9fafb', padding: '60px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 48, color: '#111' }}>
            Tout ce dont vous avez besoin
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { icon: '📱', title: 'QR Code d\'inscription', desc: 'Vos clients scannent un QR code pour obtenir leur carte en 10 secondes, sans app.' },
              { icon: '⭐', title: 'Points automatiques', desc: 'Scanner la carte du client en 1 seconde. Les points se cumulent instantanément.' },
              { icon: '🔔', title: 'Notifications push', desc: 'Envoyez des promos directement sur le téléphone de vos clients fidèles.' },
              { icon: '📊', title: 'Statistiques', desc: 'Suivez vos meilleurs clients, les passages hebdomadaires et les points distribués.' },
              { icon: '🤝', title: 'Parrainage intégré', desc: 'Vos clients invitent leurs amis et gagnent des points bonus automatiquement.' },
              { icon: '🎁', title: 'Récompenses sur mesure', desc: 'Définissez votre récompense et votre seuil. Café offert, remise, cadeau...' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: 'white', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>{icon}</p>
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#111' }}>{title}</p>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 16, color: '#111' }}>
            Prêt à fidéliser vos clients ?
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 16 }}>
            Rejoignez les commerçants qui utilisent Fidélité pour garder leurs clients.
          </p>
          <Link to="/register" style={{ background: '#4f46e5', color: 'white', padding: '16px 40px', borderRadius: 10, textDecoration: 'none', fontSize: 16, fontWeight: 700 }}>
            Créer mon compte →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
        © 2025 Fidélité — Tous droits réservés
      </footer>
    </div>
  )
}
