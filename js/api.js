"use strict";

const API_URLS = {
    translate: "https://translate.teamcardinalis.com/translate",
    detect: "https://translate.googleapis.com/translate_a/single?client=gtx",
    models: "https://translate.teamcardinalis.com/models"
};

const detectLang = async txt => {
    try {
        if (!txt || typeof txt !== 'string' || txt.trim().length < 3) {
            throw new Error("Text too short for detection");
        }

        const url = `${API_URLS.detect}&sl=auto&tl=en&dt=t&q=${encodeURIComponent(txt)}`;
        const r = await fetch(url, { timeout: 10000 });
        
        if (!r.ok) {
            throw new Error(`Language detection failed: ${r.status} ${r.statusText}`);
        }
        
        const result = await r.json();
        
        if (!result || !result[2]) {
            throw new Error("Invalid detection response format");
        }
        
        return result[2];
    } catch (error) {
        console.error("Language detection error:", error);
        throw new Error("Language detection failed");
    }
};

const translate = async (txt, src, tgt) => {
    try {
        if (!txt || typeof txt !== 'string' || txt.trim().length === 0) {
            throw new Error("No text to translate");
        }
        
        if (!src || !tgt) {
            throw new Error("Source and target languages are required");
        }

        const response = await fetch(API_URLS.translate, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: txt, source_lang: src, target_lang: tgt }),
            timeout: 15000
        });
        
        if (!response.ok) {
            throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result || typeof result.translated_text === 'undefined') {
            throw new Error("Invalid translation response format");
        }
        
        return result.translated_text || "";
    } catch (error) {
        console.error("Translation error:", error);
        throw new Error("Translation failed");
    }
};

const fetchModels = async () => {
    try {
        const response = await fetch(API_URLS.models, { timeout: 10000 });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
        }
        
        const models = await response.json();
        
        if (!Array.isArray(models)) {
            throw new Error("Invalid models response format");
        }
        
        return models;
    } catch (error) {
        console.error("Error fetching models:", error);
        throw new Error("Failed to load models");
    }
};
