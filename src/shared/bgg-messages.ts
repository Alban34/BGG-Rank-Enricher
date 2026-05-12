export interface BggLookupRequest {
  type: "BGG_RATING_LOOKUP";
  title: string;
}

export interface BggLookupSuccess {
  ok: true;
  rating: string; // formatted to one decimal place, e.g. "8.0"
}

export interface BggLookupError {
  ok: false;
  reason: "NOT_FOUND" | "API_ERROR" | "NETWORK_ERROR" | "PARSE_ERROR" | "CLOUDFLARE_BLOCK";
}

export type BggLookupResponse = BggLookupSuccess | BggLookupError;
