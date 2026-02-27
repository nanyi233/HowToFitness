/**
 * Simple Tab Router for SPA
 * Manages loading/unloading module HTML, CSS, JS
 */
const Router = {
    currentModule: null,
    modules: {},
    pageContainer: null,

    /**
     * Initialize the router
     * @param {object} moduleConfig - { moduleName: { html, css, js, init, destroy } }
     */
    init(moduleConfig) {
        this.modules = moduleConfig;
        this.pageContainer = document.getElementById('page-container');

        // Setup tab bar click handlers
        document.querySelectorAll('.tab-bar-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const moduleName = btn.dataset.module;
                if (moduleName) this.navigate(moduleName);
            });
        });

        // Navigate to initial module (from hash or default)
        const hash = window.location.hash.replace('#', '');
        const initialModule = hash && this.modules[hash] ? hash : 'food';
        this.navigate(initialModule);

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const mod = window.location.hash.replace('#', '');
            if (mod && this.modules[mod] && mod !== this.currentModule) {
                this.navigate(mod);
            }
        });
    },

    /**
     * Navigate to a module
     * @param {string} moduleName
     */
    async navigate(moduleName) {
        if (!this.modules[moduleName]) {
            console.error(`Module "${moduleName}" not found`);
            return;
        }

        const config = this.modules[moduleName];

        // Destroy current module
        if (this.currentModule && this.modules[this.currentModule]) {
            const currentConfig = this.modules[this.currentModule];
            if (currentConfig.instance && typeof currentConfig.instance.destroy === 'function') {
                currentConfig.instance.destroy();
            }
            // Remove module CSS
            const oldStyle = document.getElementById(`style-${this.currentModule}`);
            if (oldStyle) oldStyle.remove();
        }

        // Load HTML
        try {
            const response = await fetch(config.html);
            if (!response.ok) throw new Error(`Failed to load ${config.html}`);
            const html = await response.text();
            this.pageContainer.innerHTML = html;
        } catch (error) {
            console.error(`Error loading module "${moduleName}":`, error);
            this.pageContainer.innerHTML = `<p class="empty-message">⚠️ Failed to load module</p>`;
            return;
        }

        // Load CSS
        if (config.css) {
            const link = document.createElement('link');
            link.id = `style-${moduleName}`;
            link.rel = 'stylesheet';
            link.href = config.css;
            document.head.appendChild(link);
        }

        // Initialize module JS
        if (config.instance && typeof config.instance.init === 'function') {
            config.instance.init();
        }

        // Update tab bar
        document.querySelectorAll('.tab-bar-item').forEach(b => b.classList.remove('active'));
        const activeTab = document.querySelector(`.tab-bar-item[data-module="${moduleName}"]`);
        if (activeTab) activeTab.classList.add('active');

        // Update hash
        window.location.hash = moduleName;
        this.currentModule = moduleName;

        // Emit event
        EventBus.emit('router:navigate', { module: moduleName });
    }
};

window.Router = Router;
