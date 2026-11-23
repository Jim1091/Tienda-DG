export default function Brand({ inverse = false }: { inverse?: boolean }) {
  return <a href="/" className={`brand-logo${inverse ? " brand-logo-inverse" : ""}`} aria-label="Daniela y Garu, ir al inicio">
    <span className="brand-logo-mark" aria-hidden="true">DG</span>
    <span className="brand-logo-name">Daniela <i>y</i> Garu<small>MODA CON PERSONALIDAD</small></span>
  </a>;
}
