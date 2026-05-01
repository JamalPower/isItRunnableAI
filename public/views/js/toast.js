class Toast {

    // Color palettes for each toast type
    static themes = {
        error: {
            border:       '#ef4444',
            background:   '#fff5f5',
            iconBg:       '#fee2e2',
            iconColor:    '#ef4444',
            iconBorder:   '#fecaca',
            titleColor:   '#991b1b',
            messageColor: '#7f1d1d',
            closeColor:   '#f87171',
            closeHover:   '#ef4444',
            progressBar:  '#ef4444',
            icon:         'fa-solid fa-triangle-exclamation'
        },
        success: {
            border:       '#3b82f6',
            background:   '#eff6ff',
            iconBg:       '#dbeafe',
            iconColor:    '#3b82f6',
            iconBorder:   '#bfdbfe',
            titleColor:   '#1e3a5f',
            messageColor: '#1e40af',
            closeColor:   '#60a5fa',
            closeHover:   '#3b82f6',
            progressBar:  '#3b82f6',
            icon:         'fa-solid fa-circle-check'
        }
    };

    /**
     * Show a toast notification.
     * @param {Object} options
     * @param {'error'|'success'} options.type     - Toast type (default: 'success')
     * @param {string}            options.title    - Bold heading
     * @param {string}            options.message  - Description body
     * @param {number}            options.duration - Auto-dismiss in ms (default: 5000)
     */
    static show({ type = 'success', title = '', message = '', duration = 5000 } = {}) {
        const theme = Toast.themes[type] || Toast.themes.success;

        // Ensure container exists with proper fixed positioning
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }
        // Always enforce positioning (matches original .toast-container CSS)
        container.style.cssText = 'position: fixed; bottom: 2rem; right: 2rem; z-index: 1000;';

        const progressId = `toastProgress-${Date.now()}`;

        // Build toast element
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.style.cssText = `
            border-left: 4px solid ${theme.border};
            background: ${theme.background};
            padding: 1.2rem;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px ${theme.border}26;
            position: relative;
            overflow: hidden;
            margin-top: 1rem;
            transform: translateX(0);
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;

        toast.innerHTML = `
            <div class="toast-icon" style="
                background: ${theme.iconBg};
                color: ${theme.iconColor};
                flex-shrink: 0;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.1rem;
                border: 2px solid ${theme.iconBorder};
            ">
                <i class="${theme.icon}"></i>
            </div>
            <div style="text-align: left; flex: 1;">
                <strong style="
                    display: block;
                    font-size: 1.05rem;
                    font-weight: 800;
                    margin-bottom: 0.25rem;
                    color: ${theme.titleColor};
                ">${title}</strong>
                <div style="
                    font-size: 0.9rem;
                    color: ${theme.messageColor};
                    line-height: 1.4;
                ">${message}</div>
            </div>
            <button onclick="this.parentElement.style.opacity='0'; setTimeout(()=>this.parentElement.remove(), 300)" style="
                background: none;
                border: none;
                color: ${theme.closeColor};
                cursor: pointer;
                padding: 0.2rem;
                font-size: 1.2rem;
                transition: color 0.2s;
            " onmouseover="this.style.color='${theme.closeHover}'" onmouseout="this.style.color='${theme.closeColor}'">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                height: 4px;
                background: ${theme.progressBar};
                width: 100%;
                transition: width ${(duration - 200) / 1000}s linear;
            " id="${progressId}"></div>
        `;

        container.appendChild(toast);

        // Start progress bar animation
        setTimeout(() => {
            const progress = document.getElementById(progressId);
            if (progress) progress.style.width = '0%';
        }, 50);

        // Auto-dismiss
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}
