const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  '';
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'attachments';

export const useSupabaseStorage = Boolean(SUPABASE_URL && SUPABASE_KEY);

let bucketPromise: Promise<void> | null = null;

async function ensureBucket(): Promise<void> {
  if (!useSupabaseStorage) return;
  if (!bucketPromise) {
    bucketPromise = (async () => {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
      });

      if (res.ok) return;

      // 400/409 means the bucket already exists, which is fine.
      if (res.status !== 400 && res.status !== 409) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Could not prepare storage bucket: ${res.status} ${detail}`);
      }
    })().catch((err) => {
      bucketPromise = null;
      throw err;
    });
  }
  await bucketPromise;
}

function objectPath(taskId: string, fileName: string): string {
  return `${encodeURIComponent(taskId)}/${encodeURIComponent(fileName)}`;
}

export async function putFile(
  taskId: string,
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await ensureBucket();

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath(taskId, fileName)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': contentType || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Storage upload failed: ${res.status} ${detail}`);
  }
}

export async function getFile(
  taskId: string,
  fileName: string
): Promise<{ buffer: Buffer; contentType: string | null }> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath(taskId, fileName)}`, {
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Storage download failed: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType: res.headers.get('content-type') };
}

export async function removeFile(taskId: string, fileName: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath(taskId, fileName)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Storage delete failed: ${res.status} ${detail}`);
  }
}
