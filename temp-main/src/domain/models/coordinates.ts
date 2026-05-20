export interface Coordinates {
  lng: number;
  lat: number;
  alt?: number;
}

export interface LatLng {
  lat: number;
  lng: number;
  alt: number;
}

export interface LatLngManual {
  lat: number;
  lng: number;
  alt: number;
  heading: number;
}

export interface WGS84Coordinates {
  lat: number;
  lng: number;
}

export interface UTMCoordinates {
  easting: number;
  northing: number;
  zone: number;
  hemisphere: 'N' | 'S';
}
