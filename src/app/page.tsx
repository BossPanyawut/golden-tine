import { redirect } from "next/navigation";
import { requireSession } from "@/server/auth/dal";

export default async function Home() {
  await requireSession();
  redirect("/dashboard");
}
