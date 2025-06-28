"use strict";

const init = async () => {
    try {
        // Determine the session type early to prevent visual jump
        let initialSessionType = 'fast';
        if (sessions.length > 0) {
            let lastIndex = 0;
            try {
                const storedIndex = localStorage.getItem("currentSessionIndex");
                if (storedIndex !== null && !isNaN(storedIndex) && sessions[storedIndex]) {
                    lastIndex = parseInt(storedIndex, 10);
                }
            } catch (e) {
                // Ignore errors
            }
            if (sessions[lastIndex]) {
                initialSessionType = sessions[lastIndex].type || 'fast';
            }
        }
        
        // Set initial UI state immediately
        if (typeof switchToSessionType === 'function') {
            switchToSessionType(initialSessionType);
        }
        
        try {
            await loadModels();
        } catch (error) {
            console.error("Model loading failed, using defaults:", error);
        }
        
        try {
            initModelSelector();
        } catch (error) {
            console.error("Model selector initialization failed:", error);
        }
        
        try {
            if (typeof setupDocumentEditor === 'function') {
                setupDocumentEditor();
            }
            
            if (typeof updateDocumentPreview === 'function') {
                updateDocumentPreview();
            }
            if (typeof updateDocumentStats === 'function') {
                updateDocumentStats();
            }
        } catch (error) {
            console.error("Document editor setup failed:", error);
        }
        
        try {
            if (!sessions.length) {
                sessions = [{ id: Date.now(), title: "New Session", messages: [], type: "fast" }];
                save();
            }
            let lastIndex = 0;
            try {
                const storedIndex = localStorage.getItem("currentSessionIndex");
                if (storedIndex !== null && !isNaN(storedIndex) && sessions[storedIndex]) {
                    lastIndex = parseInt(storedIndex, 10);
                }
            } catch (e) {
                // Ignore errors
            }
            currentSessionIndex = lastIndex;
            renderSessions();
            
            // Ensure UI is in correct state (redundant but safe)
            if (sessions[currentSessionIndex] && typeof switchToSessionType === 'function') {
                switchToSessionType(sessions[currentSessionIndex].type || 'fast');
            }
            loadSessionData();
        } catch (error) {
            console.error("Session initialization failed:", error);
            showError(new Error("Failed to initialize sessions"));
        }
        
        try {
            if (!localStorage.getItem("welcome_shown")) {
                const modal = $("welcome-modal");
                if (modal) {
                    modal.style.display = "flex";
                    localStorage.setItem("welcome_shown", "true");
                }
            }
        } catch (error) {
            console.error("Error handling welcome modal:", error);
        }
    } catch (error) {
        console.error("Critical initialization error:", error);
        showError(new Error("Application failed to initialize"));
    }
};

let inputHandler = null;
let buttonStateTimeout = null;

try {
    if (DOM.srcText) {
        // Remove existing handler if any
        if (inputHandler) {
            DOM.srcText.removeEventListener("input", inputHandler);
        }
        
        inputHandler = () => {
            try {
                if (DOM.charCount) {
                    DOM.charCount.textContent = `${DOM.srcText.value.length} characters`;
                }
                updateDetectedLanguage();
                
                // Clear existing timeout
                if (buttonStateTimeout) {
                    clearTimeout(buttonStateTimeout);
                }
                
                buttonStateTimeout = setTimeout(() => {
                    try {
                        if (DOM.srcSel && DOM.srcSel.value === "AUTO" && DOM.detectedLangEl) {
                            const isUnsupported = DOM.detectedLangEl.textContent.includes("Unknown");
                            if (DOM.translateBtn) {
                                DOM.translateBtn.disabled = isUnsupported && DOM.srcText.value.trim().length > 0;
                                if (isUnsupported && DOM.srcText.value.trim().length > 0) {
                                    DOM.translateBtn.textContent = "Unsupported Language";
                                } else {
                                    DOM.translateBtn.textContent = "Translate";
                                }
                            }
                        } else if (DOM.translateBtn) {
                            // Always enable and reset button if not in AUTO mode
                            DOM.translateBtn.disabled = false;
                            DOM.translateBtn.textContent = "Translate";
                        }
                    } catch (error) {
                        console.error("Error updating translate button state:", error);
                    } finally {
                        buttonStateTimeout = null;
                    }
                }, 600);
                
                if (currentSessionIndex !== -1) {
                    saveSessionData();
                }
            } catch (error) {
                console.error("Error in source text input handler:", error);
            }
        };
        
        DOM.srcText.addEventListener("input", inputHandler);
        
        DOM.srcText.addEventListener("keydown", e => {
            try {
                if (e.key === "Enter" && e.ctrlKey) {
                    e.preventDefault();
                    processTranslation();
                }
            } catch (error) {
                console.error("Error in keydown handler:", error);
            }
        });
    }
    // Ajout : mettre à jour la détection de langue lors du changement de la langue source
    if (DOM.srcSel) {
        DOM.srcSel.addEventListener("change", () => {
            updateDetectedLanguage();
        });
    }
} catch (error) {
    console.error("Error setting up source text listeners:", error);
}

