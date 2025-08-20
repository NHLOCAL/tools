const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

turndownService.addRule('absoluteImages', {
    filter: 'img',
    replacement: function (content, node) {
        let src = node.getAttribute('src');
        if (src && !src.startsWith('http')) {
            try {
                src = new URL(src, location.origin).href;
            } catch (e) {
                console.error("Could not create absolute URL for image:", src, e);
            }
        }
        const alt = node.alt || '';
        return `![${alt}](${src})`;
    }
});

turndownService.addRule('cleanBlockquotes', {
    filter: 'blockquote',
    replacement: function (content, node) {
        const cleanedContent = content.replace(/@\S+\s+כתב\s+ב.+:/, '').trim();
        const lines = cleanedContent.split('\n');
        return '\n' + lines.map(line => `> ${line}`).join('\n') + '\n\n';
    }
});

turndownService.addRule('userMentions', {
    filter: function (node, options) {
        return node.nodeName === 'A' && node.classList.contains('plugin-mentions-user');
    },
    replacement: function (content, node) {
        return node.textContent;
    }
});

async function scrapeThread() {
    const postsData = [];
    const scrapedPostIds = new Set();
    
    let pageTitle;
    const titleElement = document.querySelector('span[component="topic/title"]');
    if (titleElement) {
        pageTitle = titleElement.textContent.trim();
    } else {
        pageTitle = document.title;
        const siteSeparator = ' - מתמחים טופ';
        const sepIndex = pageTitle.lastIndexOf(siteSeparator);
        if (sepIndex > 0) {
            pageTitle = pageTitle.substring(0, sepIndex);
        }
    }
    
    const indicator = document.createElement('div');
    indicator.textContent = 'טוען את כל השרשור, התהליך עשוי לקחת זמן...';
    Object.assign(indicator.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '5px',
        zIndex: '9999',
        fontSize: '16px',
        textAlign: 'center'
    });
    document.body.appendChild(indicator);

    indicator.textContent = 'טוען את תחילת השרשור...';
    let lastScrollY = -1;
    while (window.scrollY > 0 && window.scrollY !== lastScrollY) {
        lastScrollY = window.scrollY;
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    indicator.textContent = 'אוסף פוסטים וגולל לסוף השרשור...';
    let newPostsFound = true;
    while (newPostsFound) {
        const initialCount = scrapedPostIds.size;

        const postElements = document.querySelectorAll('li[component="post"]');
        postElements.forEach(postElement => {
            const postId = postElement.getAttribute('data-pid');
            if (postId && !scrapedPostIds.has(postId)) {
                const authorElement = postElement.querySelector('[data-username]');
                const author = authorElement ? authorElement.getAttribute('data-username') : 'לא ידוע';
                const timestampElement = postElement.querySelector('.timeago');
                const timestamp = timestampElement ? timestampElement.getAttribute('title') : 'לא ידוע';
                const contentElement = postElement.querySelector('[component="post/content"]');
                const contentHTML = contentElement ? contentElement.innerHTML : '';
                const contentMarkdown = contentHTML ? turndownService.turndown(contentHTML).trim() : '';

                if (contentMarkdown) {
                    postsData.push({
                        id: postId,
                        author: author,
                        timestamp: timestamp,
                        content: contentMarkdown
                    });
                    scrapedPostIds.add(postId);
                }
            }
        });

        const finalCount = scrapedPostIds.size;
        newPostsFound = finalCount > initialCount;

        if (newPostsFound) {
            window.scrollTo(0, document.documentElement.scrollHeight);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    document.body.removeChild(indicator);

    postsData.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));

    return { posts: postsData, title: pageTitle };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapeNodeBBThread") {
        scrapeThread().then(data => {
            sendResponse({ data: data });
        });
    }
    return true;
});