import { supabase } from './supabase'

const DTE_JSON_BUCKET = 'dte-json'
const DTE_PDF_BUCKET = 'dte-pdf'

function requireValue(value, fieldName) {
  if (!value) {
    throw new Error(`${fieldName} is required`)
  }
}

function normalizeDteNumber(dteNumber) {
  return String(dteNumber).trim().replaceAll('/', '-')
}

function buildDtePath({ taxpayerId, dteNumber, extension }) {
  const safeDteNumber = normalizeDteNumber(dteNumber)
  return `${taxpayerId}/${safeDteNumber}.${extension}`
}

export async function uploadDteDocument({
  taxpayerId,
  dteNumber,
  dteType,
  issuedAt,
  jsonFile,
  pdfFile,
}) {
  requireValue(taxpayerId, 'taxpayerId')
  requireValue(dteNumber, 'dteNumber')
  requireValue(dteType, 'dteType')
  requireValue(issuedAt, 'issuedAt')
  requireValue(jsonFile, 'jsonFile')
  requireValue(pdfFile, 'pdfFile')

  const jsonPath = buildDtePath({ taxpayerId, dteNumber, extension: 'json' })
  const pdfPath = buildDtePath({ taxpayerId, dteNumber, extension: 'pdf' })

  const { error: jsonError } = await supabase.storage
    .from(DTE_JSON_BUCKET)
    .upload(jsonPath, jsonFile, {
      contentType: 'application/json',
      upsert: true,
    })

  if (jsonError) {
    throw jsonError
  }

  const { error: pdfError } = await supabase.storage
    .from(DTE_PDF_BUCKET)
    .upload(pdfPath, pdfFile, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (pdfError) {
    throw pdfError
  }

  const { data, error } = await supabase
    .from('dte_documents')
    .upsert(
      {
        taxpayer_id: taxpayerId,
        dte_number: String(dteNumber).trim(),
        dte_type: dteType,
        issued_at: issuedAt,
        json_bucket: DTE_JSON_BUCKET,
        json_path: jsonPath,
        pdf_bucket: DTE_PDF_BUCKET,
        pdf_path: pdfPath,
      },
      { onConflict: 'taxpayer_id,dte_number' },
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function listDteDocuments({
  taxpayerId,
  ascending = false,
  limit = 100,
} = {}) {
  let query = supabase
    .from('dte_documents')
    .select(
      'id,taxpayer_id,dte_number,dte_type,issued_at,json_bucket,json_path,pdf_bucket,pdf_path,created_at',
    )

  if (taxpayerId) {
    query = query.eq('taxpayer_id', taxpayerId)
  }

  const { data, error } = await query
    .order('issued_at', { ascending })
    .order('dte_number', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data
}

export async function createDteSignedUrls(dteDocument, expiresIn = 3600) {
  const [{ data: jsonData, error: jsonError }, { data: pdfData, error: pdfError }] =
    await Promise.all([
      supabase.storage
        .from(dteDocument.json_bucket)
        .createSignedUrl(dteDocument.json_path, expiresIn),
      supabase.storage
        .from(dteDocument.pdf_bucket)
        .createSignedUrl(dteDocument.pdf_path, expiresIn),
    ])

  if (jsonError) {
    throw jsonError
  }

  if (pdfError) {
    throw pdfError
  }

  return {
    jsonUrl: jsonData.signedUrl,
    pdfUrl: pdfData.signedUrl,
  }
}

export async function listDteDocumentsWithUrls(options) {
  const documents = await listDteDocuments(options)

  return Promise.all(
    documents.map(async (document) => ({
      ...document,
      files: await createDteSignedUrls(document),
    })),
  )
}
