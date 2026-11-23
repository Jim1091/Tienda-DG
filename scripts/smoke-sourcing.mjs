import assert from "node:assert/strict";

const base=process.env.DG_SMOKE_URL||"http://127.0.0.1:8787";
const admin={"oai-authenticated-user-email":"seedy@sites.test","x-dg-admin":"1",Origin:base};
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==","base64");
const email=`concierge-${crypto.randomUUID().slice(0,8)}@example.com`;
const payload={customerName:"Cliente Prueba",customerEmail:email,customerPhone:"0967794192",city:"Quito",size:"M",description:"Blusa blanca elegante de manga larga",budget:"35"};
function form(image=png,type="image/png") {const data=new FormData();for(const [key,value] of Object.entries(payload))data.set(key,value);data.set("image",new File([image],"referencia.png",{type}));return data;}
async function json(path,method="GET",body,headers={}){const response=await fetch(base+path,{method,headers:body===undefined?headers:{"Content-Type":"application/json",...headers},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,data:await response.json()};}

const dashboard=await json("/api/admin/dashboard","GET",undefined,admin);
assert.equal(dashboard.status,200);
const originalSettings=dashboard.data.settings;
try {
assert.equal((await json("/api/admin/dashboard")).status,403);
assert.equal((await json("/api/admin/settings","PUT",{...originalSettings,showSourcing:false},admin)).status,200);
assert.equal((await fetch(base+"/api/sourcing",{method:"POST",body:form()})).status,404);
assert.equal((await json("/api/settings")).data.showSourcing,false);
assert.equal((await json("/api/admin/settings","PUT",{...originalSettings,showSourcing:true},admin)).status,200);
const invalid=await fetch(base+"/api/sourcing",{method:"POST",body:form(Buffer.from("This is not a PNG image at all."))});
assert.equal(invalid.status,415);
const createResponse=await fetch(base+"/api/sourcing",{method:"POST",body:form()});
const created=await createResponse.json();assert.equal(createResponse.status,201,JSON.stringify(created));assert.match(created.code,/^[A-F0-9]{12}$/);
assert.match(created.whatsappUrl,/wa\.me\/593967794192/);
const wrong=await json("/api/sourcing/track","POST",{code:created.code,email:"wrong@example.com"});assert.equal(wrong.status,404);
const initial=await json("/api/sourcing/track","POST",{code:created.code,email});assert.equal(initial.data.status,"new");assert.equal(initial.data.totalCents,null);
const list=await json("/api/admin/dashboard","GET",undefined,admin);assert.equal(list.status,200);
const row=list.data.sourcingRequests.find(item=>item.code===created.code);assert.ok(row);assert.ok(!("image_key" in row));
assert.equal((await fetch(`${base}/api/admin/sourcing/${row.id}/image`)).status,403);
const photo=await fetch(`${base}/api/admin/sourcing/${row.id}/image`,{headers:admin});assert.equal(photo.status,200);assert.equal(photo.headers.get("content-type"),"image/png");
const invalidQuote=await json(`/api/admin/sourcing/${row.id}`,"PUT",{status:"quoted",itemPriceCents:3500,deliveryCents:null,quoteNotes:"Opción disponible"},admin);assert.equal(invalidQuote.status,400);
const quoted=await json(`/api/admin/sourcing/${row.id}`,"PUT",{status:"quoted",itemPriceCents:3500,deliveryCents:500,quoteNotes:"Blusa disponible, entrega por confirmar"},admin);assert.equal(quoted.status,200,JSON.stringify(quoted));
const quote=await json("/api/sourcing/track","POST",{code:created.code,email});assert.equal(quote.data.totalCents,4000);assert.equal(quote.data.deliveryCents,500);
const impossible=await json(`/api/admin/sourcing/${row.id}`,"PUT",{status:"fulfilled",itemPriceCents:3500,deliveryCents:500,quoteNotes:""},admin);assert.equal(impossible.status,409);
const deleted=await json(`/api/admin/sourcing/${row.id}`,"DELETE",undefined,admin);assert.equal(deleted.status,200);
assert.equal((await json("/api/sourcing/track","POST",{code:created.code,email})).status,404);
console.log("Sourcing smoke passed: upload, private image, quote, tracking, transitions and deletion.");
} finally {
  await json("/api/admin/settings","PUT",originalSettings,admin);
}
