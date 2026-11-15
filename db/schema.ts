import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(), name: text("name").notNull(),
  slug: text("slug").notNull().unique(), position: integer("position").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});
export const products = sqliteTable("products", {
  id: text("id").primaryKey(), name: text("name").notNull(), slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""), categoryId: text("category_id").references(() => categories.id),
  priceCents: integer("price_cents").notNull(), compareAtCents: integer("compare_at_cents"),
  stock: integer("stock").notNull().default(0), sizes: text("sizes").notNull().default("[]"),
  imageKey: text("image_key"), featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(), code: text("code").notNull().unique(),
  customerName: text("customer_name").notNull(), customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(), deliveryDetails: text("delivery_details").notNull(),
  paymentMethod: text("payment_method").notNull(), paymentStatus: text("payment_status").notNull().default("pending"),
  status: text("status").notNull().default("pending"), totalCents: integer("total_cents").notNull(),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(), orderId: text("order_id").notNull().references(() => orders.id),
  productId: text("product_id").notNull().references(() => products.id), name: text("name").notNull(),
  size: text("size").notNull(), unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
});
export const settings = sqliteTable("settings", { key: text("key").primaryKey(), value: text("value").notNull() });
