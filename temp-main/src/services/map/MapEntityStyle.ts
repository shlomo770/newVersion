import type { TacticalEntity } from '@domain/models/entity';
import { hasTransparency } from '@domain/models/entity';
import type { MapLayerEntity } from './entity-manager/entityManagerTypes';

export interface CategoryVisual {
    color: string;
    opacity: number;
}

export function getPaintProperties(entity: TacticalEntity | MapLayerEntity, categoryVisual?: CategoryVisual) {
    const layerEntity = entity as MapLayerEntity;
    const style = layerEntity.style ?? {};
    const color = categoryVisual?.color;
    const opacity = categoryVisual?.opacity;
    const kind = entity.type.toLowerCase().trim();
    const entityTransparency = hasTransparency(entity) ? entity.transparency : opacity ?? 1;

    if (kind === "marker" || kind === "target") {
        if (kind === "target") {
            return {
                "circle-radius": 40,
                "circle-color": "#ff0000",
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 4
            };
        }
        return {
            "circle-radius": style.radius ?? 8,
            "circle-color": color ?? style.fillColor ?? entity.color ?? "#3b82f6",
            "circle-stroke-color": style.strokeColor ?? "#1e40af",
            "circle-stroke-width": style.strokeWidth ?? 2,
            "circle-opacity": opacity ?? entityTransparency ?? 1
        };
    }

    if (kind === "line") {
        return {
            "line-color": color ?? style.strokeColor ?? entity.color ?? "#3b82f6",
            "line-width": style.strokeWidth ?? layerEntity.width ?? 2,
            "line-opacity": opacity ?? style.strokeOpacity ?? entityTransparency ?? 1
        };
    }

    return {
        "fill-color": color ?? style.fillColor ?? entity.color ?? "#3b82f6",
        "fill-opacity": opacity ?? style.fillOpacity ?? entityTransparency ?? 0.3,
        "fill-outline-color": style.strokeColor ?? "#1e40af"
    };
}
