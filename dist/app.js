// Demo data. Replace with a backend and real inventory before using this as a store.
const PRODUCTS = [
  {id:1,name:'Vestido Escarlata',category:'Vestidos',price:42,oldPrice:52,image:'images/editorial-2.jpg',badge:'OFERTA',sizes:['S','M','L'],description:'Un vestido llamativo para ocasiones especiales.'},
  {id:2,name:'Conjunto Sol',category:'Conjuntos',price:36,image:'images/look-1.jpg',badge:'NUEVO',sizes:['S','M','L'],description:'Color y comodidad para un día con personalidad.'},
  {id:3,name:'Top Esencia',category:'Blusas',price:22,image:'images/editorial-1.jpg',sizes:['S','M','L'],description:'Una pieza versátil para crear looks diferentes.'},
  {id:4,name:'Abrigo Ciudad',category:'Abrigos',price:64,image:'images/look-3.jpg',sizes:['S','M','L'],description:'Una capa de estilo para los días frescos.'},
  {id:5,name:'Vestido Brisa',category:'Vestidos',price:45,image:'images/look-2.jpg',badge:'DESTACADO',sizes:['S','M','L'],description:'Ligero y femenino para momentos especiales.'},
  {id:6,name:'Enterizo Blanco',category:'Conjuntos',price:49,oldPrice:59,image:'images/editorial-3.jpg',badge:'OFERTA',sizes:['S','M','L'],description:'Una sola prenda para un look completo.'},
  {id:7,name:'Abrigo Azul',category:'Abrigos',price:59,image:'images/hero.jpg',sizes:['S','M','L'],description:'Un toque elegante para un estilo urbano.'},
  {id:8,name:'Bolso Statement',category:'Accesorios',price:29,image:'images/look-3.jpg',sizes:['Única'],description:'Un accesorio que completa el look.'}
];
const DEMO_ORDER={number:'DG-DEMO-001',email:'demo@dg.com',name:'Cliente demo',method:'transferencia',total:42,createdAt:'2026-11-15T12:00:00Z',items:[{id:1,size:'M',qty:1}]};
const CART_KEY='dg-moda-cart-v1';
const ORDERS_KEY='dg-moda-orders-v1';
// Add a DG number in international format, digits only, to open a direct chat.
const WHATSAPP_NUMBER='';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const money=value=>new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(value);
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const readStore=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key));return Array.isArray(value)?value:fallback}catch{return fallback}};
let cart=readStore(CART_KEY,[]).filter(item=>PRODUCTS.some(product=>product.id===item.id)&&Number.isInteger(item.qty)&&item.qty>0&&item.qty<=99);
let activeFilter='Todos';
let searchTerm='';
let activeProduct=null;
let selectedSize=null;
let toastTimer;

