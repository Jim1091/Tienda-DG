import { env } from "cloudflare:workers";
import { getChatGPTUser, requireChatGPTUser } from "../chatgpt-auth";
import AdminPanel from "../../frontend/storefront/admin-panel";
import { isAdminEmail } from "../../lib/admin-access";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await getChatGPTUser();
  if (!user) await requireChatGPTUser("/admin");
  if (!user || !isAdminEmail(user.email, env)) {
    return <main className="wrap" style={{paddingTop:80}}><h1>Acceso restringido</h1><p>Esta sección está reservada para la administración de DG.</p><a href="/">Volver a la tienda</a></main>;
  }
  return <AdminPanel adminEmail={user.email} authProvider={env.DG_AUTH_PROVIDER}/>;
}
