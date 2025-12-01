import { NodeType } from '../../shared/types/node-types';

/**
 * Mapper for converting between Figma node types and domain node types
 */
export class NodeTypeMapper {
  private static readonly TYPE_MAP: Record<string, NodeType> = {
    FRAME: 'FRAME',
    GROUP: 'GROUP',
    RECTANGLE: 'RECTANGLE',
    TEXT: 'TEXT',
    ELLIPSE: 'ELLIPSE',
    VECTOR: 'VECTOR',
    LINE: 'LINE',
    POLYGON: 'POLYGON',
    STAR: 'STAR',
    COMPONENT: 'COMPONENT',
    COMPONENT_SET: 'COMPONENT_SET',
    INSTANCE: 'INSTANCE',
    BOOLEAN_OPERATION: 'BOOLEAN_OPERATION',
    SECTION: 'SECTION',
    SLICE: 'SLICE',
    CONNECTOR: 'CONNECTOR',
    STICKY: 'STICKY',
    SHAPE_WITH_TEXT: 'SHAPE_WITH_TEXT',
    STAMP: 'STAMP',
    HIGHLIGHT: 'HIGHLIGHT',
    WASHI_TAPE: 'WASHI_TAPE',
    TABLE: 'TABLE',
    TABLE_CELL: 'TABLE_CELL',
    EMBED: 'EMBED',
    LINK_UNFURL: 'LINK_UNFURL',
    MEDIA: 'MEDIA',
    CODE_BLOCK: 'CODE_BLOCK',
    WIDGET: 'WIDGET',
  };

  /**
   * Map Figma node type to domain node type
   */
  static toDomain(figmaType: string): NodeType {
    return NodeTypeMapper.TYPE_MAP[figmaType] || 'FRAME';
  }

  /**
   * Normalize node type to uppercase
   */
  static normalize(type: string): NodeType {
    const upperType = (type || 'FRAME').toUpperCase();
    return NodeTypeMapper.TYPE_MAP[upperType] || 'FRAME';
  }

  /**
   * Check if type is frame-like
   */
  static isFrameLike(type: NodeType): boolean {
    return ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'SECTION', 'COMPONENT_SET'].includes(type);
  }

  /**
   * Check if type supports children
   */
  static supportsChildren(type: NodeType): boolean {
    return [
      'FRAME',
      'GROUP',
      'COMPONENT',
      'INSTANCE',
      'BOOLEAN_OPERATION',
      'SECTION',
      'COMPONENT_SET',
      'TABLE',
    ].includes(type);
  }

  /**
   * Check if type is a shape
   */
  static isShape(type: NodeType): boolean {
    return ['RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'LINE', 'VECTOR'].includes(type);
  }
}
