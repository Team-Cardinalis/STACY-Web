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
    get srcSel() { return $("source-lang"); },
    get tgtSel() { return $("target-lang"); },
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
    get docSourceLang() { return $("doc-source-lang"); },
    get docTargetLang() { return $("doc-target-lang"); },
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
        
        setTimeout(() => {
            try {
                document.addEventListener('click', () => {
                    try {
                        if (menu.parentNode) {
                            menu.remove();
                        }
                    } catch (error) {
                        console.error("Error removing menu on click:", error);
                    }
                }, { once: true });
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
        
        if (!translationContainer || !docContainer) {
            console.error("Required containers not found");
            return;
        }
        
        if (sessionType === 'doc') {
            translationContainer.style.display = 'none';
            docContainer.style.display = 'flex';
        } else {
            translationContainer.style.display = 'flex';
            docContainer.style.display = 'none';
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

window.closeWelcomeModal = closeWelcomeModal;
window.switchToSessionType = switchToSessionType;
window.closeWelcomeModal = closeWelcomeModal;
window.switchToSessionType = switchToSessionType;
