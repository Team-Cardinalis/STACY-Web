"use strict";

const exportIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="#ffffff" d="M15.245 16.498a.75.75 0 0 1 .101 1.493l-.101.007H4.75a.75.75 0 0 1-.102-1.493l.102-.007zM10.004 2a.75.75 0 0 1 .743.648l.007.102l-.001 10.193l2.966-2.97a.75.75 0 0 1 .977-.074l.084.072a.75.75 0 0 1 .073.977l-.072.084l-4.243 4.25l-.07.063l-.092.059l-.036.021l-.091.038l-.12.03l-.07.008l-.06.002a.7.7 0 0 1-.15-.016l-.082-.023a.7.7 0 0 1-.257-.146l-4.29-4.285a.75.75 0 0 1 .976-1.134l.084.073l2.973 2.967V2.75a.75.75 0 0 1 .75-.75"/></svg>`;

const MAX_PARAGRAPH_LENGTH = 1000;

const splitIntoTranslatableParagraphs = (text) => {
    try {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
        const result = [];
        
        paragraphs.forEach(paragraph => {
            if (paragraph.length <= MAX_PARAGRAPH_LENGTH) {
                result.push(paragraph.trim());
            } else {
                const sentences = paragraph.split(/(?<=[.!?])\s+/);
                let currentChunk = "";
                
                sentences.forEach(sentence => {
                    if ((currentChunk + sentence).length <= MAX_PARAGRAPH_LENGTH) {
                        currentChunk += (currentChunk ? " " : "") + sentence;
                    } else {
                        if (currentChunk) {
                            result.push(currentChunk.trim());
                        }
                        currentChunk = sentence;
                    }
                });
                
                if (currentChunk) {
                    result.push(currentChunk.trim());
                }
            }
        });
        
        return result;
    } catch (error) {
        console.error("Error splitting text into paragraphs:", error);
        return [text];
    }
};

const updateDocumentStats = () => {
    try {
        const text = DOM.docSourceText?.value || "";
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const paragraphCount = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
        
        if (DOM.docCharCount) DOM.docCharCount.textContent = `${charCount} characters`;
        if (DOM.docWordCount) DOM.docWordCount.textContent = `${wordCount} words`;
        if (DOM.docParagraphCount) DOM.docParagraphCount.textContent = `${paragraphCount} paragraphs`;
    } catch (error) {
        console.error("Error updating document stats:", error);
    }
};

const syncEditorToTextarea = () => {
    try {
        if (DOM.docSourceEditor && DOM.docSourceText) {
            const text = DOM.docSourceEditor.innerText || "";
            DOM.docSourceText.value = text;
            updateDocumentStats();
            
            if (currentSessionIndex !== -1) {
                saveSessionData();
            }
        }
    } catch (error) {
        console.error("Error syncing editor to textarea:", error);
    }
};

let editorInputHandler = null;
let editorPasteHandler = null;

const setupDocumentEditor = () => {
    try {
        if (!DOM.docSourceEditor || !DOM.docSourceText) return;
        
        // Remove existing handlers
        if (editorInputHandler) {
            DOM.docSourceEditor.removeEventListener('input', editorInputHandler);
        }
        if (editorPasteHandler) {
            DOM.docSourceEditor.removeEventListener('paste', editorPasteHandler);
        }
        
        editorInputHandler = () => {
            try {
                syncEditorToTextarea();
                if (currentSessionIndex !== -1) {
                    saveSessionData();
                }
            } catch (error) {
                console.error("Error in document editor input handler:", error);
            }
        };
        
        editorPasteHandler = (e) => {
            try {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text');
                document.execCommand('insertText', false, text);
            } catch (error) {
                console.error("Error handling paste:", error);
            }
        };
        
        DOM.docSourceEditor.addEventListener('input', editorInputHandler);
        DOM.docSourceEditor.addEventListener('paste', editorPasteHandler);
        
        const setupToolbarButton = (buttonId, command, value = null) => {
            try {
                const button = $(buttonId);
                if (button) {
                    button.onclick = () => {
                        try {
                            document.execCommand(command, false, value);
                            DOM.docSourceEditor.focus();
                            syncEditorToTextarea();
                        } catch (error) {
                            console.error(`Error executing ${command}:`, error);
                        }
                    };
                }
            } catch (error) {
                console.error(`Error setting up toolbar button ${buttonId}:`, error);
            }
        };
        
        setupToolbarButton('doc-bold-btn', 'bold');
        setupToolbarButton('doc-italic-btn', 'italic');
        setupToolbarButton('doc-underline-btn', 'underline');
        setupToolbarButton('doc-clear-format-btn', 'removeFormat');
        
        const wordCountBtn = $('doc-word-count-btn');
        if (wordCountBtn) {
            wordCountBtn.onclick = () => {
                try {
                    const stats = `Characters: ${DOM.docCharCount?.textContent || '0'}\nWords: ${DOM.docWordCount?.textContent || '0'}\nParagraphs: ${DOM.docParagraphCount?.textContent || '0'}`;
                    alert(stats);
                } catch (error) {
                    console.error("Error showing word count:", error);
                }
            };
        }
        
        injectExportIcon();
        injectCopyIcon();
        
    } catch (error) {
        console.error("Error setting up document editor:", error);
    }
};

const showDocumentProgress = (current, total, currentParagraph = "") => {
    try {
        if (!DOM.docPreview) return;
        
        const percentage = Math.round((current / total) * 100);
        
        DOM.docPreview.innerHTML = `
            <div class="doc-progress-container">
                <div class="doc-progress-header">
                    <h3>Translating Document...</h3>
                    <span class="progress-text">${current}/${total} paragraphs</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-percentage">${percentage}%</div>
                ${currentParagraph ? `
                    <div class="current-paragraph">
                        <strong>Currently translating:</strong>
                        <p class="paragraph-preview">${currentParagraph.substring(0, 100)}${currentParagraph.length > 100 ? '...' : ''}</p>
                    </div>
                ` : ''}
            </div>
        `;
    } catch (error) {
        console.error("Error showing document progress:", error);
    }
};

const translateDocument = async () => {
    try {
        if (!DOM.docSourceEditor || !DOM.docTranslateBtn) {
            console.error("Required DOM elements not found for document translation");
            return;
        }
        
        syncEditorToTextarea();
        
        const editorText = DOM.docSourceEditor.innerText?.trim() || "";
        const textareaText = DOM.docSourceText?.value?.trim() || "";
        const sourceText = editorText || textareaText;
        
        if (!sourceText) {
            showError(new Error("Please enter document text to translate"));
            return;
        }
        
        const currentSession = sessions[currentSessionIndex];
        if (!currentSession || currentSession.type !== 'doc') {
            showError(new Error("Invalid document session"));
            return;
        }
        
        DOM.docTranslateBtn.disabled = true;
        DOM.docTranslateBtn.textContent = "Translating...";
        
        const paragraphs = splitIntoTranslatableParagraphs(sourceText);
        let srcLang = DOM.docSourceLang?.getValue ? DOM.docSourceLang.getValue() : (DOM.docSourceLang?.value || "AUTO");
        let tgtLang = DOM.docTargetLang?.getValue ? DOM.docTargetLang.getValue() : (DOM.docTargetLang?.value || "en");
        
        if (srcLang === "AUTO") {
            try {
                showDocumentProgress(0, paragraphs.length, "Detecting language...");
                srcLang = await detectLang(sourceText.substring(0, 500));
                if (!isSupportedLanguage(srcLang)) {
                    showError(new Error("Detected language is not supported for translation"));
                    return;
                }
            } catch (err) {
                console.error("Language detection failed, using fallback:", err);
                srcLang = "en";
            }
        }
        
        currentSession.paragraphs = paragraphs.map(p => ({ original: p, translated: "" }));
        
        showDocumentProgress(0, paragraphs.length);
        
        for (let i = 0; i < paragraphs.length; i++) {
            try {
                showDocumentProgress(i, paragraphs.length, paragraphs[i]);
                
                const translatedParagraph = await translate(paragraphs[i], srcLang, tgtLang);
                currentSession.paragraphs[i].translated = translatedParagraph;
                
                showDocumentProgress(i + 1, paragraphs.length);
                
                save();
                
                if (i < paragraphs.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                console.error(`Error translating paragraph ${i + 1}:`, error);
                currentSession.paragraphs[i].translated = `[Translation error: ${paragraphs[i]}]`;
            }
        }
        
        setTimeout(() => {
            updateDocumentPreview();
        }, 1000);
        
    } catch (error) {
        console.error("Error in document translation:", error);
        showError(new Error("Document translation failed"));
    } finally {
        try {
            if (DOM.docTranslateBtn) {
                DOM.docTranslateBtn.disabled = false;
                DOM.docTranslateBtn.textContent = "Translate Document";
            }
        } catch (error) {
            console.error("Error restoring translate button:", error);
        }
    }
};

const updateDocumentPreview = () => {
    try {
        const currentSession = sessions[currentSessionIndex];
        if (!currentSession || !DOM.docPreview) return;

        const translatedText = currentSession.paragraphs
            ?.map(p => p.translated || p.original)
            .join('\n\n') || "";

        if (translatedText.trim()) {
            DOM.docPreview.innerHTML = translatedText
                .split('\n\n')
                .map(paragraph => `<p>${paragraph}</p>`)
                .join('');
        } else {
            // Utilisez exportIconSVG si documentIcon est vide
            let svgContent = (typeof documentIcon !== 'undefined' && documentIcon) ? documentIcon : exportIconSVG;
            DOM.docPreview.innerHTML = `
                <div class="doc-preview-placeholder">
                    <div class="doc-placeholder-icon">${svgContent}</div>
                    <p>Document translation will appear here</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error updating document preview:", error);
    }
};

