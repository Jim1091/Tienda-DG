import { ArrowUpRight, Heart, LayoutDashboard, MessageCircle, PackageSearch, Settings2, Shirt, UserRound } from "lucide-react";

type Props = {
  admin: boolean;
  whatsapp: string;
  onTrack: () => void;
};

export default function StoreMenu({ admin, whatsapp, onTrack }: Props) {
  return <div className="store-menu">
    <div className="store-menu-intro"><span className="eyebrow">Daniela y Garu</span><p className="serif">Estamos aquí para ayudarte.</p></div>
    <nav aria-label="Ayuda al cliente" className="store-menu-links">
      <span className="store-menu-label">Tu compra</span>
      <button onClick={onTrack}><PackageSearch size={19}/><span>Rastrear un pedido</span></button>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={19}/><span>Hablar por WhatsApp</span><ArrowUpRight size={15} className="store-menu-external"/></a>
      <a href="/cuenta"><UserRound size={19}/><span>Mis pedidos</span></a>
    </nav>
    {admin&&<>
      <div className="store-menu-divider"/>
      <nav aria-label="Administración" className="store-menu-links">
        <span className="store-menu-label">Administración</span>
        <a href="/admin"><LayoutDashboard size={19}/><span>Panel general</span></a>
        <a href="/admin?tab=productos"><Shirt size={19}/><span>Agregar productos</span></a>
        <a href="/admin?tab=ajustes"><Settings2 size={19}/><span>Configuración de la página</span></a>
        <a href="/admin?tab=perfil"><UserRound size={19}/><span>Mi perfil</span></a>
      </nav>
    </>}
    <div className="store-menu-bottom"><Heart size={15}/><span>Viste a tu manera.</span></div>
  </div>;
}
