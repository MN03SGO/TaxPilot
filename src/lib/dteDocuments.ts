import { supabase } from './supabase'

const DTE_JSON_BUCKET = 'dte-json'
const DTE_PDF_BUCKET = 'dte-pdf'
const N8N_DEV_PROXY_PATH = '/api/n8n/webhook'

function requireValue(value: any, fieldName: string) {
  if (!value) {
    throw new Error(`${fieldName} is required`)
  }
}

function normalizeDteNumber(dteNumber: string | number) {
  return String(dteNumber).trim().replaceAll('/', '-')
}

interface DtePathParams {
  taxpayerId: string;
  dteNumber: string | number;
  extension: 'json' | 'pdf';
}

function buildDtePath({ taxpayerId, dteNumber, extension }: DtePathParams) {
  const safeDteNumber = normalizeDteNumber(dteNumber)
  return `${taxpayerId}/${safeDteNumber}.${extension}`
}

export interface UploadDteDocumentParams {
  taxpayerId: string;
  dteNumber: string | number;
  dteType: string;
  issuedAt: string;
  jsonFile?: File | null;
  pdfFile?: File | null;
}

export async function uploadDteDocument({
  taxpayerId,
  dteNumber,
  dteType,
  issuedAt,
  jsonFile,
  pdfFile,
}: UploadDteDocumentParams) {
  requireValue(taxpayerId, 'taxpayerId')
  requireValue(dteNumber, 'dteNumber')
  requireValue(dteType, 'dteType')
  requireValue(issuedAt, 'issuedAt')

  if (!jsonFile && !pdfFile) {
    throw new Error('Debe proporcionar al menos un archivo JSON o PDF.')
  }

  let jsonPath: string | null = null
  if (jsonFile) {
    jsonPath = buildDtePath({ taxpayerId, dteNumber, extension: 'json' })
    const { error: jsonError } = await supabase.storage
      .from(DTE_JSON_BUCKET)
      .upload(jsonPath, jsonFile, {
        contentType: 'application/json',
        upsert: true,
      })

    if (jsonError) {
      throw jsonError
    }
  }

  let pdfPath: string | null = null
  if (pdfFile) {
    pdfPath = buildDtePath({ taxpayerId, dteNumber, extension: 'pdf' })
    const { error: pdfError } = await supabase.storage
      .from(DTE_PDF_BUCKET)
      .upload(pdfPath, pdfFile, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (pdfError) {
      throw pdfError
    }
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

export interface ListDteDocumentsOptions {
  taxpayerId?: string;
  ascending?: boolean;
  limit?: number;
}

export async function listDteDocuments({
  taxpayerId,
  ascending = false,
  limit = 100,
}: ListDteDocumentsOptions = {}) {
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

export async function createDteSignedUrls(dteDocument: any, expiresIn = 3600) {
  const promises = []

  if (dteDocument.json_path) {
    promises.push(
      supabase.storage
        .from(dteDocument.json_bucket)
        .createSignedUrl(dteDocument.json_path, expiresIn)
        .then((res) => {
          if (res.error) throw res.error
          return { jsonUrl: res.data?.signedUrl || null }
        })
    )
  } else {
    promises.push(Promise.resolve({ jsonUrl: null }))
  }

  if (dteDocument.pdf_path) {
    promises.push(
      supabase.storage
        .from(dteDocument.pdf_bucket)
        .createSignedUrl(dteDocument.pdf_path, expiresIn)
        .then((res) => {
          if (res.error) throw res.error
          return { pdfUrl: res.data?.signedUrl || null }
        })
    )
  } else {
    promises.push(Promise.resolve({ pdfUrl: null }))
  }

  const results = await Promise.all(promises)
  return Object.assign({}, ...results)
}

export async function listDteDocumentsWithUrls(options?: ListDteDocumentsOptions) {
  const documents = await listDteDocuments(options)

  return Promise.all(
    documents.map(async (document) => ({
      ...document,
      files: await createDteSignedUrls(document),
    })),
  )
}

export async function uploadDteToN8n({
  taxpayerId,
  jsonFile,
  pdfFile,
}: {
  taxpayerId: string;
  jsonFile?: File | null;
  pdfFile?: File | null;
}) {
  const configuredWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  const apiKey = import.meta.env.VITE_N8N_API_KEY;

  if (!configuredWebhookUrl) {
    throw new Error('La URL del Webhook de n8n no está configurada.');
  }

  const webhookUrl = import.meta.env.DEV ? N8N_DEV_PROXY_PATH : configuredWebhookUrl;

  const formData = new FormData();
  // Send taxpayer ID with different common keys
  formData.append('taxpayerId', taxpayerId);
  formData.append('taxpayer_id', taxpayerId);
  formData.append('user_id', taxpayerId);

  if (jsonFile) {
    formData.append('jsonFile', jsonFile);
    formData.append('file', jsonFile);
  }
  if (pdfFile) {
    formData.append('pdfFile', pdfFile);
    formData.append('file', pdfFile);
    formData.append('pdf', pdfFile);
  }

  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['X-N8N-API-KEY'] = apiKey;
  }

  const response = await fetch(webhookUrl || '', {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en el webhook de n8n: ${response.status} ${response.statusText} - ${errorText}`);
  }

  try {
    return await response.json();
  } catch {
    return { success: true };
  }
}
