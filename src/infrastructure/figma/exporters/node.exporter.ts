import {
  DesignNode,
  VectorPathData,
  VectorNetworkData,
  LayoutGridDef
} from '../../../domain/entities/design-node';
import { Fill } from '../../../domain/entities/fill';
import { Effect as DomainEffect } from '../../../domain/entities/effect';

/**
 * Comprehensive exporter for converting Figma nodes to DesignNode entities
 * Captures ALL properties for accurate round-trip import/export
 */
export class NodeExporter {
  /**
   * Export a Figma node to a DesignNode entity
   */
  export(node: SceneNode): DesignNode | null {
    try {
      const baseProps = this.getBaseProperties(node);

      switch (node.type) {
        case 'FRAME':
          return this.exportFrame(node as FrameNode, baseProps);
        case 'GROUP':
          return this.exportGroup(node as GroupNode, baseProps);
        case 'COMPONENT':
          return this.exportComponent(node as ComponentNode, baseProps);
        case 'COMPONENT_SET':
          return this.exportComponentSet(node as ComponentSetNode, baseProps);
        case 'INSTANCE':
          return this.exportInstance(node as InstanceNode, baseProps);
        case 'RECTANGLE':
          return this.exportRectangle(node as RectangleNode, baseProps);
        case 'ELLIPSE':
          return this.exportEllipse(node as EllipseNode, baseProps);
        case 'POLYGON':
          return this.exportPolygon(node as PolygonNode, baseProps);
        case 'STAR':
          return this.exportStar(node as StarNode, baseProps);
        case 'LINE':
          return this.exportLine(node as LineNode, baseProps);
        case 'VECTOR':
          return this.exportVector(node as VectorNode, baseProps);
        case 'TEXT':
          return this.exportText(node as TextNode, baseProps);
        case 'BOOLEAN_OPERATION':
          return this.exportBooleanOperation(node as BooleanOperationNode, baseProps);
        case 'SECTION':
          return this.exportSection(node as SectionNode, baseProps);
        case 'SLICE':
          return this.exportSlice(node as SliceNode, baseProps);
        default:
          console.warn(`Node type ${node.type} exported as generic`);
          return this.exportGeneric(node, baseProps);
      }
    } catch (error) {
      console.error(`Error exporting node ${node.name}:`, error);
      return null;
    }
  }

  // ==================== BASE PROPERTIES ====================

  private getBaseProperties(node: SceneNode): Partial<DesignNode> {
    const props: Record<string, unknown> = {
      name: node.name,
      type: node.type,
      x: node.x,
      y: node.y,
    };

    // Dimensions
    if ('width' in node) props.width = node.width;
    if ('height' in node) props.height = node.height;

    // Visibility and lock
    props.visible = node.visible;
    props.locked = node.locked;

    // Rotation
    if ('rotation' in node && (node as any).rotation !== 0) {
      props.rotation = (node as any).rotation;
    }

    // Relative transform (for accurate positioning)
    if ('relativeTransform' in node) {
      const transform = (node as any).relativeTransform;
      if (transform) {
        props.relativeTransform = [
          [transform[0][0], transform[0][1], transform[0][2]],
          [transform[1][0], transform[1][1], transform[1][2]]
        ];
      }
    }

    return props as Partial<DesignNode>;
  }

  // ==================== FRAME-LIKE NODES ====================

