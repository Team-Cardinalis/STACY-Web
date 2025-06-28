"use strict";

export const TITLE_MAX = 30;
export const SESSION_TYPES = {
    FAST: 'fast',
    DOC: 'doc'
};

export let sessions = [];
export let currentSessionIndex = -1;

try {
    const stored = localStorage.getItem("sessions");
    sessions = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(sessions)) {
        sessions = [];
    }
    sessions.forEach(session => {
        if (!session.type) {
            session.type = SESSION_TYPES.FAST;
        }
    });
} catch (error) {
    sessions = [];
}

export const save = () => {
    try {
        localStorage.setItem("sessions", JSON.stringify(sessions));
    } catch (error) {
        showError(new Error("Failed to save session data"));
    }
};

export const addSession = (title, type = SESSION_TYPES.FAST) => {
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
            <div class="modal" tabindex="0">
                <h2>Choose Session Type</h2>
                <div class="session-type-options">
                    <div class="session-type-option" data-type="${SESSION_TYPES.FAST}">
                        <div class="session-type-icon">${lightningIcon}</div>
                        <div class="session-type-title">Fast</div>
                        <div class="session-type-description">Quick text translation</div>
                    </div>
                    <div class="session-type-option" data-type="${SESSION_TYPES.DOC}">
                        <div class="session-type-icon">${documentIcon}</div>
                        <div class="session-type-title">Doc</div>
                        <div class="session-type-description">Document processing with PDF output</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        const modalBox = modal.querySelector('.modal');
        if (modalBox) modalBox.focus();

        const mousedownHandler = (e) => {
            if (e.target === modal) {
                cleanupModal();
            }
        };

        const escHandler = (e) => {
            if (e.key === "Escape") {
                cleanupModal();
            }
        };

        const cleanupModal = () => {
            try {
                modal.removeEventListener('mousedown', mousedownHandler);
                document.removeEventListener('keydown', escHandler);
                if (modal.parentNode) {
                    modal.remove();
                }
            } catch (error) {
                console.error("Error cleaning up modal:", error);
            }
        };

        modal.addEventListener('mousedown', mousedownHandler);
        document.addEventListener('keydown', escHandler);

        modal.querySelectorAll('.session-type-option').forEach(option => {
            option.onclick = () => {
                const type = option.dataset.type;
                cleanupModal();
                addSession(`New ${type === SESSION_TYPES.DOC ? 'Document' : 'Session'}`, type);
            };
        });
        
    } catch (error) {
        showError(new Error("Failed to show session type selection"));
    }
};

export const deleteSession = index => {
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
        showError(new Error("Failed to delete session"));
    }
};

export const renameSession = index => {
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
        showError(new Error("Failed to rename session"));
    }
};

export const renderSessions = () => {
    try {
        if (!DOM.sessionsEl) {
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
                    }
                };
                
                const menuBtn = sessionDiv.querySelector(".menu-btn");
                if (menuBtn) {
                    menuBtn.onclick = e => {
                        try {
                            e.stopPropagation();
                            showSessionMenu(sessionDiv, index);
                        } catch (error) {
                        }
                    };
                }
                
                DOM.sessionsEl.appendChild(sessionDiv);
            } catch (error) {
            }
        });
    } catch (error) {
        showError(new Error("Failed to display sessions"));
    }
};

export const setCurrentSession = index => {
    try {
        if (typeof index !== 'number' || index < 0 || index >= sessions.length) {
            return;
        }

        currentSessionIndex = index;
        try {
            localStorage.setItem("currentSessionIndex", String(index));
        } catch (e) {
        }
        renderSessions();

        const session = sessions[currentSessionIndex];
        if (session && typeof switchToSessionType === 'function') {
            switchToSessionType(session.type || 'fast');
        }

        loadSessionData();
    } catch (error) {
        showError(new Error("Failed to switch session"));
    }
};

export const loadSessionData = () => {
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
                return;
            }
            
            DOM.srcText.value = session.sourceText || "";
            DOM.tgtText.value = session.targetText || "";
            DOM.srcSel.value = session.sourceLang || "AUTO";
            DOM.tgtSel.value = session.targetLang || "en";
            
            DOM.charCount.textContent = `${DOM.srcText.value.length} characters`;
            
            if (DOM.srcSel.value === "AUTO" && typeof updateDetectedLanguage === 'function') {
                updateDetectedLanguage();
            } else if (DOM.detectedLangEl) {
                DOM.detectedLangEl.textContent = "";
                DOM.detectedLangEl.style.color = "";
                DOM.detectedLangEl.style.display = "none";
            }
        }
    } catch (error) {
        showError(new Error("Failed to load session data"));
    }
};

export const saveSessionData = () => {
    try {
        if (currentSessionIndex === -1 || !sessions[currentSessionIndex]) return;
        
        const session = sessions[currentSessionIndex];
        
        if (session.type === 'doc') {
            if (DOM.docSourceText) {
                session.sourceDocument = DOM.docSourceText.value || "";
            }
        } else {
            if (!DOM.srcText || !DOM.tgtText || !DOM.srcSel || !DOM.tgtSel) {
                return;
            }
            
            session.sourceText = DOM.srcText.value || "";
            session.targetText = DOM.tgtText.value || "";
            session.sourceLang = DOM.srcSel.value || "AUTO";
            session.targetLang = DOM.tgtSel.value || "en";
        }
        
        save();
    } catch (error) {
    }
};

window.showSessionTypeModal = showSessionTypeModal;