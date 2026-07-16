const cloudinary = require('../config/cloudinary');
const { BadRequestError } = require('../utils/AppError');

// Mirrors FileUploadController.java's validation order and magic-byte checks
// exactly: empty -> size -> mime -> extension -> magic bytes -> save.
//
// Files are uploaded to Cloudinary rather than local disk — most free/cheap
// hosting (Render, etc.) doesn't guarantee persistent local disk across
// restarts/redeploys, so anything written there would eventually vanish.
// PDFs are uploaded with resource_type 'image' rather than 'raw': newer
// Cloudinary accounts block raw-file delivery by default, but image-type
// assets (which Cloudinary can rasterize) are always deliverable.

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function isValidFileBytes(buffer) {
  if (buffer.length < 4) return false;
  const h = buffer;

  // JPEG: FF D8 FF
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47) return true;
  // WEBP: 52 49 46 46 (RIFF)
  if (h[0] === 0x52 && h[1] === 0x49 && h[2] === 0x46 && h[3] === 0x46) return true;
  // PDF: 25 50 44 46 (%PDF)
  if (h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46) return true;

  return false;
}

async function saveUploadedFile(file) {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new BadRequestError('File is empty');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestError('File size must be less than 5MB');
  }

  const mimeType = (file.mimetype || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new BadRequestError('Only JPG, PNG, WEBP and PDF files are allowed');
  }

  const original = file.originalname;
  if (!original || !original.includes('.')) {
    throw new BadRequestError('Invalid file name');
  }
  const extension = original.slice(original.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new BadRequestError('Only .jpg, .jpeg, .png, .webp, .pdf files are allowed');
  }

  if (!isValidFileBytes(file.buffer)) {
    throw new BadRequestError('Invalid file content');
  }

  const dataUri = `data:${mimeType};base64,${file.buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'hostel-complaint-management',
    resource_type: 'image',
  });

  return result.secure_url;
}

module.exports = { saveUploadedFile, MAX_FILE_SIZE };
