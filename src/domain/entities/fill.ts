import { Color, ColorWithAlpha } from '../value-objects/color';
import { FillType } from '../../shared/types/node-types';

/**
 * Gradient stop entity
 */
export interface GradientStop {
  readonly position: number;
  readonly color: ColorWithAlpha;
}

/**
 * Image filters
 */
export interface ImageFilters {
  readonly exposure?: number;
  readonly contrast?: number;
  readonly saturation?: number;
  readonly temperature?: number;
  readonly tint?: number;
  readonly highlights?: number;
  readonly shadows?: number;
}

/**
 * Fill entity representing paint fills
 */
export interface Fill {
  readonly type: FillType;
  readonly visible?: boolean;
  readonly opacity?: number;
  readonly blendMode?: string;

  // Solid fill
  readonly color?: Color;

  // Gradient fill
  readonly gradientStops?: GradientStop[];
  readonly gradientTransform?: number[][];

  // Image fill
  readonly imageHash?: string | null;
  readonly imageRef?: string;
  readonly scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  readonly imageTransform?: number[][];
  readonly scalingFactor?: number;
  readonly rotation?: number;
  readonly filters?: ImageFilters;

  // Video fill
  readonly videoHash?: string | null;
}

/**
 * Type guard for solid fills
 */
export function isSolidFill(fill: Fill): fill is Fill & { color: Color } {
  return fill.type === 'SOLID' && fill.color !== undefined;
}

/**
 * Type guard for gradient fills
 */
export function isGradientFill(fill: Fill): fill is Fill & { gradientStops: GradientStop[] } {
  return fill.type.startsWith('GRADIENT') && fill.gradientStops !== undefined;
}

/**
 * Type guard for image fills
 */
export function isImageFill(fill: Fill): boolean {
  return fill.type === 'IMAGE';
}

/**
 * Type guard for video fills
 */
export function isVideoFill(fill: Fill): boolean {
  return fill.type === 'VIDEO';
}
