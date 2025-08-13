// --- Time Utility Functions ---

/**
 * Converts a time string (e.g., "00:01:05.123" or "00:01:05,123") to seconds.
 * @param {string} timeStr The time string to convert.
 * @returns {number} The time in seconds.
 */
export const timeStringToSeconds = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    let normalizedTime = timeStr.replace(',', '.');
    // Heuristic to handle frame-based or colon-separated ms timecodes 
    // like 00:00:01:15 or 00:22:201 by converting the last colon to a dot.
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

function parseVttOrSrt(content) {
    const subs = [];
    const cleanedContent = content
        .trim()
        .replace(/\r/g, '')
        .replace(/^WEBVTT\s*\n/, '') 
        .replace(/NOTE\s.*\n/g, ''); 

    const blocks = cleanedContent.split(/\n\n+/);

    for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length < 2) continue;
        const timeLineIndex = lines.findIndex(l => l.includes('-->'));
        if (timeLineIndex === -1) continue;
        const timeLine = lines[timeLineIndex];
        const [start_time, end_time] = timeLine.split('-->').map(s => s.trim());
        const cleanStartTime = start_time.split(' ')[0];
        const cleanEndTime = end_time.split(' ')[0];
        const text = lines.slice(timeLineIndex + 1).join('\n').trim().replace(/<[^>]+>/g, '');
        if (text) {
            subs.push({ start_time: cleanStartTime, end_time: cleanEndTime, text });
        }
    }
    return subs.length > 0 ? subs : null;
}

function parseSimpleTimestampFormat(content) {
    let subs = [];
    // UPDATED: Added ':' to the character class to accept it as a millisecond separator
    const timestampRegex = /(\[(\d{1,2}:)?\d{2}:\d{2}[.,:]\d{1,3}\])/;
    const parts = content.trim().split(timestampRegex);
    if (parts.length < 3) return null; 

    for (let i = 1; i < parts.length; i += 3) {
        let timeStr = parts[i].replace(/[\[\]]/g, '');
        const text = parts[i + 2].trim();
        if ((timeStr.match(/:/g) || []).length === 1) {
            timeStr = '00:' + timeStr;
        }
        if (text) {
            // Here, we preserve the text block exactly as it was, including all internal newlines.
            subs.push({ start_time: timeStr, text: text });
        }
    }

    if (subs.length === 0) return null;
    for (let i = 0; i < subs.length; i++) {
        if (i < subs.length - 1) {
            const nextStartTime = timeStringToSeconds(subs[i + 1].start_time);
            subs[i].end_time = secondsToTimeString(nextStartTime - 0.001);
        } else {
            const startTime = timeStringToSeconds(subs[i].start_time);
            subs[i].end_time = secondsToTimeString(startTime + 5);
        }
    }
    return subs.length > 0 ? subs : null;
}

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
 * Intelligently parses subtitle content and returns the data along with the format type.
 * @param {string} content The raw string content from a file or textarea.
 * @returns {{data: Array<object>, format: string}|null} An object with data and format, or null if parsing fails.
 */
export function parseTranscriptContent(content) {
    if (!content || !content.trim()) {
        return null;
    }
    const trimmedContent = content.trim();
    let parsedData = null;
    let format = null;

    // 1. Try JSON
    parsedData = parseJson(trimmedContent);
    if (parsedData) {
        format = 'json';
    }
    // 2. Try VTT/SRT
    else if (trimmedContent.includes('-->')) {
        parsedData = parseVttOrSrt(trimmedContent);
        if (parsedData) {
            format = 'srt';
        }
    }
    // 3. Try the simple [timestamp] format
    else if (/^\[(\d{1,2}:)?\d{2}:\d{2}[.,:]\d{1,3}\]/.test(trimmedContent)) { // UPDATED: Also updated the initial test regex
        parsedData = parseSimpleTimestampFormat(trimmedContent);
         if (parsedData) {
            format = 'simple';
        }
    }

    // Return result if any format was successful
    if (parsedData && format) {
        const dataWithIds = parsedData.map((item, index) => ({ ...item, id: item.id || Date.now() + index }));
        return { data: dataWithIds, format: format };
    }

    // 4. If no format matches, return null
    console.warn("Could not determine subtitle format.");
    return null;
}