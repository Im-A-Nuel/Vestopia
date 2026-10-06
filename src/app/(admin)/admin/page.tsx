import type { Metadata } from "next";
import { AdminScreen } from "@/components/pages/(admin)";

export const metadata: Metadata = {
  title: "Admin | Vestopia",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminScreen />;
}
