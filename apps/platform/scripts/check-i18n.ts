import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

const enKeys = new Set(leafKeys(en));
const arKeys = new Set(leafKeys(ar));
const missingInAr = [...enKeys].filter((key) => !arKeys.has(key));
const extraInAr = [...arKeys].filter((key) => !enKeys.has(key));
const emptyEn = [...enKeys].filter((key) => {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, en);
  return typeof value === "string" && value.trim().length === 0;
});

if (missingInAr.length || extraInAr.length || emptyEn.length) {
  if (missingInAr.length) console.error("Missing in ar.json:", missingInAr.join(", "));
  if (extraInAr.length) console.error("Extra in ar.json:", extraInAr.join(", "));
  if (emptyEn.length) console.error("Empty English values:", emptyEn.join(", "));
  process.exit(1);
}

console.log(`i18n parity OK (${enKeys.size} keys).`);
