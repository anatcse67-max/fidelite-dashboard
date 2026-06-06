import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import QRScanner from '../components/QRScanner'
import { useDarkMode } from '../hooks/useDarkMode'
import api from '../api'

export default function Dashboard() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 10
  const [showAdd, setShowAdd] = useState(false)
  const [showScan, setShowScan] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [newClient, setNewClient] = useState({ prenom: '', nom: '', telephone: '', email: '' })
  const [notifForm, setNotifForm] = useState({ title: '', body: '', client_id: '' })
  const [scanNote, setScanNote] = useState('')
  const [scanMontant, setScanMontant] = useState('')
  const [loading, setLoading] = useState(false)
  const [flash, setFlash] = useState('')
  const navigate = useNavigate()

  const [commercant, setCommercant] = useState(JSON.parse(localStorage.getItem('commercant') || '{}'))
  const [dark, setDark] = useDarkMode()

  useEffect(() => {
    fetchClients()
    // Recharger les infos commerçant depuis l'API pour avoir les derniers paramètres
    api.get('/auth/me').then(r => {
      localStorage.setItem('commercant', JSON.stringify(r.data.commercant))
      setCommercant(r.data.commercant)
    }).catch(() => {})
  }, [])

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients')
      setClients(data)
    } catch { navigate('/') }
  }

  const showFlash = (m) => { setFlash(m); setTimeout(() => setFlash(''), 3500) }

  const logout = () => { localStorage.clear(); navigate('/') }

  const exportCSV = async () => {
    try {
      const { data } = await api.get('/clients/export', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `clients-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { showFlash('✗ Erreur lors de l\'export') }
  }

  const addClient = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/clients', newClient)
      setNewClient({ prenom: '', nom: '', telephone: '', email: '' })
      setShowAdd(false)
      fetchClients()
      showFlash('✓ Client ajouté avec succès')
    } catch (err) { showFlash('✗ ' + (err.response?.data?.error || 'Erreur')) }
    setLoading(false)
  }

  const scan = async (id) => {
    setLoading(true)
    try {
      const { data } = await api.post(`/clients/${id}/scan`, { note: scanNote, montant: scanMontant || undefined })
      setShowScan(null); setScanNote('')
      fetchClients()
      showFlash(`✓ +${data.points_ajoutes} pt — ${data.client.points} pts au total`)
    } catch (err) { showFlash('✗ ' + (err.response?.data?.error || 'Erreur')) }
    setLoading(false)
  }

  const handleQRScan = async (clientId) => {
    try {
      const { data } = await api.post(`/clients/${clientId}/scan`, { note: 'Scan QR code' })
      fetchClients()
      return {
        id: clientId,
        prenom: data.client.prenom,
        points_ajoutes: data.points_ajoutes,
        total: data.client.points
      }
    } catch (err) {
      return { id: clientId, prenom: 'Erreur', points_ajoutes: 0, total: 0 }
    }
  }

  const resetPoints = async (id) => {
    if (!confirm('Confirmer la récompense et remettre les points à 0 ?')) return
    try {
      await api.post(`/clients/${id}/reset`)
      fetchClients()
      showFlash('✓ Récompense validée — points remis à zéro')
    } catch {}
  }

  const deleteClient = async (id) => {
    if (!confirm('Supprimer ce client ?')) return
    try {
      await api.delete(`/clients/${id}`)
      fetchClients()
      showFlash('✓ Client supprimé')
    } catch {}
  }

  const sendNotif = async () => {
    setLoading(true)
    try {
      const payload = { title: notifForm.title, body: notifForm.body }
      if (notifForm.client_id) payload.client_id = notifForm.client_id
      const { data } = await api.post('/notifications/send', payload)
      setShowNotif(false)
      setNotifForm({ title: '', body: '', client_id: '' })
      showFlash(`✓ Notification envoyée à ${data.sent} client(s)`)
    } catch (err) { showFlash('✗ ' + (err.response?.data?.error || 'Erreur')) }
    setLoading(false)
  }

  const progress = (pts) => Math.min(100, Math.round((pts / (commercant.seuil_reward || 10)) * 100))

  const filteredClients = clients.filter(c =>
    `${c.prenom} ${c.nom} ${c.id} ${c.telephone} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filteredClients.length / PER_PAGE)
  const pagedClients = filteredClients.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const Sidebar = () => (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: commercant.couleur || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden' }}>
            {commercant.icon_url
              ? <img src={commercant.icon_url} alt="icône" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : commercant.emoji}
          </div>
          <div>
            <div className="sidebar-logo">{commercant.nom_enseigne}</div>
            <div className="sidebar-enseigne">{commercant.type_activite}</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="label" style={{ padding: '8px 12px 4px', fontSize: 11, letterSpacing: 0.5 }}>MENU</div>
        <Link to="/dashboard" className="nav-item active">
          <span className="nav-icon">👥</span> Clients
          <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>{clients.length}</span>
        </Link>
        <Link to="/stats" className="nav-item">
          <span className="nav-icon">📊</span> Statistiques
        </Link>
        <button className="nav-item" onClick={() => setShowQR(true)}>
          <span className="nav-icon">📱</span> QR Code enseigne
        </button>
        <button className="nav-item" onClick={() => setShowNotif(true)}>
          <span className="nav-icon">🔔</span> Notifications
        </button>
        <Link to="/profile" className="nav-item">
          <span className="nav-icon">⚙️</span> Mon profil
        </Link>
        <button className="nav-item" onClick={exportCSV}>
          <span className="nav-icon">📥</span> Export CSV
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={() => setDark(!dark)} style={{ marginBottom: 4 }}>
          <span className="nav-icon">{dark ? '☀️' : '🌙'}</span> {dark ? 'Mode clair' : 'Mode sombre'}
        </button>
        <button className="nav-item" onClick={logout} style={{ color: 'var(--danger)' }}>
          <span className="nav-icon">⏻</span> Déconnexion
        </button>
      </div>
    </aside>
  )

  return (
    <div className="app-layout">
      <Sidebar />

      {/* Mobile sidebar */}
      {mobileSidebar && (
        <>
          <div className="mobile-overlay" onClick={() => setMobileSidebar(false)} />
          <aside className="sidebar mobile-open"><Sidebar /></aside>
        </>
      )}

      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-icon" style={{ display: 'none' }} onClick={() => setMobileSidebar(true)}>☰</button>
            <h1 className="page-title">Clients</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setShowScanner(true)}>
              📷 Scanner QR
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
              + Nouveau client
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="page-body">

          {/* Stats rapides */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 24 }}>
            {[
              { label: 'Total clients', value: clients.length, icon: '👥', color: 'var(--primary)' },
              { label: 'Points distribués', value: clients.reduce((s, c) => s + c.points, 0), icon: '⭐', color: 'var(--warning)' },
              { label: 'Récompenses dispo', value: clients.filter(c => c.points >= (commercant.seuil_reward || 10)).length, icon: '🎁', color: 'var(--success)' },
              { label: 'Seuil récompense', value: `${commercant.seuil_reward} pts`, icon: '🏆', color: '#8b5cf6' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="stat-card">
                <div className="stat-icon">{icon}</div>
                <div className="stat-value" style={{ color }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Table clients */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>
                Liste des clients
                <span className="badge badge-primary" style={{ marginLeft: 8 }}>{clients.length}</span>
              </h2>
              <input
                placeholder="🔍 Rechercher un client..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                style={{ width: 240, padding: '7px 12px', fontSize: 13 }}
              />
            </div>

            {clients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>👥</p>
                <p style={{ fontWeight: 500, marginBottom: 4 }}>Aucun client pour l'instant</p>
                <p style={{ fontSize: 13, marginBottom: 20 }}>Partagez votre QR code pour que vos clients s'inscrivent</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowQR(true)}>📱 Voir le QR code</button>
              </div>
            ) : (
              <table className="client-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Contact</th>
                    <th>Passages</th>
                    <th>Points</th>
                    <th>Progression</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedClients.map(c => (
                    <tr key={c.id}>
                      <td data-label="Client">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="client-avatar" style={{ background: commercant.couleur || 'var(--primary)' }}>
                            {(c.prenom?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontWeight: 500 }}>{c.prenom} {c.nom}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td data-label="Contact" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {c.telephone || c.email || '—'}
                      </td>
                      <td data-label="Passages" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {c.nb_passages || 0} passage{c.nb_passages > 1 ? 's' : ''}
                      </td>
                      <td data-label="Points">
                        <span style={{ fontWeight: 600 }}>{c.points}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}> / {commercant.seuil_reward}</span>
                        {c.points >= (commercant.seuil_reward || 10) && (
                          <span className="badge badge-warning" style={{ marginLeft: 8 }}>Récompense</span>
                        )}
                      </td>
                      <td data-label="Progression">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${progress(c.points)}%`, background: commercant.couleur || 'var(--primary)' }} />
                        </div>
                      </td>
                      <td data-label="Actions" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-success btn-sm" onClick={() => { setShowScan(c); setScanNote('') }}>
                            + Points
                          </button>
                          <a href={`https://fidelite-dashboard-kohl.vercel.app/carte/${c.id}`} target="_blank" rel="noreferrer"
                            className="btn btn-outline btn-sm">
                            Carte
                          </a>
                          {c.points >= (commercant.seuil_reward || 10) && (
                            <button className="btn btn-warning btn-sm" onClick={() => resetPoints(c.id)} title="Valider récompense">
                              🎁
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => deleteClient(c.id)} style={{ color: 'var(--danger)' }}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {filteredClients.length > PER_PAGE && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredClients.length)} sur {filteredClients.length} clients
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPage(p)}
                      style={{ minWidth: 36 }}>{p}</button>
                  ))}
                  <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
                </div>
              </div>
            )}

            {/* Aucun résultat de recherche */}
            {search && filteredClients.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: 24, marginBottom: 8 }}>🔍</p>
                <p style={{ fontWeight: 500 }}>Aucun client trouvé pour "{search}"</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Flash */}
      {flash && <div className="flash">{flash}</div>}

      {/* Mobile bottom nav */}
      <nav style={{ display: 'none' }} className="mobile-bottom-nav">
        <Link to="/dashboard" className="mobile-nav-item active">
          <span>👥</span><span>Clients</span>
        </Link>
        <Link to="/stats" className="mobile-nav-item">
          <span>📊</span><span>Stats</span>
        </Link>
        <button className="mobile-nav-item" onClick={() => setShowScanner(true)}>
          <span>📷</span><span>Scanner</span>
        </button>
        <button className="mobile-nav-item" onClick={() => setShowNotif(true)}>
          <span>🔔</span><span>Notifs</span>
        </button>
        <button className="mobile-nav-item" onClick={() => setShowMobileMenu(true)}>
          <span>⋯</span><span>Plus</span>
        </button>
      </nav>

      {/* Menu mobile "Plus" */}
      {showMobileMenu && (
        <div className="modal-backdrop" onClick={() => setShowMobileMenu(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ borderRadius: '16px 16px 0 0', position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '100%' }}>
            <div style={{ padding: '12px 0' }}>
              {[
                { icon: '📱', label: 'QR Code enseigne', action: () => { setShowQR(true); setShowMobileMenu(false) } },
                { icon: '📥', label: 'Exporter les clients (CSV)', action: () => { exportCSV(); setShowMobileMenu(false) } },
              ].map(({ icon, label, action }) => (
                <button key={label} onClick={action} style={{ width: '100%', padding: '14px 24px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 14, fontSize: 15, cursor: 'pointer', color: 'var(--text)' }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>{label}
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              <Link to="/profile" onClick={() => setShowMobileMenu(false)} style={{ width: '100%', padding: '14px 24px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 14, fontSize: 15, cursor: 'pointer', color: 'var(--text)', textDecoration: 'none' }}>
                <span style={{ fontSize: 22 }}>⚙️</span>Mon profil
              </Link>
              <button onClick={() => { setDark(!dark); setShowMobileMenu(false) }} style={{ width: '100%', padding: '14px 24px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 14, fontSize: 15, cursor: 'pointer', color: 'var(--text)' }}>
                <span style={{ fontSize: 22 }}>{dark ? '☀️' : '🌙'}</span>{dark ? 'Mode clair' : 'Mode sombre'}
              </button>
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              <button onClick={() => { logout(); setShowMobileMenu(false) }} style={{ width: '100%', padding: '14px 24px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 14, fontSize: 15, cursor: 'pointer', color: 'var(--danger)' }}>
                <span style={{ fontSize: 22 }}>⏻</span>Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner QR */}
      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}

      {/* Modal Ajouter client */}
      {showAdd && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Nouveau client</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={addClient}>
              <div className="modal-body">
                <div>
                  <label className="label">Prénom *</label>
                  <input placeholder="Jean" value={newClient.prenom} onChange={e => setNewClient({ ...newClient, prenom: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input placeholder="Dupont" value={newClient.nom} onChange={e => setNewClient({ ...newClient, nom: e.target.value })} />
                </div>
                <div>
                  <label className="label">Téléphone</label>
                  <input placeholder="06 12 34 56 78" value={newClient.telephone} onChange={e => setNewClient({ ...newClient, telephone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" placeholder="jean@email.com" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Création...' : 'Créer le client'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Scanner points */}
      {showScan && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <p style={{fontSize:10,color:'#999'}}>mode: {commercant.mode_points || 'non défini'}</p>
              <h3 className="modal-title">Ajouter un passage</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowScan(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--bg)', borderRadius: 10 }}>
                <div className="client-avatar" style={{ background: commercant.couleur || 'var(--primary)', width: 44, height: 44 }}>
                  {(showScan.prenom?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600 }}>{showScan.prenom} {showScan.nom}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{showScan.points} pts actuels</p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>+{commercant.pts_par_passage}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>point(s)</p>
                </div>
              </div>
              {commercant.mode_points === 'montant' && (
                <div>
                  <label className="label">Montant dépensé (€) *</label>
                  <input type="number" min="0" step="0.01" placeholder="Ex: 12.50" value={scanMontant} onChange={e => setScanMontant(e.target.value)} />
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    = {scanMontant ? Math.floor(parseFloat(scanMontant) * (commercant.euro_to_points || 1)) : 0} point(s)
                  </p>
                </div>
              )}
              <div>
                <label className="label">Note (optionnel)</label>
                <input placeholder="Ex: menu du jour, café..." value={scanNote} onChange={e => setScanNote(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setShowScan(null); setScanMontant('') }}>Annuler</button>
              <button className="btn btn-success" disabled={loading || (commercant.mode_points === 'montant' && !scanMontant)} onClick={() => scan(showScan.id)}>
                {loading ? '...' : commercant.mode_points === 'montant'
                  ? `✓ Valider ${scanMontant ? `+${Math.floor(parseFloat(scanMontant) * (commercant.euro_to_points || 1))} pts` : ''}`
                  : `✓ Valider +${commercant.pts_par_passage} pt`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code enseigne */}
      {showQR && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">QR Code d'inscription</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowQR(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Vos clients scannent ce code pour créer leur carte de fidélité
              </p>
              <div style={{ padding: 20, background: 'var(--bg)', borderRadius: 16, border: '2px solid var(--border)' }}>
                <QRCodeSVG value={`https://fidelite-dashboard-kohl.vercel.app/inscription/${commercant.id}`} size={200} fgColor={commercant.couleur || 'var(--primary)'} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                fidelite-dashboard-kohl.vercel.app/inscription/{commercant.id?.slice(0, 8)}...
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowQR(false)}>Fermer</button>
              <button className="btn btn-primary" onClick={() => window.open(`https://fidelite-dashboard-kohl.vercel.app/inscription/${commercant.id}`, '_blank')}>
                Ouvrir la page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notification */}
      {showNotif && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Envoyer une notification</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowNotif(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div>
                <label className="label">Titre</label>
                <input placeholder="Ex: Offre spéciale ce weekend 🎉" value={notifForm.title} onChange={e => setNotifForm({ ...notifForm, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea placeholder="Ex: -20% sur tout le menu jusqu'à dimanche !" value={notifForm.body} onChange={e => setNotifForm({ ...notifForm, body: e.target.value })} rows={3} />
              </div>
              <div>
                <label className="label">Destinataire</label>
                <select value={notifForm.client_id} onChange={e => setNotifForm({ ...notifForm, client_id: e.target.value })}>
                  <option value="">Tous les clients</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom} — {c.id}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowNotif(false)}>Annuler</button>
              <button className="btn btn-primary" disabled={loading || !notifForm.title || !notifForm.body} onClick={sendNotif}>
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
