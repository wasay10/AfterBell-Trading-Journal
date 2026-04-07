import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AfterBellHero } from "@/components/ui/shape-landing-hero";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");
  return <AfterBellHero />;
}
