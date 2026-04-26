/**
 * Error Handler Utility
 * Manages error modals, toasts, and error display across the application
 */

class ErrorHandler {
    constructor() {
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorDetails = document.getElementById('errorDetails');
        this.retryBtn = document.getElementById('retryBtn');
        this.successToast = document.getElementById('successToast');
        this.retryCallback = null;
    }

    /**
     * Show error modal with message and optional retry button
     * @param {string} title - Error title
     * @param {string} message - Main error message
     * @param {string} details - Detailed error information (optional)
     * @param {Function} retryFn - Retry callback function (optional)
     */
    showError(title, message, details = '', retryFn = null) {
        this.errorMessage.textContent = message;
        this.errorDetails.textContent = details;
        
        if (retryFn) {
            this.retryCallback = retryFn;
            this.retryBtn.style.display = 'block';
        } else {
            this.retryBtn.style.display = 'none';
        }
        
        this.errorModal.classList.remove('hidden');
        this.errorModal.setAttribute('role', 'alertdialog');
        
        // Log error for debugging
        console.error(`[${title}] ${message}`, details);
    }

    /**
     * Close error modal
     */
    closeError() {
        this.errorModal.classList.add('hidden');
        this.retryCallback = null;
    }

    /**
     * Handle retry button click
     */
    retry() {
        if (this.retryCallback && typeof this.retryCallback === 'function') {
            this.closeError();
            this.retryCallback();
        }
    }

    /**
     * Show success toast notification
     * @param {string} title - Toast title
     * @param {string} message - Toast message
     * @param {number} duration - Duration in milliseconds (default: 4000)
     */
    showSuccess(title, message, duration = 4000) {
        const titleEl = this.successToast.querySelector('#toastTitle');
        const messageEl = this.successToast.querySelector('#toastMessage');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        this.successToast.classList.remove('hidden');
        
        setTimeout(() => {
            this.successToast.classList.add('hidden');
        }, duration);
    }

    /**
     * Handle API errors with user-friendly messages
     * @param {Error|Object} error - The error object
     * @param {string} context - Context of the error (e.g., "Hardware Analysis")
     */
    handleAPIError(error, context = '') {
        let message = 'An error occurred while processing your request.';
        let details = '';

        if (error.message) {
            if (error.message.includes('timeout')) {
                message = 'Request took too long. Please check your internet and try again.';
            } else if (error.message.includes('network')) {
                message = 'Network error. Please check your internet connection.';
            } else if (error.message.includes('JSON')) {
                message = 'Invalid response from server. Please try again.';
            } else {
                details = error.message;
            }
        }

        const fullMessage = context ? `${context}: ${message}` : message;
        this.showError('Analysis Error', fullMessage, details);
    }

    /**
     * Setup retry button listener
     */
    setupRetryListener() {
        this.retryBtn.addEventListener('click', () => this.retry());
    }

    /**
     * Close error on backdrop click
     */
    setupBackdropListener() {
        this.errorModal.addEventListener('click', (e) => {
            if (e.target === this.errorModal) {
                this.closeError();
            }
        });
    }

    /**
     * Initialize error handler
     */
    init() {
        this.setupRetryListener();
        this.setupBackdropListener();
    }
}

// Global error handler instance
const errorHandler = new ErrorHandler();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    errorHandler.init();
});

// Listen for any unhandled errors
window.addEventListener('error', (event) => {
    errorHandler.handleAPIError(event.error, 'Unexpected Error');
});

// Listen for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleAPIError(event.reason, 'Async Error');
});
