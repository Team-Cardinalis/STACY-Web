"use strict";

// Imports
import * as API       from './api.js';
import * as Icons     from './icons.js';
import * as UI        from './ui.js';
import * as Sessions  from './sessions.js';
import * as Transl    from './translation.js';
import * as Doc       from './document.js';
import * as Models    from './models.js';
import { MobileHandler } from './mobile.js';
import { initVersion }   from './version.js';

// Build global namespace
export const STACY = {
    API,
    Icons,
    UI,
    Sessions,
    Transl,
    Doc,
    Models,
    Mobile: MobileHandler,
    initVersion
};
window.STACY = STACY;

// Application init
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
        if (typeof STACY.UI.switchToSessionType === 'function') {
            STACY.UI.switchToSessionType(initialSessionType);
        }
        
        // load models
        try {
            await Models.loadModels();
        } catch (error) {
            console.error("Model loading failed, using defaults:", error);
        }
        
        // init model selector
        try {
            Models.initModelSelector();
        } catch (error) {
            console.error("Model selector initialization failed:", error);
        }
        
        // document editor setup
        try {
            if (typeof Doc.setupDocumentEditor === 'function') {
                Doc.setupDocumentEditor();
            }
            if (typeof Doc.updateDocumentPreview === 'function') {
                Doc.updateDocumentPreview();
            }
            if (typeof Doc.updateDocumentStats === 'function') {
                Doc.updateDocumentStats();
            }
        } catch (error) {
            console.error("Document editor setup failed:", error);
        }
        
        // sessions init
        try {
            if (!Sessions.sessions.length) {
                Sessions.sessions = [{ id: Date.now(), title: "New Session", messages: [], type: "fast" }];
                Sessions.save();
            }
            let lastIndex = 0;
            try {
                const storedIndex = localStorage.getItem("currentSessionIndex");
                if (storedIndex !== null && !isNaN(storedIndex) && Sessions.sessions[storedIndex]) {
                    lastIndex = parseInt(storedIndex, 10);
                }
            } catch (e) {
                // ignore
            }
            Sessions.currentSessionIndex = lastIndex;
            Sessions.renderSessions();
            
            if (Sessions.sessions[Sessions.currentSessionIndex] && typeof UI.switchToSessionType === 'function') {
                UI.switchToSessionType(Sessions.sessions[Sessions.currentSessionIndex].type || 'fast');
            }
            Sessions.loadSessionData();
        } catch (error) {
            console.error("Session initialization failed:", error);
            UI.showError(new Error("Failed to initialize sessions"));
        }
        
        // welcome modal
        try {
            if (!localStorage.getItem("welcome_shown")) {
                const modal = UI.$("welcome-modal");
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
        UI.showError(new Error("Application failed to initialize"));
    }
};

let inputHandler = null;
let buttonStateTimeout = null;

try {
    // source‐text listeners
    if (UI.DOM.srcText) {
        // Remove existing handler if any
        if (inputHandler) {
            UI.DOM.srcText.removeEventListener("input", inputHandler);
        }
        
        inputHandler = () => {
            try {
                if (UI.DOM.charCount) {
                    UI.DOM.charCount.textContent = `${UI.DOM.srcText.value.length} characters`;
                }
                Transl.updateDetectedLanguage();
                
                // Clear existing timeout
                if (buttonStateTimeout) {
                    clearTimeout(buttonStateTimeout);
                }
                
                buttonStateTimeout = setTimeout(() => {
                    try {
                        if (UI.DOM.srcSel && UI.DOM.srcSel.value === "AUTO" && UI.DOM.detectedLangEl) {
                            const isUnsupported = UI.DOM.detectedLangEl.textContent.includes("Unknown");
                            if (UI.DOM.translateBtn) {
                                UI.DOM.translateBtn.disabled = isUnsupported && UI.DOM.srcText.value.trim().length > 0;
                                if (isUnsupported && UI.DOM.srcText.value.trim().length > 0) {
                                    UI.DOM.translateBtn.textContent = "Unsupported Language";
                                } else {
                                    UI.DOM.translateBtn.textContent = "Translate";
                                }
                            }
                        } else if (UI.DOM.translateBtn) {
                            // Always enable and reset button if not in AUTO mode
                            UI.DOM.translateBtn.disabled = false;
                            UI.DOM.translateBtn.textContent = "Translate";
                        }
                    } catch (error) {
                        console.error("Error updating translate button state:", error);
                    } finally {
                        buttonStateTimeout = null;
                    }
                }, 600);
                
                if (Sessions.currentSessionIndex !== -1) {
                    Sessions.saveSessionData();
                }
            } catch (error) {
                console.error("Error in source text input handler:", error);
            }
        };
        
        UI.DOM.srcText.addEventListener("input", inputHandler);
        
        UI.DOM.srcText.addEventListener("keydown", e => {
            try {
                if (e.key === "Enter" && e.ctrlKey) {
                    e.preventDefault();
                    STACY.Transl.processTranslation();
                }
            } catch (error) {
                console.error("Error in keydown handler:", error);
            }
        });
    }
    // Ajout : mettre à jour la détection de langue lors du changement de la langue source
    if (UI.DOM.srcSel) {
        UI.DOM.srcSel.addEventListener("change", () => {
            Transl.updateDetectedLanguage();
        });
    }
} catch (error) {
    console.error("Error setting up source text listeners:", error);
}

// translate button
try {
    if (UI.DOM.translateBtn) {
        UI.DOM.translateBtn.onclick = () => {
            try {
                STACY.Transl.processTranslation();
            } catch (error) {
                console.error("Error in translate button handler:", error);
                UI.showError(new Error("Translation failed"));
            }
        };
    }
} catch (error) {
    console.error("Error setting up translate button listener:", error);
}

// new session button
try {
    if (UI.DOM.newSessionBtn) {
        UI.DOM.newSessionBtn.onclick = () => {
            try {
                if (typeof Sessions.showSessionTypeModal === 'function') {
                    Sessions.showSessionTypeModal();
                } else {
                    Sessions.addSession();
                }
            } catch (error) {
                console.error("Error in new session handler:", error);
                UI.showError(new Error("Failed to create new session"));
            }
        };
    }
} catch (error) {
    console.error("Error setting up new session button listener:", error);
}

// doc translate button
try {
    if (UI.DOM.docTranslateBtn) {
        UI.DOM.docTranslateBtn.onclick = () => {
            try {
                Doc.translateDocument();
            } catch (error) {
                console.error("Error in doc translate button handler:", error);
                UI.showError(new Error("Document translation failed"));
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
            UI.showError(new Error("Application failed to start"));
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