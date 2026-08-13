export interface Trip {
  id: string;
  currentLocation: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  currentLocation: string;
  destination: string;
  departureDate: string;
  returnDate: string;
}

export type UpdateTripInput = Partial<CreateTripInput>;
