"use strict";

const icons = {
    lightning: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 1024 1024"><path fill="currentColor" d="M348 676.1C250 619.4 184 513.4 184 392c0-181.1 146.9-328 328-328s328 146.9 328 328c0 121.4-66 227.4-164 284.1V792c0 17.7-14.3 32-32 32H380c-17.7 0-32-14.3-32-32zM392 888h240c4.4 0 8 3.6 8 8v32c0 17.7-14.3 32-32 32H416c-17.7 0-32-14.3-32-32v-32c0-4.4 3.6-8 8-8"/></svg>`,
    
    lightningLarge: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 1024 1024"><path fill="currentColor" d="M348 676.1C250 619.4 184 513.4 184 392c0-181.1 146.9-328 328-328s328 146.9 328 328c0 121.4-66 227.4-164 284.1V792c0 17.7-14.3 32-32 32H380c-17.7 0-32-14.3-32-32zM392 888h240c4.4 0 8 3.6 8 8v32c0 17.7-14.3 32-32 32H416c-17.7 0-32-14.3-32-32v-32c0-4.4 3.6-8 8-8"/></svg>`,
    
    document: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="currentColor" d="M17 2v7a3 3 0 0 0 3 3h7v15a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm2 .117V9a1 1 0 0 0 1 1h6.883a3 3 0 0 0-.762-1.293L20.293 2.88A3 3 0 0 0 19 2.117"/></svg>`,
    
    documentLarge: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="currentColor" d="M17 2v7a3 3 0 0 0 3 3h7v15a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm2 .117V9a1 1 0 0 0 1 1h6.883a3 3 0 0 0-.762-1.293L20.293 2.88A3 3 0 0 0 19 2.117"/></svg>`
};

const getIcon = (name, className = '') => {
    const icon = icons[name];
    if (!icon) {
        console.warn(`Icon '${name}' not found`);
        return '';
    }
    
    if (className) {
        return icon.replace('<svg', `<svg class="${className}"`);
    }
    
    return icon;
};

window.getIcon = getIcon;

