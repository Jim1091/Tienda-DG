import { ArrowRight } from "lucide-react";

const garments = [
  { name: "Jean de costuras curvas", price: 28, size: "M", image: "/products/jean-curvo-estudio.webp", story: "Para esos días en los que sales sin plan y vuelves con una historia." },
  { name: "Top vino sin tirantes", price: 10, size: "M", image: "/products/top-vino-estudio.webp", story: "Para ese atardecer que quieres recordar." },
  { name: "Vestido camisero a rayas", price: 10, size: "M", image: "/products/vestido-rayas-estudio.webp", story: "Una escapada frente al mar, incluso si tu plan empieza en la ciudad." },
];

export default function ConsultationCatalog({ whatsapp }: { whatsapp: string }) {
  return <>
    <p className="catalog-intro">Tres prendas de la colección DG. Consulta disponibilidad antes de pedir.</p>
    <div className="product-grid consultation-grid">
      {garments.map(garment => {
        const message = `Hola DG, quiero consultar la disponibilidad de ${garment.name}, talla ${garment.size}, precio $${garment.price}.`;
        const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
        return <article className="product-card" key={garment.name}>
          <div className="product-image"><img className="product-image-backdrop" src={garment.image} alt="" aria-hidden="true" loading="lazy"/><img src={garment.image} alt={garment.name} loading="lazy"/><span className="product-badge">Consulta disponibilidad</span></div>
          <div className="product-info"><p>Colección DG · Talla {garment.size}</p><h3>{garment.name}</h3><span className="price">${garment.price.toFixed(2)}</span><p className="product-story">{garment.story}</p>
            <div className="product-actions"><a className="btn" href={url} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp <ArrowRight size={15}/></a></div>
          </div>
        </article>;
      })}
    </div>
    <p className="catalog-photo-note">Fondos de las fotos editados con IA. Confirma los detalles de la prenda y su disponibilidad por WhatsApp.</p>
  </>;
}
