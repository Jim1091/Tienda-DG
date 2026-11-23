"use client";
import { useState } from "react";
import { ArrowLeft, PackageSearch, Phone, ReceiptText } from "lucide-react";

type OrderItem={name:string;size:string;quantity:number;unitPriceCents:number};
type Order={code:string;status:string;paymentStatus:string;totalCents:number;createdAt:string;items:OrderItem[]};
const labels:Record<string,string>={pending:"Pendiente",confirmed:"Confirmado",packed:"En preparación",shipped:"Enviado",delivered:"Entregado",cancelled:"Cancelado"};
const money=(cents:number)=>new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD"}).format(cents/100);

export default function CustomerAccount(){
  const [orders,setOrders]=useState<Order[]|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function lookup(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);
    setError("");
    const form=new FormData(event.currentTarget);
    try{
      const response=await fetch("/api/my-orders",{
        method:"POST",cache:"no-store",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({phone:String(form.get("phone")),code:String(form.get("code"))}),
      });
      const data=await response.json() as {orders?:Order[];error?:string};
      if(!response.ok) throw Error(data.error||"No pudimos consultar tus pedidos.");
      setOrders(data.orders||[]);
    }catch(cause){setError(cause instanceof Error?cause.message:"No pudimos consultar tus pedidos.");}
    finally{setBusy(false);}
  }

  return <main className="account-page"><div className="wrap account-wrap">
    <a className="account-back" href="/"><ArrowLeft size={17}/> Volver a la tienda</a>
    <span className="eyebrow">Daniela y Garu · Tu compra</span>
    <h1 className="serif">Mis pedidos</h1>
    <p className="muted">Consulta tus compras anteriores sin crear una cuenta. Usa tu número de WhatsApp y el código de cualquiera de tus pedidos.</p>
    {orders===null?<section className="account-access" aria-labelledby="account-access-title">
      <div className="account-access-heading"><ReceiptText size={24} aria-hidden="true"/><div><span className="eyebrow">Consulta privada</span><h2 id="account-access-title" className="serif">Vuelve a tus compras</h2></div></div>
      <form onSubmit={lookup} className="account-form">
        <label className="field">Teléfono de WhatsApp usado al comprar<input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={25} required placeholder="Ej. +593 99 123 4567"/></label>
        <label className="field">Código de uno de tus pedidos<input name="code" autoCapitalize="characters" maxLength={12} pattern="[A-Fa-f0-9]{12}" required placeholder="Ej. A1B2C3D4E5F6"/></label>
        <button className="btn" disabled={busy}><PackageSearch size={17}/>{busy?"Consultando…":"Ver mis pedidos"}</button>
      </form>
      {error&&<p role="alert" className="form-error">{error}</p>}
      <p className="account-hint"><Phone size={15} aria-hidden="true"/> No enviamos códigos por correo ni SMS. El código aparece al finalizar tu compra.</p>
    </section>:<>
      <div className="account-results"><span className="eyebrow">Tu historial</span><button className="textlink" onClick={()=>{setOrders(null);setError("")}}>Consultar otro número</button></div>
      {orders.length===0?<div className="account-empty"><PackageSearch size={28}/><h2 className="serif">Todavía no hay pedidos.</h2><a className="btn" href="/#coleccion">Ver colección</a></div>
        :<div className="account-orders">{orders.map(order=><article className="account-order" key={order.code}>
          <div className="account-order-top"><div><span className="eyebrow">Pedido {order.code}</span><h2 className="serif">{labels[order.status]||order.status}</h2><p>{new Date(order.createdAt).toLocaleDateString("es-EC")} · Pago {order.paymentStatus==="verified"?"verificado":"pendiente"}</p></div><strong>{money(order.totalCents)}</strong></div>
          <ul>{order.items.map((item,index)=><li key={`${order.code}-${index}`}><span>{item.name}{item.size?` · Talla ${item.size}`:""} × {item.quantity}</span><span>{money(item.unitPriceCents*item.quantity)}</span></li>)}</ul>
        </article>)}</div>}
    </>}
  </div></main>;
}
