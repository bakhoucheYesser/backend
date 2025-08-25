export interface PlaceResult {
  id: string;
  title: string;
  address: {
    label: string;
    countryCode: string;
    city?: string;
    state?: string;
    postalCode?: string;
    houseNumber?: string;
    street?: string;
  };
  position: { lat: number; lng: number };
  resultType: string;
  distance?: number;
}
