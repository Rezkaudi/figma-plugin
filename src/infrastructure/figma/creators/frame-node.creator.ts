import { DesignNode } from '../../../domain/entities/design-node';
import { BaseNodeCreator } from './base-node.creator';

/**
 * Creator for Frame nodes with full property support
 */
export class FrameNodeCreator extends BaseNodeCreator {
  /**
   * Create a frame node from design data
   */
  async create(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: FrameNode) => Promise<void>
  ): Promise<FrameNode> {
    const frameNode = figma.createFrame();
    frameNode.name = nodeData.name || 'Frame';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    frameNode.resize(width, height);

    // Apply fills and strokes
    this.applyFills(frameNode, nodeData.fills);
    this.applyStrokes(frameNode, nodeData);
    this.applyCornerRadius(frameNode, nodeData);

    // Apply frame-specific properties
    this.applyFrameProperties(frameNode, nodeData);

    // Apply auto-layout properties BEFORE creating children
    this.applyAutoLayout(frameNode, nodeData);

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
      for (const child of nodeData.children) {
        if (child && typeof child === 'object') {
          await createChildFn(child, frameNode);
        }
      }
    }

    return frameNode;
  }

  /**
   * Create a group-like frame (no fill, no clipping)
   */
  async createGroup(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: FrameNode) => Promise<void>
  ): Promise<FrameNode> {
    const groupFrame = figma.createFrame();
    groupFrame.name = nodeData.name || 'Group';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    groupFrame.resize(width, height);

    // Groups typically have no fill
    groupFrame.fills = [];
    groupFrame.clipsContent = false;

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
      for (const child of nodeData.children) {
        if (child && typeof child === 'object') {
          await createChildFn(child, groupFrame);
        }
      }
    }

    return groupFrame;
  }

  /**
   * Create a section node
   */
  async createSection(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: SectionNode) => Promise<void>
  ): Promise<SectionNode> {
    const sectionNode = figma.createSection();
    sectionNode.name = nodeData.name || 'Section';

    // Section resize
    if (nodeData.width && nodeData.height) {
      sectionNode.resizeWithoutConstraints(nodeData.width, nodeData.height);
    }

    // Apply fills
    this.applyFills(sectionNode, nodeData.fills);

    // Section-specific properties
    if (typeof nodeData.sectionContentsHidden === 'boolean') {
      sectionNode.sectionContentsHidden = nodeData.sectionContentsHidden;
    }

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
      for (const child of nodeData.children) {
        if (child && typeof child === 'object') {
          await createChildFn(child, sectionNode);
        }
      }
    }

    return sectionNode;
  }
}
