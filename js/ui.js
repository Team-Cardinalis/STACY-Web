"use strict";

const $ = id => {
    try {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Element with id '${id}' not found`);
        }
        return element;
    } catch (error) {
        console.error(`Error getting element '${id}':`, error);
        return null;
    }
};

const DOM = {
    get sessionsEl() { return $("sessions"); },
    get srcText() { return $("source-text"); },
    get tgtText() { return $("target-text"); },
    get srcSel() { 
        const customDropdown = $("source-lang-custom");
        return customDropdown || $("source-lang-select");
    },
    get tgtSel() { 
        const customDropdown = $("target-lang-custom");
        return customDropdown || $("target-lang-select");
    },
    get translateBtn() { return $("translate-btn"); },
    get detectedLangEl() { return $("detected-lang"); },
    get charCount() { return $("char-count"); },
    get newSessionBtn() { return document.querySelector(".new-session-btn"); },
    get translationContainer() { return $("translation-container"); },
    get docContainer() { return $("doc-container"); },
    get docSourceArea() { return $("doc-source-area"); },
    get docPreviewArea() { return $("doc-preview-area"); },
    get docSourceText() { return $("doc-source-text"); },
    get docPreview() { return $("doc-preview"); },
    get docTranslateBtn() { return $("doc-translate-btn"); },
    get docSourceEditor() { return $("doc-source-editor"); },
    get docSourceLang() { 
        const customDropdown = $("doc-source-lang-custom");
        return customDropdown || $("doc-source-lang-select");
    },
    get docTargetLang() { 
        const customDropdown = $("doc-target-lang-custom");
        return customDropdown || $("doc-target-lang-select");
    },
    get docCharCount() { return $("doc-char-count"); },
    get docWordCount() { return $("doc-word-count"); },
    get docParagraphCount() { return $("doc-paragraph-count"); }
};

const showError = err => {
    try {
        const toast = document.createElement("div");
        toast.textContent = err.message || "An error occurred";
        toast.className = "error-toast";
        document.body.appendChild(toast);
        setTimeout(() => {
            try {
                if (toast.parentNode) {
                    toast.remove();
                }
            } catch (removeError) {
                console.error("Error removing toast:", removeError);
            }
        }, 5000);
    } catch (error) {
        console.error("Error showing error toast:", error);
        alert(err.message || "An error occurred");
    }
};

const closeWelcomeModal = () => {
    try {
        const modal = $("welcome-modal");
        if (modal) {
            modal.style.display = "none";
        }
    } catch (error) {
        console.error("Error closing welcome modal:", error);
    }
};

let menuCleanupTimeout;

const showSessionMenu = (sessionDiv, index) => {
    try {
        if (!sessionDiv || typeof index !== 'number') {
            console.error("Invalid parameters for session menu");
            return;
        }

        document.querySelectorAll('.context-menu').forEach(m => {
            try {
                m.remove();
            } catch (error) {
                console.error("Error removing existing menu:", error);
            }
        });
        
        const menu = document.createElement("div");
        menu.className = "context-menu";
        
        const rect = sessionDiv.getBoundingClientRect();
        menu.style.top = rect.bottom + 5 + "px";
        menu.style.left = rect.right - 120 + "px";
        
        const renameItem = document.createElement("div");
        renameItem.className = "context-menu-item";
        renameItem.textContent = "Rename";
        renameItem.onclick = () => {
            try {
                menu.remove();
                renameSession(index);
            } catch (error) {
                console.error("Error handling rename click:", error);
                showError(new Error("Failed to rename session"));
            }
        };
        
        const deleteItem = document.createElement("div");
        deleteItem.className = "context-menu-item danger";
        deleteItem.textContent = "Delete";
        deleteItem.onclick = () => {
            try {
                menu.remove();
                deleteSession(index);
            } catch (error) {
                console.error("Error handling delete click:", error);
                showError(new Error("Failed to delete session"));
            }
        };
        
        menu.appendChild(renameItem);
        menu.appendChild(deleteItem);
        document.body.appendChild(menu);
        
        // Clear any existing timeout
        if (menuCleanupTimeout) {
            clearTimeout(menuCleanupTimeout);
        }
        
        menuCleanupTimeout = setTimeout(() => {
            try {
                const clickHandler = () => {
                    try {
                        if (menu.parentNode) {
                            menu.remove();
                        }
                    } catch (error) {
                        console.error("Error removing menu on click:", error);
                    }
                    document.removeEventListener('click', clickHandler);
                };
                document.addEventListener('click', clickHandler, { once: true });
            } catch (error) {
                console.error("Error setting up menu close listener:", error);
            }
        }, 0);
    } catch (error) {
        console.error("Error showing session menu:", error);
        showError(new Error("Failed to show menu"));
    }
};

const switchToSessionType = (sessionType) => {
    try {
        const translationContainer = DOM.translationContainer;
        const docContainer = DOM.docContainer;
        const floatingActions = document.getElementById("floating-actions");
        
        if (!translationContainer || !docContainer) {
            console.error("Required containers not found");
            return;
        }
        
        // Remove previous classes
        translationContainer.classList.remove('hide', 'initialized');
        docContainer.classList.remove('show', 'initialized');
        
        if (sessionType === 'doc') {
            translationContainer.style.display = 'none';
            translationContainer.classList.add('hide');
            docContainer.style.display = 'flex';
            docContainer.classList.add('show');
            
            // Show/hide appropriate floating buttons
            if (floatingActions && window.innerWidth <= 768) {
                const translationFabs = floatingActions.querySelector('.translation-fabs');
                const docFabs = floatingActions.querySelector('.doc-fabs');
                if (translationFabs) translationFabs.style.display = 'none';
                if (docFabs) docFabs.style.display = 'flex';
            }
            
            // Add small delay to ensure display change is applied before opacity
            setTimeout(() => {
                docContainer.classList.add('initialized');
            }, 10);
        } else {
            docContainer.style.display = 'none';
            docContainer.classList.remove('show');
            translationContainer.style.display = 'flex';
            translationContainer.classList.remove('hide');
            
            // Show/hide appropriate floating buttons
            if (floatingActions && window.innerWidth <= 768) {
                const translationFabs = floatingActions.querySelector('.translation-fabs');
                const docFabs = floatingActions.querySelector('.doc-fabs');
                if (translationFabs) translationFabs.style.display = 'flex';
                if (docFabs) docFabs.style.display = 'none';
            }
            
            // Add small delay to ensure display change is applied before opacity
            setTimeout(() => {
                translationContainer.classList.add('initialized');
            }, 10);
        }
    } catch (error) {
        console.error("Error switching session type:", error);
    }
};

window.copyTranslation = () => {
    try {
        const translation = DOM.tgtText?.value;
        if (!translation) {
            showError(new Error("No translation to copy"));
            return;
        }

        navigator.clipboard.writeText(translation).then(() => {
            try {
                const btn = event.target.closest('button');
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"/>
                        </svg>
                        Copied
                    `;
                    setTimeout(() => {
                        try {
                            btn.innerHTML = originalText;
                        } catch (error) {
                            console.error("Error restoring button text:", error);
                        }
                    }, 2000);
                }
            } catch (error) {
                console.error("Error updating copy button:", error);
            }
        }).catch((error) => {
            console.error("Clipboard write failed:", error);
            showError(new Error("Failed to copy translation"));
        });
    } catch (error) {
        console.error("Error in copyTranslation:", error);
        showError(new Error("Failed to copy translation"));
    }
};

