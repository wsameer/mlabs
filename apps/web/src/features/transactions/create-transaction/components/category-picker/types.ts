export type PickerStage = "parent" | "subcategory";

export interface PickerValue {
  categoryId: string;
  subcategoryId?: string;
}
