"use strict";

import { $ } from './ui.js';

let globalClickHandler = null;

export const initModelSelector = () => {
    try {
        const button = $("model-selector-button");
        const dropdown = $("model-selector-dropdown");
        
        if (!button || !dropdown) {
            console.error("Model selector elements not found");
            return;
        }
        
        button.onclick = (e) => {
            try {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains("open");
                
                document.querySelectorAll('.model-selector-dropdown.open').forEach(d => {
                    try {
                        d.classList.remove("open");
                        const btn = d.parentElement?.querySelector('.model-selector-button');
                        if (btn) btn.classList.remove("open");
                    } catch (error) {
                        console.error("Error closing dropdown:", error);
                    }
                });
                
                if (!isOpen) {
                    dropdown.classList.add("open");
                    button.classList.add("open");
                }
            } catch (error) {
                console.error("Error handling model selector click:", error);
            }
        };
        
        // Remove existing global click handler before adding new one
        if (globalClickHandler) {
            document.removeEventListener('click', globalClickHandler);
        }
        
        globalClickHandler = () => {
            try {
                dropdown.classList.remove("open");
                button.classList.remove("open");
            } catch (error) {
                console.error("Error closing model selector:", error);
            }
        };
        
        document.addEventListener('click', globalClickHandler);
        
        dropdown.addEventListener('click', (e) => {
            try {
                const option = e.target.closest('.model-option');
                if (option) {
                    e.stopPropagation();
                    
                    dropdown.querySelectorAll('.model-option').forEach(opt => {
                        try {
                            opt.classList.remove('selected');
                        } catch (error) {
                            console.error("Error removing selection:", error);
                        }
                    });
                    option.classList.add('selected');
                    
                    const modelName = option.dataset.model;
                    const currentModelEl = $("current-model");
                    if (currentModelEl && modelName) {
                        currentModelEl.textContent = modelName;
                    }
                    
                    dropdown.classList.remove("open");
                    button.classList.remove("open");
                }
            } catch (error) {
                console.error("Error handling model option click:", error);
            }
        });
    } catch (error) {
        console.error("Error initializing model selector:", error);
    }
};

export const loadModels = async () => {
    try {
        const models = await fetchModels();
        const dropdown = $("model-selector-dropdown");
        const currentModelEl = $("current-model");
        
        if (!dropdown) {
            console.error("Model selector dropdown not found");
            return;
        }
        
        dropdown.innerHTML = "";
        
        if (!Array.isArray(models) || models.length === 0) {
            console.error("No models available");
            const option = document.createElement("div");
            option.className = "model-option selected";
            option.dataset.model = "BETA";
            option.innerHTML = `
                <div class="model-option-name">BETA</div>
                <div class="model-option-description">Default translation model</div>
            `;
            dropdown.appendChild(option);
            
            if (currentModelEl) {
                currentModelEl.textContent = "BETA";
            }
            return;
        }
        
        models.forEach((model, index) => {
            try {
                const name = typeof model === "string" ? model : (model.name || `Model ${index + 1}`);
                const description = typeof model === "object" ? (model.description || "Translation model") : "Translation model";
                
                const option = document.createElement("div");
                option.className = `model-option${index === 0 ? " selected" : ""}`;
                option.dataset.model = name;
                option.innerHTML = `
                    <div class="model-option-name">${name}</div>
                    <div class="model-option-description">${description}</div>
                `;
                
                dropdown.appendChild(option);
            } catch (error) {
                console.error(`Error creating model option ${index}:`, error);
            }
        });
        
        if (models.length > 0 && currentModelEl) {
            const firstModel = typeof models[0] === "string" ? models[0] : (models[0].name || "BETA");
            currentModelEl.textContent = firstModel;
        }
    } catch (err) {
        console.error("Error loading models:", err);
        try {
            const currentModelEl = $("current-model");
            if (currentModelEl) {
                currentModelEl.textContent = "BETA";
            }
        } catch (fallbackError) {
            console.error("Error setting fallback model:", fallbackError);
        }
    }
};