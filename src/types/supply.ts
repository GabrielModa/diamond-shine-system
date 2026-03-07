export type SupplyStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Supply = {
  id: string;
  item: string;
  quantity: number;
  department: string;
  status: SupplyStatus;
  requestDate: Date;
  requesterId: string;
};