  private exportFrame(node: FrameNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      ...this.getGeometryMixin(node),
      ...this.getBlendMixin(node),
      ...this.getCornerMixin(node),
      ...this.getLayoutMixin(node),
      ...this.getAutoLayoutMixin(node),
      ...this.getConstraintsMixin(node),
      ...this.getFrameSpecificProps(node),
      children: this.exportChildren(node),
    });
  }

  private exportGroup(node: GroupNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      ...this.getBlendMixin(node),
      ...this.getLayoutChildMixin(node),
      children: this.exportChildren(node),
    });
  }

  private exportComponent(node: ComponentNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      ...this.getGeometryMixin(node),
      ...this.getBlendMixin(node),
      ...this.getCornerMixin(node),
      ...this.getLayoutMixin(node),
      ...this.getAutoLayoutMixin(node),
      ...this.getConstraintsMixin(node),
      ...this.getFrameSpecificProps(node),
      children: this.exportChildren(node),
    });
  }

  private exportComponentSet(node: ComponentSetNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      ...this.getGeometryMixin(node),
      ...this.getBlendMixin(node),
      ...this.getAutoLayoutMixin(node),
      children: this.exportChildren(node),
    });
  }

  private exportInstance(node: InstanceNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      ...this.getGeometryMixin(node),
      ...this.getBlendMixin(node),
      ...this.getCornerMixin(node),
      ...this.getLayoutMixin(node),
      ...this.getAutoLayoutMixin(node),
      ...this.getConstraintsMixin(node),
      ...this.getFrameSpecificProps(node),
      children: this.exportChildren(node),
    });
  }

  private exportSection(node: SectionNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      fills: this.exportFills(node.fills),
      sectionContentsHidden: node.sectionContentsHidden,
      children: this.exportChildren(node),
    });
  }

  // ==================== SHAPE NODES ====================

  private exportRectangle(node: RectangleNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      ...this.getGeometryMixin(node),
      ...this.getBlendMixin(node),
      ...this.getCornerMixin(node),
      ...this.getConstraintsMixin(node),
      ...this.getLayoutChildMixin(node),
    });
  }

  private exportEllipse(node: EllipseNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      ...this.getGeometryMixin(node),
      ...this.getBlendMixin(node),
      ...this.getConstraintsMixin(node),
      ...this.getLayoutChildMixin(node),
      arcData: node.arcData ? {
        startingAngle: node.arcData.startingAngle,
        endingAngle: node.arcData.endingAngle,
        innerRadius: node.arcData.innerRadius,
      } : undefined,
    });
  }

  private exportPolygon(node: PolygonNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      ...this.getGeometryMixin(node),
      ...this.getBlendMixin(node),
      ...this.getConstraintsMixin(node),
      ...this.getLayoutChildMixin(node),
      pointCount: node.pointCount,
    });
  }

  private exportStar(node: StarNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      ...this.getGeometryMixin(node),
      ...this.getBlendMixin(node),
      ...this.getConstraintsMixin(node),
      ...this.getLayoutChildMixin(node),
      pointCount: node.pointCount,
      innerRadius: node.innerRadius,
    });
  }

  private exportLine(node: LineNode, baseProps: Partial<DesignNode>): DesignNode {
    const strokeCap = node.strokeCap !== figma.mixed ? node.strokeCap : undefined;
    const strokeJoin = node.strokeJoin !== figma.mixed ? node.strokeJoin : undefined;

    return this.buildDesignNode({
      ...baseProps,
      height: 0,
      ...this.getStrokeMixin(node),
      ...this.getBlendMixin(node),
      ...this.getConstraintsMixin(node),
      ...this.getLayoutChildMixin(node),
      strokeCap,
      strokeJoin,
      dashPattern: node.dashPattern.length > 0 ? [...node.dashPattern] : undefined,
    });
  }

  private exportVector(node: VectorNode, baseProps: Partial<DesignNode>): DesignNode {
    let vectorPaths: VectorPathData[] | undefined;
    let vectorNetwork: VectorNetworkData | undefined;

    // Export vector paths - filter out NONE winding rule
    try {
      if (node.vectorPaths && node.vectorPaths.length > 0) {
        const validPaths = node.vectorPaths.filter(
          path => path.windingRule === 'NONZERO' || path.windingRule === 'EVENODD'
        );
        if (validPaths.length > 0) {
          vectorPaths = validPaths.map(path => ({
            windingRule: path.windingRule as 'NONZERO' | 'EVENODD',
            data: path.data,
          }));
        }
      }
    } catch (e) {
      console.warn('Could not export vector paths:', e);
    }

    // Export vector network for more complex vectors
    try {
      if (node.vectorNetwork) {
        const network = node.vectorNetwork;
        vectorNetwork = {
          vertices: network.vertices.map(v => ({
            x: v.x,
            y: v.y,
            strokeCap: v.strokeCap,
            strokeJoin: v.strokeJoin,
            cornerRadius: v.cornerRadius,
            handleMirroring: v.handleMirroring,
          })),
          segments: network.segments.map(s => ({
            start: s.start,
            end: s.end,
            tangentStart: s.tangentStart ? { x: s.tangentStart.x, y: s.tangentStart.y } : undefined,
            tangentEnd: s.tangentEnd ? { x: s.tangentEnd.x, y: s.tangentEnd.y } : undefined,
          })),
          regions: network.regions?.map(r => ({
            windingRule: r.windingRule,
            loops: r.loops.map(loop => [...loop]),
            fills: this.exportFills(r.fills as readonly Paint[]),
            fillStyleId: r.fillStyleId,
          })),
        };
      }
    } catch (e) {
      console.warn('Could not export vector network:', e);
    }

    return this.buildDesignNode({
      ...baseProps,
      ...this.getGeometryMixin(node),
      ...this.getBlendMixin(node),
      ...this.getConstraintsMixin(node),
      ...this.getLayoutChildMixin(node),
      vectorPaths,
      vectorNetwork,
    });
  }

  // ==================== TEXT NODE ====================

  private exportText(node: TextNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      characters: node.characters,
      ...this.getTextMixin(node),
      ...this.getBlendMixin(node),
      ...this.getConstraintsMixin(node),
      ...this.getLayoutChildMixin(node),
      fills: this.exportFills(node.fills),
    });
  }

  private getTextMixin(node: TextNode): Partial<DesignNode> {
    const props: Record<string, unknown> = {};

    // Font name
    if (node.fontName !== figma.mixed) {
      props.fontName = {
        family: node.fontName.family,
        style: node.fontName.style,
      };
    }

    // Font size
    if (node.fontSize !== figma.mixed) {
      props.fontSize = node.fontSize;
    }

    // Text alignment
    props.textAlignHorizontal = node.textAlignHorizontal;
    props.textAlignVertical = node.textAlignVertical;

    // Line height
    if (node.lineHeight !== figma.mixed) {
      props.lineHeight = {
        unit: node.lineHeight.unit,
        value: node.lineHeight.unit !== 'AUTO' ? (node.lineHeight as any).value : undefined,
      };
    }

    // Letter spacing
    if (node.letterSpacing !== figma.mixed) {
      props.letterSpacing = {
        unit: node.letterSpacing.unit,
        value: node.letterSpacing.value,
      };
    }

    // Text case
    if (node.textCase !== figma.mixed && node.textCase !== 'ORIGINAL') {
      props.textCase = node.textCase;
    }

    // Text decoration
    if (node.textDecoration !== figma.mixed && node.textDecoration !== 'NONE') {
      props.textDecoration = node.textDecoration;
    }

    // Text auto resize
    props.textAutoResize = node.textAutoResize;

    // Paragraph settings
    if (node.paragraphIndent !== 0) {
      props.paragraphIndent = node.paragraphIndent;
    }
    if (node.paragraphSpacing !== 0) {
      props.paragraphSpacing = node.paragraphSpacing;
    }

    // List spacing
    if (node.listSpacing !== 0) {
      props.listSpacing = node.listSpacing;
    }

    // Hanging punctuation
    if (node.hangingPunctuation) {
      props.hangingPunctuation = node.hangingPunctuation;
    }
    if (node.hangingList) {
      props.hangingList = node.hangingList;
    }

    // Leading trim
    if (node.leadingTrim !== figma.mixed && node.leadingTrim !== 'NONE') {
      props.leadingTrim = node.leadingTrim;
    }

    // Text truncation
    if (node.textTruncation !== 'DISABLED') {
      props.textTruncation = node.textTruncation;
    }
    if (node.maxLines !== null) {
      props.maxLines = node.maxLines;
    }

    // Hyperlink
    if (node.hyperlink !== figma.mixed && node.hyperlink !== null) {
      props.hyperlink = node.hyperlink;
    }

    // Text style ID
    if (node.textStyleId !== figma.mixed && node.textStyleId !== '') {
      props.textStyleId = node.textStyleId;
    }

    return props as Partial<DesignNode>;
  }

  // ==================== BOOLEAN OPERATION ====================

  private exportBooleanOperation(node: BooleanOperationNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
      ...this.getGeometryMixin(node),
      ...this.getBlendMixin(node),
      booleanOperation: node.booleanOperation,
      children: this.exportChildren(node),
    });
  }

  // ==================== OTHER NODES ====================

  private exportSlice(node: SliceNode, baseProps: Partial<DesignNode>): DesignNode {
    return this.buildDesignNode({
      ...baseProps,
    });
  }

  private exportGeneric(node: SceneNode, baseProps: Partial<DesignNode>): DesignNode {
    const props: Record<string, unknown> = { ...baseProps };

    if ('fills' in node) {
      props.fills = this.exportFills((node as any).fills);
    }
    if ('strokes' in node) {
      props.strokes = this.exportFills((node as any).strokes);
    }
    if ('children' in node) {
      props.children = this.exportChildren(node as any);
    }

    return this.buildDesignNode(props);
  }

  // ==================== MIXINS ====================

  private getGeometryMixin(node: GeometryMixin & MinimalStrokesMixin): Partial<DesignNode> {
    const props: Record<string, unknown> = {};

    // Fills
    const fills = this.exportFills(node.fills);
    if (fills) props.fills = fills;

    // Fill style ID
    if (node.fillStyleId !== figma.mixed && node.fillStyleId !== '') {
      props.fillStyleId = node.fillStyleId;
    }

    // Strokes
    const strokes = this.exportFills(node.strokes);
    if (strokes) props.strokes = strokes;

    // Stroke style ID
    if (node.strokeStyleId !== '') {
      props.strokeStyleId = node.strokeStyleId;
    }

    // Stroke weight
    const strokeWeight = node.strokeWeight;
    if (typeof strokeWeight === 'number' && strokeWeight > 0) {
      props.strokeWeight = strokeWeight;
    }

    // Individual stroke weights
    if ('strokeTopWeight' in node) {
      const sNode = node as any;
      if (sNode.strokeTopWeight !== sNode.strokeWeight ||
        sNode.strokeRightWeight !== sNode.strokeWeight ||
        sNode.strokeBottomWeight !== sNode.strokeWeight ||
        sNode.strokeLeftWeight !== sNode.strokeWeight) {
        props.individualStrokeWeights = {
          top: sNode.strokeTopWeight,
          right: sNode.strokeRightWeight,
          bottom: sNode.strokeBottomWeight,
          left: sNode.strokeLeftWeight,
        };
      }
    }

    // Stroke align
    if (node.strokeAlign !== 'INSIDE') {
      props.strokeAlign = node.strokeAlign;
    }

    // Stroke cap and join
    if ('strokeCap' in node && node.strokeCap !== figma.mixed) {
      if (node.strokeCap !== 'NONE') {
        props.strokeCap = node.strokeCap;
      }
    }
    if ('strokeJoin' in node && node.strokeJoin !== figma.mixed) {
      if (node.strokeJoin !== 'MITER') {
        props.strokeJoin = node.strokeJoin;
      }
    }

    // Stroke miter limit
    if ('strokeMiterLimit' in node && (node as any).strokeMiterLimit !== 4) {
      props.strokeMiterLimit = (node as any).strokeMiterLimit;
    }

    // Dash pattern
    if ('dashPattern' in node && node.dashPattern.length > 0) {
      props.dashPattern = [...node.dashPattern];
    }

    return props as Partial<DesignNode>;
  }

  private getStrokeMixin(node: MinimalStrokesMixin): Partial<DesignNode> {
    const props: Record<string, unknown> = {};

    const strokes = this.exportFills(node.strokes);
    if (strokes) props.strokes = strokes;

    const strokeWeight = node.strokeWeight;
    if (typeof strokeWeight === 'number' && strokeWeight > 0) {
      props.strokeWeight = strokeWeight;
    }

    if (node.strokeAlign !== 'INSIDE') {
      props.strokeAlign = node.strokeAlign;
    }

    if ('dashPattern' in node && node.dashPattern.length > 0) {
      props.dashPattern = [...node.dashPattern];
    }

    return props as Partial<DesignNode>;
  }

  private getBlendMixin(node: SceneNode): Partial<DesignNode> {
    const props: Record<string, unknown> = {};

    // Check if node has blend mixin properties
    if (!('opacity' in node)) {
      return props as Partial<DesignNode>;
    }

    const blendNode = node as SceneNode & MinimalBlendMixin;

    // Opacity
    if (blendNode.opacity !== 1) {
      props.opacity = blendNode.opacity;
    }

    // Blend mode
    if (blendNode.blendMode !== 'PASS_THROUGH' && blendNode.blendMode !== 'NORMAL') {
      props.blendMode = blendNode.blendMode;
    }

    // Is mask - check if property exists
    if ('isMask' in blendNode && (blendNode as any).isMask) {
      props.isMask = true;
    }

    // Effects - filter to only supported types and use any to avoid type conflicts
    if ('effects' in blendNode && blendNode.effects.length > 0) {
      const allEffects = blendNode.effects as readonly any[];
      const supportedEffects = allEffects.filter(
        (effect) =>
          effect.type === 'DROP_SHADOW' ||
          effect.type === 'INNER_SHADOW' ||
          effect.type === 'LAYER_BLUR' ||
          effect.type === 'BACKGROUND_BLUR'
      );
      if (supportedEffects.length > 0) {
        props.effects = this.exportEffects(supportedEffects);
      }
    }

    // Effect style ID
    if ('effectStyleId' in blendNode && (blendNode as any).effectStyleId !== '') {
      props.effectStyleId = (blendNode as any).effectStyleId;
    }

    return props as Partial<DesignNode>;
  }

  private getCornerMixin(node: SceneNode): Partial<DesignNode> {
    const props: Record<string, unknown> = {};

    if (!('cornerRadius' in node)) {
      return props as Partial<DesignNode>;
    }

    const cornerNode = node as RectangleNode | FrameNode | ComponentNode;

    if (cornerNode.cornerRadius === figma.mixed) {
      // Individual corner radii
      if (cornerNode.topLeftRadius > 0) props.topLeftRadius = cornerNode.topLeftRadius;
      if (cornerNode.topRightRadius > 0) props.topRightRadius = cornerNode.topRightRadius;
      if (cornerNode.bottomLeftRadius > 0) props.bottomLeftRadius = cornerNode.bottomLeftRadius;
      if (cornerNode.bottomRightRadius > 0) props.bottomRightRadius = cornerNode.bottomRightRadius;
    } else if (cornerNode.cornerRadius > 0) {
      props.cornerRadius = cornerNode.cornerRadius;
    }

    // Corner smoothing
    if ('cornerSmoothing' in cornerNode && cornerNode.cornerSmoothing > 0) {
      props.cornerSmoothing = cornerNode.cornerSmoothing;
    }

    return props as Partial<DesignNode>;
  }

  private getConstraintsMixin(node: SceneNode): Partial<DesignNode> {
    const props: Record<string, unknown> = {};

    if (!('constraints' in node)) {
      return props as Partial<DesignNode>;
    }

    const constraintNode = node as ConstraintMixin;
    if (constraintNode.constraints) {
      const { horizontal, vertical } = constraintNode.constraints;
      if (horizontal !== 'MIN' || vertical !== 'MIN') {
        props.constraints = { horizontal, vertical };
      }
    }

    return props as Partial<DesignNode>;
  }

  private getLayoutMixin(node: SceneNode): Partial<DesignNode> {
    const props: Record<string, unknown> = {};

    if (!('minWidth' in node)) {
      return props as Partial<DesignNode>;
    }

    const layoutNode = node as LayoutMixin;

    // Size constraints
    if (layoutNode.minWidth !== null) props.minWidth = layoutNode.minWidth;
    if (layoutNode.maxWidth !== null) props.maxWidth = layoutNode.maxWidth;
    if (layoutNode.minHeight !== null) props.minHeight = layoutNode.minHeight;
    if (layoutNode.maxHeight !== null) props.maxHeight = layoutNode.maxHeight;

    return props as Partial<DesignNode>;
  }

  private getAutoLayoutMixin(node: BaseFrameMixin): Partial<DesignNode> {
    const props: Record<string, unknown> = {};

    if (node.layoutMode === 'NONE') {
      return props;
    }

    props.layoutMode = node.layoutMode;

    // Sizing modes
    props.primaryAxisSizingMode = node.primaryAxisSizingMode;
    props.counterAxisSizingMode = node.counterAxisSizingMode;

    // Alignment
    props.primaryAxisAlignItems = node.primaryAxisAlignItems;
    props.counterAxisAlignItems = node.counterAxisAlignItems;

    // Spacing
    if (node.itemSpacing !== 0) props.itemSpacing = node.itemSpacing;
    if (node.counterAxisSpacing !== null) props.counterAxisSpacing = node.counterAxisSpacing;

    // Padding
    if (node.paddingTop !== 0) props.paddingTop = node.paddingTop;
    if (node.paddingRight !== 0) props.paddingRight = node.paddingRight;
    if (node.paddingBottom !== 0) props.paddingBottom = node.paddingBottom;
    if (node.paddingLeft !== 0) props.paddingLeft = node.paddingLeft;

    // Wrap
    if (node.layoutWrap !== 'NO_WRAP') props.layoutWrap = node.layoutWrap;

    // Counter axis align content (for wrap)
    if ('counterAxisAlignContent' in node && (node as any).counterAxisAlignContent !== 'AUTO') {
      props.counterAxisAlignContent = (node as any).counterAxisAlignContent;
    }

    // Z-index reversal
    if (node.itemReverseZIndex) props.itemReverseZIndex = true;

    return props as Partial<DesignNode>;
  }

  private getLayoutChildMixin(node: SceneNode): Partial<DesignNode> {
    const props: Record<string, unknown> = {};

    if ('layoutAlign' in node && (node as any).layoutAlign !== 'INHERIT') {
      props.layoutAlign = (node as any).layoutAlign;
    }
    if ('layoutGrow' in node && (node as any).layoutGrow !== 0) {
      props.layoutGrow = (node as any).layoutGrow;
    }
    if ('layoutPositioning' in node && (node as any).layoutPositioning !== 'AUTO') {
      props.layoutPositioning = (node as any).layoutPositioning;
    }
    if ('layoutSizingHorizontal' in node) {
      props.layoutSizingHorizontal = (node as any).layoutSizingHorizontal;
    }
    if ('layoutSizingVertical' in node) {
      props.layoutSizingVertical = (node as any).layoutSizingVertical;
    }

    return props as Partial<DesignNode>;
  }

  private getFrameSpecificProps(node: BaseFrameMixin): Partial<DesignNode> {
    const props: Record<string, unknown> = {};

    // Clips content
    if (!node.clipsContent) {
      props.clipsContent = false;
    }

    // Guides
    if ('guides' in node && (node as any).guides?.length > 0) {
      props.guides = (node as any).guides.map((g: Guide) => ({
        axis: g.axis,
        offset: g.offset,
      }));
    }

    // Layout grids
    if (node.layoutGrids && node.layoutGrids.length > 0) {
      props.layoutGrids = node.layoutGrids.map(grid => {
        const gridDef: LayoutGridDef = {
          pattern: grid.pattern,
          visible: grid.visible !== undefined ? grid.visible : true,
          color: grid.color ? {
            r: grid.color.r,
            g: grid.color.g,
            b: grid.color.b,
            a: grid.color.a,
          } : { r: 0, g: 0, b: 0, a: 0.1 },
        };

        if (grid.pattern !== 'GRID') {
          const rowColGrid = grid as RowsColsLayoutGrid;
          return {
            ...gridDef,
            alignment: rowColGrid.alignment,
            gutterSize: rowColGrid.gutterSize,
            count: rowColGrid.count,
            sectionSize: rowColGrid.sectionSize,
            offset: rowColGrid.offset,
          };
        } else {
          return {
            ...gridDef,
            sectionSize: (grid as GridLayoutGrid).sectionSize,
          };
        }
      });
    }

    // Grid style ID
    if (node.gridStyleId !== '') {
      props.gridStyleId = node.gridStyleId;
    }

    return props as Partial<DesignNode>;
  }

  // ==================== FILLS AND EFFECTS ====================

  private exportFills(paints: readonly Paint[] | typeof figma.mixed): Fill[] | undefined {
    if (!paints || paints === figma.mixed || paints.length === 0) {
      return undefined;
    }

    const fills: Fill[] = [];

    for (const paint of paints) {
      const fill = this.exportPaint(paint);
      if (fill) fills.push(fill);
    }

    return fills.length > 0 ? fills : undefined;
  }

  private exportPaint(paint: Paint): Fill | null {
    const baseFill: Fill = {
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
          color: {
            r: this.roundValue(solidPaint.color.r),
            g: this.roundValue(solidPaint.color.g),
            b: this.roundValue(solidPaint.color.b),
          },
        };
      }
      case 'GRADIENT_LINEAR':
      case 'GRADIENT_RADIAL':
      case 'GRADIENT_ANGULAR':
      case 'GRADIENT_DIAMOND': {
        const gradientPaint = paint as GradientPaint;
        return {
          ...baseFill,
          gradientStops: gradientPaint.gradientStops.map(stop => ({
            position: stop.position,
            color: {
              r: this.roundValue(stop.color.r),
              g: this.roundValue(stop.color.g),
              b: this.roundValue(stop.color.b),
              a: stop.color.a,
            },
          })),
          gradientTransform: gradientPaint.gradientTransform.map(row => [...row]),
        };
      }
      case 'IMAGE': {
        const imagePaint = paint as ImagePaint;
        return {
          ...baseFill,
          imageHash: imagePaint.imageHash,
          scaleMode: imagePaint.scaleMode,
          imageTransform: imagePaint.imageTransform ?
            imagePaint.imageTransform.map(row => [...row]) : undefined,
          scalingFactor: imagePaint.scalingFactor,
          rotation: imagePaint.rotation !== 0 ? imagePaint.rotation : undefined,
          filters: imagePaint.filters ? { ...imagePaint.filters } : undefined,
        };
      }
      case 'VIDEO': {
        const videoPaint = paint as VideoPaint;
        return {
          ...baseFill,
          videoHash: videoPaint.videoHash,
          scaleMode: videoPaint.scaleMode,
        };
      }
      default:
        return null;
    }
  }

  private exportEffects(effects: readonly any[]): DomainEffect[] {
    return effects.map(effect => {
      if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
        const shadow = effect as DropShadowEffect | InnerShadowEffect;
        const exportedEffect: DomainEffect = {
          type: effect.type,
          visible: effect.visible,
          radius: shadow.radius,
          color: {
            r: this.roundValue(shadow.color.r),
            g: this.roundValue(shadow.color.g),
            b: this.roundValue(shadow.color.b),
            a: shadow.color.a,
          },
          offset: {
            x: shadow.offset.x,
            y: shadow.offset.y,
          },
          spread: shadow.spread,
          blendMode: shadow.blendMode,
        };

        if (effect.type === 'DROP_SHADOW' && (shadow as DropShadowEffect).showShadowBehindNode) {
          return { ...exportedEffect, showShadowBehindNode: true };
        }

        return exportedEffect;
      } else {
        const blur = effect as BlurEffect;
        return {
          type: effect.type,
          visible: effect.visible,
          radius: blur.radius,
        } as DomainEffect;
      }
    });
  }

  // ==================== CHILDREN ====================

  private exportChildren(node: { children: readonly SceneNode[] }): DesignNode[] | undefined {
    if (!node.children || node.children.length === 0) {
      return undefined;
    }

    const children: DesignNode[] = [];

    for (const child of node.children) {
      const exported = this.export(child);
      if (exported) {
        children.push(exported);
      }
    }

    return children.length > 0 ? children : undefined;
  }

  // ==================== UTILITIES ====================

  private roundValue(value: number, precision: number = 4): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  private buildDesignNode(props: Record<string, unknown>): DesignNode {
    const cleaned: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }

    return cleaned as unknown as DesignNode;
  }
}