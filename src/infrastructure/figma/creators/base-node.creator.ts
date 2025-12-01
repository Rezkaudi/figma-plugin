import { DesignNode } from '../../../domain/entities/design-node';
import { Fill } from '../../../domain/entities/fill';
import { Effect } from '../../../domain/entities/effect';
import { FillMapper } from '../../mappers/fill.mapper';
import { EffectMapper } from '../../mappers/effect.mapper';

/**
 * Base class for node creators with comprehensive property application
 */
export abstract class BaseNodeCreator {
  /**
   * Apply fills to a node
   */
  protected applyFills(node: SceneNode, fills?: Fill[]): void {
    if (!fills || !Array.isArray(fills) || fills.length === 0 || !('fills' in node)) {
      return;
    }

    const validFills = FillMapper.toPaint(fills);
    if (validFills.length > 0) {
      (node as GeometryMixin).fills = validFills;
    }
  }

  /**
   * Apply strokes to a node
   */
  protected applyStrokes(node: SceneNode, nodeData: DesignNode): void {
    if (!nodeData.strokes || !Array.isArray(nodeData.strokes) || nodeData.strokes.length === 0) {
      return;
    }
    if (!('strokes' in node)) return;

    const validStrokes = FillMapper.toPaint(nodeData.strokes);
    if (validStrokes.length > 0) {
      const geoNode = node as GeometryMixin;
      geoNode.strokes = validStrokes as SolidPaint[];

      // Stroke weight
      if (typeof nodeData.strokeWeight === 'number' && nodeData.strokeWeight >= 0) {
        geoNode.strokeWeight = nodeData.strokeWeight;
      }

      // Individual stroke weights
      if (nodeData.individualStrokeWeights && 'strokeTopWeight' in node) {
        const frameNode = node as any;
        frameNode.strokeTopWeight = nodeData.individualStrokeWeights.top;
        frameNode.strokeRightWeight = nodeData.individualStrokeWeights.right;
        frameNode.strokeBottomWeight = nodeData.individualStrokeWeights.bottom;
        frameNode.strokeLeftWeight = nodeData.individualStrokeWeights.left;
      }

      // Stroke align
      if (nodeData.strokeAlign && 'strokeAlign' in node) {
        (node as any).strokeAlign = nodeData.strokeAlign;
      }

      // Stroke cap
      if (nodeData.strokeCap && 'strokeCap' in node) {
        (node as any).strokeCap = nodeData.strokeCap;
      }

      // Stroke join
      if (nodeData.strokeJoin && 'strokeJoin' in node) {
        (node as any).strokeJoin = nodeData.strokeJoin;
      }

      // Stroke miter limit
      if (typeof nodeData.strokeMiterLimit === 'number' && 'strokeMiterLimit' in node) {
        (node as any).strokeMiterLimit = nodeData.strokeMiterLimit;
      }

      // Dash pattern
      if (nodeData.dashPattern && Array.isArray(nodeData.dashPattern) && 'dashPattern' in node) {
        (node as any).dashPattern = nodeData.dashPattern;
      }
    }
  }

  /**
   * Apply corner radius to a node
   */
  protected applyCornerRadius(node: SceneNode, nodeData: DesignNode): void {
    if (!('cornerRadius' in node)) return;

    const rectNode = node as RectangleNode | FrameNode | ComponentNode;

    // Check for individual corner radii first
    if (
      typeof nodeData.topLeftRadius === 'number' ||
      typeof nodeData.topRightRadius === 'number' ||
      typeof nodeData.bottomLeftRadius === 'number' ||
      typeof nodeData.bottomRightRadius === 'number'
    ) {
      rectNode.topLeftRadius = nodeData.topLeftRadius || 0;
      rectNode.topRightRadius = nodeData.topRightRadius || 0;
      rectNode.bottomLeftRadius = nodeData.bottomLeftRadius || 0;
      rectNode.bottomRightRadius = nodeData.bottomRightRadius || 0;
    } else if (typeof nodeData.cornerRadius === 'number') {
      rectNode.cornerRadius = nodeData.cornerRadius;
    }

    // Corner smoothing
    if (typeof nodeData.cornerSmoothing === 'number' && 'cornerSmoothing' in node) {
      (node as any).cornerSmoothing = nodeData.cornerSmoothing;
    }
  }

