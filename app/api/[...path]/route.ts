import { env } from "cloudflare:workers";
import { ZodError } from "zod";
import { catalog, adminData, bucket, db, readSettings } from "../../../backend/infrastructure/store-repository";
import { categoryInput, guestHistoryInput, normalizePhone, orderInput, productInput, settingsInput, slugify, transitions } from "../../../backend/domain/store-domain";
import { createSourcingRequest, deleteSourcingRequest, getSourcingImage, listSourcingRequests, SourcingError, trackSourcingRequest, updateSourcingRequest } from "../../../backend/application/concierge-service";
import { ImageUploadError, inspectImage } from "../../../backend/infrastructure/image-upload";
import { findOrderForPhone, getGuestOrderHistory, OrderHistoryError } from "../../../backend/application/order-history";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{path:string[]}> };
const json = (data:unknown,status=200) => Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const fail = (message:string,status=400) => json({error:message},status);
const now = () => new Date().toISOString();
const isAdmin = (request:Request) => {
  const email = request.headers.get("oai-authenticated-user-email");
  return !!email && !!env.DG_ADMIN_EMAIL && email.toLowerCase() === env.DG_ADMIN_EMAIL.toLowerCase();
};
const requireWrite = (request:Request) => {
  if (!isAdmin(request)) return fail("Acceso restringido",403);
  const origin=request.headers.get("origin");
  if (!origin || new URL(origin).origin !== new URL(request.url).origin || request.headers.get("x-dg-admin")!=="1") return fail("Solicitud no permitida",403);
  return null;
};
async function handle(request:Request,ctx:Ctx) {
  const path=(await ctx.params).path;
  const [root,action,id]=path;
  if (root==="session" && request.method==="GET") {
    const email=request.headers.get("oai-authenticated-user-email");
    const signedIn=!!email && !!request.headers.get("oai-authenticated-user-id");
    return json({admin:isAdmin(request),signedIn,email:signedIn?email:null});
  }
  if (root==="catalog" && request.method==="GET") return json(await catalog());
  if (root==="my-orders" && request.method==="POST") return json({orders:await getGuestOrderHistory(await request.json())});
  if (root==="settings" && request.method==="GET") { const {transferInstructions,...publicSettings}=await readSettings(); return json(publicSettings); }
  if (root==="media" && action==="static" && request.method==="GET" && path.length===3 && /^(jean-curvo-estudio|top-vino-estudio|vestido-rayas-estudio)\.webp$/.test(id)) {
    return Response.redirect(new URL(`/products/${id}`,request.url),302);
  }
  if (root==="media" && request.method==="GET" && path.length===3 && (action==="products" || action==="categories") && /^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(id)) {
    const object=await bucket().get(`${action}/${id}`);
    if (!object) return fail("Imagen no encontrada",404);
    return new Response(object.body,{headers:{"Content-Type":object.httpMetadata?.contentType||"image/jpeg","Cache-Control":"public,max-age=86400","X-Content-Type-Options":"nosniff"}});
  }
  if (root==="orders" && action==="track" && request.method==="POST") {
    const body=await request.json() as {code?:string,email?:string,phone?:string};
    if (typeof body.phone==="string") {
      const input=guestHistoryInput.parse(body);
      const order=await findOrderForPhone(input.code,input.phone);
      return order?json({code:order.code,status:order.status,paymentStatus:order.paymentStatus,createdAt:order.createdAt}):fail("Pedido no encontrado",404);
    }
    if (!/^[A-F0-9]{12}$/.test(body.code||"") || typeof body.email!=="string" || !body.email.trim()) return fail("Datos inválidos");
    const order=await db().prepare("SELECT code,status,payment_status as paymentStatus,created_at as createdAt FROM orders WHERE code=? AND lower(customer_email)=lower(?)").bind(body.code,body.email.trim()).first();
    return order?json(order):fail("Pedido no encontrado",404);
  }
  if (root==="orders" && path.length===1 && request.method==="POST") {
    const input=orderInput.parse(await request.json());
    const rows=[] as {id:string,name:string,price_cents:number,stock:number,sizes:string}[];
    for (const item of input.items) {
      const p=await db().prepare("SELECT id,name,price_cents,stock,sizes FROM products WHERE id=? AND status='active'").bind(item.productId).first<{id:string,name:string,price_cents:number,stock:number,sizes:string}>();
      if (!p || p.stock<item.quantity || (JSON.parse(p.sizes) as string[]).length>0 && !JSON.parse(p.sizes).includes(item.size)) return fail("Un producto ya no está disponible",409);
      rows.push(p);
    }
    const quantities=new Map<string,number>();
    input.items.forEach(i=>quantities.set(i.productId,(quantities.get(i.productId)||0)+i.quantity));
    if (rows.some(p=>(quantities.get(p.id)||0)>p.stock)) return fail("Stock insuficiente",409);
    const id=crypto.randomUUID(),code=crypto.randomUUID().replace(/-/g,"").slice(0,12).toUpperCase();
    const total=input.items.reduce((sum,item,index)=>sum+rows[index].price_cents*item.quantity,0);
    const statements=[db().prepare("INSERT INTO orders(id,code,customer_name,customer_email,customer_phone,delivery_details,payment_method,total_cents,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(id,code,input.customerName,input.customerEmail.toLowerCase(),normalizePhone(input.customerPhone),input.deliveryDetails,input.paymentMethod,total,now(),now()),...input.items.map((item,index)=>db().prepare("INSERT INTO order_items(id,order_id,product_id,name,size,unit_price_cents,quantity) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),id,item.productId,rows[index].name,item.size,rows[index].price_cents,item.quantity))];
    await db().batch(statements);
    const settings=await readSettings();
    return json({code,totalCents:total,status:"pending",transferInstructions:input.paymentMethod==="transferencia"?settings.transferInstructions:null,whatsappUrl:`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hola DG, realicé el pedido ${code}. Quiero coordinar la compra.`)}`},201);
  }
  if (root==="sourcing" && action==="track" && request.method==="POST") return json(await trackSourcingRequest(await request.json()));
  if (root==="sourcing" && path.length===1 && request.method==="POST") {
    if (!(await readSettings()).showSourcing) return fail("Servicio no disponible",404);
    return json(await createSourcingRequest(request),201);
  }
  if (root!=="admin") return fail("No encontrado",404);
  if (request.method==="GET") {
    if (!isAdmin(request)) return fail("Acceso restringido",403);
    if (action==="dashboard") return json({...await adminData(),sourcingRequests:await listSourcingRequests()});
    if (action==="sourcing" && id && path[3]==="image") return getSourcingImage(id);
    if (action==="orders" && id) {
      const order=await db().prepare("SELECT * FROM orders WHERE id=?").bind(id).first();
      if (!order) return fail("Pedido no encontrado",404);
      const items=await db().prepare("SELECT * FROM order_items WHERE order_id=?").bind(id).all();
      return json({order,items:items.results});
    }
  }
  const denied=requireWrite(request); if (denied) return denied;
  if (action==="sourcing" && id && request.method==="PUT") return json(await updateSourcingRequest(id,await request.json()));
  if (action==="sourcing" && id && request.method==="DELETE") return json(await deleteSourcingRequest(id));
  if (action==="settings" && request.method==="PUT") {
    const value=settingsInput.parse(await request.json());
    await db().prepare("INSERT INTO settings(key,value) VALUES('store',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(value)).run();
    return json(value);
  }
  if (action==="categories" && request.method==="POST") {
    const value=categoryInput.parse(await request.json());
    const category={id:crypto.randomUUID(),...value,slug:`${slugify(value.name)}-${crypto.randomUUID().slice(0,6)}`};
    await db().prepare("INSERT INTO categories(id,name,slug,position,active,image_key) VALUES(?,?,?,?,?,?)").bind(category.id,category.name,category.slug,category.position,category.active?1:0,category.imageKey).run();
    return json(category,201);
  }
  if (action==="categories" && id && request.method==="PUT") {
    const value=categoryInput.parse(await request.json());
    const result=await db().prepare("UPDATE categories SET name=?,position=?,active=?,image_key=? WHERE id=?").bind(value.name,value.position,value.active?1:0,value.imageKey,id).run();
    return result.meta.changes?json({ok:true}):fail("Categoría no encontrada",404);
  }
  if (action==="products" && request.method==="POST") {
    const value=productInput.parse(await request.json());
    const product={id:crypto.randomUUID(),...value,slug:`${slugify(value.name)}-${crypto.randomUUID().slice(0,6)}`};
    await db().prepare("INSERT INTO products(id,name,slug,description,category_id,price_cents,compare_at_cents,stock,sizes,image_key,featured,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(product.id,product.name,product.slug,product.description,product.categoryId,product.priceCents,product.compareAtCents,product.stock,JSON.stringify(product.sizes),product.imageKey,product.featured?1:0,product.status,now(),now()).run();
    return json(product,201);
  }
  if (action==="products" && id && request.method==="PUT") {
    const value=productInput.parse(await request.json());
    const result=await db().prepare("UPDATE products SET name=?,description=?,category_id=?,price_cents=?,compare_at_cents=?,stock=?,sizes=?,image_key=?,featured=?,status=?,updated_at=? WHERE id=?").bind(value.name,value.description,value.categoryId,value.priceCents,value.compareAtCents,value.stock,JSON.stringify(value.sizes),value.imageKey,value.featured?1:0,value.status,now(),id).run();
    return result.meta.changes?json({ok:true}):fail("Producto no encontrado",404);
  }
  if (action==="products" && id && request.method==="DELETE") {
    const result=await db().prepare("UPDATE products SET status='archived',updated_at=? WHERE id=?").bind(now(),id).run();
    return result.meta.changes?json({ok:true}):fail("Producto no encontrado",404);
  }
  if (action==="orders" && id && request.method==="PUT") {
    const body=await request.json() as {status?:string,paymentStatus?:string};
    const order=await db().prepare("SELECT status FROM orders WHERE id=?").bind(id).first<{status:string}>();
    if (!order) return fail("Pedido no encontrado",404);
    if (body.status && !transitions[order.status]?.includes(body.status)) return fail("Cambio de estado no permitido",409);
    if (body.paymentStatus && !["pending","verified"].includes(body.paymentStatus)) return fail("Pago inválido");
    if (!body.status && !body.paymentStatus) return fail("Sin cambios");
    await db().prepare("UPDATE orders SET status=?,payment_status=COALESCE(?,payment_status),updated_at=? WHERE id=? AND status=?").bind(body.status||order.status,body.paymentStatus||null,now(),id,order.status).run();
    return json({ok:true});
  }
  if (action==="media" && request.method==="POST") {
    const type=request.headers.get("content-type")||"";
    const buffer=await request.arrayBuffer();
    const ext=inspectImage(type,buffer);
    const folder=new URL(request.url).searchParams.get("kind")==="category"?"categories":"products";
    const key=`${folder}/${crypto.randomUUID()}.${ext}`;
    await bucket().put(key,buffer,{httpMetadata:{contentType:type}});
    return json({key,url:`/api/media/${key}`},201);
  }
  return fail("No encontrado",404);
}
async function route(request:Request,ctx:Ctx) { try { return await handle(request,ctx); } catch (error) {
  if (error instanceof SourcingError || error instanceof ImageUploadError || error instanceof OrderHistoryError) return fail(error.message,error.status);
  if (error instanceof ZodError) return fail(error.issues[0]?.message||"Datos inválidos");
  if (error instanceof SyntaxError) return fail("JSON inválido");
  if (error instanceof Error && error.message.includes("insufficient_stock")) return fail("Stock insuficiente para confirmar el pedido",409);
  console.error("Store request failed", error instanceof Error?error.message:"unknown");
  return fail("No se pudo completar la solicitud",500);
} }
export { route as GET,route as POST,route as PUT,route as DELETE };
