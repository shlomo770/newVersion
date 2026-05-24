import { getMapServerHost } from '@core/config/servers';
import type { StyleSpecification } from 'maplibre-gl';
import {
  BASEMAP_GLYPHS_URL,
  BASEMAP_IDS,
  BASEMAP_RASTER,
  BASEMAP_VECTOR,
} from '@features/map/config';

const VECTOR_MAP_TYPE = 'vector-global';
const CARTO_MAP_TYPES = new Set(['carto-dark', 'carto-light']);

function buildRasterStyle(mapType: string): StyleSpecification {
  const mapServerHost = getMapServerHost();
  return {
    version: 8,
    glyphs: BASEMAP_GLYPHS_URL,
    sources: {
      [BASEMAP_IDS.rasterSource]: {
        type: 'raster',
        tiles: [
          `http://${mapServerHost}/tiles/${mapType}/{z}/{x}/{y}.${BASEMAP_RASTER.tileExt}`,
        ],
        tileSize: BASEMAP_RASTER.tileSize,
        minzoom: BASEMAP_RASTER.minZoom,
        maxzoom: BASEMAP_RASTER.maxZoom,
      },
    },
    layers: [
      {
        id: BASEMAP_IDS.rasterLayer,
        type: 'raster',
        source: BASEMAP_IDS.rasterSource,
      },
    ],
  };
}

function buildVectorGlobalStyle(): StyleSpecification {
  const mapServerHost = getMapServerHost();
  return {
    version: 8,
    glyphs: BASEMAP_GLYPHS_URL,
    sources: {
      [BASEMAP_IDS.vectorSource]: {
        type: 'vector',
        tiles: [`http://${mapServerHost}/tiles/${VECTOR_MAP_TYPE}/{z}/{x}/{y}.pbf.gz`],
        minzoom: BASEMAP_VECTOR.minZoom,
        maxzoom: BASEMAP_VECTOR.maxZoom,
      },
    },
    layers: [
      {
        id: BASEMAP_IDS.vectorWaterLayer,
        type: 'fill',
        source: BASEMAP_IDS.vectorSource,
        'source-layer': BASEMAP_IDS.vectorWaterSourceLayer,
        paint: {
          'fill-color': BASEMAP_VECTOR.waterFillColor,
          'fill-opacity': BASEMAP_VECTOR.waterFillOpacity,
        },
      },
    ],
  };
}

export function getMapStyle(mapType: string, _type: 'vector' | 'raster'): StyleSpecification {
  void _type;
  if (mapType === VECTOR_MAP_TYPE) {
    return buildVectorGlobalStyle();
  }
  if (CARTO_MAP_TYPES.has(mapType)) {
    return buildRasterStyle(mapType);
  }
  return buildRasterStyle(mapType);
}
