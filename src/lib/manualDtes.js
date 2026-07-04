import { supabase } from './supabase'

function cleanText(value) {
  const cleaned = String(value ?? '').trim()
  return cleaned || null
}

function parseAmount(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const amount = Number(value)

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('El monto total debe ser un numero positivo.')
  }

  return amount
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user
}

export async function createManualDte(formValues) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Inicia sesion antes de guardar un DTE.')
  }

  const numeroDte = cleanText(formValues.numeroDte)
  const fecha = cleanText(formValues.fecha)

  if (!numeroDte) {
    throw new Error('El numero DTE es obligatorio.')
  }

  if (!fecha) {
    throw new Error('La fecha es obligatoria.')
  }

  const { data, error } = await supabase
    .from('dtes')
    .insert({
      user_id: user.id,
      numero_dte: numeroDte,
      fecha,
      emisor: cleanText(formValues.emisor),
      receptor: cleanText(formValues.receptor),
      monto_total: parseAmount(formValues.montoTotal),
      es_valido: Boolean(formValues.esValido),
      observaciones: cleanText(formValues.observaciones),
    })
    .select('id,numero_dte,fecha,emisor,receptor,monto_total,es_valido,created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function listManualDtes(limit = 8) {
  const { data, error } = await supabase
    .from('dtes')
    .select('id,numero_dte,fecha,emisor,receptor,monto_total,es_valido,created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data
}
