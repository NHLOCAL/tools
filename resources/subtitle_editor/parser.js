// --- Time Utility Functions ---

/**
 * Converts a time string (e.g., "00:01:05.123" or "00:01:05,123") to seconds.
 * @param {string} timeStr The time string to convert.
 * @returns {number} The time in seconds.
 */
export const timeStringToSeconds = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    let normalizedTime = timeStr.replace(',', '.');
    // Heuristic to handle frame-based timecodes like 00:00:01:15 by converting the last colon to a dot.
    const colonCount = (normalizedTime.match(/:/g) || []).length;
    if (colonCount === 3 || (colonCount === 2 && !normalizedTime.includes('.'))) {
         const lastColonIndex = normalizedTime.lastIndexOf(':');
         normalizedTime = normalizedTime.substring(0, lastColonIndex) + '.' + normalizedTime.substring(lastColonIndex + 1);
    }
    const parts = normalizedTime.split(':');
    let seconds = 0;
    if (parts.length === 3) { seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]); }
    else if (parts.length === 2) { seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]); }
    else if (parts.length === 1) { seconds = parseFloat(parts[0]); }
    return isNaN(seconds) ? 0 : seconds;
};

/**
 * Converts seconds to a time string (HH:MM:SS.ms).
 * @param {number} seconds The time in seconds.
 * @param {boolean} useComma Whether to use a comma instead of a dot for the millisecond separator.
 * @returns {string} The formatted time string.
 */
export const secondsToTimeString = (seconds, useComma = false) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0'),
        m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0'),
        s = Math.floor(seconds % 60).toString().padStart(2, '0'),
        ms = Math.round((seconds - Math.floor(seconds)) * 1000).toString().padStart(3, '0');
    return `${h}:${m}:${s}${useComma ? ',' : '.'}${ms}`;
};


// --- Format-Specific Parsers ---

/**
 * Parses content in SRT or VTT format.
 * @param {string} content The subtitle content.
 * @returns {Array<object>|null} An array of subtitle objects or null if parsing fails.
 */
function parseVttOrSrt(content) {
    const subs = [];
    const cleanedContent = content
        .trim()
        .replace(/\r/g, '')
        .replace(/^WEBVTT\s*\n/, '') // Remove VTT header
        .replace(/NOTE\s.*\n/g, '');   // Remove VTT notes

    const blocks = cleanedContent.split(/\n\n+/);

    for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length < 2) continue;

        const timeLineIndex = lines.findIndex(l => l.includes('-->'));
        if (timeLineIndex === -1) continue;

        const timeLine = lines[timeLineIndex];
        const [start_time, end_time] = timeLine.split('-->').map(s => s.trim());
        
        // VTT can have metadata on the time line, remove it
        const cleanStartTime = start_time.split(' ')[0];
        const cleanEndTime = end_time.split(' ')[0];

        // The text is everything after the timeline, removing any VTT tags
        const text = lines.slice(timeLineIndex + 1)
                          .join('\n')
                          .trim()
                          .replace(/<[^>]+>/g, ''); // Strip tags like <v Author>

        if (text) {
            subs.push({ start_time: cleanStartTime, end_time: cleanEndTime, text });
        }
    }
    return subs.length > 0 ? subs : null;
}

/**
 * Parses content in a simple timestamp format, e.g., [HH:MM:SS.ms] text...
 * This is now enhanced to also handle malformed timestamps like [MM:SS.ms].
 * @param {string} content The subtitle content.
 * @returns {Array<object>|null} An array of subtitle objects or null if parsing fails.
 */
function parseSimpleTimestampFormat(content) {
    let subs = [];
    
    // --- CHANGED ---
    // This regex now accepts an optional HH: part, making it compatible with [MM:SS.ms]
    const timestampRegex = /(\[(\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3}\])/;
    const parts = content.trim().split(timestampRegex);

    if (parts.length < 3) return null; // Not the right format

    for (let i = 1; i < parts.length; i += 3) { // Note: The capturing group in regex changes the split behavior
        let timeStr = parts[i].replace(/[\[\]]/g, ''); // Remove brackets
        const text = parts[i + 2].trim();
        
        // --- ADDED ---
        // Automatically fix timestamps that are missing the hour part
        if ((timeStr.match(/:/g) || []).length === 1) {
            timeStr = '00:' + timeStr; // Prepend "00:" to standardize to HH:MM:SS.ms
        }
        
        if (text) {
            subs.push({ start_time: timeStr, text });
        }
    }

    if (subs.length === 0) return null;

    // Second pass to calculate end times
    for (let i = 0; i < subs.length; i++) {
        if (i < subs.length - 1) {
            const nextStartTime = timeStringToSeconds(subs[i + 1].start_time);
            subs[i].end_time = secondsToTimeString(nextStartTime - 0.001); // End just before the next starts
        } else {
            // Last subtitle, give it a default duration (e.g., 5 seconds)
            const startTime = timeStringToSeconds(subs[i].start_time);
            subs[i].end_time = secondsToTimeString(startTime + 5);
        }
    }
    
    return subs.length > 0 ? subs : null;
}

/**
 * Parses content from a JSON string.
 * @param {string} content The JSON content.
 * @returns {Array<object>|null} An array of subtitle objects or null if parsing fails.
 */
function parseJson(content) {
    try {
        const data = JSON.parse(content);
        if (Array.isArray(data) && data.every(item => 'text' in item && ('start_time' in item || 'end_time' in item))) {
            return data;
        }
        return null;
    } catch (e) {
        return null;
    }
}


// --- Main Parser Function ---

/**
 * Intelligently parses subtitle content by trying different formats.
 * @param {string} content The raw string content from a file or textarea.
 * @returns {Array<object>|null} An array of subtitle objects or null if no format is recognized.
 */
export function parseTranscriptContent(content) {
    if (!content || !content.trim()) {
        return null;
    }
    const trimmedContent = content.trim();

    // 1. Try JSON first (it's the most structured and least ambiguous)
    let parsedData = parseJson(trimmedContent);
    if (parsedData) {
        return parsedData.map((item, index) => ({ ...item, id: item.id || Date.now() + index }));
    }

    // 2. Try VTT/SRT (strong indicator is '-->')
    if (trimmedContent.includes('-->')) {
        parsedData = parseVttOrSrt(trimmedContent);
        if (parsedData) {
            return parsedData.map((item, index) => ({ ...item, id: item.id || Date.now() + index }));
        }
    }
    
    // 3. Try the simple [timestamp] format
    // --- CHANGED ---
    // Updated the detection regex to also match the malformed [MM:SS.ms] format
    if (/^\[(\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3}\]/.test(trimmedContent)) {
        parsedData = parseSimpleTimestampFormat(trimmedContent);
         if (parsedData) {
            return parsedData.map((item, index) => ({ ...item, id: item.id || Date.now() + index }));
        }
    }

    // 4. If no format matches, return null
    console.warn("Could not determine subtitle format.");
    return null;
}