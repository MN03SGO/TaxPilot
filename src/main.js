import './styles.css'
import { getCurrentUser } from './lib/manualDtes'
import { uploadDteDocument, listDteDocumentsWithUrls } from './lib/dteDocuments'

const app = document.querySelector('#app')

app.innerHTML = `
  <section class="workspace">
    <header class="topbar">
      <div>
        <p class="eyebrow">TaxPilot</p>
        <h1>Registro manual de DTE</h1>
      </div>
      <p id="session-state" class="session-pill">Verificando sesion</p>
    </header>

    <div class="layout">
      <section class="panel form-panel" aria-labelledby="form-title">
        <div class="section-heading">
          <p class="eyebrow">Nuevo documento</p>
          <h2 id="form-title">Datos del DTE</h2>
        </div>

        <form id="dte-form" class="dte-form" enctype="multipart/form-data">
          <label>
            <span>Numero DTE</span>
            <input name="numeroDte" type="text" placeholder="DTE-0001" autocomplete="off" required />
          </label>

          <label>
            <span>Tipo DTE</span>
            <select name="dteType" required>
              <option value="01">01 - Factura de Consumo</option>
              <option value="03" selected>03 - Comprobante de Crédito Fiscal</option>
              <option value="05">05 - Nota de Débito</option>
              <option value="06">06 - Nota de Crédito</option>
              <option value="11">11 - Factura de Exportación</option>
              <option value="14">14 - Factura de Sujeto Excluido</option>
            </select>
          </label>

          <label class="full-span">
            <span>Fecha de Emisión</span>
            <input name="fecha" type="date" required />
          </label>

          <label class="full-span">
            <span>Archivo JSON (.json)</span>
            <input name="jsonFile" type="file" accept=".json" />
          </label>

          <label class="full-span">
            <span>Archivo PDF (.pdf)</span>
            <input name="pdfFile" type="file" accept=".pdf" />
          </label>

          <div class="actions full-span">
            <button id="submit-button" type="submit">Guardar DTE</button>
            <p id="form-status" class="status-text" role="status"></p>
          </div>
        </form>
      </section>

      <aside class="panel recent-panel" aria-labelledby="recent-title">
        <div class="section-heading">
          <p class="eyebrow">Supabase</p>
          <h2 id="recent-title">Ultimos DTE</h2>
        </div>
        <div id="recent-list" class="recent-list"></div>
      </aside>
    </div>
  </section>
`

const dteForm = document.querySelector('#dte-form')
const formStatus = document.querySelector('#form-status')
const recentList = document.querySelector('#recent-list')
const sessionState = document.querySelector('#session-state')
const submitButton = document.querySelector('#submit-button')

document.querySelector('input[name="fecha"]').value = new Date().toISOString().slice(0, 10)

function setStatus(message, tone = 'neutral') {
  formStatus.textContent = message
  formStatus.dataset.tone = tone
}

function renderRecentDtes(dtes) {
  if (!dtes.length) {
    recentList.innerHTML = '<p class="empty-state">Aun no hay DTE registrados para esta cuenta.</p>'
    return
  }

  recentList.innerHTML = dtes
    .map(
      (dte) => {
        const issuedDate = new Date(dte.issued_at).toLocaleDateString('es-SV', {
          timeZone: 'UTC'
        })
        
        let filesHtml = ''
        if (dte.files?.pdfUrl) {
          filesHtml += `<a href="${dte.files.pdfUrl}" target="_blank" class="file-btn pdf">📄 PDF</a>`
        }
        if (dte.files?.jsonUrl) {
          filesHtml += `<a href="${dte.files.jsonUrl}" target="_blank" class="file-btn json">⚙️ JSON</a>`
        }
        if (!filesHtml) {
          filesHtml = '<span class="file-badge-missing">Sin archivos</span>'
        }

        const dteTypeLabels = {
          '01': 'Factura',
          '03': 'Crédito Fiscal',
          '05': 'Nota de Débito',
          '06': 'Nota de Crédito',
          '11': 'Factura de Exportación',
          '14': 'Sujeto Excluido',
        }
        const typeLabel = dteTypeLabels[dte.dte_type] || `Tipo ${dte.dte_type}`

        return `
          <article class="recent-item">
            <div>
              <strong>${dte.dte_number}</strong>
              <span style="font-size:0.8rem; color:#667085;">${typeLabel} • ${issuedDate}</span>
            </div>
            <div>
              <div class="dte-files">
                ${filesHtml}
              </div>
            </div>
          </article>
        `
      }
    )
    .join('')
}

async function refreshRecentDtes() {
  try {
    const user = await getCurrentUser()
    if (!user) return

    const dtes = await listDteDocumentsWithUrls({
      taxpayerId: user.id,
      limit: 8,
    })
    renderRecentDtes(dtes)
  } catch (error) {
    recentList.innerHTML = `<p class="empty-state error">No se pudieron cargar los DTE: ${error.message}</p>`
  }
}

async function initializeSessionState() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      sessionState.textContent = 'Sin sesion activa'
      sessionState.dataset.state = 'warning'
      submitButton.disabled = true
      setStatus('Necesitas iniciar sesion para guardar DTE en Supabase.', 'warning')
      return
    }

    sessionState.textContent = user.email ?? user.id
    sessionState.dataset.state = 'ready'
    submitButton.disabled = false
    await refreshRecentDtes()
  } catch (error) {
    sessionState.textContent = 'Sesion no disponible'
    sessionState.dataset.state = 'warning'
    submitButton.disabled = true
    setStatus(error.message, 'error')
  }
}

dteForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  submitButton.disabled = true
  setStatus('Guardando y subiendo DTE...', 'neutral')

  const formData = new FormData(dteForm)
  const jsonFile = formData.get('jsonFile')
  const pdfFile = formData.get('pdfFile')

  const hasJson = jsonFile && jsonFile.size > 0
  const hasPdf = pdfFile && pdfFile.size > 0

  if (!hasJson && !hasPdf) {
    setStatus('Debe proporcionar al menos un archivo JSON o PDF.', 'error')
    submitButton.disabled = false
    return
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Inicia sesion antes de guardar un DTE.')
    }

    await uploadDteDocument({
      taxpayerId: user.id,
      dteNumber: formData.get('numeroDte'),
      dteType: formData.get('dteType'),
      issuedAt: new Date(formData.get('fecha')).toISOString(),
      jsonFile: hasJson ? jsonFile : null,
      pdfFile: hasPdf ? pdfFile : null,
    })

    dteForm.reset()
    document.querySelector('input[name="fecha"]').value = new Date().toISOString().slice(0, 10)
    setStatus('DTE guardado correctamente.', 'success')
    await refreshRecentDtes()
  } catch (error) {
    setStatus(error.message, 'error')
  } finally {
    submitButton.disabled = false
  }
})

initializeSessionState()
