import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

const TYPES = ['Restaurant', 'Boulangerie', 'Coiffeur', 'Café', 'Épicerie', 'Autre']
const EMOJIS = ['🍕', '🥐', '✂️', '☕', '🛒', '🏪', '💈', '🍔', '🌸', '⭐', '🎂', '🍜']
const COULEURS = ['#4f46e5', '#ef4444', '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b']

export default function Profile() {
  const saved = JSON.parse(localStorage.getItem('commercant') || '{}')
  const [form, setForm] = useState({
    nom_enseigne: saved.nom_enseigne || '',
    type_activite: saved.type_activite || 'Restaurant',
    emoji: saved.emoji || '🏪',
    couleur: saved.couleur || '#4f46e5',
    pts_par_passage: saved.pts_par_passage || 1,
    seuil_reward: saved.seuil_reward || 10,
    reward_desc: saved.reward_desc || ''
  })
  const [iconUrl, setIconUrl] = useState(saved.icon_url || null)
  const [iconPreview, setIconPreview] = useState(null)
  const [iconFile, setIconFile] = useState(null)
  const [iconLoading, setIconLoading] = useState(false)
  const fileInputRef = useRef(null)
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

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
      const { data } = await api.post('/auth/upload-icon', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      localStorage.setItem('commercant', JSON.stringify(data.commercant))
      setIconUrl(data.icon_url)
      setIconPreview(null)
      setIconFile(null)
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
              {iconUrl
                ? <img src={iconUrl} alt="icône" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : form.emoji
              }
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
          <h1 className="page-title">⚙️ Mon profil</h1>
          <Link to="/dashboard" className="btn btn-outline btn-sm">← Retour</Link>
        </div>

        <div className="page-body" style={{ maxWidth: 640 }}>
          {msg && <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#065f46', fontSize: 14 }}>{msg}</div>}
          {err && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#991b1b', fontSize: 14 }}>{err}</div>}

          {/* Profil enseigne */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Informations de l'enseigne</h2>
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Icône personnalisée */}
              <div>
                <label className="label">Icône du dashboard</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      width: 72, height: 72, borderRadius: 16,
                      background: iconPreview || iconUrl ? 'transparent' : form.couleur,
                      border: '2px dashed #d1d5db', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0
                    }}
                  >
                    {iconPreview || iconUrl
                      ? <img src={iconPreview || iconUrl} alt="icône" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 28 }}>{form.emoji}</span>
                    }
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button type="button" onClick={() => fileInputRef.current.click()}
                      className="btn btn-outline btn-sm">
                      📁 Choisir une image
                    </button>
                    {iconFile && (
                      <button type="button" onClick={uploadIcon} disabled={iconLoading}
                        className="btn btn-primary btn-sm">
                        {iconLoading ? 'Envoi...' : '✓ Valider l\'icône'}
                      </button>
                    )}
                    {iconUrl && !iconFile && (
                      <span style={{ fontSize: 12, color: '#6b7280' }}>Image personnalisée active</span>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onIconChange} />
                </div>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>JPG, PNG, WEBP — 2 Mo max</p>
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
                <label className="label">Couleur</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COULEURS.map(c => (
                    <button type="button" key={c} onClick={() => set('couleur', c)}
                      style={{ width: 32, height: 32, background: c, border: form.couleur === c ? '3px solid #111' : '3px solid transparent', borderRadius: '50%', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Points par passage</label>
                  <input type="number" min="1" value={form.pts_par_passage} onChange={e => set('pts_par_passage', parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="label">Seuil récompense</label>
                  <input type="number" min="1" value={form.seuil_reward} onChange={e => set('seuil_reward', parseInt(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="label">Description récompense</label>
                <input placeholder="Ex: Café offert, -10%, cadeau..." value={form.reward_desc} onChange={e => set('reward_desc', e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}</button>
            </form>
          </div>

          {/* Mot de passe */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Changer le mot de passe</h2>
            <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          </div>
        </div>
      </main>
    </div>
  )
}
