import { Fill } from './fill';
import { Effect } from './effect';
import { Constraints } from './constraints';
import { FontName, LineHeight, LetterSpacing } from '../value-objects/typography';
import {
  NodeType,
  LayoutMode,
  HorizontalAlignment,
  VerticalAlignment,
  AxisAlignment,
  CounterAxisAlignment,
  SizingMode,
  StrokeAlign,
  StrokeCap,
  StrokeJoin,
  TextAutoResize,
  TextCase,
  TextDecoration,
  LayoutWrap,
  LayoutPositioning,
  LayoutAlign,
  LayoutSizing,
} from '../../shared/types/node-types';

/**
 * Arc data for ellipses
 */
export interface ArcData {
  readonly startingAngle: number;
  readonly endingAngle: number;
  readonly innerRadius: number;
}

/**
 * Individual stroke weights
 */
export interface IndividualStrokeWeights {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/**
 * Hyperlink target
 */
export interface HyperlinkTarget {
  readonly type: 'URL' | 'NODE';
  readonly value: string;
}

/**
 * Guide definition
 */
export interface Guide {
  readonly axis: 'X' | 'Y';
  readonly offset: number;
}

/**
 * Layout grid definition
 */
export interface LayoutGridDef {
  readonly pattern: 'ROWS' | 'COLUMNS' | 'GRID';
  readonly visible: boolean;
  readonly color: { r: number; g: number; b: number; a: number };
  readonly alignment?: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH';
  readonly gutterSize?: number;
  readonly count?: number;
  readonly sectionSize?: number;
  readonly offset?: number;
}

/**
 * Main Design Node entity
 * Represents a node in the design tree with ALL Figma properties
 */
export interface DesignNode {
  // Identity
  readonly name: string;
  readonly type: NodeType;

  // Position & Transform
  readonly x: number;
  readonly y: number;
  readonly width?: number;
  readonly height?: number;
  readonly rotation?: number;
  readonly relativeTransform?: number[][];

  // Fills and Strokes
  readonly fills?: Fill[];
  readonly strokes?: Fill[];
  readonly strokeWeight?: number;
  readonly strokeAlign?: StrokeAlign;
  readonly strokeCap?: StrokeCap;
  readonly strokeJoin?: StrokeJoin;
  readonly strokeMiterLimit?: number;
  readonly dashPattern?: number[];
  readonly individualStrokeWeights?: IndividualStrokeWeights;

  // Corner Radius
  readonly cornerRadius?: number;
  readonly topLeftRadius?: number;
  readonly topRightRadius?: number;
  readonly bottomLeftRadius?: number;
  readonly bottomRightRadius?: number;
  readonly cornerSmoothing?: number;

  // Text Properties
  readonly characters?: string;
  readonly fontSize?: number;
  readonly fontName?: FontName;
  readonly textAlignHorizontal?: HorizontalAlignment;
  readonly textAlignVertical?: VerticalAlignment;
  readonly lineHeight?: LineHeight;
  readonly letterSpacing?: LetterSpacing;
  readonly textCase?: TextCase;
  readonly textDecoration?: TextDecoration;
  readonly textAutoResize?: TextAutoResize;
  readonly paragraphIndent?: number;
  readonly paragraphSpacing?: number;
  readonly listSpacing?: number;
  readonly hangingPunctuation?: boolean;
  readonly hangingList?: boolean;
  readonly autoRename?: boolean;
  readonly hyperlink?: HyperlinkTarget | null;
  readonly textTruncation?: 'DISABLED' | 'ENDING';
  readonly maxLines?: number | null;
  readonly leadingTrim?: 'NONE' | 'CAP_HEIGHT';

  // Layout Properties (Auto-layout parent)
  readonly layoutMode?: LayoutMode;
  readonly primaryAxisSizingMode?: SizingMode;
  readonly counterAxisSizingMode?: SizingMode;
  readonly primaryAxisAlignItems?: AxisAlignment;
  readonly counterAxisAlignItems?: CounterAxisAlignment;
  readonly counterAxisAlignContent?: 'AUTO' | 'SPACE_BETWEEN';
  readonly itemSpacing?: number;
  readonly counterAxisSpacing?: number | null;
  readonly paddingTop?: number;
  readonly paddingRight?: number;
  readonly paddingBottom?: number;
  readonly paddingLeft?: number;
  readonly layoutWrap?: LayoutWrap;
  readonly itemReverseZIndex?: boolean;
  readonly numberOfFixedChildren?: number;

