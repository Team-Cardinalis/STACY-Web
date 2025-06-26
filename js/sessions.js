"use strict";

const TITLE_MAX = 30;
const SESSION_TYPES = {
    FAST: 'fast',
    DOC: 'doc'
};

let sessions = [];
let currentSessionIndex = -1;

try {
    const stored = localStorage.getItem("sessions");
    sessions = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(sessions)) {
        console.error("Invalid sessions data in localStorage, resetting");
        sessions = [];
    }
    sessions.forEach(session => {
        if (!session.type) {
            session.type = SESSION_TYPES.FAST;
        }
    });
} catch (error) {
    console.error("Error loading sessions from localStorage:", error);
    sessions = [];
}

const save = () => {
    try {
        localStorage.setItem("sessions", JSON.stringify(sessions));
    } catch (error) {
        console.error("Error saving sessions to localStorage:", error);
        showError(new Error("Failed to save session data"));
    }
};

const addSession = (title, type = SESSION_TYPES.FAST) => {
    try {
        const sessionTitle = (title || "New Session").slice(0, TITLE_MAX);
        const newSession = {
            id: Date.now(),
            title: sessionTitle,
            type: type,
            messages: [],
            ...(type === SESSION_TYPES.DOC && {
                sourceDocument: "",
                translatedDocument: "",
                paragraphs: []
            })
        };
        
        sessions.unshift(newSession);
        save();
        renderSessions();
        setCurrentSession(0);
    } catch (error) {
        console.error("Error adding session:", error);
        showError(new Error("Failed to create new session"));
    }
};

