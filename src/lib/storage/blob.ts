import 'server-only';
import { put, del } from '@vercel/blob';

/**
 * Fotos das mercadorias no Vercel Blob. O store `doca-fotos` é público: a URL
 * devolvida vai direto no `<img>` do item, sem passar por rota autenticada.
 *
 * As credenciais vêm de `BLOB_READ_WRITE_TOKEN`, injetado pela Vercel em todos
 * os ambientes (localmente: `vercel env pull`).
 */

/** Sobe um objeto e devolve a URL pública. */
export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const blob = await put(key, body, { access: 'public', contentType });
  return blob.url;
}

/**
 * Remove uma foto substituída. O plano Hobby dá 1 GB, então trocar a foto não
 * pode deixar a anterior ocupando espaço para sempre.
 */
export async function deleteObject(url: string): Promise<void> {
  await del(url);
}
