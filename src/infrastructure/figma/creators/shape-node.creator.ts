import { DesignNode, VectorPathData, VectorNetworkData } from '../../../domain/entities/design-node';
import { BaseNodeCreator } from './base-node.creator';
import { FillMapper } from '../../mappers/fill.mapper';

/**
 * Creator for shape nodes (Ellipse, Polygon, Star, Line, Vector)
 */
export class ShapeNodeCreator extends BaseNodeCreator {
  /**
   * Create an ellipse node
   */
  async createEllipse(nodeData: DesignNode): Promise<EllipseNode> {
    const ellipseNode = figma.createEllipse();
    ellipseNode.name = nodeData.name || 'Ellipse';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    ellipseNode.resize(width, height);

    this.applyFills(ellipseNode, nodeData.fills);
    this.applyStrokes(ellipseNode, nodeData);

    // Arc data for partial ellipses
    if (nodeData.arcData) {
      ellipseNode.arcData = {
        startingAngle: nodeData.arcData.startingAngle || 0,
        endingAngle: nodeData.arcData.endingAngle || 2 * Math.PI,
        innerRadius: nodeData.arcData.innerRadius || 0,
      };
    }

    return ellipseNode;
  }

  /**
   * Create a polygon node
   */
  async createPolygon(nodeData: DesignNode): Promise<PolygonNode> {
    const polygonNode = figma.createPolygon();
    polygonNode.name = nodeData.name || 'Polygon';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    polygonNode.resize(width, height);

    if (typeof nodeData.pointCount === 'number' && nodeData.pointCount >= 3) {
      polygonNode.pointCount = nodeData.pointCount;
    }

    this.applyFills(polygonNode, nodeData.fills);
    this.applyStrokes(polygonNode, nodeData);

    return polygonNode;
  }

  /**
   * Create a star node
   */
  async createStar(nodeData: DesignNode): Promise<StarNode> {
    const starNode = figma.createStar();
    starNode.name = nodeData.name || 'Star';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    starNode.resize(width, height);

    if (typeof nodeData.pointCount === 'number' && nodeData.pointCount >= 3) {
      starNode.pointCount = nodeData.pointCount;
    }
    if (typeof nodeData.innerRadius === 'number') {
      starNode.innerRadius = nodeData.innerRadius;
    }

    this.applyFills(starNode, nodeData.fills);
    this.applyStrokes(starNode, nodeData);

    return starNode;
  }

  /**
   * Create a line node
   */
  async createLine(nodeData: DesignNode): Promise<LineNode> {
    const lineNode = figma.createLine();
    lineNode.name = nodeData.name || 'Line';

    // Lines are resized differently - width is the length
    const width = Math.max(1, nodeData.width || 100);
    lineNode.resize(width, 0);

    // Lines typically use strokes, not fills
    if (nodeData.strokes && nodeData.strokes.length > 0) {
      this.applyStrokes(lineNode, nodeData);
    } else if (nodeData.fills && nodeData.fills.length > 0) {
      // If no strokes but has fills, use fills as strokes
      this.applyStrokes(lineNode, {
        ...nodeData,
        strokes: nodeData.fills,
        strokeWeight: nodeData.strokeWeight || 1,
      });
    } else {
      // Default stroke
      lineNode.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
      lineNode.strokeWeight = nodeData.strokeWeight || 1;
    }

    // Stroke caps and joins
    if (nodeData.strokeCap) {
      lineNode.strokeCap = nodeData.strokeCap;
    }
    if (nodeData.strokeJoin) {
      lineNode.strokeJoin = nodeData.strokeJoin;
    }

    // Dash pattern
    if (nodeData.dashPattern && Array.isArray(nodeData.dashPattern)) {
      lineNode.dashPattern = nodeData.dashPattern;
    }

    return lineNode;
  }

  /**
   * Create a vector node
   */
  async createVector(nodeData: DesignNode): Promise<VectorNode> {
    const vectorNode = figma.createVector();
    vectorNode.name = nodeData.name || 'Vector';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height, 24);

    // Try to apply vector paths if available
    if (nodeData.vectorPaths && nodeData.vectorPaths.length > 0) {
      try {
        vectorNode.vectorPaths = nodeData.vectorPaths.map(path => ({
          windingRule: path.windingRule,
          data: path.data,
        }));
      } catch (e) {
        console.warn('Could not apply vector paths:', e);
        vectorNode.resize(width, height);
      }
    } else if (nodeData.vectorNetwork) {
      // Try to apply vector network
      try {
        await this.applyVectorNetwork(vectorNode, nodeData.vectorNetwork);
      } catch (e) {
        console.warn('Could not apply vector network:', e);
        vectorNode.resize(width, height);
      }
    } else {
      vectorNode.resize(width, height);
    }

    this.applyFills(vectorNode, nodeData.fills);
    this.applyStrokes(vectorNode, nodeData);

    return vectorNode;
  }

  /**
   * Create a vector placeholder (for vectors that can't be fully recreated)
   */
  async createVectorPlaceholder(nodeData: DesignNode): Promise<VectorNode | RectangleNode> {
    // Try to create actual vector first
    if (nodeData.vectorPaths || nodeData.vectorNetwork) {
      try {
        return await this.createVector(nodeData);
      } catch (e) {
        console.warn('Vector creation failed, creating placeholder:', e);
      }
    }

    // Fallback to rectangle placeholder
    const placeholder = figma.createRectangle();
    placeholder.name = `${nodeData.name || 'Vector'} (placeholder)`;

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height, 24);
    placeholder.resize(width, height);

    this.applyFills(placeholder, nodeData.fills);
    this.applyStrokes(placeholder, nodeData);

    return placeholder;
  }

  /**
   * Apply vector network to a vector node
   */
  private async applyVectorNetwork(
    vectorNode: VectorNode,
    network: VectorNetworkData
  ): Promise<void> {
    // Convert our data format to Figma's format
    const vertices: VectorVertex[] = network.vertices.map(v => ({
      x: v.x,
      y: v.y,
      strokeCap: v.strokeCap,
      strokeJoin: v.strokeJoin,
      cornerRadius: v.cornerRadius,
      handleMirroring: v.handleMirroring,
    }));

    const segments: VectorSegment[] = network.segments.map(s => ({
      start: s.start,
      end: s.end,
      tangentStart: s.tangentStart,
      tangentEnd: s.tangentEnd,
    }));

    // For regions, we need to convert fills from our format to Paint[]
    const regions: VectorRegion[] | undefined = network.regions?.map(r => {
      const region: VectorRegion = {
        windingRule: r.windingRule,
        loops: r.loops,
      };

      // If there are fills, convert them to Paint format
      if (r.fills && r.fills.length > 0) {
        const paints = FillMapper.toPaint(r.fills);
        if (paints.length > 0) {
          (region as any).fills = paints;
        }
      }

      return region;
    });

    const figmaNetwork: VectorNetwork = {
      vertices,
      segments,
      regions,
    };

    vectorNode.vectorNetwork = figmaNetwork;
  }
}
