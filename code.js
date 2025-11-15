
figma.showUI(__html__, { width: 340, height: 400 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-design') {
    let data = msg.data;
    if (data.success && data.design && data.design.components) {
      data = {
        type: 'frame',
        name: 'AI Generated Page',
        styles: { layout: 'vertical' },
        children: data.design.components || data.elements
      };
    }

    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 0, g: 0, b: 0 };
    }

    function parseUnit(value) {
      if (typeof value === 'string') return parseFloat(value) || 0;
      return value || 0;
    }

    async function loadFont(fontFamily = 'Arial', fontWeight = 'Regular') {
      try {
        await figma.loadFontAsync({ family: fontFamily, style: fontWeight });
        return { family: fontFamily, style: fontWeight };
      } catch (e) {
        console.log(`Warning: Font '${fontFamily} - ${fontWeight}' not found. Falling back to Arial.`);
        await figma.loadFontAsync({ family: 'Arial', style: 'Regular' });
        return { family: 'Arial', style: 'Regular' };
      }
    }

    async function createNode(obj, isTopLevel = false) {
      if (!obj || !obj.type) return null;

      let node;
      const styles = obj.styles || {};
      
      let nodeType = 'frame';
      const originalType = obj.type.toLowerCase();
      const textTypes = ['text', 'h1', 'h2', 'h3', 'h4', 'p', 'span', 'a', 'li', 'logo', 'price', 'tagline'];
      if (textTypes.includes(originalType) || (obj.content && !obj.children && !obj.elements)) {
        nodeType = 'text';
      } else if (originalType === 'button') {
        nodeType = 'button';
      }

      if (nodeType === 'text') {
        node = figma.createText();
        let weight = (styles.fontWeight >= 600 || styles.fontWeight === 'bold') ? 'Bold' : 'Regular';
        node.fontName = await loadFont(styles.fontFamily, weight);
        
        node.characters = obj.content || "";
        if (styles.fontSize) node.fontSize = parseUnit(styles.fontSize);
        if (styles.color) node.fills = [{ type: 'SOLID', color: hexToRgb(styles.color) }];
        if (styles.textAlign) node.textAlignHorizontal = styles.textAlign.toUpperCase();

      } else { 
        node = figma.createFrame();
        node.fills = [];

        if (nodeType === 'button') {
            if (styles.backgroundColor) node.fills = [{ type: 'SOLID', color: hexToRgb(styles.backgroundColor) }];
            if (styles.borderRadius) node.cornerRadius = parseUnit(styles.borderRadius);
            
            if (styles.padding) {
                const paddingStr = String(styles.padding);
                const parts = paddingStr.split(' ').map(p => parseUnit(p));
                if (parts.length === 1) {
                    const p = parts[0];
                    node.paddingTop = p; node.paddingBottom = p; node.paddingLeft = p; node.paddingRight = p;
                } else if (parts.length >= 2) {
                    node.paddingTop = node.paddingBottom = parts[0];
                    node.paddingLeft = node.paddingRight = parts[1];
                }
            }

            if (obj.content) {
                const textNode = figma.createText();
                let weight = (styles.fontWeight >= 600 || styles.fontWeight === 'bold') ? 'Bold' : 'Regular';
                textNode.fontName = await loadFont(styles.fontFamily, weight);
                textNode.characters = obj.content;
                if (styles.color) textNode.fills = [{ type: 'SOLID', color: hexToRgb(styles.color) }];
                if (styles.fontSize) textNode.fontSize = parseUnit(styles.fontSize);
                node.appendChild(textNode);
            }
            
            node.layoutMode = 'HORIZONTAL';
            node.primaryAxisSizingMode = 'AUTO';
            node.counterAxisSizingMode = 'AUTO';
        } else { 
            if (styles.background || styles.backgroundColor) {
              const bg = styles.background || styles.backgroundColor;
              if (bg.includes("gradient")) {
                const colors = bg.match(/#[0-9a-fA-F]{6}/g);
                if (colors && colors.length >= 2) {
                  const color1 = hexToRgb(colors[0]);
                  const color2 = hexToRgb(colors[1]);
                  node.fills = [{
                    type: 'GRADIENT_LINEAR',
                    gradientTransform: [[0.5, 0, 0], [0.5, 1, 0]],
                    gradientStops: [
                      { color: { r: color1.r, g: color1.g, b: color1.b, a: 1 }, position: 0 },
                      { color: { r: color2.r, g: color2.g, b: color2.b, a: 1 }, position: 1 }
                    ]
                  }];
                }
              } else {
                node.fills = [{ type: 'SOLID', color: hexToRgb(bg) }];
              }
            }
            if (styles.borderRadius) node.cornerRadius = parseUnit(styles.borderRadius);
        }

        if (styles.boxShadow) {
            node.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 12, visible: true, blendMode: 'NORMAL' }];
        }

        if (isTopLevel) {
            node.primaryAxisSizingMode = 'AUTO';
            node.counterAxisSizingMode = 'AUTO';
        } else if (nodeType !== 'button') {
            if (styles.width) node.resize(parseUnit(styles.width), node.height);
            if (styles.height) node.resize(node.width, parseUnit(styles.height));
            if (!styles.width) node.layoutAlign = 'STRETCH';
            if (!styles.height) node.primaryAxisSizingMode = 'AUTO';
        }

        if (nodeType !== 'button') {
            const layout = styles.layout || (styles.display === 'flex' && styles.flexDirection === 'row' ? 'horizontal' : 'vertical');
            node.layoutMode = (layout === 'horizontal') ? 'HORIZONTAL' : 'VERTICAL';
            if (styles.alignItems) node.counterAxisAlignItems = { 'center': 'CENTER', 'flex-start': 'MIN', 'end': 'MAX' }[styles.alignItems] || 'MIN';
            if (styles.justifyContent) node.primaryAxisAlignItems = { 'center': 'CENTER', 'space-between': 'SPACE_BETWEEN' }[styles.justifyContent] || 'MIN';
            const spacing = parseUnit(styles.spacing || styles.gap);
            if (spacing > 0) node.itemSpacing = spacing;
            const padding = parseUnit(styles.padding);
            if (padding > 0) {
                node.paddingTop = node.paddingRight = node.paddingBottom = node.paddingLeft = padding;
            } else {
                if (styles.paddingTop) node.paddingTop = parseUnit(styles.paddingTop);
                if (styles.paddingRight) node.paddingRight = parseUnit(styles.paddingRight);
                if (styles.paddingBottom) node.paddingBottom = parseUnit(styles.paddingBottom);
                if (styles.paddingLeft) node.paddingLeft = parseUnit(styles.paddingLeft);
            }
        }
      }

      if (!node) return null;
      node.name = obj.name || obj.className || obj.id || originalType;

      const children = obj.children || obj.elements;
      if (children && Array.isArray(children)) {
        for (const childObj of children) {
          const childNode = await createNode(childObj, false);
          if (childNode) node.appendChild(childNode);
        }
      }
      return node;
    }

    const finalDesign = await createNode(data, true);
    if (finalDesign) {
      figma.currentPage.appendChild(finalDesign);
      figma.viewport.scrollAndZoomIntoView([finalDesign]);
      figma.closePlugin("✅The design has been successfully created!");
    } else {
      figma.closePlugin("❌ Design creation failed. Check the console.");
    }
  }
};
