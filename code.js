
figma.showUI(__html__, { width: 400, height: 500, title: "Claude JSON Importer" });

figma.ui.onmessage = msg => {
  if (msg.type === 'create-design') {
    const designData = msg.data;
    createDesign(designData);
  }
};

/**
 * @param {string} hex 
 * @returns {object} 
 */
function hexToRgb(hex) {
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
    const bigint = parseInt(cleanHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r: r / 255, g: g / 255, b: b / 255 };
}

/**
 * @param {SceneNode} node
 * @param {string} cssColor 
 */
function applyCssFill(node, cssColor) {
    if (node.fills && cssColor && cssColor.startsWith('#')) {
        const rgb = hexToRgb(cssColor);
        node.fills = [{ type: 'SOLID', color: rgb }];
    }
}

/**
 * @param {SceneNode} node 
 * @param {object} styles 
 */
function applyCssStyles(node, styles) {
    if (!styles) return;

    if (styles.backgroundColor) {
        applyCssFill(node, styles.backgroundColor);
    }
    if (styles.color && node.type === 'TEXT') {
        const rgb = hexToRgb(styles.color);
        node.fills = [{ type: 'SOLID', color: rgb }];
    }

    const parsePx = (val) => parseFloat(String(val).replace('px', ''));

    if (styles.width && 'resize' in node) {
        const width = parsePx(styles.width);
        if (!isNaN(width)) node.resize(width, node.height);
    }
    if (styles.height && 'resize' in node) {
        const height = parsePx(styles.height);
        if (!isNaN(height)) node.resize(node.width, height);
    }

    if (styles.display === 'flex' && 'layoutMode' in node) {
        node.layoutMode = styles.flexDirection === 'column' ? 'VERTICAL' : 'HORIZONTAL';
        
        if (styles.gap) {
            const spacing = parsePx(styles.gap);
            if (!isNaN(spacing)) node.itemSpacing = spacing;
        }

        if (styles.justifyContent === 'space-between') {
            node.primaryAxisAlignItems = 'SPACE_BETWEEN';
        } else if (styles.justifyContent === 'center') {
            node.primaryAxisAlignItems = 'CENTER';
        }
        
        if (styles.alignItems === 'center') {
            node.counterAxisAlignItems = 'CENTER';
        }
    }

    if (styles.borderRadius && 'cornerRadius' in node) {
        const radius = parsePx(styles.borderRadius);
        if (!isNaN(radius)) node.cornerRadius = radius;
    }

    if (styles.boxShadow && 'effects' in node) {
      
    }
    
 
}

/**
 * @param {SceneNode} node 
 * @param {object} component 
 */
function applyCommonProperties(node, component) {
    node.name = component.name || component.type;
    if (component.x !== undefined) node.x = component.x;
    if (component.y !== undefined) node.y = component.y;
    
    applyCssStyles(node, component.styles);
}

/**
 * @param {TextNode} node 
 * @param {object} component 
 */
async function applyTextProperties(node, component) {
    const textContent = component.content || component.text;
    if (textContent) {
        const fontFamily = (component.styles && component.styles.fontFamily) ? component.styles.fontFamily : "Inter";
        const fontWeight = (component.styles && component.styles.fontWeight) ? String(component.styles.fontWeight) : "Regular";
        
        try {
            await figma.loadFontAsync({ family: fontFamily, style: fontWeight });
        } catch (e) {
            console.warn(`error: ${fontFamily}, ${fontWeight}`);
            await figma.loadFontAsync({ family: "Inter", style: "Regular" }); 
        }
        
        node.characters = textContent;
        
        if (component.styles && component.styles.fontSize) node.fontSize = parseFloat(component.styles.fontSize.fontSize.replace('px', ''));
        if (component.styles && component.styles.color) {
            const rgb = hexToRgb(component.styles.color);
            node.fills = [{ type: 'SOLID', color: rgb }];
        }
    }
}


/**
 * @param {object} component 
 * @returns {SceneNode | null}
 */
async function createNode(component) {
    let node = null;

    switch (component.type) {
        case 'FRAME':
            node = figma.createFrame();
            applyCommonProperties(node, component);
            break;
        case 'RECTANGLE':
            node = figma.createRectangle();
            applyCommonProperties(node, component);
            break;
        case 'TEXT':
        case 'h1':
        case 'p':
        case 'a':
            node = figma.createText();
            applyCommonProperties(node, component);
            await applyTextProperties(node, component);
            break;
        default:
            console.warn(`Unsupported component type: ${component.type}`);
            return null;
    }

    if (node && component.children && component.children.length > 0) {
        for (const childComponent of component.children) {
            const childNode = await createNode(childComponent);
            if (childNode) {
                node.appendChild(childNode);
            }
        }
    }

    return node;
}

/**
 * @param {object} designData 
 */
async function createDesign(designData) {
    const components = designData.design.components;
    
    const mapType = (type) => {
        if (['header', 'section', 'div', 'nav', 'button'].includes(type)) return 'FRAME';
        if (['h1', 'p', 'a'].includes(type)) return 'TEXT';
        return type.toUpperCase();
    };

    const processedComponents = components.map(comp => {
        comp.type = mapType(comp.type);
        if (comp.children) {
            comp.children = comp.children.map(child => {
                child.type = mapType(child.type);
                return child;
            });
        }
        return comp;
    });
    if (!components || components.length === 0) {
        figma.notify("No design components were found in the JSON file.");
        return;
    }

    const parentFrame = figma.createFrame();
    parentFrame.name = designData.design.designName || "Generated Design";
    parentFrame.resize(1440, 1024); 
    parentFrame.layoutMode = 'VERTICAL'; 
    for (const component of processedComponents) {
        const node = await createNode(component);
        if (node) {
            parentFrame.appendChild(node);
        }
    }

    figma.currentPage.selection = [parentFrame];
    figma.viewport.scrollAndZoomIntoView([parentFrame]);

    figma.notify("The design has been successfully created!");
    figma.closePlugin();
}