window.exportToPDF = () => {
    try {
        const translation = DOM.tgtText?.value;
        
        if (!translation) {
            showError(new Error("No translation to export"));
            return;
        }

        const printContent = `
            <html>
                <head>
                    <title>Translation</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px; 
                            line-height: 1.6; 
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    ${translation}
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            throw new Error("Failed to open print window - popup blocked?");
        }
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    } catch (error) {
        console.error("Error exporting to PDF:", error);
        showError(new Error("Failed to export PDF"));
    }
};

const createCustomDropdown = (containerId, options, defaultValue = null, hasAutoDetect = false) => {
    try {
        const container = $(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return null;
        }

        const dropdownId = `${containerId}-custom`;
        const buttonId = `${containerId}-button`;
        const menuId = `${containerId}-menu`;

        // Remove existing dropdown if any
        const existing = $(dropdownId);
        if (existing) existing.remove();

        // Create dropdown structure
        const dropdown = document.createElement('div');
        dropdown.id = dropdownId;
        dropdown.className = 'custom-language-dropdown';

        const button = document.createElement('button');
        button.id = buttonId;
        button.className = 'custom-dropdown-button';
        button.type = 'button';

        const buttonText = document.createElement('span');
        buttonText.className = 'dropdown-button-text';
        
        const buttonIcon = document.createElement('span');
        buttonIcon.className = 'dropdown-button-icon';
        buttonIcon.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
        `;

        button.appendChild(buttonText);
        button.appendChild(buttonIcon);

        const menu = document.createElement('div');
        menu.id = menuId;
        menu.className = 'custom-dropdown-menu';

        // Add options
        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'custom-dropdown-item';
            item.dataset.value = option.value;
            
            const flagHtml = option.flag ? 
                `<img src="${option.flag}" class="dropdown-item-flag" alt="${option.label} flag" />` : 
                '<span class="dropdown-item-flag-placeholder">🌐</span>';
                
            item.innerHTML = `
                ${flagHtml}
                <span class="dropdown-item-text">${option.label}</span>
            `;
            menu.appendChild(item);
        });

        dropdown.appendChild(button);
        dropdown.appendChild(menu);
        container.appendChild(dropdown);

        // Set initial value
        const initialValue = defaultValue || options[0]?.value;
        const initialOption = options.find(opt => opt.value === initialValue);
        if (initialOption) {
            const flagHtml = initialOption.flag ? 
                `<img src="${initialOption.flag}" class="dropdown-item-flag" alt="${initialOption.label} flag" />` : 
                '<span class="dropdown-item-flag-placeholder">🌐</span>';
            buttonText.innerHTML = `${flagHtml} ${initialOption.label}`;
            dropdown.dataset.value = initialValue;
        }

        // Add click handlers
        button.onclick = (e) => {
            e.stopPropagation();
            closeAllCustomDropdowns();
            dropdown.classList.toggle('open');
        };

        menu.onclick = (e) => {
            e.stopPropagation();
            const item = e.target.closest('.custom-dropdown-item');
            if (item) {
                const value = item.dataset.value;
                const option = options.find(opt => opt.value === value);
                if (option) {
                    // Remove previous selection
                    menu.querySelectorAll('.custom-dropdown-item').forEach(i => {
                        i.removeAttribute('data-selected');
                    });
                    // Mark current item as selected
                    item.dataset.selected = 'true';
                    
                    const flagHtml = option.flag ? 
                        `<img src="${option.flag}" class="dropdown-item-flag" alt="${option.label} flag" />` : 
                        '<span class="dropdown-item-flag-placeholder">🌐</span>';
                    buttonText.innerHTML = `${flagHtml} ${option.label}`;
                    dropdown.dataset.value = value;
                    dropdown.classList.remove('open');
                    
                    // Trigger change event
                    const changeEvent = new CustomEvent('languageChange', {
                        detail: { value, label: option.label }
                    });
                    dropdown.dispatchEvent(changeEvent);
                }
            }
        };

        // Add methods to mimic select behavior
        dropdown.getValue = () => dropdown.dataset.value || '';
        dropdown.setValue = (value) => {
            const option = options.find(opt => opt.value === value);
            if (option) {
                // Remove previous selection
                menu.querySelectorAll('.custom-dropdown-item').forEach(i => {
                    i.removeAttribute('data-selected');
                });
                // Mark new item as selected
                const newItem = menu.querySelector(`[data-value="${value}"]`);
                if (newItem) newItem.dataset.selected = 'true';
                
                const flagHtml = option.flag ? 
                    `<img src="${option.flag}" class="dropdown-item-flag" alt="${option.label} flag" />` : 
                    '<span class="dropdown-item-flag-placeholder">🌐</span>';
                buttonText.innerHTML = `${flagHtml} ${option.label}`;
                dropdown.dataset.value = value;
            }
        };

        return dropdown;
    } catch (error) {
        console.error('Error creating custom dropdown:', error);
        return null;
    }
};

