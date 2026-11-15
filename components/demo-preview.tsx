import { ArrowRight } from "lucide-react";

export type VisualCategory = {id:string,name:string,imageKey?:string|null};
const examples=[
  {name:"Blazers",piece:"Blazer de inspiración"},
  {name:"Vestidos",piece:"Vestido de inspiración"},
  {name:"Blusas",piece:"Blusa de inspiración"},
  {name:"Conjuntos",piece:"Conjunto de inspiración"},
];

export function CategoryTiles({categories,onChoose}:{categories:VisualCategory[],onChoose:(id:string)=>void}){
  const isPreview=categories.length===0;
  const rows=isPreview?examples.map((e,index)=>({id:`preview-${index}`,name:e.name,imageKey:null})):categories;
  return <>
    {isPreview&&<p className="preview-note"><strong>Vista de ejemplo</strong> · Las categorías y fotos son ilustrativas. Aún no hay artículos publicados.</p>}
    <div className="cat-grid">{rows.map((category,index)=>{
      const content=<><span className={`quad-background q${index%4}`} style={category.imageKey?{backgroundImage:`url(/api/media/${category.imageKey})`,backgroundSize:"cover",backgroundPosition:"center"}:undefined}/><span className="category-shade"/><span className="category-content"><span className="eyebrow">{category.imageKey?"Explorar":"Foto ilustrativa"}</span><strong>{category.name}</strong><span className="category-link">{isPreview?"Próximamente":"Descubrir"} <ArrowRight size={15}/></span></span></>;
      return isPreview?<article className="category-photo-tile" key={category.id}>{content}</article>:<button className="category-photo-tile" key={category.id} onClick={()=>onChoose(category.id)}>{content}</button>;
    })}</div>
  </>;
}

export function DemoCatalog(){
  return <>
    <p className="preview-note"><strong>Así se verá la colección</strong> · Fotografías y prendas de ejemplo; no están disponibles para comprar.</p>
    <div className="product-grid">{examples.map((item,index)=><article className="product-card" key={item.name}><div className="product-image demo-product-image"><span className={`quad-background product-quad q${index}`}/><span className="product-badge">Vista de ejemplo</span></div><div className="product-info"><p>Inspiración DG</p><h3>{item.piece}</h3><span className="muted" style={{fontSize:12}}>Próximamente</span></div></article>)}</div>
  </>;
}
