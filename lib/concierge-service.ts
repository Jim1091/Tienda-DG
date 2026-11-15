import { bucket, db, readSettings } from "./store-repository";
import { sourcingInput, sourcingTrackInput, sourcingTransitions, sourcingUpdateInput } from "./concierge-domain";
import { inspectImage } from "./image-upload";

export class SourcingError extends Error {
  constructor(message:string,public readonly status:number){super(message);}
}

const now=()=>new Date().toISOString();

export async function createSourcingRequest(request:Request){
  const length=Number(request.headers.get("content-length")||0);
  if(length>6*1024*1024) throw new SourcingError("La solicitud es demasiado grande",413);
  if(!request.headers.get("content-type")?.startsWith("multipart/form-data")) throw new SourcingError("Envía el formulario con una foto",415);
  const form=await request.formData();
  if(String(form.get("website")||"").trim()) throw new SourcingError("Solicitud no permitida",400);
  const rawBudget=String(form.get("budget")||"").trim();
  const input=sourcingInput.parse({
    customerName:String(form.get("customerName")||""),
    customerEmail:String(form.get("customerEmail")||""),
    customerPhone:String(form.get("customerPhone")||""),
    city:String(form.get("city")||""),
    size:String(form.get("size")||""),
    description:String(form.get("description")||""),
    budgetCents:rawBudget?Math.round(Number(rawBudget)*100):null,
  });
  const image=form.get("image");
  if(!(image instanceof File)) throw new SourcingError("Selecciona una foto de la prenda",400);
  if(image.size>5*1024*1024) throw new SourcingError("La foto debe pesar menos de 5 MB",413);
  const buffer=await image.arrayBuffer();
  const extension=inspectImage(image.type,buffer);
  const recent=await db().prepare("SELECT COUNT(*) as total FROM sourcing_requests WHERE (lower(customer_email)=? OR customer_phone=?) AND created_at>=?")
    .bind(input.customerEmail.toLowerCase(),input.customerPhone,new Date(Date.now()-30*60*1000).toISOString()).first<{total:number}>();
  if((recent?.total||0)>=3) throw new SourcingError("Espera unos minutos antes de enviar otra solicitud",429);
  const id=crypto.randomUUID();
  const code=crypto.randomUUID().replace(/-/g,"").slice(0,12).toUpperCase();
  const key=`sourcing/${crypto.randomUUID()}.${extension}`;
  await bucket().put(key,buffer,{httpMetadata:{contentType:image.type}});
  try{
    await db().prepare("INSERT INTO sourcing_requests(id,code,customer_name,customer_email,customer_phone,city,size,description,budget_cents,image_key,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id,code,input.customerName,input.customerEmail.toLowerCase(),input.customerPhone,input.city,input.size,input.description,input.budgetCents,key,now(),now()).run();
  }catch(error){await bucket().delete(key);throw error;}
  const settings=await readSettings();
  const text=`Hola DG, envié la solicitud ${code} para encontrar una prenda. Quiero coordinar la cotización.`;
  return {code,status:"new",whatsappUrl:`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(text)}`};
}

export async function trackSourcingRequest(raw:unknown){
  const input=sourcingTrackInput.parse(raw);
  const row=await db().prepare("SELECT code,status,item_price_cents as itemPriceCents,delivery_cents as deliveryCents,quote_notes as quoteNotes,created_at as createdAt FROM sourcing_requests WHERE code=? AND lower(customer_email)=?")
    .bind(input.code,input.email.toLowerCase()).first<{code:string,status:string,itemPriceCents:number|null,deliveryCents:number|null,quoteNotes:string,createdAt:string}>();
  if(!row) throw new SourcingError("Solicitud no encontrada",404);
  const hasQuote=["quoted","accepted","fulfilled"].includes(row.status)&&row.itemPriceCents!==null&&row.deliveryCents!==null;
  return {...row,itemPriceCents:hasQuote?row.itemPriceCents:null,deliveryCents:hasQuote?row.deliveryCents:null,quoteNotes:hasQuote?row.quoteNotes:"",totalCents:hasQuote?row.itemPriceCents!+row.deliveryCents!:null};
}

export async function listSourcingRequests(){
  const result=await db().prepare("SELECT id,code,customer_name,customer_email,customer_phone,city,size,description,budget_cents,status,item_price_cents,delivery_cents,quote_notes,created_at,updated_at FROM sourcing_requests ORDER BY created_at DESC LIMIT 200").all();
  return result.results;
}

export async function updateSourcingRequest(id:string,raw:unknown){
  const input=sourcingUpdateInput.parse(raw);
  const current=await db().prepare("SELECT status FROM sourcing_requests WHERE id=?").bind(id).first<{status:string}>();
  if(!current) throw new SourcingError("Solicitud no encontrada",404);
  if(input.status!==current.status&&!sourcingTransitions[current.status]?.includes(input.status)) throw new SourcingError("Cambio de estado no permitido",409);
  const result=await db().prepare("UPDATE sourcing_requests SET status=?,item_price_cents=?,delivery_cents=?,quote_notes=?,updated_at=? WHERE id=? AND status=?")
    .bind(input.status,input.itemPriceCents,input.deliveryCents,input.quoteNotes,now(),id,current.status).run();
  if(!result.meta.changes) throw new SourcingError("La solicitud cambió; actualiza el panel",409);
  return {ok:true};
}

export async function getSourcingImage(id:string){
  const row=await db().prepare("SELECT image_key FROM sourcing_requests WHERE id=?").bind(id).first<{image_key:string}>();
  if(!row) throw new SourcingError("Solicitud no encontrada",404);
  const image=await bucket().get(row.image_key);
  if(!image) throw new SourcingError("Foto no encontrada",404);
  return new Response(image.body,{headers:{"Content-Type":image.httpMetadata?.contentType||"image/jpeg","Cache-Control":"private,no-store","X-Content-Type-Options":"nosniff"}});
}

export async function deleteSourcingRequest(id:string){
  const row=await db().prepare("SELECT image_key FROM sourcing_requests WHERE id=?").bind(id).first<{image_key:string}>();
  if(!row) throw new SourcingError("Solicitud no encontrada",404);
  await db().prepare("DELETE FROM sourcing_requests WHERE id=?").bind(id).run();
  await bucket().delete(row.image_key);
  return {ok:true};
}
