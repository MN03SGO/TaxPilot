import './styles.css'
import { supabase, supabaseConfig } from './lib/supabase'

const app = document.querySelector('#app')

app.innerHTML = `
  <section class="shell">
    <p class="eyebrow">TaxPilot</p>
    <h1>Conexion Supabase lista</h1>
    <p class="copy">
      El cliente de Supabase esta configurado para Vite. Actualiza las variables
      en <code>.env</code> con las credenciales del proyecto.
    </p>
    <button id="check-connection" type="button">Probar conexion</button>
    <pre id="connection-result">Sin probar</pre>
  </section>
`

document.querySelector('#check-connection').addEventListener('click', async () => {
  const result = document.querySelector('#connection-result')
  result.textContent = 'Probando...'

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const response = await fetch(`${supabaseConfig.url}/auth/v1/settings`, {
      headers: {
        Accept: 'application/json',
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
      },
    })

    if (!response.ok) {
      const details = await response.text()
      const message =
        response.status === 401
          ? 'Supabase Auth respondio 401. La key coincide con el proyecto localmente, asi que revisa el detalle devuelto por Supabase.'
          : `Supabase respondio con estado ${response.status}. Revisa URL y anon key.`

      result.textContent = details ? `${message}\n\n${details}` : message
      return
    }

    result.textContent = session
      ? 'Conexion correcta. Hay una sesion activa.'
      : 'Conexion correcta. No hay una sesion activa.'
  } catch (error) {
    result.textContent = `No se pudo conectar con Supabase: ${error.message}`
    return
  }
})
