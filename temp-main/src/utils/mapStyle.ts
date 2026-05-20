import { getMapServerHost } from '@core/config/servers';
import type { StyleSpecification } from 'maplibre-gl';

export function getMapStyle(mapType: string, type: 'vector' | 'raster'): StyleSpecification {
    const mapServerHost = getMapServerHost();
    if (mapType === 'vector-global') {
        return {
            version: 8,
            glyphs: "/fonts/{fontstack}/{range}.pbf",
            sources: {
                vectiles: {
                    type,
                    tiles: [`http://${mapServerHost}/tiles/vector-global/{z}/{x}/{y}.pbf.gz`],
                    minzoom: 0,
                    maxzoom: 15
                }
            },
            layers: [
                {
                    id: 'water',
                    type: 'fill',   
                    source: 'vectiles',
                    'source-layer': 'water',
                    paint: {
                        'fill-color': '#00ffff',
                        'fill-opacity': 0.4
                    }
                }
            ]
        };
    } else if (mapType === 'carto-dark' || mapType === 'carto-light') {
        return {
            version: 8,
            glyphs: "/fonts/{fontstack}/{range}.pbf",
            sources: {
                rastertiles: {
                    type: 'raster',
                    tiles: [`http://${mapServerHost}/tiles/${mapType}/{z}/{x}/{y}.webp`],
                    tileSize: 256,
                    minzoom: 0,
                    maxzoom: 15
                }
            },
            layers: [
                {
                    id: 'raster-layer',
                    type: 'raster',
                    source: 'rastertiles'
                }
            ]
        };
    } else {
        return {
            version: 8,
            glyphs: "/fonts/{fontstack}/{range}.pbf",
            sources: {
                rastertiles: {
                    type: 'raster',
                    tiles: [`http://${mapServerHost}/tiles/${mapType}/{z}/{x}/{y}.webp`],
                    tileSize: 256,
                    minzoom: 0,
                    maxzoom: 15
                }
            },
            layers: [
                {
                    id: 'raster-layer',
                    type: 'raster',
                    source: 'rastertiles'
                }
            ]
        };
    }
}