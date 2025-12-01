import { DesignNode } from '../../../domain/entities/design-node';
import { DefaultFonts } from '../../../domain/value-objects/typography';
import { BaseNodeCreator } from './base-node.creator';

/**
 * Creator for Text nodes with full text property support
 */
export class TextNodeCreator extends BaseNodeCreator {
  /**
   * Create a text node from design data
   */
  async create(nodeData: DesignNode): Promise<TextNode> {
    const textNode = figma.createText();
    textNode.name = nodeData.name || 'Text';

    // Load and apply font
    const fontToUse = await this.loadFont(nodeData.fontName);
    textNode.fontName = fontToUse;

    // Set characters (must be after font is set)
    if (nodeData.characters !== undefined && nodeData.characters !== null) {
      textNode.characters = String(nodeData.characters);
    } else {
      textNode.characters = '';
    }

    // Apply all text properties
    this.applyTextProperties(textNode, nodeData);

    // Apply fills (text color)
    this.applyFills(textNode, nodeData.fills);

    // Apply strokes if any
    this.applyStrokes(textNode, nodeData);

    return textNode;
  }

  private async loadFont(fontName?: { family: string; style: string }): Promise<FontName> {
    const defaultFont = DefaultFonts.INTER;

    if (fontName) {
      try {
        await figma.loadFontAsync(fontName);
        return fontName;
      } catch {
        console.warn(`Failed to load font ${fontName.family} ${fontName.style}, trying default`);
      }
    }

    try {
      await figma.loadFontAsync(defaultFont);
      return defaultFont;
    } catch {
      // Try Arial as last resort
      const arialFont = DefaultFonts.ARIAL;
      await figma.loadFontAsync(arialFont);
      return arialFont;
    }
  }

  private applyTextProperties(textNode: TextNode, nodeData: DesignNode): void {
    // Font size
    if (typeof nodeData.fontSize === 'number' && nodeData.fontSize > 0) {
      textNode.fontSize = nodeData.fontSize;
    }

    // Text alignment
    if (nodeData.textAlignHorizontal) {
      textNode.textAlignHorizontal = nodeData.textAlignHorizontal;
    }
    if (nodeData.textAlignVertical) {
      textNode.textAlignVertical = nodeData.textAlignVertical;
    }

    // Text decoration
    if (nodeData.textDecoration && nodeData.textDecoration !== 'NONE') {
      textNode.textDecoration = nodeData.textDecoration;
    }

    // Text case
    if (nodeData.textCase && nodeData.textCase !== 'ORIGINAL') {
      textNode.textCase = nodeData.textCase;
    }

    // Line height
    if (nodeData.lineHeight) {
      this.applyLineHeight(textNode, nodeData.lineHeight);
    }

    // Letter spacing
    if (nodeData.letterSpacing && typeof nodeData.letterSpacing.value === 'number') {
      textNode.letterSpacing = {
        unit: nodeData.letterSpacing.unit || 'PIXELS',
        value: nodeData.letterSpacing.value,
      };
    }

    // Paragraph settings
    if (typeof nodeData.paragraphIndent === 'number') {
      textNode.paragraphIndent = nodeData.paragraphIndent;
    }
    if (typeof nodeData.paragraphSpacing === 'number') {
      textNode.paragraphSpacing = nodeData.paragraphSpacing;
    }

    // List spacing
    if (typeof nodeData.listSpacing === 'number') {
      textNode.listSpacing = nodeData.listSpacing;
    }

    // Hanging punctuation
    if (typeof nodeData.hangingPunctuation === 'boolean') {
      textNode.hangingPunctuation = nodeData.hangingPunctuation;
    }
    if (typeof nodeData.hangingList === 'boolean') {
      textNode.hangingList = nodeData.hangingList;
    }

    // Leading trim
    if (nodeData.leadingTrim && nodeData.leadingTrim !== 'NONE') {
      textNode.leadingTrim = nodeData.leadingTrim;
    }

    // Text truncation
    if (nodeData.textTruncation && nodeData.textTruncation !== 'DISABLED') {
      textNode.textTruncation = nodeData.textTruncation;
    }
    if (typeof nodeData.maxLines === 'number') {
      textNode.maxLines = nodeData.maxLines;
    }

    // Hyperlink
    if (nodeData.hyperlink) {
      textNode.hyperlink = nodeData.hyperlink;
    }

    // Text auto resize
    this.applyTextAutoResize(textNode, nodeData);
  }

  private applyLineHeight(
    textNode: TextNode,
    lineHeight: { unit: string; value?: number }
  ): void {
    if (lineHeight.unit === 'AUTO') {
      textNode.lineHeight = { unit: 'AUTO' };
    } else if (
      (lineHeight.unit === 'PIXELS' || lineHeight.unit === 'PERCENT') &&
      typeof lineHeight.value === 'number'
    ) {
      textNode.lineHeight = {
        unit: lineHeight.unit,
        value: lineHeight.value,
      };
    }
  }

  private applyTextAutoResize(textNode: TextNode, nodeData: DesignNode): void {
    // If explicitly set in data, use it
    if (nodeData.textAutoResize) {
      textNode.textAutoResize = nodeData.textAutoResize;

      // Resize based on mode
      if (nodeData.textAutoResize === 'NONE' && nodeData.width && nodeData.height) {
        textNode.resize(nodeData.width, nodeData.height);
      } else if (nodeData.textAutoResize === 'HEIGHT' && nodeData.width) {
        textNode.resize(nodeData.width, textNode.height || 1);
      }
      // WIDTH_AND_HEIGHT and TRUNCATE handle themselves
      return;
    }

    // Fallback logic
    const isParentAutoLayout =
      nodeData.layoutAlign !== undefined || typeof nodeData.layoutGrow === 'number';

    if (isParentAutoLayout) {
      if (nodeData.width && nodeData.width > 0) {
        textNode.textAutoResize = 'HEIGHT';
        textNode.resize(nodeData.width, textNode.height || 1);
      } else {
        textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
      }
    } else {
      if (nodeData.width && nodeData.height) {
        textNode.textAutoResize = 'NONE';
        textNode.resize(nodeData.width, nodeData.height);
      } else if (nodeData.width) {
        textNode.textAutoResize = 'HEIGHT';
        textNode.resize(nodeData.width, textNode.height || 1);
      } else {
        textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
      }
    }
  }
}
