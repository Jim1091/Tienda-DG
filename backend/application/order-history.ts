import { guestHistoryInput, normalizePhone } from "../domain/store-domain";
import { db } from "../infrastructure/store-repository";

type OrderRow = {id:string;code:string;status:string;paymentStatus:string;totalCents:number;createdAt:string};
type OrderItemRow = {orderId:string;name:string;size:string;quantity:number;unitPriceCents:number};
type VerifiedOrder = OrderRow & {customerPhone:string};

export class OrderHistoryError extends Error {
  constructor(message:string,public readonly status:number){super(message);}
}

const phoneColumn = "replace(replace(replace(replace(replace(replace(customer_phone,' ',''),'-',''),'+',''),'(',''),')',''),'.','')";

export async function findOrderForPhone(code:string,phone:string) {
  const row=await db().prepare("SELECT id,code,customer_phone as customerPhone,status,payment_status as paymentStatus,total_cents as totalCents,created_at as createdAt FROM orders WHERE code=?")
    .bind(code).first<VerifiedOrder>();
  if(!row || normalizePhone(row.customerPhone)!==normalizePhone(phone)) return null;
  const {customerPhone: _customerPhone,...order}=row;
  return order;
}

export async function getGuestOrderHistory(raw:unknown) {
  const {phone,code}=guestHistoryInput.parse(raw);
  const proof=await findOrderForPhone(code,phone);
  if(!proof) throw new OrderHistoryError("No encontramos un pedido con esos datos",404);

  const normalized=normalizePhone(phone);
  const local=normalized.length===12 && normalized.startsWith("5939") ? `0${normalized.slice(3)}` : normalized;
  const short=normalized.length===12 && normalized.startsWith("5939") ? normalized.slice(3) : normalized;
  const result=await db().prepare(`SELECT id,code,status,payment_status as paymentStatus,total_cents as totalCents,created_at as createdAt FROM orders WHERE ${phoneColumn} IN (?,?,?) ORDER BY created_at DESC LIMIT 50`)
    .bind(normalized,local,short).all<OrderRow>();
  const orders=result.results;
  if(!orders.length) return [];

  const placeholders=orders.map(()=>"?").join(",");
  const items=await db().prepare(`SELECT order_id as orderId,name,size,quantity,unit_price_cents as unitPriceCents FROM order_items WHERE order_id IN (${placeholders})`)
    .bind(...orders.map(order=>order.id)).all<OrderItemRow>();
  const byOrder=new Map<string,OrderItemRow[]>();
  for(const item of items.results){
    const group=byOrder.get(item.orderId)||[];
    group.push(item);
    byOrder.set(item.orderId,group);
  }
  return orders.map(({id,...order})=>({
    ...order,
    items:(byOrder.get(id)||[]).map(({orderId: _orderId,...item})=>item),
  }));
}
