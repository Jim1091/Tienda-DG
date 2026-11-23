"use client";
import { useState } from "react";

export type SourcingRequest={
  id:string;code:string;customer_name:string;customer_email:string;customer_phone:string;
  city:string;size:string;description:string;budget_cents:number|null;status:string;
  item_price_cents:number|null;delivery_cents:number|null;quote_notes:string;created_at:string;
};
const money=(cents:number)=>new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD"}).format(cents/100);
const labels:Record<string,string>={new:"Recibida",searching:"Buscando",quoted:"Cotizada",accepted:"Aceptada",fulfilled:"Completada",declined:"Sin opción"};
const transitions:Record<string,string[]>={new:["searching","quoted","declined"],searching:["quoted","declined"],quoted:["searching","accepted","declined"],accepted:["fulfilled","declined"],fulfilled:[],declined:[]};

export default function SourcingAdmin({requests,reload}:{requests:SourcingRequest[];reload:()=>Promise<void>}){
  const [selected,setSelected]=useState<string|null>(null);
  const [status,setStatus]=useState("new"),[itemPrice,setItemPrice]=useState(""),[delivery,setDelivery]=useState(""),[notes,setNotes]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
  const request=requests.find(item=>item.id===selected);
  function choose(item:SourcingRequest){setSelected(item.id);setStatus(item.status);setItemPrice(item.item_price_cents===null?"":String(item.item_price_cents/100));setDelivery(item.delivery_cents===null?"":String(item.delivery_cents/100));setNotes(item.quote_notes);setError("");setMessage("");}
  async function save(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!request)return;
    setBusy(true);setError("");setMessage("");
    try{
      const body={status,itemPriceCents:itemPrice===""?null:Math.round(Number(itemPrice)*100),deliveryCents:delivery===""?null:Math.round(Number(delivery)*100),quoteNotes:notes};
      const response=await fetch(`/api/admin/sourcing/${request.id}`,{method:"PUT",headers:{"Content-Type":"application/json","x-dg-admin":"1"},body:JSON.stringify(body)});
      const result=await response.json() as {error?:string};if(!response.ok)throw Error(result.error||"No se pudo guardar");
      await reload();setMessage("Solicitud actualizada. Avisa al cliente por WhatsApp cuando la cotización esté lista.");
    }catch(cause){setError(cause instanceof Error?cause.message:"Error inesperado")}finally{setBusy(false)}
  }
  async function remove(){
    if(!request||!confirm(`¿Eliminar la solicitud ${request.code} y su foto?`))return;
    setBusy(true);setError("");try{const response=await fetch(`/api/admin/sourcing/${request.id}`,{method:"DELETE",headers:{"x-dg-admin":"1"}});const result=await response.json() as {error?:string};if(!response.ok)throw Error(result.error||"No se pudo eliminar");setSelected(null);await reload()}catch(cause){setError(cause instanceof Error?cause.message:"Error inesperado")}finally{setBusy(false)}
  }
  return <div className="admin-grid sourcing-admin-grid"><div className="admin-card"><h3>Solicitudes de búsqueda ({requests.length})</h3>{requests.length===0?<p className="muted">Aún no hay solicitudes. El formulario público ya está disponible.</p>:requests.map(item=><button key={item.id} className={`sourcing-request-row ${selected===item.id?"active":""}`} onClick={()=>choose(item)}><span><b>{item.code}</b><small>{item.customer_name} · {item.city}</small></span><span><b>{labels[item.status]||item.status}</b><small>{new Date(item.created_at).toLocaleDateString("es-EC")}</small></span></button>)}</div>
  <div className="admin-card">{request?<><h3>Solicitud {request.code}</h3><img className="sourcing-admin-photo" src={`/api/admin/sourcing/${request.id}/image`} alt="Foto de referencia enviada por el cliente"/><p><b>{request.customer_name}</b> · {request.city} · talla {request.size||"sin indicar"}</p><p>{request.description}</p>{request.budget_cents!==null&&<p>Presupuesto orientativo: {money(request.budget_cents)}</p>}<p><a href={`mailto:${request.customer_email}`}>{request.customer_email}</a><br/><a href={`tel:${request.customer_phone}`}>{request.customer_phone}</a></p><form onSubmit={save}><label className="field">Estado<select value={status} onChange={event=>setStatus(event.target.value)}><option value={request.status}>{labels[request.status]}</option>{transitions[request.status]?.map(next=><option key={next} value={next}>{labels[next]}</option>)}</select></label><div className="sourcing-form-grid"><label className="field">Prenda y servicio (USD)<input type="number" min="0.01" step="0.01" value={itemPrice} onChange={event=>setItemPrice(event.target.value)} required={["quoted","accepted","fulfilled"].includes(status)}/></label><label className="field">Envío (USD)<input type="number" min="0" step="0.01" value={delivery} onChange={event=>setDelivery(event.target.value)} required={["quoted","accepted","fulfilled"].includes(status)}/></label></div><label className="field">Detalles de la opción y cotización<textarea value={notes} onChange={event=>setNotes(event.target.value)} maxLength={1000} placeholder="Modelo, disponibilidad, plazo estimado y condiciones"/></label>{itemPrice!==""&&delivery!==""&&<p><b>Total cotizado: {money(Math.round(Number(itemPrice)*100)+Math.round(Number(delivery)*100))}</b></p>}<button className="btn" disabled={busy}>{busy?"Guardando...":"Guardar solicitud"}</button></form><div className="sourcing-admin-actions"><a className="btn outline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${request.customer_phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${request.customer_name}, te escribimos de DG por tu solicitud ${request.code}.`)}`}>Contactar por WhatsApp</a><button className="textlink" disabled={busy} onClick={remove}>Eliminar solicitud y foto</button></div>{message&&<p role="status" className="admin-message">{message}</p>}{error&&<p role="alert" className="form-error">{error}</p>}</>:<p className="muted">Selecciona una solicitud para revisar la foto y preparar una cotización.</p>}</div></div>;
}
