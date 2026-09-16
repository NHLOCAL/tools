        const themeToggle = document.getElementById('theme-toggle');

        const applyTheme = (theme) => {
            document.body.classList.toggle('dark-mode', theme === 'dark');
            localStorage.setItem('theme', theme);
        };

        async function forceDownload(url, filename) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            } catch (error) {
                console.error(`Download failed for ${filename}:`, error);
            }
        }

        function copyDirectLink(linkElement, event) {
            event.preventDefault();
            if (linkElement.classList.contains('copied')) return;

            const fullUrl = new URL(linkElement.href, window.location.href).href;
            
            navigator.clipboard.writeText(fullUrl).then(() => {
                linkElement.classList.add('copied');
                setTimeout(() => {
                    linkElement.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy link:', err);
            });
        }

        function createDynamicMailLink() {
            const emailAddress = 'nh.local11@gmail.com';
            const subject = encodeURIComponent('פנייה מאתר ארגז הכלים');
            const contactLink = document.getElementById('contact-link');
            if (!contactLink) return;
            const isWindows = navigator.userAgent.toLowerCase().includes('win');
            contactLink.href = isWindows 
                ? `https://mail.google.com/mail/?view=cm&fs=1&to=${emailAddress}&su=${subject}` 
                : `mailto:${emailAddress}?subject=${subject}`;
            if (isWindows) {
                contactLink.target = '_blank';
                contactLink.rel = 'noopener noreferrer';
            }
        }

        function scrollToElementFromHash() {
            document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
            if (window.location.hash) {
                try {
                    const elementId = decodeURIComponent(window.location.hash.substring(1));
                    const element = document.getElementById(elementId);
                    if (element) {
                        setTimeout(() => {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            element.classList.add('highlighted');
                            setTimeout(() => { element.classList.remove('highlighted'); }, 2500);
                        }, 100);
                    }
                } catch (e) { console.error("Could not scroll to element:", e); }
            }
        }

        themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            applyTheme(newTheme);
        });

        document.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('theme') || 
                               (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            applyTheme(savedTheme);
            createDynamicMailLink();
            feather.replace();
            scrollToElementFromHash();
        });

        window.addEventListener('hashchange', scrollToElementFromHash, false);
