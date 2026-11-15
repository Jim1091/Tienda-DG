import { env } from "cloudflare:workers";
import { getChatGPTUser, requireChatGPTUser } from "../chatgpt-auth";
import AdminPanel from "../../components/admin-panel";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await getChatGPTUser();
  if (!user) await requireChatGPTUser("/admin");
  if (!user || !env.DG_ADMIN_EMAIL || user.email.toLowerCase()!==env.DG_ADMIN_EMAIL.toLowerCase()) {
    return <main className="wrap" style={{paddingTop:80}}><h1>Acceso restringido</h1><p>Esta sección está reservada para la administración de DG.</p><a href="/">Volver a la tienda</a></main>;
  }
  return <AdminPanel/>;
}
