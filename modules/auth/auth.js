/**
 * Auth Module — Login / Register / Local Mode
 */
const AuthModule = {
    init() {
        this.bindForms();
    },

    destroy() {
        // Cleanup if needed
    },

    bindForms() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    },

    // ==================== Form Switching ====================

    showLogin() {
        const loginCard = document.getElementById('loginCard');
        const registerCard = document.getElementById('registerCard');
        if (loginCard) loginCard.classList.remove('hidden');
        if (registerCard) registerCard.classList.add('hidden');
        this.clearErrors();
    },

    showRegister() {
        const loginCard = document.getElementById('loginCard');
        const registerCard = document.getElementById('registerCard');
        if (loginCard) loginCard.classList.add('hidden');
        if (registerCard) registerCard.classList.remove('hidden');
        this.clearErrors();
    },

    clearErrors() {
        const loginError = document.getElementById('loginError');
        const registerError = document.getElementById('registerError');
        if (loginError) { loginError.classList.add('hidden'); loginError.textContent = ''; }
        if (registerError) { registerError.classList.add('hidden'); registerError.textContent = ''; }
    },

    showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            el.classList.remove('hidden');
        }
    },

    setLoading(btnId, loading) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (loading) {
            btn.classList.add('loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    },

    // ==================== Login ====================

    async handleLogin() {
        const username = document.getElementById('loginUsername')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;

        if (!username || !password) {
            this.showError('loginError', '请填写用户名和密码');
            return;
        }

        this.clearErrors();
        this.setLoading('loginBtn', true);

        try {
            await Storage.login(username, password);
            // Navigate to main app
            this.onAuthSuccess(username);
        } catch (e) {
            console.error('Login failed:', e);
            const msg = e.message || '登录失败，请检查用户名和密码';
            this.showError('loginError', msg.includes('Invalid') ? '用户名或密码错误' : msg);
        } finally {
            this.setLoading('loginBtn', false);
        }
    },

    // ==================== Register ====================

    async handleRegister() {
        const username = document.getElementById('registerUsername')?.value.trim();
        const password = document.getElementById('registerPassword')?.value;
        const confirm = document.getElementById('registerConfirm')?.value;

        if (!username || !password || !confirm) {
            this.showError('registerError', '请填写所有字段');
            return;
        }

        if (username.length < 2) {
            this.showError('registerError', '用户名至少2个字符');
            return;
        }

        if (password.length < 6) {
            this.showError('registerError', '密码至少6个字符');
            return;
        }

        if (password !== confirm) {
            this.showError('registerError', '两次输入的密码不一致');
            return;
        }

        this.clearErrors();
        this.setLoading('registerBtn', true);

        try {
            await Storage.register(username, password);
            this.onAuthSuccess(username);
        } catch (e) {
            console.error('Register failed:', e);
            const msg = e.message || '注册失败';
            this.showError('registerError', msg.includes('already exists') ? '用户名已存在' : msg);
        } finally {
            this.setLoading('registerBtn', false);
        }
    },

    // ==================== Local Mode ====================

    useLocalMode() {
        // Ensure backend mode is off
        Storage.useBackend = false;
        Storage.token = null;
        localStorage.removeItem(Storage.KEYS.AUTH_TOKEN);
        localStorage.removeItem(Storage.KEYS.USE_BACKEND);
        // Mark local mode chosen so we don't re-prompt
        localStorage.setItem('htf_local_mode', 'true');
        // Navigate to main app
        this.onAuthSuccess(null);
    },

    // ==================== Auth Success ====================

    onAuthSuccess(username) {
        // Emit event so AppRouter knows to show the main app
        window.EventBus && EventBus.emit('auth:success', { username });
    }
};

window.AuthModule = AuthModule;
