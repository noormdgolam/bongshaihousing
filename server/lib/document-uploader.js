const fs = require('fs');
const path = require('path');

// Deliberately NOT under images/uploads - that path resolves (via an
// account-root symlink on the production host) straight into the public
// docroot's images/ folder, statically served by Apache. NID scans, trade
// license copies, and customer floor plans must never be reachable by a
// guessed URL, so this lives in its own directory one level up from lib/ -
// a sibling of routes/, views/, db/, matching the same "app root" reference
// point that already works correctly in both local dev (server/lib/..) and
// the flattened production layout (lib/.. is the app's own root there too).
const PRIVATE_UPLOADS_ROOT = path.join(__dirname, '..', 'private-uploads');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' };

function dirFor(subdir) {
  const dir = path.join(PRIVATE_UPLOADS_ROOT, subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Saved filenames are random, not derived from the applicant's name, NID,
// or order - even though the directory itself isn't publicly served, an
// unguessable name is one more layer if that ever changes.
function saveDocumentIn(subdir, buffer, mimetype) {
  if (!ALLOWED_MIME.has(mimetype)) {
    throw new Error(`Unsupported document type: ${mimetype}. Only JPG, PNG, WebP, or PDF are accepted.`);
  }
  const ext = EXT_BY_MIME[mimetype];
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  fs.writeFileSync(path.join(dirFor(subdir), filename), buffer);
  return filename;
}

function documentPathIn(subdir, filename) {
  // path.basename strips any directory traversal a stored value could
  // theoretically contain before it ever touches the filesystem again.
  return path.join(dirFor(subdir), path.basename(filename));
}

const saveDocument = (buffer, mimetype) => saveDocumentIn('agent-docs', buffer, mimetype);
const documentPath = (filename) => documentPathIn('agent-docs', filename);
const PRIVATE_UPLOADS_DIR = path.join(PRIVATE_UPLOADS_ROOT, 'agent-docs');

module.exports = { saveDocument, documentPath, PRIVATE_UPLOADS_DIR, saveDocumentIn, documentPathIn };
