const pieces = [
  { image: "/products/vestido-rayas-estudio.webp", name: "Vestido camisero a rayas", className: "hero-piece-main" },
  { image: "/products/jean-curvo-estudio.webp", name: "Jean de costuras curvas", className: "hero-piece-jean" },
  { image: "/products/top-vino-estudio.webp", name: "Top vino sin tirantes", className: "hero-piece-top" },
];

export default function HeroProducts() {
  return <div className="hero-products" aria-label="Prendas reales de la colección Daniela y Garu">
    {pieces.map(piece => <div className={`hero-piece ${piece.className}`} key={piece.name}>
      <img src={piece.image} alt={piece.name} loading={piece.className === "hero-piece-main" ? "eager" : "lazy"}/>
      <span>{piece.name}</span>
    </div>)}
  </div>;
}
