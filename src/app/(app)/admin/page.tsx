import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireUser(true);
  if (user.username === "financas") {
    redirect("/admin/financas");
  }
  redirect("/admin/calendario");
}
