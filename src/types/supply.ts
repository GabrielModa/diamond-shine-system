export type SupplyStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export type Supply = {
  id: string;
  item: string;
  quantity: number;
  department: string;
  status: SupplyStatus;
  requestDate: Date;
  requesterId: string;
};
