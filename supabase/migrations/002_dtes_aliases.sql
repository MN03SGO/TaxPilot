-- Add alias/backup columns to public.dtes table to support external integrations (like n8n)
ALTER TABLE public.dtes ADD COLUMN IF NOT EXISTS taxpayer_id uuid;
ALTER TABLE public.dtes ADD COLUMN IF NOT EXISTS codigo_generacion text;
ALTER TABLE public.dtes ADD COLUMN IF NOT EXISTS fecha_emision date;
ALTER TABLE public.dtes ADD COLUMN IF NOT EXISTS emisor_nombre text;
ALTER TABLE public.dtes ADD COLUMN IF NOT EXISTS receptor_nombre text;

-- Create trigger function to keep columns in sync
CREATE OR REPLACE FUNCTION public.sync_dtes_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync user_id / taxpayer_id
  IF NEW.user_id IS NULL AND NEW.taxpayer_id IS NOT NULL THEN
    NEW.user_id := NEW.taxpayer_id;
  ELSIF NEW.taxpayer_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.taxpayer_id := NEW.user_id;
  END IF;

  -- Sync numero_dte / codigo_generacion
  IF NEW.numero_dte IS NULL AND NEW.codigo_generacion IS NOT NULL THEN
    NEW.numero_dte := NEW.codigo_generacion;
  ELSIF NEW.codigo_generacion IS NULL AND NEW.numero_dte IS NOT NULL THEN
    NEW.codigo_generacion := NEW.numero_dte;
  END IF;

  -- Sync fecha / fecha_emision
  IF NEW.fecha IS NULL AND NEW.fecha_emision IS NOT NULL THEN
    NEW.fecha := NEW.fecha_emision;
  ELSIF NEW.fecha_emision IS NULL AND NEW.fecha IS NOT NULL THEN
    NEW.fecha_emision := NEW.fecha;
  END IF;

  -- Sync emisor / emisor_nombre
  IF NEW.emisor IS NULL AND NEW.emisor_nombre IS NOT NULL THEN
    NEW.emisor := NEW.emisor_nombre;
  ELSIF NEW.emisor_nombre IS NULL AND NEW.emisor IS NOT NULL THEN
    NEW.emisor_nombre := NEW.emisor;
  END IF;

  -- Sync receptor / receptor_nombre
  IF NEW.receptor IS NULL AND NEW.receptor_nombre IS NOT NULL THEN
    NEW.receptor := NEW.receptor_nombre;
  ELSIF NEW.receptor_nombre IS NULL AND NEW.receptor IS NOT NULL THEN
    NEW.receptor_nombre := NEW.receptor;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_dtes_columns_trigger ON public.dtes;
CREATE TRIGGER sync_dtes_columns_trigger
BEFORE INSERT OR UPDATE ON public.dtes
FOR EACH ROW
EXECUTE FUNCTION public.sync_dtes_columns();
