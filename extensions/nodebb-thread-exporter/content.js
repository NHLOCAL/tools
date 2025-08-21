// --- הגדרת ממיר HTML ל-Markdown ---
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

// כלל להמרת כתובות תמונה יחסיות למוחלטות
turndownService.addRule('absoluteImages', {
    filter: 'img',
    replacement: function (content, node) {
        let src = node.getAttribute('src');
        if (src && !src.startsWith('http')) {
            try {
                // ה-API מחזיר כתובות יחסיות, לכן נשתמש במיקום הנוכחי כבסיס
                src = new URL(src, location.origin).href;
            } catch (e) {
                console.error("Could not create absolute URL for image:", src, e);
            }
        }
        const alt = node.alt || '';
        return `![${alt}](${src})`;
    }
});

// כלל לניקוי ציטוטים אוטומטיים של NodeBB
turndownService.addRule('cleanBlockquotes', {
    filter: 'blockquote',
    replacement: function (content, node) {
        const cleanedContent = content.replace(/@\S+\s+כתב\s+ב.+:/, '').trim();
        const lines = cleanedContent.split('\n');
        return '\n' + lines.map(line => `> ${line}`).join('\n') + '\n\n';
    }
});

// כלל לטיפול בתיוגי משתמשים
turndownService.addRule('userMentions', {
    filter: (node) => node.nodeName === 'A' && node.classList.contains('plugin-mentions-user'),
    replacement: (content) => content
});


/**
 * פונקציה ראשית לאיסוף ועיבוד השרשור דרך ה-API
 */
async function fetchAndProcessThread() {
    // שלב 1: חילוץ מזהה השרשור (TID) וכותרת
    // --- התיקון כאן: שינוי const ל-let ---
    let tid = window.ajaxify?.data?.tid;
    let title = window.ajaxify?.data?.title;

    // אם לא מצאנו TID ב-ajaxify, ננסה לחלץ אותו מה-URL
    if (!tid) {
        const match = window.location.pathname.match(/topic\/(\d+)/);
        if (match && match[1]) {
            tid = match[1];
        } else {
            throw new Error("לא ניתן היה למצוא את מזהה השרשור (TID).");
        }
    }
    // אם לא מצאנו כותרת, ננסה לחלץ אותה מה-DOM
     if (!title) {
        const titleElement = document.querySelector('span[component="topic/title"]');
        title = titleElement ? titleElement.textContent.trim() : document.title;
     }


    // שלב 2: קבלת מידע על מספר העמודים בשרשור
    const paginationResponse = await fetch(`${location.origin}/api/topic/pagination/${tid}`);
    if (!paginationResponse.ok) throw new Error(`שגיאה בקבלת מידע על עמודים: ${paginationResponse.statusText}`);
    const paginationData = await paginationResponse.json();
    const pageCount = paginationData.pagination.pageCount;

    // שלב 3: בניית רשימת בקשות API לכל העמודים
    const pagePromises = [];
    for (let i = 1; i <= pageCount; i++) {
        pagePromises.push(
            fetch(`${location.origin}/api/topic/${tid}?page=${i}`).then(res => {
                if (!res.ok) throw new Error(`שגיאה בטעינת עמוד ${i}`);
                return res.json();
            })
        );
    }

    // שלב 4: הרצת כל הבקשות במקביל ואיחוד התוצאות
    const allPagesData = await Promise.all(pagePromises);
    const allPosts = allPagesData.flatMap(pageData => pageData.posts);

    // שלב 5: עיבוד, סינון וצמצום המידע עבור כל פוסט
    const processedPosts = allPosts
        .filter(post => post && !post.deleted) // סינון פוסטים שנמחקו או לא תקינים
        .map(post => {
            // המרת תוכן HTML ל-Markdown
            const contentMarkdown = turndownService.turndown(post.content || '').trim();

            // יצירת אובייקט נקי ומצומצם
            return {
                pid: post.pid,
                author: post.user.username,
                content: contentMarkdown,
                reply_to_pid: post.toPid || null,
            };
        });

    return { posts: processedPosts, title: title };
}

// מאזין להודעות מה-popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "exportNodeBBThread") {
        fetchAndProcessThread()
            .then(data => {
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                console.error("Error exporting thread:", error);
                sendResponse({ success: false, error: error.message });
            });
    }
    return true; // נדרש עבור תגובה אסינכרונית
});