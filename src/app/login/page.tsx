import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string; callbackUrl?: string }> }) {
  const user = await currentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/membros");
  const query = await searchParams;
  const callback = query.callbackUrl?.startsWith("/") ? query.callbackUrl : "/membros";
  return <main className="auth-page"><section className="auth-card">
    <Link className="brand" href="/"><Image src="/uploads/logo-ejc.png" width={36} height={36} alt="" /><span>EJC Nossa Senhora Aparecida</span></Link>
    <h1>Entrar</h1><p>Acesso restrito para equipe e membros autorizados.</p>
    {query.erro && <p className="error" role="alert">Usuário ou senha inválidos.</p>}
    <form className="form" method="post" action="/api/login">
      <input type="hidden" name="callbackUrl" value={callback} />
      <label className="field">Usuário<input name="identifier" autoComplete="username" required /></label>
      <label className="field">Senha<input name="password" type="password" autoComplete="current-password" required /></label>
      <button className="button" type="submit">Acessar área interna</button>
    </form>
  </section></main>;
}
