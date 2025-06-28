"use strict";

const LANG_MAP = { fr: "French", en: "English", ru: "Russian", it: "Italian", ja: "Japanese", es: "Spanish", de: "German", ar: "Arabic" };

let detectTimeout;

const isSupportedLanguage = (langCode) => {
    return LANG_MAP.hasOwnProperty(langCode);
};

const updateDetectedLanguage = () => {
    try {
        if (!DOM.srcSel || !DOM.detectedLangEl || !DOM.srcText) {
            console.error("Required DOM elements not found for language detection");
            return;
        }

        const srcValue = DOM.srcSel.getValue ? DOM.srcSel.getValue() : DOM.srcSel.value;
        if (srcValue !== "AUTO") {
            // Hide detected language if not in AUTO mode
            DOM.detectedLangEl.textContent = "";
            DOM.detectedLangEl.style.display = "none";
            return;
        } else {
            // Show detected language if in AUTO mode
            DOM.detectedLangEl.style.display = "";
        }

        const text = DOM.srcText.value?.trim() || "";
        
        // Always clear previous timeout before setting new one
        if (detectTimeout) {
            clearTimeout(detectTimeout);
            detectTimeout = null;
        }

        if (text.length < 3) {
            DOM.detectedLangEl.textContent = "";
            return;
        }

        detectTimeout = setTimeout(async () => {
            try {
                const langCode = await detectLang(text);

                if (isSupportedLanguage(langCode)) {
                    DOM.detectedLangEl.textContent = `${LANG_MAP[langCode]}`;
                    DOM.detectedLangEl.style.color = "var(--text-muted)";
                    DOM.detectedLangEl.style.display = ""; // Ensure visible

                    if (DOM.tgtSel) {
                        const newTarget = langCode === "en" ? "fr" : "en";
                        if (DOM.tgtSel.setValue) {
                            DOM.tgtSel.setValue(newTarget);
                        } else {
                            DOM.tgtSel.value = newTarget;
                        }
                    }
                } else {
                    DOM.detectedLangEl.textContent = "Unknown";
                    DOM.detectedLangEl.style.color = "var(--error)";
                    DOM.detectedLangEl.style.display = ""; // Ensure visible
                }
            } catch (error) {
                console.error("Language detection failed:", error);
                DOM.detectedLangEl.textContent = "Detection error";
                DOM.detectedLangEl.style.color = "var(--error)";
                DOM.detectedLangEl.style.display = ""; // Ensure visible
            } finally {
                detectTimeout = null;
            }
        }, 500);
    } catch (error) {
        console.error("Error in updateDetectedLanguage:", error);
    }
};

const adjustLanguage = (src, tgt) => {
    try {
        if (!src || !tgt) return tgt || "en";
        if (tgt !== src) return tgt;

        const alternatives = ['fr', 'en', 'es', 'de', 'it', 'ru', 'ja', 'ar'];
        return alternatives.find(lang => lang !== src) || tgt;
    } catch (error) {
        console.error("Error adjusting language:", error);
        return tgt || "en";
    }
};

const processTranslation = async () => {
    try {
        if (!DOM.srcText || !DOM.translateBtn) {
            console.error("Required DOM elements not found for translation");
            return;
        }

        const text = DOM.srcText.value?.trim();
        if (!text) {
            showError(new Error("Please enter text to translate"));
            return;
        }

        let srcLang = DOM.srcSel?.getValue ? DOM.srcSel.getValue() : (DOM.srcSel?.value || "AUTO");
        let tgtLang = DOM.tgtSel?.getValue ? DOM.tgtSel.getValue() : (DOM.tgtSel?.value || "en");

        if (srcLang === "AUTO") {
            try {
                srcLang = await detectLang(text);

                if (!isSupportedLanguage(srcLang)) {
                    showError(new Error("Detected language is not supported for translation"));
                    return;
                }
            } catch (err) {
                console.error("Language detection failed, using fallback:", err);
                srcLang = "en";
            }
        }

        DOM.translateBtn.disabled = true;
        DOM.translateBtn.textContent = "Translating...";

        tgtLang = adjustLanguage(srcLang, tgtLang);

        let translation = "";
        try {
            translation = await translate(text, srcLang, tgtLang);
        } catch (err) {
            console.error("Translation failed:", err);
            showError(err);
            translation = "[Translation error]";
        }

        if (DOM.tgtText) {
            DOM.tgtText.value = translation;
        }

        try {
            saveSessionData();

            if (currentSessionIndex !== -1 && sessions[currentSessionIndex]) {
                sessions[currentSessionIndex].messages.push({
                    role: "user",
                    text: `${LANG_MAP[srcLang] || srcLang} → ${LANG_MAP[tgtLang] || tgtLang}: ${text}`
                });
                sessions[currentSessionIndex].messages.push({
                    role: "assistant",
                    text: translation
                });

                if (sessions[currentSessionIndex].title === "New Session") {
                    sessions[currentSessionIndex].title = text.slice(0, TITLE_MAX);
                }

                save();
                renderSessions();
            }
        } catch (error) {
            console.error("Error saving translation to session:", error);
        }
    } catch (err) {
        console.error("Error in processTranslation:", err);
        showError(new Error("Translation process failed"));
    } finally {
        try {
            if (DOM.translateBtn) {
                DOM.translateBtn.disabled = false;
                DOM.translateBtn.textContent = "Translate";
            }
        } catch (error) {
            console.error("Error restoring translate button:", error);
        }
    }
};
