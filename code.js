figma.showUI(__html__, { width: 340, height: 400 });


/**
 * @param hex 
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}

/**
 * @param value 
 */
function parseUnit(value) {
    if (typeof value === 'string') return parseFloat(value) || 0;
    return value || 0;
}

/**
 * @param fontFamily 
 * @param fontWeight 
 */
async function loadFont(fontFamily = 'Inter', fontWeight = 'Regular') {
    try {
        let style = 'Regular';
        const lowerCaseWeight = (typeof fontWeight === 'string' ? fontWeight.toLowerCase() : String(fontWeight));

        if (['bold', '700', '900'].includes(lowerCaseWeight)) {
             style = 'Bold';
        } else if (['medium', '500'].includes(lowerCaseWeight)) {
             style = 'Medium';
        } else if (['semibold', '600'].includes(lowerCaseWeight)) {
             style = 'SemiBold';
        } else if (['regular', '400'].includes(lowerCaseWeight)) {
             style = 'Regular';
        } else {
             style = 'Regular'; 
        }
        
        await figma.loadFontAsync({ family: fontFamily, style: style });
        return { family: fontFamily, style: style };
    } catch (e) {
        await figma.loadFontAsync({ family: 'Arial', style: 'Regular' });
        return { family: 'Arial', style: 'Regular' };
    }
}

/**

 * @param node 
 */
