import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string; callbackUrl?: string }> }) {
  const user = await currentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin/financas" : "/membros");
  const query = await searchParams;
  const callback = query.callbackUrl?.startsWith("/") ? query.callbackUrl : "/admin/financas";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand" href="/">
          <Image src="/uploads/logo-ejc.png" width={36} height={36} alt="Logo EJC" />
          <span>EJC Nossa Senhora Aparecida</span>
        </Link>
        <h1>Entrar</h1>
        <p>Acesso restrito para equipe e membros autorizados.</p>
        {query.erro && <p className="error" role="alert">Usuário ou senha inválidos.</p>}
        <form className="form" method="post" action="/api/login">
          <input type="hidden" name="callbackUrl" value={callback} />
          <label className="field">
            Usuário
            <input name="identifier" autoComplete="username" required />
          </label>
          <label className="field">
            Senha
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <label className="remember-row" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem", color: "var(--text)", marginTop: "4px" }}>
            <input name="remember" type="checkbox" defaultChecked style={{ width: "18px", height: "18px", accentColor: "#0284c7" }} />
            <span>Lembrar de mim (manter conectado)</span>
          </label>
          <button className="button" type="submit" style={{ marginTop: "8px" }}>
            Acessar área interna
          </button>
        </form>
      </section>
    </main>
  );
}
