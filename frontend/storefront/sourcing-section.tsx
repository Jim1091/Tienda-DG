"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Camera, CheckCircle2, Search, Truck, X } from "lucide-react";

type Created={code:string,whatsappUrl:string};
type Tracked={code:string,status:string,itemPriceCents:number|null,deliveryCents:number|null,totalCents:number|null,quoteNotes:string};
const money=(cents:number)=>new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD"}).format(cents/100);
const labels:Record<string,string>={new:"Recibida",searching:"Buscando opciones",quoted:"Cotizada",accepted:"Aceptada",fulfilled:"Completada",declined:"Sin opción disponible"};

export default function SourcingSection({whatsapp}:{whatsapp:string}){
  const [mode,setMode]=useState<"request"|"track"|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[photo,setPhoto]=useState<File|null>(null),[preview,setPreview]=useState(""),[created,setCreated]=useState<Created|null>(null),[tracked,setTracked]=useState<Tracked|null>(null);
  useEffect(()=>{if(!photo){setPreview("");return}const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url)},[photo]);
  const open=(next:"request"|"track")=>{setMode(next);setError("");setTracked(null)};
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setError("");
    if(!photo){setError("Selecciona una foto de la prenda.");return}
    if(photo.size>5*1024*1024||!["image/jpeg","image/png","image/webp"].includes(photo.type)){setError("Usa una foto JPG, PNG o WebP de hasta 5 MB.");return}
    const form=new FormData(e.currentTarget);form.set("image",photo);
    setBusy(true);
    try{const response=await fetch("/api/sourcing",{method:"POST",body:form});const data=await response.json() as Created&{error?:string};if(!response.ok)throw Error(data.error||"No se pudo enviar la solicitud");setCreated(data);setPhoto(null)}catch(cause){setError(cause instanceof Error?cause.message:"Error inesperado")}finally{setBusy(false)}
  }
  async function track(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError("");const form=new FormData(e.currentTarget);
    try{const response=await fetch("/api/sourcing/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:String(form.get("code")||"").trim().toUpperCase(),email:String(form.get("email")||"").trim()})});const data=await response.json() as Tracked&{error?:string};if(!response.ok)throw Error(data.error||"Solicitud no encontrada");setTracked(data)}catch(cause){setError(cause instanceof Error?cause.message:"No se pudo consultar")}finally{setBusy(false)}
  }
  const quoteLink=tracked?`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola DG, quiero conversar sobre la cotización de mi solicitud ${tracked.code}.`)}`:"";
  return <>
    <section className="sourcing-section" id="buscamos-por-ti"><div className="sourcing-visual" role="img" aria-label="Mesa de inspiración para buscar una prenda"/><div className="sourcing-copy"><div><span className="eyebrow">Servicio personal DG</span><h2 className="serif">¿Viste una prenda y no sabes dónde encontrarla?</h2><p>Envíanos una foto. Buscaremos opciones para ti y te diremos el precio de la prenda y el envío antes de confirmar nada. Si te gusta la propuesta, coordinamos la entrega a tu domicilio.</p><div className="sourcing-steps"><span><Camera size={17}/> Envía tu foto</span><span><Search size={17}/> Buscamos opciones</span><span><Truck size={17}/> Tú decides</span></div><div className="sourcing-buttons"><button className="btn" onClick={()=>open("request")}>Buscar mi prenda <ArrowRight size={15}/></button><button className="textlink" onClick={()=>open("track")}>Consultar solicitud →</button></div><small>La disponibilidad y el costo final se confirman mediante cotización. No se realiza ningún cobro aquí.</small></div></div></section>
    {mode&&<div className="sourcing-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setMode(null)}}><section className="sourcing-modal" role="dialog" aria-modal="true" aria-label={mode==="request"?"Solicitar búsqueda de prenda":"Consultar búsqueda de prenda"}><div className="sourcing-modal-head"><div><span className="eyebrow">DG · Servicio personal</span><h2 className="serif">{mode==="request"?"Buscamos tu prenda":"Consulta tu solicitud"}</h2></div><button className="iconbtn" aria-label="Cerrar" onClick={()=>setMode(null)}><X/></button></div>
      {mode==="request"&&(created?<div className="sourcing-confirmed"><CheckCircle2 size={36}/><h3 className="serif">Recibimos tu referencia.</h3><p>Tu código es <b>{created.code}</b>. Guárdalo para consultar el estado con tu correo electrónico.</p><p>Revisaremos opciones y te comunicaremos el costo completo antes de confirmar una compra.</p><a className="btn" target="_blank" rel="noopener noreferrer" href={created.whatsappUrl}>Continuar por WhatsApp</a><button className="textlink" onClick={()=>{setCreated(null);open("track")}}>Consultar estado →</button></div>:<form onSubmit={submit}>
        <p className="muted">Sube una foto o captura de la prenda. Cuéntanos qué talla buscas y en qué ciudad recibirías el pedido.</p>
        <label className="field">Foto de referencia *<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label>{preview&&<img className="sourcing-preview" src={preview} alt="Foto elegida para buscar la prenda"/>}
        <div className="sourcing-form-grid"><label className="field">Tu nombre *<input name="customerName" minLength={2} maxLength={100} required/></label><label className="field">Correo electrónico *<input name="customerEmail" type="email" maxLength={254} required/></label></div>
        <div className="sourcing-form-grid"><label className="field">WhatsApp *<input name="customerPhone" type="tel" minLength={7} maxLength={25} required placeholder="Ej. 0967794192"/></label><label className="field">Ciudad de entrega *<input name="city" minLength={2} maxLength={80} required placeholder="Ej. Quito"/></label></div>
        <div className="sourcing-form-grid"><label className="field">Talla deseada<input name="size" maxLength={30} placeholder="Ej. M"/></label><label className="field">Presupuesto aproximado (USD)<input name="budget" type="number" min="1" step="0.01" placeholder="Opcional"/></label></div>
        <label className="field">Detalles que nos ayuden a encontrarla *<textarea name="description" minLength={10} maxLength={1000} required placeholder="Color, estilo, marca si la conoces, ocasión..."/></label>
        <label className="sourcing-honeypot" aria-hidden="true">Sitio web<input name="website" tabIndex={-1} autoComplete="off"/></label>
        <p className="tiny muted">Usaremos tu foto y contacto para responder esta solicitud. No incluyas documentos ni datos personales en la imagen. Aún no necesitamos tu dirección exacta.</p>
        <button className="btn" disabled={busy}>{busy?"Enviando...":"Enviar referencia"}</button>
      </form>)}
      {mode==="track"&&<><form onSubmit={track}><p className="muted">Usa el código de solicitud y el correo que registraste.</p><label className="field">Código de solicitud<input name="code" maxLength={12} required placeholder="Ej. A1B2C3D4E5F6"/></label><label className="field">Correo electrónico<input name="email" type="email" required/></label><button className="btn" disabled={busy}>Consultar</button></form>{tracked&&<div className="sourcing-quote"><span className="eyebrow">Solicitud {tracked.code}</span><h3 className="serif">{labels[tracked.status]||tracked.status}</h3>{tracked.totalCents!==null?<><div><span>Prenda y servicio</span><b>{money(tracked.itemPriceCents!)}</b></div><div><span>Envío</span><b>{money(tracked.deliveryCents!)}</b></div><div className="sourcing-quote-total"><span>Total cotizado</span><b>{money(tracked.totalCents)}</b></div>{tracked.quoteNotes&&<p>{tracked.quoteNotes}</p>}<p className="tiny muted">La compra y entrega se coordinan solo después de que aceptes este costo por WhatsApp.</p><a className="btn" href={quoteLink} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a></>:<p>Te avisaremos cuando tengamos una opción y su costo completo.</p>}</div>}</>}
      {error&&<p className="form-error" role="alert">{error}</p>}
    </section></div>}
  </>;
}
