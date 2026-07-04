-- Alter dte_documents to make json_path and pdf_path nullable
alter table public.dte_documents
  alter column json_path drop not null,
  alter column pdf_path drop not null;
