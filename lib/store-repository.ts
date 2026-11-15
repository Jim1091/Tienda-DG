import { env } from "cloudflare:workers";
import { DEFAULT_SETTINGS, type StoreSettings } from "./store-domain";

export const db = (): D1Database => { if (!env.DB) throw new Error("D1 unavailable"); return env.DB; };
export const bucket = (): R2Bucket => { if (!env.BUCKET) throw new Error("R2 unavailable"); return env.BUCKET; };
export async function readSettings(): Promise<StoreSettings> {
  const row = await db().prepare("SELECT value FROM settings WHERE key = 'store'").first<{value:string}>();
  if (!row) return DEFAULT_SETTINGS;
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) }; } catch { return DEFAULT_SETTINGS; }
}
export async function catalog() {
  const [categories, products] = await Promise.all([
    db().prepare("SELECT id,name,slug,position,image_key as imageKey FROM categories WHERE active=1 ORDER BY position,name").all(),
    db().prepare("SELECT p.id,p.name,p.slug,p.description,p.category_id as categoryId,p.price_cents as priceCents,p.compare_at_cents as compareAtCents,p.stock,p.sizes,p.image_key as imageKey,p.featured FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.status='active' AND (p.category_id IS NULL OR c.active=1) ORDER BY p.featured DESC,p.created_at DESC").all(),
  ]);
  return { categories: categories.results, products: products.results.map(p => ({...p,sizes: JSON.parse(String(p.sizes)),imageUrl:p.imageKey?`/api/media/${p.imageKey}`:null})) };
}
export async function adminData() {
  const [categories, products, orders] = await Promise.all([
    db().prepare("SELECT * FROM categories ORDER BY position,name").all(),
    db().prepare("SELECT * FROM products ORDER BY created_at DESC").all(),
    db().prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200").all(),
  ]);
  return { categories:categories.results, products:products.results.map(p=>({...p,sizes:JSON.parse(String(p.sizes))})), orders:orders.results, settings:await readSettings() };
}