const exportDocumentToPDF = () => {
    try {
        const currentSession = sessions[currentSessionIndex];
        if (!currentSession || currentSession.type !== 'doc') {
            showError(new Error("No document session active"));
            return;
        }
        
        const translatedText = currentSession.paragraphs
            .map(p => p.translated || p.original)
            .filter(p => p.trim())
            .join('\n\n');
            
        if (!translatedText) {
            showError(new Error("No translated document to export"));
            return;
        }
        
        const printContent = `
            <html>
                <head>
                    <title>Document</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 40px; 
                            line-height: 1.8; 
                            font-size: 14px;
                            color: #333;
                        }
                        p {
                            margin-bottom: 16px;
                            text-align: justify;
                        }
                    </style>
                </head>
                <body>
                    ${translatedText.split('\n\n').map(p => `<p>${p}</p>`).join('')}
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
        console.error("Error exporting document to PDF:", error);
        showError(new Error("Failed to export document PDF"));
    }
};

const injectExportIcon = () => {
    try {
        const btn = document.getElementById('doc-export-btn');
        if (btn) {
            const iconSpan = btn.querySelector('#export-pdf-icon');
            if (iconSpan) {
                iconSpan.innerHTML = exportIconSVG;
            } else {
                btn.innerHTML = `${exportIconSVG} Export PDF`;
            }
        }
    } catch (e) {
        // fallback
        const btn = document.getElementById('doc-export-btn');
        if (btn) btn.textContent = "Export PDF";
    }
};

function injectCopyIcon() {
    const btn = document.querySelector('.copy-btn');
    if (btn) {
        // SVG en dur (copied from icons/copy.svg)
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="#ffffff" fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/></svg>`;
    }
}

window.translateDocument = translateDocument;
window.exportDocumentToPDF = exportDocumentToPDF;
window.setupDocumentEditor = setupDocumentEditor;