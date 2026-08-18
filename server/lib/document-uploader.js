const fs = require('fs');
const path = require('path');

// Deliberately NOT under images/uploads - that path resolves (via an
// account-root symlink on the production host) straight into the public
// docroot's images/ folder, statically served by Apache. NID scans and
// trade license copies must never be reachable by a guessed URL, so this
// lives in its own directory one level up from lib/ - a sibling of
// routes/, views/, db/, matching the same "app root" reference point
// that already works correctly in both local dev (server/lib/..) and the
// flattened production layout (lib/.. is the app's own root there too).
const PRIVATE_UPLOADS_DIR = path.join(__dirname, '..', 'private-uploads', 'agent-docs');
if (!fs.existsSync(PRIVATE_UPLOADS_DIR)) {
  fs.mkdirSync(PRIVATE_UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' };

// Saved filenames are random, not derived from the applicant's name or
// NID - even though the directory itself isn't publicly served, an
// unguessable name is one more layer if that ever changes.
function saveDocument(buffer, mimetype) {
  if (!ALLOWED_MIME.has(mimetype)) {
    throw new Error(`Unsupported document type: ${mimetype}. Only JPG, PNG, WebP, or PDF are accepted.`);
  }
  const ext = EXT_BY_MIME[mimetype];
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  fs.writeFileSync(path.join(PRIVATE_UPLOADS_DIR, filename), buffer);
  return filename;
}

function documentPath(filename) {
  // path.basename strips any directory traversal a stored value could
  // theoretically contain before it ever touches the filesystem again.
  return path.join(PRIVATE_UPLOADS_DIR, path.basename(filename));
}

module.exports = { saveDocument, documentPath, PRIVATE_UPLOADS_DIR };
