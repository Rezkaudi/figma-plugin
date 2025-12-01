import { DesignNode } from '../../../domain/entities/design-node';
import { BaseNodeCreator } from './base-node.creator';

/**
 * Creator for Rectangle nodes
 */
export class RectangleNodeCreator extends BaseNodeCreator {
  /**
   * Create a rectangle node from design data
   */
  async create(nodeData: DesignNode): Promise<RectangleNode> {
    const rectNode = figma.createRectangle();
    rectNode.name = nodeData.name || 'Rectangle';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    rectNode.resize(width, height);

    this.applyFills(rectNode, nodeData.fills);
    this.applyStrokes(rectNode, nodeData);
    this.applyCornerRadius(rectNode, nodeData);

    return rectNode;
  }

  /**
   * Create a rectangle as a frame (when it has children)
   */
  async createAsFrame(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: FrameNode) => Promise<void>
  ): Promise<FrameNode> {
    const rectFrame = figma.createFrame();
    rectFrame.name = nodeData.name || 'Rectangle';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    rectFrame.resize(width, height);

    this.applyFills(rectFrame, nodeData.fills);
    this.applyStrokes(rectFrame, nodeData);
    this.applyCornerRadius(rectFrame, nodeData);

    // Apply auto-layout if specified
    this.applyAutoLayout(rectFrame, nodeData);

    // Apply frame-specific properties
    this.applyFrameProperties(rectFrame, nodeData);

    for (const child of nodeData.children!) {
      if (child && typeof child === 'object') {
        await createChildFn(child, rectFrame);
      }
    }

    return rectFrame;
  }
}
