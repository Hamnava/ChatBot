// wwwroot/js/askAi.js

// Store parsed code blocks globally for preview
let parsedCodeBlocks = [];
let currentPreviewHtml = '';
let detectedTechnologies = new Set();

// HTML tag builders (to avoid Razor parsing issues)
const HTML_TAGS = {
    doctype: '<!DOCTYPE html>',
    htmlOpen: '<html>',
    htmlClose: '</html>',
    headOpen: '<head>',
    headClose: '</head>',
    bodyOpen: '<body>',
    bodyClose: '</body>',
    scriptClose: '</script>',
    styleClose: '</style>'
};

// Technology detection patterns
const techPatterns = {
    'react': {
        patterns: [/import.*from\s+['"]react['"]/, /useState|useEffect|useContext/, /<\w+\s+.*\/>/, /className=/],
        previewable: true,
        needsTranspile: true,
        icon: 'bi-filetype-jsx',
        color: '#61DAFB',
        name: 'React'
    },
    'nextjs': {
        patterns: [/from\s+['"]next/, /getServerSideProps|getStaticProps/, /useRouter.*next\/router/, /next\/image|next\/link/],
        previewable: false,
        needsServer: true,
        icon: 'bi-triangle',
        color: '#000000',
        name: 'Next.js'
    },
    'vue': {
        patterns: [/<template>/, /<script setup>/, /defineComponent|ref\(|reactive\(/, /v-if|v-for|v-model/],
        previewable: true,
        needsTranspile: true,
        icon: 'bi-filetype-vue',
        color: '#4FC08D',
        name: 'Vue.js'
    },
    'angular': {
        patterns: [/@Component|@Injectable|@NgModule/, /\*ngIf|\*ngFor/, /\[ngClass\]|\(click\)/],
        previewable: false,
        needsCompile: true,
        icon: 'bi-shield',
        color: '#DD0031',
        name: 'Angular'
    },
    'svelte': {
        patterns: [/<script>.*\$:/, /{#if|{#each|{@html}/],
        previewable: false,
        needsCompile: true,
        icon: 'bi-fire',
        color: '#FF3E00',
        name: 'Svelte'
    },
    'tailwind': {
        patterns: [/class=["'][^"']*(?:flex|grid|p-\d|m-\d|text-\w+|bg-\w+|rounded|shadow|hover:)[^"']*/],
        previewable: true,
        needsCdn: true,
        icon: 'bi-wind',
        color: '#06B6D4',
        name: 'Tailwind CSS'
    },
    'bootstrap': {
        patterns: [/class=["'][^"']*(?:container|row|col-|btn|form-control|card|navbar|modal)[^"']*/],
        previewable: true,
        needsCdn: true,
        icon: 'bi-bootstrap',
        color: '#7952B3',
        name: 'Bootstrap'
    },
    'csharp': {
        patterns: [/using\s+System|namespace\s+\w+|public\s+class|async\s+Task/],
        previewable: false,
        isBackend: true,
        icon: 'bi-filetype-cs',
        color: '#512BD4',
        name: 'C#'
    },
    'python': {
        patterns: [/^import\s+\w+|^from\s+\w+\s+import|def\s+\w+\(|class\s+\w+:/m],
        previewable: false,
        isBackend: true,
        icon: 'bi-filetype-py',
        color: '#3776AB',
        name: 'Python'
    },
    'nodejs': {
        patterns: [/require\(['"]|module\.exports|const\s+express|app\.listen/],
        previewable: false,
        isBackend: true,
        icon: 'bi-filetype-js',
        color: '#339933',
        name: 'Node.js'
    },
    'sql': {
        patterns: [/SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+.*SET|CREATE\s+TABLE/i],
        previewable: false,
        isDatabase: true,
        icon: 'bi-database',
        color: '#4479A1',
        name: 'SQL'
    },
    'html': {
        patterns: [/<html|<head|<body|<!DOCTYPE/i],
        previewable: true,
        icon: 'bi-filetype-html',
        color: '#E34F26',
        name: 'HTML'
    },
    'css': {
        patterns: [/^[\w\.\#\[\]]+\s*\{[^}]+\}/m],
        previewable: true,
        withHtml: true,
        icon: 'bi-filetype-css',
        color: '#1572B6',
        name: 'CSS'
    }
};

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function detectTechnologies(codeBlocks) {
    const detected = new Set();

    codeBlocks.forEach(block => {
        const code = block.content;
        const lang = block.language.toLowerCase();

        if (['jsx', 'tsx'].includes(lang)) detected.add('react');
        if (['vue'].includes(lang)) detected.add('vue');
        if (['ts', 'typescript'].includes(lang)) detected.add('typescript');
        if (['cs', 'csharp'].includes(lang)) detected.add('csharp');
        if (['py', 'python'].includes(lang)) detected.add('python');

        for (const [tech, config] of Object.entries(techPatterns)) {
            if (config.patterns.some(pattern => pattern.test(code))) {
                detected.add(tech);
            }
        }
    });

    return detected;
}

function getPreviewCapability(technologies) {
    const result = {
        canPreview: true,
        warnings: [],
        suggestions: [],
        framework: 'none',
        cdns: []
    };

    const nonPreviewable = ['nextjs', 'angular', 'svelte', 'csharp', 'python', 'nodejs', 'sql'];
    const foundNonPreviewable = [...technologies].filter(t => nonPreviewable.includes(t));

    if (foundNonPreviewable.length > 0) {
        const techNames = foundNonPreviewable.map(t => techPatterns[t]?.name || t).join(', ');
        result.warnings.push(`${techNames} code cannot be previewed in the browser.`);

        foundNonPreviewable.forEach(tech => {
            const config = techPatterns[tech];
            if (config?.isBackend) {
                result.suggestions.push(`<strong>${config.name}</strong>: Run this code in your IDE or server environment.`);
            }
            if (config?.needsServer) {
                result.suggestions.push(`<strong>${config.name}</strong>: Requires a Node.js server. Use <code>npx create-next-app</code> to set up.`);
            }
            if (config?.needsCompile) {
                result.suggestions.push(`<strong>${config.name}</strong>: Requires compilation. Use the framework's CLI to build and run.`);
            }
        });
    }

    if (technologies.has('react')) {
        result.framework = 'react';
        result.warnings.push('React code will be transpiled using Babel (basic preview).');
    }

    if (technologies.has('vue')) {
        result.framework = 'vue';
        result.warnings.push('Vue code will use Vue 3 CDN (basic preview).');
    }

    if (technologies.has('tailwind')) {
        result.cdns.push('tailwind');
        result.suggestions.push('Tailwind CSS CDN will be included automatically.');
    }

    if (technologies.has('bootstrap')) {
        result.cdns.push('bootstrap');
        result.suggestions.push('Bootstrap CSS will be included automatically.');
    }

    if (foundNonPreviewable.length > 0 && foundNonPreviewable.length === technologies.size) {
        result.canPreview = false;
    }

    return result;
}

function generatePreviewHtml(code, framework, cdns, darkMode = false) {
    let headContent = '';
    let scripts = '';

    // Add CSS frameworks
    if (cdns.includes('tailwind')) {
        headContent += `<script src="https://cdn.tailwindcss.com">${HTML_TAGS.scriptClose}\n`;
    }

    if (cdns.includes('bootstrap')) {
        headContent += '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">\n';
        scripts += `<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js">${HTML_TAGS.scriptClose}\n`;
    }

    const darkModeStyle = darkMode ? 'body { background-color: #1a1a2e; color: #eee; }' : '';

    // Handle React
    if (framework === 'react') {
        return `${HTML_TAGS.doctype}
${HTML_TAGS.htmlOpen}
${HTML_TAGS.headOpen}
    <meta charset="UTF-8">
    ${headContent}
    <script src="https://unpkg.com/react@18/umd/react.development.js">${HTML_TAGS.scriptClose}
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js">${HTML_TAGS.scriptClose}
    <script src="https://unpkg.com/@babel/standalone/babel.min.js">${HTML_TAGS.scriptClose}
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
        ${darkModeStyle}
    ${HTML_TAGS.styleClose}
${HTML_TAGS.headClose}
${HTML_TAGS.bodyOpen}
    <div id="root"></div>
    <script type="text/babel">
        ${extractReactComponent(code)}
    ${HTML_TAGS.scriptClose}
    ${scripts}
${HTML_TAGS.bodyClose}
${HTML_TAGS.htmlClose}`;
    }

    // Handle Vue
    if (framework === 'vue') {
        return `${HTML_TAGS.doctype}
${HTML_TAGS.htmlOpen}
${HTML_TAGS.headOpen}
    <meta charset="UTF-8">
    ${headContent}
    <script src="https://unpkg.com/vue@3/dist/vue.global.js">${HTML_TAGS.scriptClose}
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
        ${darkModeStyle}
    ${HTML_TAGS.styleClose}
${HTML_TAGS.headClose}
${HTML_TAGS.bodyOpen}
    <div id="app"></div>
    <script>
        ${extractVueComponent(code)}
    ${HTML_TAGS.scriptClose}
    ${scripts}
${HTML_TAGS.bodyClose}
${HTML_TAGS.htmlClose}`;
    }

    // Plain HTML - check if it's a complete document
    if (code.includes(HTML_TAGS.htmlOpen.replace('>', '')) || code.includes('<!DOCTYPE')) {
        if (headContent) {
            code = code.replace(new RegExp(HTML_TAGS.headOpen, 'i'), HTML_TAGS.headOpen + '\n' + headContent);
        }
        if (scripts) {
            code = code.replace(new RegExp(HTML_TAGS.bodyClose, 'i'), scripts + HTML_TAGS.bodyClose);
        }
        return code;
    }

    // Wrap partial HTML
    return `${HTML_TAGS.doctype}
${HTML_TAGS.htmlOpen}
${HTML_TAGS.headOpen}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${headContent}
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
        ${darkModeStyle}
    ${HTML_TAGS.styleClose}
${HTML_TAGS.headClose}
${HTML_TAGS.bodyOpen}
    ${code}
    ${scripts}
${HTML_TAGS.bodyClose}
${HTML_TAGS.htmlClose}`;
}

function extractReactComponent(code) {
    if (code.includes('export default') || code.includes('function App')) {
        code = code.replace(/import.*from\s+['"]react['"];?\n?/g, '');
        code = code.replace(/import.*from\s+['"].*['"];?\n?/g, '');
        code = code.replace(/export\s+default\s+/g, '');

        return `
            ${code}
            const components = [typeof App !== 'undefined' ? App : null].filter(Boolean);
            if (components.length > 0) {
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(React.createElement(components[0]));
            }
        `;
    }

    return `
        function App() {
            return (
                ${code}
            );
        }
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    `;
}

function extractVueComponent(code) {
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
    const template = templateMatch ? templateMatch[1] : code;

    return `
        const { createApp, ref, reactive, computed, onMounted } = Vue;
        
        const app = createApp({
            setup() {
                const message = ref("Hello Vue!");
                return { message };
            },
            template: \`${template}\`
        });
        
        app.mount('#app');
    `;
}

function parseMarkdownText(text) {
    let html = escapeHtml(text);

    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    html = html.replace(/\n(?!<)/g, '<br>');
    html = html.replace(/<br>\s*<br>/g, '</p><p>');
    html = html.replace(/<br>\s*(<h[1-4]>)/g, '$1');
    html = html.replace(/(<\/h[1-4]>)\s*<br>/g, '$1');
    html = html.replace(/<br>\s*(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)\s*<br>/g, '$1');

    return html;
}

function parseMarkdownResponse(text) {
    const parts = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            const textContent = text.substring(lastIndex, match.index).trim();
            if (textContent) {
                parts.push({ type: 'text', content: textContent });
            }
        }
        parts.push({
            type: 'code',
            language: match[1] || 'plaintext',
            content: match[2]
        });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        const textContent = text.substring(lastIndex).trim();
        if (textContent) {
            parts.push({ type: 'text', content: textContent });
        }
    }

    return parts;
}

function getPrismLanguage(lang) {
    const langMap = {
        'html': 'markup', 'xml': 'markup', 'jsx': 'jsx', 'tsx': 'tsx',
        'csharp': 'csharp', 'cs': 'csharp', 'c#': 'csharp',
        'javascript': 'javascript', 'js': 'javascript',
        'typescript': 'typescript', 'ts': 'typescript',
        'css': 'css', 'json': 'json', 'sql': 'sql',
        'python': 'python', 'py': 'python',
        'bash': 'bash', 'shell': 'bash', 'sh': 'bash',
        'yaml': 'yaml', 'yml': 'yaml',
        '': 'plaintext'
    };
    return langMap[lang.toLowerCase()] || lang.toLowerCase();
}

function getLanguageDisplayName(lang) {
    const nameMap = {
        'html': 'HTML', 'xml': 'XML', 'jsx': 'JSX', 'tsx': 'TSX',
        'csharp': 'C#', 'cs': 'C#', 'c#': 'C#',
        'javascript': 'JavaScript', 'js': 'JavaScript',
        'typescript': 'TypeScript', 'ts': 'TypeScript',
        'css': 'CSS', 'json': 'JSON', 'sql': 'SQL',
        'python': 'Python', 'py': 'Python',
        'bash': 'Bash', 'shell': 'Shell',
        'yaml': 'YAML', 'plaintext': 'Code', '': 'Code'
    };
    return nameMap[lang.toLowerCase()] || lang.toUpperCase();
}

function getContrastColor(hexcolor) {
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

function updateDetectedTechDisplay() {
    const container = document.getElementById('detectedTech');
    if (!container) return;

    container.innerHTML = '';

    detectedTechnologies.forEach(tech => {
        const config = techPatterns[tech];
        if (config) {
            const badge = document.createElement('span');
            badge.className = 'badge tech-badge-display';
            badge.style.backgroundColor = config.color;
            badge.style.color = getContrastColor(config.color);
            badge.innerHTML = `<i class="${config.icon}"></i> ${config.name}`;
            container.appendChild(badge);
        }
    });
}

function renderParsedResponse(parts) {
    return parts.map((part, index) => {
        if (part.type === 'text') {
            const formattedText = parseMarkdownText(part.content);
            return `<div class="response-text">${formattedText}</div>`;
        } else {
            const prismLang = getPrismLanguage(part.language);
            const displayName = getLanguageDisplayName(part.language);

            const blockTech = [...detectedTechnologies].filter(tech => {
                const config = techPatterns[tech];
                return config?.patterns.some(p => p.test(part.content));
            });

            const techBadges = blockTech.map(tech => {
                const config = techPatterns[tech];
                return `<span class="tech-badge">${config.name}</span>`;
            }).join('');

            return `
                <div class="code-block" data-index="${index}">
                    <div class="code-header">
                        <span class="code-label">
                            <i class="bi bi-code-slash"></i> ${displayName}
                            ${techBadges}
                        </span>
                        <button class="copy-btn" onclick="copyCode(this)">
                            <i class="bi bi-clipboard"></i>
                            <span>Copy</span>
                        </button>
                    </div>
                    <pre><code class="language-${prismLang}">${escapeHtml(part.content)}</code></pre>
                </div>
            `;
        }
    }).join('');
}

async function copyCode(button) {
    const codeElement = button.closest('.code-block').querySelector('code');
    const code = codeElement.textContent;

    try {
        await navigator.clipboard.writeText(code);

        const icon = button.querySelector('i');
        const text = button.querySelector('span');

        button.classList.add('copied');
        icon.className = 'bi bi-check2';
        text.textContent = 'Copied!';

        setTimeout(() => {
            button.classList.remove('copied');
            icon.className = 'bi bi-clipboard';
            text.textContent = 'Copy';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

async function sendPrompt() {
    const prompt = document.getElementById("prompt").value;
    const responseDiv = document.getElementById("response");
    const previewBtn = document.getElementById("previewBtn");
    const previewOptions = document.getElementById("previewOptionsDropdown");

    if (!prompt.trim()) {
        alert('Please enter a prompt');
        return;
    }

    responseDiv.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-primary" role="status"></div>
            <span>Thinking...</span>
        </div>
    `;
    previewBtn.disabled = true;
    if (previewOptions) previewOptions.style.display = 'none';
    detectedTechnologies.clear();
    updateDetectedTechDisplay();

    try {
        const res = await fetch('/Home/Ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        console.log("Raw response:", data.text);

        const parts = parseMarkdownResponse(data.text);
        parsedCodeBlocks = parts.filter(p => p.type === 'code');

        detectedTechnologies = detectTechnologies(parsedCodeBlocks);
        updateDetectedTechDisplay();

        const hasPreviewableCode = parsedCodeBlocks.some(block => {
            const lang = block.language.toLowerCase();
            return ['html', 'jsx', 'tsx', 'vue', ''].includes(lang) ||
                detectedTechnologies.has('tailwind') ||
                detectedTechnologies.has('bootstrap');
        });

        previewBtn.disabled = !hasPreviewableCode;
        if (previewOptions) previewOptions.style.display = hasPreviewableCode ? 'block' : 'none';

        responseDiv.innerHTML = renderParsedResponse(parts);
        Prism.highlightAll();

    } catch (error) {
        responseDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Error: ${error.message}
            </div>
        `;
    }
}

function previewCode() {
    const capability = getPreviewCapability(detectedTechnologies);

    if (!capability.canPreview && capability.warnings.length > 0) {
        document.getElementById('cannotPreviewMessage').innerHTML =
            capability.warnings.map(w => `<p><i class="bi bi-exclamation-circle text-warning"></i> ${w}</p>`).join('');
        document.getElementById('cannotPreviewSuggestions').innerHTML =
            capability.suggestions.length > 0
                ? '<strong>Suggestions:</strong><ul>' + capability.suggestions.map(s => `<li>${s}</li>`).join('') + '</ul>'
                : '';

        const modal = new bootstrap.Modal(document.getElementById('cannotPreviewModal'));
        modal.show();
        return;
    }

    previewWithFramework(capability.framework, capability.cdns);
}

function previewWithFramework(framework, cdns = []) {
    const previewableBlocks = parsedCodeBlocks.filter(block => {
        const lang = block.language.toLowerCase();
        return ['html', 'jsx', 'tsx', 'vue', ''].includes(lang);
    });

    if (previewableBlocks.length === 0) {
        alert('No previewable code found!');
        return;
    }

    if (cdns.length === 0) {
        if (detectedTechnologies.has('tailwind')) cdns.push('tailwind');
        if (detectedTechnologies.has('bootstrap')) cdns.push('bootstrap');
    }

    if (typeof cdns === 'undefined') {
        cdns = [];
        if (framework === 'bootstrap') { cdns = ['bootstrap']; framework = 'none'; }
        if (framework === 'tailwind') { cdns = ['tailwind']; framework = 'none'; }
    }

    const code = previewableBlocks.map(b => b.content).join('\n\n');
    const darkMode = document.getElementById('darkModePreview')?.checked || false;

    currentPreviewHtml = generatePreviewHtml(code, framework, cdns, darkMode);

    const techBadge = document.getElementById('previewTechBadge');
    if (techBadge) {
        const techLabels = [];
        if (framework !== 'none') techLabels.push(framework.charAt(0).toUpperCase() + framework.slice(1));
        cdns.forEach(cdn => techLabels.push(cdn.charAt(0).toUpperCase() + cdn.slice(1)));
        techBadge.textContent = techLabels.join(' + ') || 'Plain HTML';
    }

    const iframe = document.getElementById('previewFrame');
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    const previewError = document.getElementById('previewError');
    if (previewError) previewError.style.display = 'none';

    doc.open();
    doc.write(currentPreviewHtml);
    doc.close();

    const modal = new bootstrap.Modal(document.getElementById('previewModal'));
    modal.show();
}

function openInNewTab() {
    const newWindow = window.open('', '_blank');
    newWindow.document.write(currentPreviewHtml);
    newWindow.document.close();
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    const darkModeToggle = document.getElementById('darkModePreview');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function () {
            if (currentPreviewHtml) {
                previewCode();
            }
        });
    }

    const promptInput = document.getElementById('prompt');
    if (promptInput) {
        promptInput.addEventListener('keydown', function (e) {
            if (e.ctrlKey && e.key === 'Enter') {
                sendPrompt();
            }
        });
    }
});