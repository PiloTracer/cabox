import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Public endpoint — no admin auth (checkout is unauthenticated)
// Security: strict type + size validation, randomized filenames, no path traversal

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/heic', 'image/heif',    // iPhone photos
  'application/pdf',              // PDF receipts / bank transfer confirmations
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg',
  'image/png': 'png', 'image/webp': 'webp',
  'image/heic': 'heic', 'image/heif': 'heic',
  'application/pdf': 'pdf',
};

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Datos de formulario inválidos' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
  }

  const mime = file.type.toLowerCase();

  if (!ALLOWED_TYPES.includes(mime)) {
    return NextResponse.json(
      { error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP, HEIC o PDF.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'El archivo excede el límite de 10 MB.' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = EXT_MAP[mime] ?? 'bin';
  const filename = `proof_${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const proofsDir = join(process.cwd(), 'public', 'uploads', 'proofs');

  await mkdir(proofsDir, { recursive: true });
  await writeFile(join(proofsDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/proofs/${filename}` });
}
