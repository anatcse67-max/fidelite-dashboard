import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CarteHome() {
  const navigate = useNavigate()

  useEffect(() => {
    const id = localStorage.getItem('carte_id')
    if (id) navigate(`/carte/${id}`, { replace: true })
    else navigate('/', { replace: true })
  }, [])

  return null
}
