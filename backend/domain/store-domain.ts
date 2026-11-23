import { z } from "zod";

export const categoryInput = z.object({
  name: z.string().trim().min(2).max(60),
  position: z.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
  imageKey: z.string().regex(/^categories\/[a-f0-9-]{36}\.(jpg|png|webp)$/).nullable().default(null),
});
export const productInput = z.object({
  name: z.string().trim().min(2).max(120), description: z.string().trim().max(3000).default(""),
  categoryId: z.string().uuid().nullable().default(null),
  priceCents: z.number().int().min(1).max(10000000),
  compareAtCents: z.number().int().min(1).max(10000000).nullable().default(null),
  stock: z.number().int().min(0).max(100000),
  sizes: z.array(z.string().trim().min(1).max(20)).max(20).default([]),
  imageKey: z.string().regex(/^(products\/[a-f0-9-]{36}\.(jpg|png|webp)|static\/(jean-curvo-estudio|top-vino-estudio|vestido-rayas-estudio)\.webp)$/).nullable().default(null),
  featured: z.boolean().default(false), status: z.enum(["draft", "active", "archived"]).default("draft"),
}).refine(v => !v.compareAtCents || v.compareAtCents > v.priceCents, { message: "El precio anterior debe superar el precio actual" });
export const orderInput = z.object({
  customerName: z.string().trim().min(2).max(100), customerEmail: z.union([z.string().trim().email().max(254),z.literal("")]).default(""),
  customerPhone: z.string().trim().min(7).max(25).refine(value=>/^\+?[\d\s().-]+$/.test(value)&&normalizePhone(value).length>=7&&normalizePhone(value).length<=15,"Ingresa un teléfono válido"), deliveryDetails: z.string().trim().min(5).max(500),
  paymentMethod: z.enum(["whatsapp", "transferencia"]),
  items: z.array(z.object({ productId: z.string().uuid(), size: z.string().trim().max(20).default(""), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
});
export const guestHistoryInput = z.object({
  phone: z.string().trim().min(7).max(25).refine(value=>/^\+?[\d\s().-]+$/.test(value)&&normalizePhone(value).length>=7&&normalizePhone(value).length<=15,"Ingresa un teléfono válido"),
  code: z.string().trim().toUpperCase().regex(/^[A-F0-9]{12}$/,"Código de pedido inválido"),
});
export function normalizePhone(value:string) {
  const digits=value.replace(/\D/g,"");
  if(digits.length===10 && digits.startsWith("09")) return `593${digits.slice(1)}`;
  if(digits.length===9 && digits.startsWith("9")) return `593${digits}`;
  return digits;
}
export const settingsInput = z.object({
  whatsapp: z.string().regex(/^\d{9,15}$/),
  announcement: z.string().trim().max(140), heroTitle: z.string().trim().min(5).max(100),
  heroText: z.string().trim().max(300), transferInstructions: z.string().trim().max(1000),
  tiktokUrl: z.string().trim().max(200).refine(value=>{
    if (!value) return true;
    try { const url=new URL(value); return url.protocol==="https:" && ["tiktok.com","www.tiktok.com"].includes(url.hostname) && /^\/@[^/]+\/?$/.test(url.pathname); }
    catch { return false; }
  },"Usa el enlace completo del perfil: https://www.tiktok.com/@usuario").default(""),
  showSourcing: z.boolean().default(false),
  liveSchedule: z.string().trim().min(5).max(100).default("Lunes a viernes · 19:00 a 21:00"),
  showLiveSchedule: z.boolean().default(true),
});
export const DEFAULT_SETTINGS = {
  whatsapp: "593967794192", announcement: "Moda que acompaña tu forma de ser",
  heroTitle: "Vístete para lo que viene.",
  heroText: "Un paseo sin plan, un atardecer frente al mar, una historia que empieza contigo. Elige la prenda que te acompañe.",
  transferInstructions: "Solicita los datos de transferencia a través de WhatsApp al confirmar tu pedido.",
  tiktokUrl: "", showSourcing: false,
  liveSchedule: "Lunes a viernes · 19:00 a 21:00", showLiveSchedule: true,
};
export type StoreSettings = typeof DEFAULT_SETTINGS;
export const transitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"], confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [],
};
export function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
