import { DesignNode } from '../../../domain/entities/design-node';
import { BaseNodeCreator } from './base-node.creator';

/**
 * Creator for Component nodes
 */
export class ComponentNodeCreator extends BaseNodeCreator {
  /**
   * Create a component node from design data
   */
  async create(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: ComponentNode) => Promise<void>
  ): Promise<ComponentNode> {
    const componentNode = figma.createComponent();
    componentNode.name = nodeData.name || 'Component';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    componentNode.resize(width, height);

    this.applyFills(componentNode, nodeData.fills);
    this.applyStrokes(componentNode, nodeData);
    this.applyCornerRadius(componentNode, nodeData);

    // Apply frame-specific properties
    this.applyFrameProperties(componentNode, nodeData);

    // Apply auto-layout if specified
    this.applyAutoLayout(componentNode, nodeData);

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
      for (const child of nodeData.children) {
        if (child && typeof child === 'object') {
          await createChildFn(child, componentNode);
        }
      }
    }

    return componentNode;
  }

  /**
   * Create a boolean operation node
   */
  async createBooleanOperation(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: FrameNode) => Promise<void>
  ): Promise<BooleanOperationNode | FrameNode> {
    // First create children in a temporary frame
    const tempFrame = figma.createFrame();
    tempFrame.name = 'temp';

    const childNodes: SceneNode[] = [];
    if (nodeData.children && Array.isArray(nodeData.children)) {
      for (const child of nodeData.children) {
        if (child && typeof child === 'object') {
          await createChildFn(child, tempFrame);
        }
      }
      childNodes.push(...tempFrame.children);
    }

    // If we have at least 2 children, create boolean operation
    if (childNodes.length >= 2) {
      try {
        let booleanNode: BooleanOperationNode;
        const operation = nodeData.booleanOperation || 'UNION';

        switch (operation) {
          case 'UNION':
            booleanNode = figma.union(childNodes, figma.currentPage);
            break;
          case 'INTERSECT':
            booleanNode = figma.intersect(childNodes, figma.currentPage);
            break;
          case 'SUBTRACT':
            booleanNode = figma.subtract(childNodes, figma.currentPage);
            break;
          case 'EXCLUDE':
            booleanNode = figma.exclude(childNodes, figma.currentPage);
            break;
          default:
            booleanNode = figma.union(childNodes, figma.currentPage);
        }

        booleanNode.name = nodeData.name || 'Boolean';

        // Apply fills and strokes
        this.applyFills(booleanNode, nodeData.fills);
        this.applyStrokes(booleanNode, nodeData);

        // Clean up temp frame
        tempFrame.remove();

        return booleanNode;
      } catch (e) {
        console.warn('Could not create boolean operation:', e);
        // Return the temp frame as fallback
        tempFrame.name = nodeData.name || 'Boolean (fallback)';
        const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
        tempFrame.resize(width, height);
        return tempFrame;
      }
    }

    // Not enough children, return as frame
    tempFrame.name = nodeData.name || 'Boolean (empty)';
    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    tempFrame.resize(width, height);
    this.applyFills(tempFrame, nodeData.fills);
    return tempFrame;
  }
}