const closeAllCustomDropdowns = () => {
    try {
        document.querySelectorAll('.custom-language-dropdown.open').forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    } catch (error) {
        console.error('Error closing dropdowns:', error);
    }
};

const initCustomLanguageDropdowns = () => {
    try {
        const languageOptions = [
            { value: 'fr', label: 'French', flag: 'flags/fr.svg' },
            { value: 'en', label: 'English', flag: 'flags/en.svg' },
            { value: 'es', label: 'Spanish', flag: 'flags/es.svg' },
            { value: 'de', label: 'German', flag: 'flags/de.svg' },
            { value: 'it', label: 'Italian', flag: 'flags/it.svg' },
            { value: 'ru', label: 'Russian', flag: 'flags/ru.svg' },
            { value: 'ja', label: 'Japanese', flag: 'flags/ja.svg' },
            { value: 'ar', label: 'Arabic', flag: 'flags/ar.svg' }
        ];

        const sourceOptionsWithAuto = [
            { value: 'AUTO', label: 'Auto-Detect', flag: 'flags/detect.svg' },
            ...languageOptions
        ];

        // Create translation dropdowns using existing containers
        const srcDropdown = createCustomDropdown('source-lang', sourceOptionsWithAuto, 'AUTO');
        const tgtDropdown = createCustomDropdown('target-lang', languageOptions, 'en');

        // Create document dropdowns using existing containers
        const docSrcDropdown = createCustomDropdown('doc-source-lang', sourceOptionsWithAuto, 'AUTO');
        const docTgtDropdown = createCustomDropdown('doc-target-lang', languageOptions, 'en');

        // Add event listeners for language change detection
        if (srcDropdown) {
            srcDropdown.addEventListener('languageChange', (e) => {
                if (typeof updateDetectedLanguage === 'function') {
                    updateDetectedLanguage();
                }
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', closeAllCustomDropdowns);

        return { srcDropdown, tgtDropdown, docSrcDropdown, docTgtDropdown };
    } catch (error) {
        console.error('Error initializing custom language dropdowns:', error);
        return null;
    }
};

window.copyTranslation = copyTranslation;
window.exportToPDF = exportToPDF;
window.closeWelcomeModal = closeWelcomeModal;
window.switchToSessionType = switchToSessionType;
window.initCustomLanguageDropdowns = initCustomLanguageDropdowns;
window.createCustomDropdown = createCustomDropdown;
window.closeAllCustomDropdowns = closeAllCustomDropdowns;
