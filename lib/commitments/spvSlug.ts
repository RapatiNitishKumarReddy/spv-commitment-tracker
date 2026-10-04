/**
 * Builds a URL-safe slug from an SPV key: "beta infra spv" → "beta-infra-spv".
 * Accents are stripped, any run of other characters becomes "-", and an empty
 * result falls back to "spv".
 */
export function toSpvSlug(spvKey: string): string {
  const slug = spvKey
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "spv";
}

/**
 * Assigns every SPV key a unique slug.
 *
 * Keys are processed in the order given (callers pass SPVs in order of first
 * appearance in the CSV), so the same data always produces the same URLs.
 * When two keys produce the same slug (e.g. "alpha+" and "alpha-"), later ones
 * get "-2", "-3", … appended.
 */
export function assignSpvSlugs(spvKeys: string[]): Map<string, string> {
  const slugByKey = new Map<string, string>();
  const usedSlugs = new Set<string>();

  for (const key of spvKeys) {
    if (slugByKey.has(key)) continue;

    const base = toSpvSlug(key);
    let slug = base;
    for (let suffix = 2; usedSlugs.has(slug); suffix += 1) {
      slug = `${base}-${suffix}`;
    }

    usedSlugs.add(slug);
    slugByKey.set(key, slug);
  }

  return slugByKey;
}