  /**
   * Apply effects to a node
   */
  protected applyEffects(node: SceneNode & MinimalBlendMixin, effects?: Effect[]): void {
    if (!effects || !Array.isArray(effects) || effects.length === 0) return;

    const validEffects = EffectMapper.toFigmaEffect(effects);
    if (validEffects.length > 0 && 'effects' in node) {
      (node as any).effects = validEffects;
    }
  }

  /**
   * Apply common visual properties to a node
   */
  protected applyCommonProperties(node: SceneNode, nodeData: DesignNode): void {
    // Opacity
    if (typeof nodeData.opacity === 'number' && 'opacity' in node) {
      (node as any).opacity = Math.max(0, Math.min(1, nodeData.opacity));
    }

    // Blend mode
    if (nodeData.blendMode && 'blendMode' in node) {
      (node as any).blendMode = nodeData.blendMode;
    }

    // Visibility
    if (typeof nodeData.visible === 'boolean') {
      node.visible = nodeData.visible;
    }

    // Locked
    if (typeof nodeData.locked === 'boolean') {
      node.locked = nodeData.locked;
    }

    // Rotation
    if (typeof nodeData.rotation === 'number' && 'rotation' in node) {
      (node as any).rotation = nodeData.rotation;
    }

    // Is mask
    if (nodeData.isMask && 'isMask' in node) {
      (node as any).isMask = true;
    }

    // Effects
    if (nodeData.effects && Array.isArray(nodeData.effects) && 'effects' in node) {
      this.applyEffects(node as SceneNode & MinimalBlendMixin, nodeData.effects);
    }

    // Constraints
    if (nodeData.constraints && 'constraints' in node) {
      (node as any).constraints = nodeData.constraints;
    }

    // Size constraints
    this.applySizeConstraints(node, nodeData);

    // Layout child properties
    this.applyLayoutChildProperties(node, nodeData);
  }

  /**
   * Apply size constraints
   */
  protected applySizeConstraints(node: SceneNode, nodeData: DesignNode): void {
    if ('minWidth' in node) {
      const layoutNode = node as any;
      if (nodeData.minWidth !== undefined && nodeData.minWidth !== null) {
        layoutNode.minWidth = nodeData.minWidth;
      }
      if (nodeData.maxWidth !== undefined && nodeData.maxWidth !== null) {
        layoutNode.maxWidth = nodeData.maxWidth;
      }
      if (nodeData.minHeight !== undefined && nodeData.minHeight !== null) {
        layoutNode.minHeight = nodeData.minHeight;
      }
      if (nodeData.maxHeight !== undefined && nodeData.maxHeight !== null) {
        layoutNode.maxHeight = nodeData.maxHeight;
      }
    }
  }

  /**
   * Apply layout child properties (for children of auto-layout frames)
   */
  protected applyLayoutChildProperties(node: SceneNode, nodeData: DesignNode): void {
    if (typeof nodeData.layoutGrow === 'number' && 'layoutGrow' in node) {
      (node as any).layoutGrow = nodeData.layoutGrow;
    }
    if (nodeData.layoutAlign && 'layoutAlign' in node) {
      (node as any).layoutAlign = nodeData.layoutAlign;
    }
    if (nodeData.layoutPositioning && 'layoutPositioning' in node) {
      (node as any).layoutPositioning = nodeData.layoutPositioning;
    }
    if (nodeData.layoutSizingHorizontal && 'layoutSizingHorizontal' in node) {
      (node as any).layoutSizingHorizontal = nodeData.layoutSizingHorizontal;
    }
    if (nodeData.layoutSizingVertical && 'layoutSizingVertical' in node) {
      (node as any).layoutSizingVertical = nodeData.layoutSizingVertical;
    }
  }