function toast(message){const node=$('#toast');node.textContent=message;node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),3200)}
function saveCart(){try{localStorage.setItem(CART_KEY,JSON.stringify(cart))}catch{toast('No se pudo guardar el carrito en este navegador.')}}
function visibleProducts(){let products=PRODUCTS.filter(product=>activeFilter==='Todos'||(activeFilter==='Ofertas'?!!product.oldPrice:product.category===activeFilter));if(searchTerm)products=products.filter(product=>`${product.name} ${product.category}`.toLocaleLowerCase('es').includes(searchTerm));const sort=$('#sort-select').value;if(sort==='price-low')products.sort((a,b)=>a.price-b.price);if(sort==='price-high')products.sort((a,b)=>b.price-a.price);if(sort==='name')products.sort((a,b)=>a.name.localeCompare(b.name,'es'));return products}
function renderProducts(){const products=visibleProducts();$('#empty-products').hidden=products.length>0;$('#product-grid').innerHTML=products.map(product=>`<article class="product-card"><div class="product-image"><img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy">${product.badge?`<span class="product-badge ${product.oldPrice?'sale':''}">${product.badge}</span>`:''}<button class="quick-add" data-product="${product.id}" aria-label="Ver ${escapeHtml(product.name)}">+</button></div><div class="product-info"><span class="product-category">${product.category}</span><h3>${escapeHtml(product.name)}</h3><div class="product-price">${product.oldPrice?`<span class="old-price">${money(product.oldPrice)}</span>`:''}${money(product.price)}</div></div></article>`).join('');$$('[data-product]').forEach(button=>button.addEventListener('click',()=>openProduct(Number(button.dataset.product))))}
function setFilter(filter){activeFilter=filter;$$('.filter').forEach(button=>button.classList.toggle('active',button.dataset.filter===filter));renderProducts();$('#coleccion').scrollIntoView({behavior:'smooth'})}
function openProduct(id){activeProduct=PRODUCTS.find(product=>product.id===id);if(!activeProduct)return;selectedSize=null;$('#product-modal-body').innerHTML=`<div class="product-modal-body"><img class="modal-image" src="${activeProduct.image}" alt="${escapeHtml(activeProduct.name)}"><div class="modal-info"><span class="eyebrow">${activeProduct.category} / DG</span><h2>${escapeHtml(activeProduct.name)}</h2><div class="modal-price">${activeProduct.oldPrice?`<span class="old-price">${money(activeProduct.oldPrice)}</span>`:''}${money(activeProduct.price)}</div><p>${escapeHtml(activeProduct.description)}</p><label>Elige tu talla</label><div class="size-options">${activeProduct.sizes.map(size=>`<button data-size="${size}" aria-label="Talla ${size}">${size}</button>`).join('')}</div><button class="button button-dark full" id="add-to-cart">Agregar al carrito <span>→</span></button><p class="demo-note">Producto y precio ilustrativos.</p></div></div>`;$$('[data-size]').forEach(button=>button.addEventListener('click',()=>{selectedSize=button.dataset.size;$$('[data-size]').forEach(option=>option.classList.toggle('selected',option===button))}));$('#add-to-cart').addEventListener('click',addToCart);openModal('#product-modal')}
function addToCart(){if(!selectedSize){toast('Selecciona una talla para continuar.');return}const existing=cart.find(item=>item.id===activeProduct.id&&item.size===selectedSize);if(existing){existing.qty=Math.min(99,existing.qty+1)}else cart.push({id:activeProduct.id,size:selectedSize,qty:1});saveCart();renderCart();closeAll();openCart();toast('Prenda agregada al carrito.')}
function cartTotal(){return cart.reduce((total,item)=>{const product=PRODUCTS.find(p=>p.id===item.id);return total+(product?product.price*item.qty:0)},0)}
function renderCart(){const count=cart.reduce((total,item)=>total+item.qty,0);$('#cart-count').textContent=count;$('#drawer-count').textContent=`(${count})`;$('#cart-total').textContent=money(cartTotal());$('#checkout-total').textContent=money(cartTotal());$('#checkout-open').disabled=count===0;$('#cart-whatsapp').disabled=count===0;$('#cart-items').innerHTML=count?cart.map((item,index)=>{const product=PRODUCTS.find(p=>p.id===item.id);return `<div class="cart-item"><img src="${product.image}" alt="${escapeHtml(product.name)}"><div><h3>${escapeHtml(product.name)}</h3><p>Talla ${escapeHtml(item.size)}</p><strong>${money(product.price*item.qty)}</strong><div class="cart-item-actions"><button data-quantity="${index},-1" aria-label="Reducir cantidad">−</button><span>${item.qty}</span><button data-quantity="${index},1" aria-label="Aumentar cantidad">+</button><button class="remove" data-remove="${index}">Eliminar</button></div></div></div>`}).join(''):'<div class="cart-empty"><span>♧</span><h3>Tu carrito está vacío</h3><p>Explora la colección y encuentra tu próximo look.</p></div>';$$('[data-quantity]').forEach(button=>button.addEventListener('click',()=>{const [index,change]=button.dataset.quantity.split(',').map(Number);cart[index].qty+=change;if(cart[index].qty<=0)cart.splice(index,1);if(cart[index]?.qty>99)cart[index].qty=99;saveCart();renderCart()}));$$('[data-remove]').forEach(button=>button.addEventListener('click',()=>{cart.splice(Number(button.dataset.remove),1);saveCart();renderCart()}))}
function closeAll(){$('#cart-drawer').hidden=true;$('#overlay').hidden=true;$$('.modal-wrap').forEach(modal=>modal.hidden=true);document.body.style.overflow=''}
function openModal(selector){closeAll();$(selector).hidden=false;document.body.style.overflow='hidden'}
function openCart(){closeAll();$('#overlay').hidden=false;$('#cart-drawer').hidden=false;document.body.style.overflow='hidden'}
function whatsappUrl(message){const text=encodeURIComponent(message);return WHATSAPP_NUMBER?`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`:`https://api.whatsapp.com/send?text=${text}`}
function openWhatsApp(message){window.open(whatsappUrl(message),'_blank','noopener,noreferrer');if(!WHATSAPP_NUMBER)toast('Demo: elige el contacto de DG en WhatsApp. Falta configurar su número.')}
function cartMessage(){return `Hola, me interesan estas prendas de DG:\n${cart.map(item=>{const product=PRODUCTS.find(p=>p.id===item.id);return `• ${product.name} / talla ${item.size} / ${item.qty} × ${money(product.price)}`}).join('\n')}\nTotal ilustrativo: ${money(cartTotal())}.`}
function createOrder(event){event.preventDefault();if(!cart.length){toast('Tu carrito está vacío.');return}const form=$('#checkout-form');if(!form.reportValidity())return;const name=$('#customer-name').value.trim(),email=$('#customer-email').value.trim().toLowerCase(),method=$('#payment-method').value;if(name.length<2||!email||!['transferencia','contraentrega'].includes(method)){toast('Revisa los datos del pedido.');return}const number=`DG-2026-${Math.floor(100000+Math.random()*900000)}`;const order={number,email,name,method,total:cartTotal(),createdAt:new Date().toISOString(),items:cart.map(item=>({...item}))};try{const orders=readStore(ORDERS_KEY,[]);orders.push(order);localStorage.setItem(ORDERS_KEY,JSON.stringify(orders))}catch{toast('No se pudo guardar el pedido. Revisa el almacenamiento del navegador.');return}cart=[];saveCart();renderCart();form.reset();$('#success-number').textContent=number;$('#success-copy').textContent=`Guarda este número y utiliza ${email} para consultar el estado en este navegador. No se ha realizado ningún pago.`;$('#track-number').value=number;$('#track-email').value=email;openModal('#success-modal')}
function trackOrder(event){event.preventDefault();const number=$('#track-number').value.trim().toUpperCase(),email=$('#track-email').value.trim().toLowerCase();const order=[DEMO_ORDER,...readStore(ORDERS_KEY,[])].find(item=>item.number.toUpperCase()===number&&item.email.toLowerCase()===email);const result=$('#track-result');if(!order){result.innerHTML='<span class="error">No encontramos un pedido de demostración con esos datos en este navegador.</span>';return}const date=new Date(order.createdAt).toLocaleDateString('es-EC',{day:'numeric',month:'long',year:'numeric'});result.innerHTML=`<span class="eyebrow">ESTADO DEL PEDIDO</span><strong>Pedido recibido · Demo</strong><p>N.º ${escapeHtml(order.number)} · ${escapeHtml(date)}</p><p>El pedido está registrado únicamente para esta demostración. No representa un envío ni un pago real.</p>`}
$$('.filter').forEach(button=>button.addEventListener('click',()=>setFilter(button.dataset.filter)));
$$('.category-card').forEach(button=>button.addEventListener('click',()=>setFilter(button.dataset.category)));
$('#offers-link').addEventListener('click',()=>setFilter('Ofertas'));
$('#sort-select').addEventListener('change',renderProducts);
$('#search-toggle').addEventListener('click',()=>{$('#search-bar').hidden=!$('#search-bar').hidden;if(!$('#search-bar').hidden)$('#header-search').focus()});
function runSearch(){searchTerm=$('#header-search').value.trim().toLocaleLowerCase('es');renderProducts();$('#coleccion').scrollIntoView({behavior:'smooth'})}
$('#search-go').addEventListener('click',runSearch);
$('#header-search').addEventListener('keydown',event=>{if(event.key==='Enter')runSearch()});
$('#header-search').addEventListener('search',runSearch);
$('#menu-toggle').addEventListener('click',()=>{const open=$('#main-nav').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open))});
$$('.main-nav a').forEach(link=>link.addEventListener('click',()=>{$('#main-nav').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false')}));
$('#cart-open').addEventListener('click',openCart);
$('#cart-close').addEventListener('click',closeAll);
$('#overlay').addEventListener('click',closeAll);
$$('[data-close]').forEach(button=>button.addEventListener('click',closeAll));
$$('.modal-wrap').forEach(modal=>modal.addEventListener('click',event=>{if(event.target===modal)closeAll()}));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeAll()});
$('#checkout-open').addEventListener('click',()=>{if(cart.length)openModal('#checkout-modal')});
$('#checkout-form').addEventListener('submit',createOrder);
$('#track-form').addEventListener('submit',trackOrder);
$('#success-track').addEventListener('click',()=>{closeAll();$('#seguimiento').scrollIntoView({behavior:'smooth'});$('#track-form').requestSubmit()});
$('#cart-whatsapp').addEventListener('click',()=>{if(cart.length)openWhatsApp(cartMessage())});
['#whatsapp-float','#footer-whatsapp','#contact-whatsapp'].forEach(selector=>$(selector).addEventListener('click',()=>openWhatsApp('Hola DG, quisiera información sobre sus prendas.')));
renderProducts();renderCart();
