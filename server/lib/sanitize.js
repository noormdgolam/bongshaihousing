/** Mirrors PHP's strip_tags(trim($x)) */
function stripTags(value) {
  return String(value ?? '').trim().replace(/<[^>]*>/g, '');
}

/** Mirrors PHP's preg_replace('/[\r\n]+/', ' ', strip_tags(trim($x))) - used for header-unsafe fields like name */
function singleLine(value) {
  return stripTags(value).replace(/[\r\n]+/g, ' ');
}

/** Mirrors PHP's filter_var(trim($x), FILTER_SANITIZE_EMAIL) - strips characters illegal in an email, does not validate format */
function sanitizeEmail(value) {
  return String(value ?? '').trim().replace(/[^a-zA-Z0-9!#$%&'*+/=?^_`{|}~@.[\]-]/g, '');
}

/** Mirrors PHP's preg_replace('/[^a-zA-Z0-9_-]/', '_', $x) - used to build safe filenames */
function safeFilenamePart(value) {
  return String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

module.exports = { stripTags, singleLine, sanitizeEmail, safeFilenamePart };