  /**
   * Apply auto-layout properties to a frame
   */
  protected applyAutoLayout(node: FrameNode | ComponentNode, nodeData: DesignNode): void {
    if (!nodeData.layoutMode || nodeData.layoutMode === 'NONE') {
      return;
    }

    node.layoutMode = nodeData.layoutMode;

    // Sizing modes
    if (nodeData.primaryAxisSizingMode) {
      node.primaryAxisSizingMode = nodeData.primaryAxisSizingMode;
    }
    if (nodeData.counterAxisSizingMode) {
      node.counterAxisSizingMode = nodeData.counterAxisSizingMode;
    }

    // Alignment
    if (nodeData.primaryAxisAlignItems) {
      node.primaryAxisAlignItems = nodeData.primaryAxisAlignItems;
    }
    if (nodeData.counterAxisAlignItems && nodeData.counterAxisAlignItems !== 'BASELINE') {
      node.counterAxisAlignItems = nodeData.counterAxisAlignItems;
    }

    // Spacing
    if (typeof nodeData.itemSpacing === 'number') {
      node.itemSpacing = nodeData.itemSpacing;
    }
    if (typeof nodeData.counterAxisSpacing === 'number') {
      (node as any).counterAxisSpacing = nodeData.counterAxisSpacing;
    }

    // Padding
    if (typeof nodeData.paddingTop === 'number') {
      node.paddingTop = nodeData.paddingTop;
    }
    if (typeof nodeData.paddingRight === 'number') {
      node.paddingRight = nodeData.paddingRight;
    }
    if (typeof nodeData.paddingBottom === 'number') {
      node.paddingBottom = nodeData.paddingBottom;
    }
    if (typeof nodeData.paddingLeft === 'number') {
      node.paddingLeft = nodeData.paddingLeft;
    }

    // Wrap
    if (nodeData.layoutWrap && 'layoutWrap' in node) {
      (node as any).layoutWrap = nodeData.layoutWrap;
    }

    // Counter axis align content
    if (nodeData.counterAxisAlignContent && 'counterAxisAlignContent' in node) {
      (node as any).counterAxisAlignContent = nodeData.counterAxisAlignContent;
    }

    // Z-index reversal
    if (nodeData.itemReverseZIndex) {
      node.itemReverseZIndex = true;
    }
  }

  /**
   * Apply frame-specific properties
   */
  protected applyFrameProperties(node: FrameNode | ComponentNode, nodeData: DesignNode): void {
    // Clips content
    if (typeof nodeData.clipsContent === 'boolean') {
      node.clipsContent = nodeData.clipsContent;
    }

    // Guides
    if (nodeData.guides && Array.isArray(nodeData.guides) && 'guides' in node) {
      (node as any).guides = nodeData.guides;
    }

    // Layout grids
    if (nodeData.layoutGrids && Array.isArray(nodeData.layoutGrids)) {
      node.layoutGrids = nodeData.layoutGrids.map(grid => {
        if (grid.pattern === 'GRID') {
          return {
            pattern: 'GRID' as const,
            visible: grid.visible,
            color: grid.color,
            sectionSize: grid.sectionSize || 10,
          };
        } else {
          return {
            pattern: grid.pattern as 'ROWS' | 'COLUMNS',
            visible: grid.visible,
            color: grid.color,
            alignment: grid.alignment || 'STRETCH',
            gutterSize: grid.gutterSize || 10,
            count: grid.count || 5,
            sectionSize: grid.sectionSize || 10,
            offset: grid.offset || 0,
          };
        }
      });
    }
  }

  /**
   * Ensure minimum dimensions
   */
  protected ensureMinDimensions(
    width?: number,
    height?: number,
    defaultValue: number = 100
  ): { width: number; height: number } {
    return {
      width: Math.max(1, width || defaultValue),
      height: Math.max(1, height || defaultValue),
    };
  }
}