const showSessionTypeModal = () => {
    try {
        const modal = document.createElement("div");
        modal.className = "modal-overlay";
        
        const lightningIcon = getIcon('lightningLarge', 'icon-accent');
        const documentIcon = getIcon('documentLarge', 'icon-accent');
        
        modal.innerHTML = `
            <div class="modal">
                <h2>Choose Session Type</h2>
                <div class="session-type-options">
                    <div class="session-type-option" data-type="${SESSION_TYPES.FAST}">
                        <div class="session-type-icon">${lightningIcon}</div>
                        <div class="session-type-title">Fast</div>
                        <div class="session-type-description">Quick text translation (current mode)</div>
                    </div>
                    <div class="session-type-option" data-type="${SESSION_TYPES.DOC}">
                        <div class="session-type-icon">${documentIcon}</div>
                        <div class="session-type-title">Doc</div>
                        <div class="session-type-description">Document processing with PDF output</div>
                    </div>
                </div>
                <button class="modal-btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelectorAll('.session-type-option').forEach(option => {
            option.onclick = () => {
                const type = option.dataset.type;
                modal.remove();
                addSession(`New ${type === SESSION_TYPES.DOC ? 'Document' : 'Session'}`, type);
            };
        });
        
    } catch (error) {
        console.error("Error showing session type modal:", error);
        showError(new Error("Failed to show session type selection"));
    }
};

const deleteSession = index => {
    try {
        if (typeof index !== 'number' || index < 0 || index >= sessions.length) {
            throw new Error("Invalid session index");
        }
        
        sessions.splice(index, 1);
        save();
        
        if (!sessions.length) {
            addSession("New Session");
        } else {
            if (currentSessionIndex >= sessions.length) {
                currentSessionIndex = sessions.length - 1;
            }
            renderSessions();
        }
    } catch (error) {
        console.error("Error deleting session:", error);
        showError(new Error("Failed to delete session"));
    }
};

const renameSession = index => {
    try {
        if (typeof index !== 'number' || index < 0 || index >= sessions.length) {
            throw new Error("Invalid session index");
        }

        const sessionDivs = DOM.sessionsEl?.querySelectorAll('.session-item');
        if (!sessionDivs || !sessionDivs[index]) return;
        const sessionDiv = sessionDivs[index];
        const titleDiv = sessionDiv.querySelector('.title');
        if (!titleDiv) return;

        if (titleDiv.querySelector('input')) return;

        const currentTitle = sessions[index].title;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.maxLength = TITLE_MAX;
        input.className = 'session-title-input';
        input.style.width = '90%';

        titleDiv.textContent = '';
        titleDiv.appendChild(input);
        input.focus();
        input.select();

        const finish = () => {
            let newTitle = input.value.trim();
            if (!newTitle) newTitle = "Untitled";
            sessions[index].title = newTitle.slice(0, TITLE_MAX);
            save();
            renderSessions();
        };

        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                finish();
            } else if (e.key === 'Escape') {
                renderSessions();
            }
        });
        input.addEventListener('blur', finish);
    } catch (error) {
        console.error("Error renaming session:", error);
        showError(new Error("Failed to rename session"));
    }
};

const renderSessions = () => {
    try {
        if (!DOM.sessionsEl) {
            console.error("Sessions element not found");
            return;
        }
        
        DOM.sessionsEl.innerHTML = "";
        
        sessions.forEach((session, index) => {
            try {
                const sessionDiv = document.createElement("div");
                const typeIcon = session.type === SESSION_TYPES.DOC ? 
                    getIcon('document', 'session-icon') : 
                    getIcon('lightning', 'session-icon');
                    
                sessionDiv.className = `session-item${index === currentSessionIndex ? " active" : ""}`;
                sessionDiv.innerHTML = `
                    <div class="session-type-badge">${typeIcon}</div>
                    <div class="title">${session.title || "Untitled"}</div>
                    <button class="menu-btn">⋯</button>
                `;
                
                sessionDiv.onclick = e => {
                    try {
                        if (!e.target.closest(".menu-btn")) {
                            setCurrentSession(index);
                        }
                    } catch (error) {
                        console.error("Error handling session click:", error);
                    }
                };
                
                const menuBtn = sessionDiv.querySelector(".menu-btn");
                if (menuBtn) {
                    menuBtn.onclick = e => {
                        try {
                            e.stopPropagation();
                            showSessionMenu(sessionDiv, index);
                        } catch (error) {
                            console.error("Error handling menu click:", error);
                        }
                    };
                }
                
                DOM.sessionsEl.appendChild(sessionDiv);
            } catch (error) {
                console.error(`Error rendering session ${index}:`, error);
            }
        });
    } catch (error) {
        console.error("Error rendering sessions:", error);
        showError(new Error("Failed to display sessions"));
    }
};

const setCurrentSession = index => {
    try {
        if (typeof index !== 'number' || index < 0 || index >= sessions.length) {
            console.error("Invalid session index:", index);
            return;
        }

        currentSessionIndex = index;
        try {
            localStorage.setItem("stacy_currentSessionIndex", String(index));
        } catch (e) {
        }
        renderSessions();

        const session = sessions[currentSessionIndex];
        if (session && typeof switchToSessionType === 'function') {
            switchToSessionType(session.type || 'fast');
        }

        loadSessionData();
    } catch (error) {
        console.error("Error setting current session:", error);
        showError(new Error("Failed to switch session"));
    }
};

const loadSessionData = () => {
    try {
        const session = sessions[currentSessionIndex];
        if (!session) return;
        
        if (session.type === 'doc') {
            const sourceText = session.sourceDocument || "";
            
            if (DOM.docSourceText) {
                DOM.docSourceText.value = sourceText;
            }
            
            if (DOM.docSourceEditor) {
                DOM.docSourceEditor.innerText = sourceText;
            }

            if (typeof setupDocumentEditor === 'function') {
                setupDocumentEditor();
            }
            if (typeof updateDocumentStats === 'function') {
                updateDocumentStats();
            }
            
            if (typeof updateDocumentPreview === 'function') {
                updateDocumentPreview();
            }
        } else {
            if (!DOM.srcText || !DOM.tgtText || !DOM.srcSel || !DOM.tgtSel || !DOM.charCount) {
                console.error("Required DOM elements not found for loading session data");
                return;
            }
            
            DOM.srcText.value = session.sourceText || "";
            DOM.tgtText.value = session.targetText || "";
            DOM.srcSel.value = session.sourceLang || "AUTO";
            DOM.tgtSel.value = session.targetLang || "en";
            
            DOM.charCount.textContent = `${DOM.srcText.value.length} characters`;
            
            if (typeof updateDetectedLanguage === 'function') {
                updateDetectedLanguage();
            }
        }
    } catch (error) {
        console.error("Error loading session data:", error);
        showError(new Error("Failed to load session data"));
    }
};

const saveSessionData = () => {
    try {
        if (currentSessionIndex === -1 || !sessions[currentSessionIndex]) return;
        
        const session = sessions[currentSessionIndex];
        
        if (session.type === 'doc') {
            if (DOM.docSourceText) {
                session.sourceDocument = DOM.docSourceText.value || "";
            }
        } else {
            if (!DOM.srcText || !DOM.tgtText || !DOM.srcSel || !DOM.tgtSel) {
                console.error("Required DOM elements not found for saving session data");
                return;
            }
            
            session.sourceText = DOM.srcText.value || "";
            session.targetText = DOM.tgtText.value || "";
            session.sourceLang = DOM.srcSel.value || "AUTO";
            session.targetLang = DOM.tgtSel.value || "en";
        }
        
        save();
    } catch (error) {
        console.error("Error saving session data:", error);
    }
};

window.showSessionTypeModal = showSessionTypeModal;