  // Layout Child Properties
  readonly layoutGrow?: number;
  readonly layoutAlign?: LayoutAlign;
  readonly layoutPositioning?: LayoutPositioning;
  readonly layoutSizingHorizontal?: LayoutSizing;
  readonly layoutSizingVertical?: LayoutSizing;

  // Size Constraints
  readonly minWidth?: number | null;
  readonly maxWidth?: number | null;
  readonly minHeight?: number | null;
  readonly maxHeight?: number | null;

  // Visual Properties
  readonly opacity?: number;
  readonly blendMode?: BlendMode;
  readonly effects?: Effect[];
  readonly constraints?: Constraints;
  readonly clipsContent?: boolean;
  readonly visible?: boolean;
  readonly locked?: boolean;
  readonly isMask?: boolean;
  readonly maskType?: 'ALPHA' | 'VECTOR' | 'LUMINANCE';

  // Frame-specific
  readonly guides?: Guide[];
  readonly layoutGrids?: LayoutGridDef[];

  // Shape-specific Properties
  readonly arcData?: ArcData;
  readonly pointCount?: number;
  readonly innerRadius?: number;

  // Boolean operation
  readonly booleanOperation?: 'UNION' | 'INTERSECT' | 'SUBTRACT' | 'EXCLUDE';

  // Vector paths (for vector nodes) - using string data for serialization
  readonly vectorPaths?: VectorPathData[];
  readonly vectorNetwork?: VectorNetworkData;

  // Section properties
  readonly sectionContentsHidden?: boolean;

  // Plugin data (optional)
  readonly pluginData?: Record<string, string>;
  readonly sharedPluginData?: Record<string, Record<string, string>>;

  // Style references
  readonly fillStyleId?: string;
  readonly strokeStyleId?: string;
  readonly effectStyleId?: string;
  readonly gridStyleId?: string;
  readonly textStyleId?: string;

  // Children
  readonly children?: DesignNode[];
}

/**
 * Vector path data for serialization
 */
export interface VectorPathData {
  readonly windingRule: 'NONZERO' | 'EVENODD';
  readonly data: string;
}

/**
 * Vector network data for serialization
 */
export interface VectorNetworkData {
  readonly vertices: VectorVertexData[];
  readonly segments: VectorSegmentData[];
  readonly regions?: VectorRegionData[];
}

export interface VectorVertexData {
  readonly x: number;
  readonly y: number;
  readonly strokeCap?: StrokeCap;
  readonly strokeJoin?: StrokeJoin;
  readonly cornerRadius?: number;
  readonly handleMirroring?: 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH';
}

export interface VectorSegmentData {
  readonly start: number;
  readonly end: number;
  readonly tangentStart?: { x: number; y: number };
  readonly tangentEnd?: { x: number; y: number };
}

export interface VectorRegionData {
  readonly windingRule: 'NONZERO' | 'EVENODD';
  readonly loops: number[][];
  readonly fills?: Fill[];
  readonly fillStyleId?: string;
}

/**
 * Type guard for frame-like nodes
 */
export function isFrameNode(node: DesignNode): boolean {
  return ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'SECTION'].includes(node.type);
}

/**
 * Type guard for text nodes
 */
export function isTextNode(node: DesignNode): node is DesignNode & { characters: string } {
  return node.type === 'TEXT';
}

/**
 * Type guard for nodes with children
 */
export function hasChildren(node: DesignNode): node is DesignNode & { children: DesignNode[] } {
  return node.children !== undefined && node.children.length > 0;
}

/**
 * Type guard for vector nodes
 */
export function isVectorNode(node: DesignNode): boolean {
  return node.type === 'VECTOR';
}

/**
 * Type guard for shape nodes
 */
export function isShapeNode(node: DesignNode): boolean {
  return ['RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'LINE', 'VECTOR'].includes(node.type);
}
