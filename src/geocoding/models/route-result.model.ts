export interface RouteCalculationResult {
  summary: {
    duration: number; // seconds
    length: number; // meters
  };
  polyline: string;
}