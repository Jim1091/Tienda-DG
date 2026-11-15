import { z } from "zod";

export const sourcingInput=z.object({
  customerName:z.string().trim().min(2).max(100),
  customerEmail:z.string().trim().email().max(254),
  customerPhone:z.string().trim().regex(/^\+?[0-9\s()-]{7,25}$/),
  city:z.string().trim().min(2).max(80),
  size:z.string().trim().max(30).default(""),
  description:z.string().trim().min(10).max(1000),
  budgetCents:z.number().int().min(100).max(10000000).nullable().default(null),
});
export const sourcingTrackInput=z.object({
  code:z.string().regex(/^[A-F0-9]{12}$/),
  email:z.string().trim().email().max(254),
});
export const sourcingUpdateInput=z.object({
  status:z.enum(["new","searching","quoted","accepted","fulfilled","declined"]),
  itemPriceCents:z.number().int().min(1).max(10000000).nullable(),
  deliveryCents:z.number().int().min(0).max(10000000).nullable(),
  quoteNotes:z.string().trim().max(1000),
}).refine(value=>!["quoted","accepted","fulfilled"].includes(value.status)||(value.itemPriceCents!==null&&value.deliveryCents!==null),{message:"Indica precio de la prenda y costo de envío antes de cotizar"});

export const sourcingTransitions:Record<string,string[]>={
  new:["searching","quoted","declined"],
  searching:["quoted","declined"],
  quoted:["searching","accepted","declined"],
  accepted:["fulfilled","declined"],
  fulfilled:[],declined:[],
};