try {
    if (DOM.translateBtn) {
        DOM.translateBtn.onclick = () => {
            try {
                processTranslation();
            } catch (error) {
                console.error("Error in translate button handler:", error);
                showError(new Error("Translation failed"));
            }
        };
    }
} catch (error) {
    console.error("Error setting up translate button listener:", error);
}

try {
    if (DOM.newSessionBtn) {
        DOM.newSessionBtn.onclick = () => {
            try {
                if (typeof showSessionTypeModal === 'function') {
                    showSessionTypeModal();
                } else {
                    addSession();
                }
            } catch (error) {
                console.error("Error in new session handler:", error);
                showError(new Error("Failed to create new session"));
            }
        };
    }
} catch (error) {
    console.error("Error setting up new session button listener:", error);
}

try {
    if (DOM.docSourceEditor) {
    }
} catch (error) {
    console.error("Error setting up doc source editor listener:", error);
}

try {
    if (DOM.docTranslateBtn) {
        DOM.docTranslateBtn.onclick = () => {
            try {
                if (typeof translateDocument === 'function') {
                    translateDocument();
                } else {
                    showError(new Error("Document translation function not available"));
                }
            } catch (error) {
                console.error("Error in doc translate button handler:", error);
                showError(new Error("Document translation failed"));
            }
        };
    }
} catch (error) {
    console.error("Error setting up doc translate button listener:", error);
}

try {
    document.addEventListener("click", e => {
        try {
            // Remove mobile sidebar handling - now in mobile.js
            if (window.innerWidth <= 768) {
                // Mobile handling moved to mobile.js
            }
        } catch (error) {
            console.error("Error in click handler:", error);
        }
    });
} catch (error) {
    console.error("Error setting up click listener:", error);
}

try {
    // Remove mobile sidebar toggle - now in mobile.js
    const mobileSidebarToggle = document.getElementById("mobile-sidebar-toggle");
    if (mobileSidebarToggle) {
        // Mobile toggle handling moved to mobile.js
    }
} catch (error) {
    console.error("Error setting up mobile sidebar toggle:", error);
}

try {
    window.addEventListener("load", () => {
        try {
            init();
        } catch (error) {
            console.error("Error during initialization:", error);
            showError(new Error("Application failed to start"));
        }
    });
} catch (error) {
    console.error("Error setting up load listener:", error);
}

try {
    window.addEventListener("error", e => {
        console.error("Unhandled error:", e.error || e.message || "Unknown error");
        if (typeof showError === 'function') {
            showError(e.error || new Error("An unexpected error occurred"));
        }
    });
    
    window.addEventListener("unhandledrejection", e => {
        console.error("Unhandled promise rejection:", e.reason);
        if (typeof showError === 'function') {
            showError(new Error("An unexpected error occurred"));
        }
        e.preventDefault();
    });
} catch (error) {
    console.error("Error setting up global error handlers:", error);
}
    window.addEventListener("error", e => {
        console.error("Unhandled error:", e.error || e.message || "Unknown error");
        if (typeof showError === 'function') {
            showError(e.error || new Error("An unexpected error occurred"));
        }
    });
    
    window.addEventListener("unhandledrejection", e => {
        console.error("Unhandled promise rejection:", e.reason);
        if (typeof showError === 'function') {
            showError(new Error("An unexpected error occurred"));
        }
        e.preventDefault();
    });