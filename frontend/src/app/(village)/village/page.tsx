import type { Metadata } from "next";
import { VillageScreen } from "@/components/pages/(village)";

export const metadata: Metadata = {
  title: "Your Village",
};

export default function VillagePage() {
  return <VillageScreen />;
}
