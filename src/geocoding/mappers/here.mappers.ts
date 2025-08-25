import { PlaceResult } from '../models/place-result.model';
import { RouteCalculationResult } from '../models/route-result.model';

export function mapHereItemToPlaceResult(item: any): PlaceResult {
  return {
    id: item.id,
    title: item.title,
    address: {
      label: item.address?.label ?? item.title,
      countryCode: item.address?.countryCode ?? 'CAN',
      city: item.address?.city,
      state: item.address?.state,
      postalCode: item.address?.postalCode,
      houseNumber: item.address?.houseNumber,
      street: item.address?.street,
    },
    position: { lat: item.position.lat, lng: item.position.lng },
    resultType: item.resultType,
    distance: item.distance,
  };
}

export function mapRoute(data: any): RouteCalculationResult | null {
  const section = data?.routes?.[0]?.sections?.[0];
  if (!section?.summary) return null;
  return {
    summary: {
      duration: section.summary.duration,
      length: section.summary.length,
    },
    polyline: section.polyline,
  };
}
