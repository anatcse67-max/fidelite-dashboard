import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

const TYPES = ['Restaurant', 'Boulangerie', 'Coiffeur', 'Café', 'Épicerie', 'Autre']
const EMOJIS = ['🍕', '🥐', '✂️', '☕', '🛒', '🏪', '💈', '🍔', '🌸', '⭐', '🎂', '🍜']
const COULEURS = ['#4f46e5', '#ef4444', '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b']

function Accordion({ icon, title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: 0 }}>{title}</p>
            {subtitle && <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, marginTop: 2 }}>{subtitle}</p>}
          </div>
        </div>
        <span style={{
          fontSize: 18, color: 'var(--text-secondary)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>›</span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function Profile() {
  const saved = JSON.parse(localStorage.getItem('commercant') || '{}')
  const [form, setForm] = useState({
    nom_enseigne: saved.nom_enseigne || '',
    type_activite: saved.type_activite || 'Restaurant',
    emoji: saved.emoji || '🏪',
    couleur: saved.couleur || '#4f46e5',
    pts_par_passage: saved.pts_par_passage || 1,
    seuil_reward: saved.seuil_reward || 10,
    reward_desc: saved.reward_desc || '',
    mode_points: saved.mode_points || 'passages',
    euro_to_points: saved.euro_to_points || 1,
    parrainage_actif: saved.parrainage_actif || false,
    parrainage_points: saved.parrainage_points || 5,
    parrainage_nb_min: saved.parrainage_nb_min || 1,
    reward_expiry_days: saved.reward_expiry_days || '',
    points_expiry_days: saved.points_expiry_days || '',
  })
  const [paliers, setPaliers] = useState([])
  const [newPalier, setNewPalier] = useState({ points_requis: '', description: '', type: 'texte', valeur: '' })
  const [iconUrl, setIconUrl] = useState(saved.icon_url || null)
  const [iconPreview, setIconPreview] = useState(null)
  const [iconFile, setIconFile] = useState(null)
  const [iconLoading, setIconLoading] = useState(false)
  const fileInputRef = useRef(null)
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/clients/paliers').then(r => setPaliers(r.data)).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addPalier = async e => {
    e.preventDefault()
    try {
      const { data } = await api.post('/clients/paliers', { ...newPalier, points_requis: parseInt(newPalier.points_requis), valeur: newPalier.valeur ? parseFloat(newPalier.valeur) : null })
      setPaliers(p => [...p, data].sort((a, b) => a.points_requis - b.points_requis))
      setNewPalier({ points_requis: '', description: '', type: 'texte', valeur: '' })
      setMsg('✓ Palier ajouté')
    } catch { setErr('Erreur ajout palier') }
  }

  const deletePalier = async id => {
    await api.delete(`/clients/paliers/${id}`)
    setPaliers(p => p.filter(x => x.id !== id))
  }

  const onIconChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setIconFile(file)
    setIconPreview(URL.createObjectURL(file))
  }

  const uploadIcon = async () => {
    if (!iconFile) return
    setIconLoading(true); setErr(''); setMsg('')
    try {
      const formData = new FormData()
      formData.append('icon', iconFile)
      const { data } = await api.post('/auth/upload-icon', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      localStorage.setItem('commercant', JSON.stringify(data.commercant))
      setIconUrl(data.icon_url)
      setIconPreview(null); setIconFile(null)
      setMsg('✓ Icône mise à jour')
    } catch (e) { setErr(e.response?.data?.error || 'Erreur upload') }
    setIconLoading(false)
  }

  const saveProfile = async e => {
    e.preventDefault()
    setLoading(true); setErr(''); setMsg('')
    try {
      const { data } = await api.put('/auth/profile', form)
      localStorage.setItem('commercant', JSON.stringify(data.commercant))
      setMsg('✓ Profil mis à jour')
    } catch (e) { setErr(e.response?.data?.error || 'Erreur') }
    setLoading(false)
  }

  const savePassword = async e => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) return setErr('Les mots de passe ne correspondent pas')
    setLoading(true); setErr(''); setMsg('')
    try {
      await api.put('/auth/password', { current_password: pwForm.current_password, new_password: pwForm.new_password })
      setPwForm({ current_password: '', new_password: '', confirm: '' })
      setMsg('✓ Mot de passe modifié')
    } catch (e) { setErr(e.response?.data?.error || 'Erreur') }
    setLoading(false)
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: form.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden' }}>
              {iconUrl ? <img src={iconUrl} alt="icône" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : form.emoji}
            </div>
            <div>
              <div className="sidebar-logo">{form.nom_enseigne}</div>
              <div className="sidebar-enseigne">{form.type_activite}</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item"><span className="nav-icon">👥</span> Clients</Link>
          <Link to="/stats" className="nav-item"><span className="nav-icon">📊</span> Statistiques</Link>
          <Link to="/profile" className="nav-item active"><span className="nav-icon">⚙️</span> Mon profil</Link>
        </nav>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">⚙️ Paramètres</h1>
          <Link to="/dashboard" className="btn btn-outline btn-sm">← Retour</Link>
        </div>

        <div className="page-body" style={{ maxWidth: 640 }}>
          {msg && <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#065f46', fontSize: 14 }}>{msg}</div>}
          {err && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#991b1b', fontSize: 14 }}>{err}</div>}

          <form onSubmit={saveProfile}>

            {/* 1. Enseigne */}
            <Accordion icon="🏪" title="Mon enseigne" subtitle="Nom, logo, couleur, emoji" defaultOpen={true}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
                {/* Icône */}
                <div>
                  <label className="label">Icône / Logo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div onClick={() => fileInputRef.current.click()} style={{ width: 72, height: 72, borderRadius: 16, background: iconPreview || iconUrl ? 'transparent' : form.couleur, border: '2px dashed #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {iconPreview || iconUrl ? <img src={iconPreview || iconUrl} alt="icône" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28 }}>{form.emoji}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button type="button" onClick={() => fileInputRef.current.click()} className="btn btn-outline btn-sm">📁 Choisir une image</button>
                      {iconFile && <button type="button" onClick={uploadIcon} disabled={iconLoading} className="btn btn-primary btn-sm">{iconLoading ? 'Envoi...' : '✓ Valider'}</button>}
                      {iconUrl && !iconFile && <span style={{ fontSize: 12, color: '#6b7280' }}>Image active</span>}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onIconChange} />
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>JPG, PNG, WEBP — 2 Mo max</p>
                </div>

                <div>
                  <label className="label">Nom de l'enseigne</label>
                  <input value={form.nom_enseigne} onChange={e => set('nom_enseigne', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Type d'activité</label>
                  <select value={form.type_activite} onChange={e => set('type_activite', e.target.value)}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Emoji</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {EMOJIS.map(e => (
                      <button type="button" key={e} onClick={() => set('emoji', e)}
                        style={{ fontSize: 22, background: form.emoji === e ? '#eef2ff' : 'transparent', border: form.emoji === e ? '2px solid #4f46e5' : '2px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Couleur principale</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {COULEURS.map(c => (
                      <button type="button" key={c} onClick={() => set('couleur', c)}
                        style={{ width: 32, height: 32, background: c, border: form.couleur === c ? '3px solid #111' : '3px solid transparent', borderRadius: '50%', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
              </div>
            </Accordion>

            {/* 2. Programme fidélité */}
            <Accordion icon="⭐" title="Programme de fidélité" subtitle="Points, seuil, récompense, mode">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Points par passage</label>
                    <input type="number" min="1" value={form.pts_par_passage} onChange={e => set('pts_par_passage', parseInt(e.target.value))} />
                  </div>
                  <div>
                    <label className="label">Seuil récompense (pts)</label>
                    <input type="number" min="1" value={form.seuil_reward} onChange={e => set('seuil_reward', parseInt(e.target.value))} />
                  </div>
                </div>
                <div>
                  <label className="label">Description de la récompense</label>
                  <input placeholder="Ex: Café offert, -10%, cadeau..." value={form.reward_desc} onChange={e => set('reward_desc', e.target.value)} />
                </div>

                <div>
                  <label className="label">Mode de calcul des points</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[{ val: 'passages', label: '📲 Par passage' }, { val: 'montant', label: '💶 Par montant (€)' }].map(m => (
                      <button key={m.val} type="button" onClick={() => set('mode_points', m.val)}
                        style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: form.mode_points === m.val ? '2px solid #4f46e5' : '2px solid #e5e7eb', background: form.mode_points === m.val ? '#eef2ff' : 'transparent', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: form.mode_points === m.val ? '#4f46e5' : '#6b7280' }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {form.mode_points === 'montant' && (
                    <div style={{ marginTop: 10 }}>
                      <label className="label">Conversion (1€ = X points)</label>
                      <input type="number" min="0.1" step="0.1" value={form.euro_to_points} onChange={e => set('euro_to_points', parseFloat(e.target.value))} placeholder="1" />
                      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>1€ = {form.euro_to_points} point{form.euro_to_points > 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>
              </div>
            </Accordion>

            {/* 3. Paliers */}
            <Accordion icon="🏆" title="Paliers de récompenses" subtitle={paliers.length > 0 ? `${paliers.length} palier${paliers.length > 1 ? 's' : ''} configuré${paliers.length > 1 ? 's' : ''}` : 'Récompenses intermédiaires'}>
              <div style={{ paddingTop: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>Les clients débloquent une récompense à chaque palier atteint. Les points continuent de s'accumuler.</p>

                {paliers.length > 0 && (
                  <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {paliers.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ background: '#eef2ff', color: '#4f46e5', fontWeight: 700, fontSize: 13, padding: '3px 10px', borderRadius: 99 }}>{p.points_requis} pts</span>
                          <span style={{ fontSize: 13 }}>{p.description}</span>
                          {p.type === 'reduction' && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>-{p.valeur}%</span>}
                        </div>
                        <button type="button" onClick={() => deletePalier(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 10 }}>
                    <div>
                      <label className="label">Points requis</label>
                      <input type="number" min="1" placeholder="50" value={newPalier.points_requis} onChange={e => setNewPalier(p => ({ ...p, points_requis: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Récompense</label>
                      <input placeholder="Ex: Café offert..." value={newPalier.description} onChange={e => setNewPalier(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <select value={newPalier.type} onChange={e => setNewPalier(p => ({ ...p, type: e.target.value }))}>
                        <option value="texte">Cadeau</option>
                        <option value="reduction">Réduction %</option>
                      </select>
                    </div>
                  </div>
                  {newPalier.type === 'reduction' && (
                    <div>
                      <label className="label">Valeur (%)</label>
                      <input type="number" min="1" max="100" placeholder="10" value={newPalier.valeur} onChange={e => setNewPalier(p => ({ ...p, valeur: e.target.value }))} />
                    </div>
                  )}
                  <button type="button" onClick={addPalier} className="btn btn-outline">+ Ajouter un palier</button>
                </div>
              </div>
            </Accordion>

            {/* 4. Parrainage */}
            <Accordion icon="🤝" title="Parrainage" subtitle={form.parrainage_actif ? 'Activé' : 'Désactivé'}>
              <div style={{ paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Activer le parrainage</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, marginTop: 2 }}>Les clients gagnent des points en invitant des amis</p>
                  </div>
                  <button type="button" onClick={() => set('parrainage_actif', !form.parrainage_actif)}
                    style={{ width: 44, height: 24, borderRadius: 99, border: 'none', background: form.parrainage_actif ? '#4f46e5' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: 2, left: form.parrainage_actif ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', display: 'block' }} />
                  </button>
                </div>
                {form.parrainage_actif && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="label">Points offerts au parrain</label>
                      <input type="number" min="1" value={form.parrainage_points} onChange={e => set('parrainage_points', parseInt(e.target.value))} />
                    </div>
                    <div>
                      <label className="label">Filleuls pour déclencher</label>
                      <input type="number" min="1" value={form.parrainage_nb_min} onChange={e => set('parrainage_nb_min', parseInt(e.target.value))} />
                      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>Ex: 3 = récompense tous les 3 filleuls</p>
                    </div>
                  </div>
                )}
              </div>
            </Accordion>

            {/* 5. Expiration */}
            <Accordion icon="⏰" title="Limites & expiration" subtitle="Durée de validité des points et récompenses">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Laisse vide pour désactiver. L'expiration se déclenche automatiquement au prochain scan.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Expiration récompense (jours)</label>
                    <input type="number" min="1" placeholder="Ex: 30" value={form.reward_expiry_days} onChange={e => set('reward_expiry_days', e.target.value ? parseInt(e.target.value) : '')} />
                    <p style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>Jours pour utiliser la récompense après l'avoir débloquée</p>
                  </div>
                  <div>
                    <label className="label">Expiration points inactivité (jours)</label>
                    <input type="number" min="1" placeholder="Ex: 180" value={form.points_expiry_days} onChange={e => set('points_expiry_days', e.target.value ? parseInt(e.target.value) : '')} />
                    <p style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>Points remis à zéro si pas de visite pendant X jours</p>
                  </div>
                </div>
              </div>
            </Accordion>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: 12 }}>
              {loading ? 'Enregistrement...' : '💾 Enregistrer toutes les modifications'}
            </button>
          </form>

          {/* 6. Mot de passe — hors du form principal */}
          <Accordion icon="🔒" title="Changer le mot de passe" subtitle="Modifier votre mot de passe de connexion">
            <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16 }}>
              <div>
                <label className="label">Mot de passe actuel</label>
                <input type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} required />
              </div>
              <div>
                <label className="label">Nouveau mot de passe</label>
                <input type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} required />
              </div>
              <div>
                <label className="label">Confirmer le nouveau mot de passe</label>
                <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-outline" disabled={loading}>{loading ? '...' : 'Changer le mot de passe'}</button>
            </form>
          </Accordion>

        </div>
      </main>
    </div>
  )
}
