import { Suspense } from "react";
import { GuestNav } from "@/components/GuestNav";
import { GuestProvider } from "@/components/GuestProvider";

async function GuestShell({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <GuestProvider id={id}>
      <GuestNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </GuestProvider>
  );
}

export default function GuestLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Cargando tu reserva…</p>}>
      <GuestShell params={params}>{children}</GuestShell>
    </Suspense>
  );
}
