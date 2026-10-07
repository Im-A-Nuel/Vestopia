import type { DistrictFrame, SectorId } from "@/types";
import layout from "./layout.json";

export const LAYOUT = layout;

export const PLAZA = layout.plaza;

export const districtFrame = (id: SectorId): DistrictFrame => {
  const district = layout.districts.find((item) => item.id === id);
  if (!district) {
    throw new Error(`Missing layout for district: ${id}`);
  }
  const rows = Math.ceil(district.lots / district.cols);
  const width = district.cols * layout.cell + layout.margin.side * 2;
  const height = rows * layout.cell + layout.margin.top + layout.margin.bottom;
  return {
    left: district.centerX - width / 2,
    top: district.top,
    width,
    height,
    cols: district.cols,
    rows,
  };
};

export const districtCenter = (frame: DistrictFrame): { x: number; y: number } => ({
  x: frame.left + frame.width / 2,
  y: frame.top + frame.height / 2,
});

export const lotCenter = (frame: DistrictFrame, index: number): { x: number; y: number } => {
  const column = index % frame.cols;
  const row = Math.floor(index / frame.cols);
  return {
    x: frame.left + layout.margin.side + column * layout.cell + layout.cell / 2,
    y: frame.top + layout.margin.top + row * layout.cell + layout.cell / 2,
  };
};
