"use strict";

import { DOM } from './ui.js';
import { detectLang, translate } from './api.js';

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

export const updateDocumentStats = () => {
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

export const setupDocumentEditor = () => {
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

export const translateDocument = async () => {
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
        let srcLang = DOM.docSourceLang?.value || "AUTO";
        let tgtLang = DOM.docTargetLang?.value || "en";
        
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

export const updateDocumentPreview = () => {
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
            DOM.docPreview.innerHTML = `
                <div class="doc-preview-placeholder">
                    <div class="doc-placeholder-icon">${getIcon('documentLarge', 'icon-muted')}</div>
                    <p>Document translation will appear here</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error updating document preview:", error);
    }
};

export const exportDocumentToPDF = () => {
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

window.translateDocument = translateDocument;
window.exportDocumentToPDF = exportDocumentToPDF;
window.setupDocumentEditor = setupDocumentEditor;