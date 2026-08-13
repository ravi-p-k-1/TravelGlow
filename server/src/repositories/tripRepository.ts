import { randomUUID } from "node:crypto";
import { database } from "../config/database.js";
import type { CreateTripInput, Trip, UpdateTripInput } from "../models/trip.js";

interface TripRow {
  id: string;
  current_location: string;
  destination: string;
  departure_date: Date | string;
  return_date: Date | string;
  created_at: Date;
  updated_at: Date;
}

function mapDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function mapTrip(row: TripRow): Trip {
  return {
    id: row.id,
    currentLocation: row.current_location,
    destination: row.destination,
    departureDate: mapDate(row.departure_date),
    returnDate: mapDate(row.return_date),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const tripColumns = `
  id, current_location, destination, departure_date, return_date, created_at, updated_at
`;

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const result = await database.query<TripRow>(
    `INSERT INTO trips (
      id, current_location, destination, departure_date, return_date
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING ${tripColumns}`,
    [
      randomUUID(),
      input.currentLocation,
      input.destination,
      input.departureDate,
      input.returnDate,
    ],
  );

  return mapTrip(result.rows[0]!);
}

export async function findTripById(id: string): Promise<Trip | null> {
  const result = await database.query<TripRow>(
    `SELECT ${tripColumns} FROM trips WHERE id = $1`,
    [id],
  );

  return result.rows[0] ? mapTrip(result.rows[0]) : null;
}

export async function updateTrip(
  id: string,
  input: UpdateTripInput,
): Promise<Trip | null> {
  const result = await database.query<TripRow>(
    `UPDATE trips SET
      current_location = COALESCE($2, current_location),
      destination = COALESCE($3, destination),
      departure_date = COALESCE($4, departure_date),
      return_date = COALESCE($5, return_date),
      updated_at = NOW()
    WHERE id = $1
    RETURNING ${tripColumns}`,
    [
      id,
      input.currentLocation ?? null,
      input.destination ?? null,
      input.departureDate ?? null,
      input.returnDate ?? null,
    ],
  );

  return result.rows[0] ? mapTrip(result.rows[0]) : null;
}
