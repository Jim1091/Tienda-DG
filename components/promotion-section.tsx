import { ArrowRight } from "lucide-react";

export type PromotionProduct = {
  id: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  sizes: string[];
  imageUrl: string | null;
};

const examples = [
  { name: "Blazer de inspiración", quadrant: "q0" },
  { name: "Vestido de inspiración", quadrant: "q1" },
  { name: "Blusa de inspiración", quadrant: "q2" },
];
const money = (cents: number) => new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(cents / 100);
export const discountPercent = (product: PromotionProduct) =>
  product.compareAtCents && product.compareAtCents > product.priceCents
    ? Math.max(1, Math.round((1 - product.priceCents / product.compareAtCents) * 100))
    : 0;

export default function PromotionSection({
  products,
  isPreview,
  selectedSizes,
  onSizeChange,
  onAdd,
}: {
  products: PromotionProduct[];
  isPreview: boolean;
  selectedSizes: Record<string, string>;
  onSizeChange: (id: string, size: string) => void;
  onAdd: (product: PromotionProduct) => void;
}) {
  if (!isPreview && products.length === 0) return null;

  return <section className="promotions-section" id="promociones" aria-labelledby="promotions-title">
    <div className="wrap promotions-layout">
      <div className="promotions-copy">
        <span className="eyebrow">{isPreview ? "Vista de ejemplo" : "Selección especial"}</span>
        <h2 id="promotions-title" className="serif">{isPreview ? "Un espacio para tus ofertas." : "Estilo a un precio especial."}</h2>
        <p>{isPreview
          ? "Aquí aparecerán tus promociones cuando publiques prendas con un precio anterior y uno actual. Las imágenes son ilustrativas."
          : "Descubre prendas seleccionadas con precios especiales, sin perder el estilo que te define."}</p>
        <a className="textlink" href="#coleccion">Explorar la colección <ArrowRight size={15} style={{ display: "inline" }}/></a>
      </div>
      <div className="promotions-products">
        {isPreview ? examples.map(example => <article className="promotion-card" key={example.name}>
          <div className="promotion-image"><span className={`quad-background product-quad ${example.quadrant}`}/><span className="promotion-badge">Ejemplo visual</span></div>
          <div className="promotion-info"><span className="eyebrow">Inspiración DG</span><h3>{example.name}</h3><p>Próximamente · No disponible para compra</p></div>
        </article>) : products.slice(0, 3).map(product => <article className="promotion-card" key={product.id}>
          <div className="promotion-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name}/> : <span className="promotion-no-image">Foto pendiente</span>}<span className="promotion-badge">-{discountPercent(product)}%</span></div>
          <div className="promotion-info"><span className="eyebrow">Oferta DG</span><h3>{product.name}</h3><p className="promotion-price"><strong>{money(product.priceCents)}</strong> <del>{money(product.compareAtCents!)}</del></p>
            <div className="promotion-actions">{product.sizes.length>0&&<select aria-label={`Talla de ${product.name}`} value={selectedSizes[product.id]||product.sizes[0]} onChange={e=>onSizeChange(product.id,e.target.value)}>{product.sizes.map(size=><option key={size}>{size}</option>)}</select>}<button className="btn" onClick={()=>onAdd(product)}>Añadir</button></div>
          </div>
        </article>)}
      </div>
    </div>
  </section>;
}
