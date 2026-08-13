export interface Trip {
  id: string;
  currentLocation: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTripInput = Pick<
  Trip,
  "currentLocation" | "destination" | "departureDate" | "returnDate"
>;
