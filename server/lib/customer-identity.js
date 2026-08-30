// Shared phone-identity key for the customer portal. Bangladeshi visitors
// type their number in a handful of equivalent forms - "01712345678",
// "+8801712345678", "880 1712-345678", with a selected country-code
// dropdown prefixed on top of it from the contact form - so matching by
// raw string would silently create duplicate customer accounts for the
// same person. Reduce everything to the bare 10-digit subscriber number
// (post-880/post-leading-0) and use *that* as the unique key; the
// original, human-typed string is still what's stored/shown on leads and
// orders, this is only the lookup key on the `customers` table.
function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('880')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  // Keep the last 10 digits - covers a stray leading 0 or country code
  // fragment left over from the above (e.g. a "00880..." paste).
  if (digits.length > 10) digits = digits.slice(-10);
  return digits || null;
}

module.exports = { normalizePhone };