function applyTextWrapCorrection(node) {
    if (node.type !== 'FRAME' || node.layoutMode !== 'VERTICAL' || node.counterAxisSizingMode !== 'FIXED') {
        return;
    }

    for (const childNode of node.children) {
        if (childNode.type === 'TEXT') {
            childNode.layoutAlign = 'STRETCH'; 
            
            childNode.textAutoResize = 'HEIGHT'; 
        } else if (childNode.type === 'FRAME' || childNode.type === 'COMPONENT') {
            applyTextWrapCorrection(childNode);
        }
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

    const definedWidth = styles.width ? parseUnit(styles.width) : 0;
    const definedHeight = styles.height ? parseUnit(styles.height) : 0;
    
    
    if (nodeType === 'text') {
        node = figma.createText();
        
        const font = await loadFont(styles.fontFamily, styles.fontWeight);
        node.fontName = font;
        
        node.characters = obj.content || "";
        if (styles.fontSize) node.fontSize = parseUnit(styles.fontSize);
        if (styles.color) node.fills = [{ type: 'SOLID', color: hexToRgb(styles.color) }];
        if (styles.textAlign) node.textAlignHorizontal = styles.textAlign.toUpperCase();
        
        node.textAutoResize = 'WIDTH_AND_HEIGHT'; 
        
        if (definedWidth > 0) node.resize(definedWidth, node.height);
        
    } else { 
        node = figma.createFrame();
        node.fills = [];

        if (nodeType === 'button') {
            if (styles.backgroundColor) node.fills = [{ type: 'SOLID', color: hexToRgb(styles.backgroundColor) }];
            if (styles.borderRadius) node.cornerRadius = parseUnit(styles.borderRadius);
            
            const paddingValue = parseUnit(styles.padding);
            if (paddingValue > 0) {
                node.paddingTop = node.paddingBottom = node.paddingLeft = node.paddingRight = paddingValue;
            } else {
                if (styles.paddingTop) node.paddingTop = parseUnit(styles.paddingTop);
                if (styles.paddingRight) node.paddingRight = parseUnit(styles.paddingRight);
                if (styles.paddingBottom) node.paddingBottom = parseUnit(styles.paddingBottom);
                if (styles.paddingLeft) node.paddingLeft = parseUnit(styles.paddingLeft);
            }
            
            if (obj.content) {
                const textNode = figma.createText();
                const font = await loadFont(styles.fontFamily, styles.fontWeight);
                textNode.fontName = font;
                textNode.characters = obj.content;
                if (styles.color) textNode.fills = [{ type: 'SOLID', color: hexToRgb(styles.color) }];
                if (styles.fontSize) textNode.fontSize = parseUnit(styles.fontSize);
                textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
                node.appendChild(textNode);
            }
            
            node.layoutMode = 'HORIZONTAL';
            node.primaryAxisSizingMode = 'AUTO';
            node.counterAxisSizingMode = 'AUTO';
            node.primaryAxisAlignItems = 'CENTER'; 
            node.counterAxisAlignItems = 'CENTER';

            if (definedWidth > 0) node.primaryAxisSizingMode = 'FIXED';

        } else { 
            
            if (styles.background || styles.backgroundColor) {
                const bg = styles.background || styles.backgroundColor;
                
                if (bg.includes("linear-gradient")) {
                    const colorMatches = bg.match(/#[0-9a-fA-F]{3,6}\s*(\d+%|)/g);
                    const angleMatch = bg.match(/linear-gradient\((\d+deg)/);
                    const angle = angleMatch ? parseFloat(angleMatch[1]) : 0;
                    
                    if (colorMatches && colorMatches.length >= 2) {
                        const gradientStops = colorMatches.map((match, index) => {
                            const parts = match.trim().split(/\s+/);
                            const colorHex = parts[0];
                            let position = index / (colorMatches.length - 1); 
                            
                            if (parts.length > 1) {
                                position = parseUnit(parts[1]) / 100;
                            } else if (colorMatches.length === 2) {
                                position = index === 0 ? 0 : 1;
                            }
                            
                            const colorRgb = hexToRgb(colorHex);
                            return { 
                                color: { r: colorRgb.r, g: colorRgb.g, b: colorRgb.b, a: 1 }, 
                                position: position
                            };
                        });
                        
                        let gradientTransform;
                        
                        if (angle === 135) {
                            gradientTransform = [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5]]; 
                        } else if (angle === 90) {
                            gradientTransform = [[1, 0, 0], [0, 1, 0]]; 
                        } else {
                             gradientTransform = [[0, 1, 0], [1, 0, 0]]; 
                        }

                        node.fills = [{
                            type: 'GRADIENT_LINEAR',
                            gradientTransform: gradientTransform,
                            gradientStops: gradientStops,
                            visible: true
                        }];
                        
                    } else {
                        const firstColorMatch = bg.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
                        if (firstColorMatch) {
                            node.fills = [{ type: 'SOLID', color: hexToRgb(firstColorMatch[0]) }];
                        }
                    }
                    
                } else {
                    node.fills = [{ type: 'SOLID', color: hexToRgb(bg) }];
                }
            }
            
            if (styles.borderRadius) node.cornerRadius = parseUnit(styles.borderRadius);
            if (styles.boxShadow) {
                node.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 12, visible: true, blendMode: 'NORMAL' }];
            }
            

            if (definedWidth === 0 && definedHeight === 0 && !obj.content && (!obj.children || obj.children.length === 0)) {
                node.resize(100, 100);
                node.fills = [{ type: 'SOLID', color: {r: 0.9, g: 0.9, b: 0.9, a: 0.8} }]; 
            }

            const layout = styles.layout || (styles.display === 'flex' && styles.flexDirection === 'row' ? 'horizontal' : 'vertical');
            node.layoutMode = (layout === 'horizontal') ? 'HORIZONTAL' : 'VERTICAL';

            const hasDefinedWidth = definedWidth > 0;
            const hasDefinedHeight = definedHeight > 0;
            const isHorizontal = node.layoutMode === 'HORIZONTAL';

            node.primaryAxisSizingMode = (isHorizontal && hasDefinedWidth) || (!isHorizontal && hasDefinedHeight) ? 'FIXED' : 'AUTO';
            node.counterAxisSizingMode = (isHorizontal && hasDefinedHeight) || (!isHorizontal && hasDefinedWidth) ? 'FIXED' : 'AUTO';
            
            if (styles.alignItems) node.counterAxisAlignItems = { 'center': 'CENTER', 'flex-start': 'MIN', 'end': 'MAX', 'start': 'MIN' }[styles.alignItems] || 'MIN';
            if (styles.justifyContent) node.primaryAxisAlignItems = { 'center': 'CENTER', 'space-between': 'SPACE_BETWEEN', 'start': 'MIN', 'end': 'MAX' }[styles.justifyContent] || 'MIN';
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
    node.name = obj.name || originalType;

    const children = obj.children || obj.elements;
    if (children && Array.isArray(children)) {
        for (const childObj of children) {
            const childNode = await createNode(childObj, false);
            
            if (childNode) {
                node.appendChild(childNode);
                
                if (childNode.type === 'FRAME' || childNode.type === 'INSTANCE' || childNode.type === 'TEXT') {
                    
                    const childStyles = childObj.styles || {};
                    const childDefinedWidth = childStyles.width ? parseUnit(childStyles.width) : 0;
                    const childDefinedHeight = childStyles.height ? parseUnit(childStyles.height) : 0;
                    
                    if (node.layoutMode === 'VERTICAL') {
                        if (childDefinedWidth === 0) childNode.layoutAlign = 'STRETCH'; 
                        else childNode.layoutAlign = 'MIN'; 
                        
                    } else if (node.layoutMode === 'HORIZONTAL') { 
                        if (childDefinedHeight === 0) childNode.layoutAlign = 'STRETCH'; 
                        
                        if (childDefinedWidth === 0 && node.primaryAxisSizingMode === 'AUTO') {
                            childNode.layoutGrow = 1;
                        } else {
                            childNode.layoutGrow = 0;
                            childNode.layoutAlign = 'MIN';
                        }
                    }
                }
            }
        }
    }
    
    if (node.type !== 'TEXT') {
        if (definedWidth > 0 && node.width !== definedWidth) {
            node.resize(definedWidth, node.height);
        }
        if (definedHeight > 0 && node.height !== definedHeight) {
            node.resize(node.width, definedHeight);
        }
        
        applyTextWrapCorrection(node);
    }
    
    return node;
}


figma.ui.onmessage = async (msg) => {

    if (msg.type === 'create-design') {
        let componentsToRender = [];
        let data = msg.data;
        
        if (Array.isArray(data)) {
            componentsToRender = data;
        } else if (data.success && data.design && Array.isArray(data.design.components)) {
            componentsToRender = data.design.components;
        } else if (data.type) {
            componentsToRender = [data];
        } else {
            figma.closePlugin("❌ Failed to specify the data format. It must be an array or a single design object.");
            return;
        }

        const createdNodes = [];
        let currentX = 0; 
        const SPACING = 100; 

        for (const componentObj of componentsToRender) {
            const pageNode = await createNode(componentObj, true); 
            
            if (pageNode) {
                pageNode.x = currentX;
                pageNode.y = 0; 
                
                figma.currentPage.appendChild(pageNode);
                createdNodes.push(pageNode);
                
                currentX += pageNode.width + SPACING;
            }
        }

        if (createdNodes.length > 0) {
            figma.viewport.scrollAndZoomIntoView(createdNodes); 
            figma.closePlugin(`✅The design was successfully created. Number of pages/frames: ${createdNodes.length}`);
        } else {
            figma.closePlugin("❌No design creation occurred. Please ensure the input JSON is correct.");
        }
    }
};