/**
 * Build Script — bundles all CSS/JS/HTML into a single dist/index.html
 * Usage: node build.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST, { recursive: true });
}

function read(filePath) {
    return fs.readFileSync(path.join(ROOT, filePath), 'utf-8');
}

// ============== Collect all CSS ==============
const cssFiles = [
    'shared/styles/variables.css',
    'shared/styles/reset.css',
    'shared/styles/layout.css',
    'shared/styles/components.css',
    'modules/food/food.css',
    'modules/training/training.css',
    'modules/home/home.css',
    'modules/auth/auth.css',
    'modules/profile/profile.css',
];
const allCSS = cssFiles.map(function(f) { return '/* === ' + f + ' === */\n' + read(f); }).join('\n\n');

// ============== Collect all JS ==============
const jsFiles = [
    'shared/js/event-bus.js',
    'shared/js/storage.js',
    'shared/js/api.js',
    'shared/js/utils.js',
    'modules/food/food.js',
    'modules/home/home.js',
    'modules/training/training.js',
    'modules/profile/profile.js',
    'modules/auth/auth.js',
];
const allJS = jsFiles.map(function(f) { return '// === ' + f + ' ===\n' + read(f); }).join('\n\n');

// ============== Collect module HTML templates ==============
const moduleNames = ['home', 'food', 'training', 'profile', 'auth'];
const moduleHtmlPaths = {
    home: 'modules/home/home.html',
    food: 'modules/food/food.html',
    training: 'modules/training/training.html',
    profile: 'modules/profile/profile.html',
    auth: 'modules/auth/auth.html',
};

var templateTags = moduleNames.map(function(name) {
    return '    <template id="tpl-' + name + '">\n' + read(moduleHtmlPaths[name]) + '\n    </template>';
}).join('\n\n');

// ============== Build Bootstrap JS ==============
// This is the router script that reads from <template> tags
// We build it as a plain string to avoid nested template literal issues
var bootstrapJS = [
    '',
    '    // ============== App Bootstrap ==============',
    '    var AppRouter = {',
    '        currentModule: null,',
    '        pageContainer: null,',
    '',
    '        modules: {',
    '            home:     { tpl: "tpl-home",     instance: window.HomeModule },',
    '            food:     { tpl: "tpl-food",     instance: window.FoodModule },',
    '            training: { tpl: "tpl-training", instance: window.TrainingModule },',
    '            profile:  { tpl: "tpl-profile",  instance: window.ProfileModule },',
    '            auth:     { tpl: "tpl-auth",     instance: window.AuthModule }',
    '        },',
    '',
    '        init: function() {',
    '            this.pageContainer = document.getElementById("page-container");',
    '',
    '            var self = this;',
    '            document.querySelectorAll(".tab-bar-item").forEach(function(btn) {',
    '                btn.addEventListener("click", function() {',
    '                    var moduleName = btn.dataset.module;',
    '                    if (moduleName) self.navigate(moduleName);',
    '                });',
    '            });',
    '',
    '            var hash = window.location.hash.replace("#", "");',
    '            var initial = hash && this.modules[hash] ? hash : "home";',
    '            this.navigate(initial);',
    '',
    '            window.addEventListener("hashchange", function() {',
    '                var mod = window.location.hash.replace("#", "");',
    '                if (mod && self.modules[mod] && mod !== self.currentModule) {',
    '                    self.navigate(mod);',
    '                }',
    '            });',
    '        },',
    '',
    '        navigate: function(moduleName) {',
    '            var config = this.modules[moduleName];',
    '            if (!config) return;',
    '',
    '            if (this.currentModule && this.modules[this.currentModule]) {',
    '                var cur = this.modules[this.currentModule];',
    '                if (cur.instance && typeof cur.instance.destroy === "function") {',
    '                    cur.instance.destroy();',
    '                }',
    '            }',
    '',
    '            var tpl = document.getElementById(config.tpl);',
    '            if (tpl) {',
    '                this.pageContainer.innerHTML = tpl.innerHTML;',
    '                this.pageContainer.style.animation = "none";',
    '                this.pageContainer.offsetHeight;',
    '                this.pageContainer.style.animation = "";',
    '            } else {',
    '                this.pageContainer.innerHTML = \'<p class="empty-message">⚠️ 页面加载失败</p>\';',
    '                return;',
    '            }',
    '',
    '            if (config.instance && typeof config.instance.init === "function") {',
    '                config.instance.init();',
    '            }',
    '',
    '            document.querySelectorAll(".tab-bar-item").forEach(function(b) { b.classList.remove("active"); });',
    '            var activeTab = document.querySelector(\'.tab-bar-item[data-module="\' + moduleName + \'"]\');',
    '            if (activeTab) activeTab.classList.add("active");',
    '',
    '            window.location.hash = moduleName;',
    '            this.currentModule = moduleName;',
    '        }',
    '    };',
    '',
    '    document.addEventListener("DOMContentLoaded", function() {',
    '        AppRouter.init();',
    '    });',
].join('\n');

// ============== Assemble final HTML ==============
var parts = [];
parts.push('<!DOCTYPE html>');
parts.push('<html lang="zh-CN">');
parts.push('<head>');
parts.push('    <meta charset="UTF-8">');
parts.push('    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">');
parts.push('    <title>HowToFitness - 健康生活从记录开始</title>');
parts.push('    <meta name="description" content="HowToFitness - Track your diet, calculate aerobic calories, and plan your fitness journey">');
parts.push('    <meta name="theme-color" content="#2ecc71">');
parts.push('    <link rel="icon" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>🏋️</text></svg>">');
parts.push('    <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>');
parts.push('    <style>');
parts.push(allCSS);
parts.push('    </style>');
parts.push('</head>');
parts.push('<body>');
parts.push('    <div class="app-shell">');
parts.push('        <div id="page-container">');
parts.push('            <p class="empty-message" style="margin-top: 40vh;">Loading...</p>');
parts.push('        </div>');
parts.push('');
parts.push('        <nav class="tab-bar">');
parts.push('            <button class="tab-bar-item active" data-module="home">');
parts.push('                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>');
parts.push('                <span>Home</span>');
parts.push('            </button>');
parts.push('            <button class="tab-bar-item" data-module="food">');
parts.push('                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>');
parts.push('                <span>Diet</span>');
parts.push('            </button>');
parts.push('            <button class="tab-bar-item" data-module="training">');
parts.push('                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M12 2v4"/><path d="M12 18v4"/><rect x="2" y="6" width="4" height="12" rx="1"/><rect x="18" y="6" width="4" height="12" rx="1"/></svg>');
parts.push('                <span>Train</span>');
parts.push('            </button>');
parts.push('            <button class="tab-bar-item" data-module="profile">');
parts.push('                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>');
parts.push('                <span>Profile</span>');
parts.push('            </button>');
parts.push('        </nav>');
parts.push('    </div>');
parts.push('');
parts.push('    <!-- Inlined Module HTML Templates -->');
parts.push(templateTags);
parts.push('');
parts.push('    <script>');
parts.push(allJS);
parts.push(bootstrapJS);
parts.push('    <\/script>');
parts.push('</body>');
parts.push('</html>');

var output = parts.join('\n');

// Write output
var outputPath = path.join(DIST, 'index.html');
fs.writeFileSync(outputPath, output, 'utf-8');

var fileSizeKB = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(1);
console.log('Build complete!');
console.log('Output: dist/index.html (' + fileSizeKB + ' KB)');
console.log('Ready to deploy -- just upload dist/index.html to any static hosting.');
