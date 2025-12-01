import { Fill, GradientStop, isSolidFill, isGradientFill } from '../../domain/entities/fill';
import { ColorFactory } from '../../domain/value-objects/color';

/**
 * Mapper for converting between Fill entities and Figma Paint objects
 * Handles: SOLID, GRADIENT_*, IMAGE, VIDEO
 */
export class FillMapper {
  /**
   * Map Figma paints to Fill entities
   */
  static toEntity(paints: readonly Paint[] | typeof figma.mixed): Fill[] | null {
    if (!paints || paints === figma.mixed || paints.length === 0) return null;

    const fills: Fill[] = [];

    for (const paint of paints) {
      const fill = FillMapper.mapPaintToFill(paint);
      if (fill) {
        fills.push(fill);
      }
    }

    return fills.length > 0 ? fills : null;
  }

  /**
   * Map Fill entities to Figma Paint objects
   */
  static toPaint(fills: Fill[]): Paint[] {
    const validFills: Paint[] = [];

    for (const fill of fills) {
      if (!fill || typeof fill !== 'object') continue;

      const paint = FillMapper.mapFillToPaint(fill);
      if (paint) {
        validFills.push(paint);
      }
    }

    return validFills;
  }

  private static mapPaintToFill(paint: Paint): Fill | null {
    const baseFill: Partial<Fill> = {
      type: paint.type as Fill['type'],
      visible: paint.visible !== false ? undefined : false,
      opacity: paint.opacity !== 1 ? paint.opacity : undefined,
      blendMode: paint.blendMode !== 'NORMAL' ? paint.blendMode : undefined,
    };

    switch (paint.type) {
      case 'SOLID': {
        const solidPaint = paint as SolidPaint;
        return {
          ...baseFill,
          type: 'SOLID',
          color: ColorFactory.round({
            r: solidPaint.color.r,
            g: solidPaint.color.g,
            b: solidPaint.color.b,
          }),
        } as Fill;
      }

      case 'GRADIENT_LINEAR':
      case 'GRADIENT_RADIAL':
      case 'GRADIENT_ANGULAR':
      case 'GRADIENT_DIAMOND': {
        const gradientPaint = paint as GradientPaint;
        return {
          ...baseFill,
          type: paint.type,
          gradientStops: FillMapper.mapGradientStops(gradientPaint.gradientStops),
          gradientTransform: gradientPaint.gradientTransform.map(row => [...row]),
        } as Fill;
      }

      case 'IMAGE': {
        const imagePaint = paint as ImagePaint;
        return {
          ...baseFill,
          type: 'IMAGE',
          imageHash: imagePaint.imageHash,
          scaleMode: imagePaint.scaleMode,
          imageTransform: imagePaint.imageTransform ?
            imagePaint.imageTransform.map(row => [...row]) : undefined,
          scalingFactor: imagePaint.scalingFactor,
          rotation: imagePaint.rotation !== 0 ? imagePaint.rotation : undefined,
          filters: imagePaint.filters ? { ...imagePaint.filters } : undefined,
        } as Fill;
      }

      case 'VIDEO': {
        const videoPaint = paint as VideoPaint;
        return {
          ...baseFill,
          type: 'VIDEO',
          videoHash: videoPaint.videoHash,
          scaleMode: videoPaint.scaleMode,
        } as Fill;
      }

      default:
        // Skip unsupported paint types
        return null;
    }
  }

  private static mapFillToPaint(fill: Fill): Paint | null {
    const visible = fill.visible !== false;
    const opacity = FillMapper.normalizeOpacity(fill.opacity);
    const blendMode = (fill.blendMode as BlendMode) || 'NORMAL';

    switch (fill.type) {
      case 'SOLID': {
        if (!fill.color) return null;
        const solidPaint: SolidPaint = {
          type: 'SOLID',
          visible,
          opacity,
          blendMode,
          color: {
            r: ColorFactory.normalize(fill.color.r || 0),
            g: ColorFactory.normalize(fill.color.g || 0),
            b: ColorFactory.normalize(fill.color.b || 0),
          },
        };
        return solidPaint;
      }

      case 'GRADIENT_LINEAR':
      case 'GRADIENT_RADIAL':
      case 'GRADIENT_ANGULAR':
      case 'GRADIENT_DIAMOND': {
        if (!fill.gradientStops || !fill.gradientTransform) return null;
        const gradientPaint: GradientPaint = {
          type: fill.type,
          visible,
          opacity,
          blendMode,
          gradientStops: fill.gradientStops.map(stop => ({
            position: stop.position,
            color: {
              r: ColorFactory.normalize(stop.color.r),
              g: ColorFactory.normalize(stop.color.g),
              b: ColorFactory.normalize(stop.color.b),
              a: stop.color.a ?? 1,
            },
          })),
          gradientTransform: fill.gradientTransform as Transform,
        };
        return gradientPaint;
      }

      case 'IMAGE': {
        if (!fill.imageHash) return null;
        const imagePaint: ImagePaint = {
          type: 'IMAGE',
          visible,
          opacity,
          blendMode,
          scaleMode: fill.scaleMode || 'FILL',
          imageHash: fill.imageHash,
          imageTransform: fill.imageTransform as Transform | undefined,
          scalingFactor: fill.scalingFactor,
          rotation: fill.rotation || 0,
          filters: fill.filters,
        };
        return imagePaint;
      }

      case 'VIDEO': {
        if (!fill.videoHash) return null;
        const videoPaint: VideoPaint = {
          type: 'VIDEO',
          visible,
          opacity,
          blendMode,
          scaleMode: fill.scaleMode || 'FILL',
          videoHash: fill.videoHash,
        };
        return videoPaint;
      }

      default:
        return null;
    }
  }

  private static mapGradientStops(stops: readonly ColorStop[]): GradientStop[] {
    return stops.map(stop => ({
      position: stop.position,
      color: {
        r: Math.round(stop.color.r * 1000) / 1000,
        g: Math.round(stop.color.g * 1000) / 1000,
        b: Math.round(stop.color.b * 1000) / 1000,
        a: stop.color.a,
      },
    }));
  }

  private static normalizeOpacity(opacity?: number): number {
    if (typeof opacity !== 'number') return 1;
    return Math.max(0, Math.min(1, opacity));
  }
}
