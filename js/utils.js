// filepath: js/utils.js
// Utility functions - modals, helpers, common functions

const Utils = {
    createModal(title, content) {
        // Remove existing modal if present
        const existingModal = document.getElementById('modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'modal-overlay';
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        modalOverlay.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center p-6 border-b">
                    <h2 class="text-xl font-semibold">${title}</h2>
                    <button onclick="Utils.closeModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="p-6">
                    ${content}
                </div>
            </div>
        `;
        
        // Close modal when clicking overlay
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                Utils.closeModal();
            }
        });
        
        document.body.appendChild(modalOverlay);
        return modalOverlay;
    },

    closeModal() {
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.remove();
        }
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('it-IT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    },

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copiato negli appunti', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Copiato negli appunti', 'success');
        });
    },

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-y-full`;
        toast.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-y-full');
        }, 100);
        
        // Auto-remove
        setTimeout(() => {
            toast.classList.add('translate-y-full');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    },

    confirmDialog(message, onConfirm, onCancel = null) {
        const modal = this.createModal('Conferma', `
            <div class="text-center">
                <i class="fas fa-question-circle text-4xl text-yellow-500 mb-4"></i>
                <p class="text-lg mb-6">${message}</p>
                <div class="flex justify-center space-x-4">
                    <button onclick="Utils.closeModal(); ${onCancel ? `(${onCancel})()` : ''}" 
                            class="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition">
                        Annulla
                    </button>
                    <button onclick="Utils.closeModal(); (${onConfirm})()" 
                            class="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">
                        Conferma
                    </button>
                </div>
            </div>
        `);
        return modal;
    },

    sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    },

    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    },

    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    getDeviceInfo() {
        const ua = navigator.userAgent;
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
        const isDesktop = !isMobile && !isTablet;
        
        return {
            isMobile,
            isTablet,
            isDesktop,
            userAgent: ua,
            platform: navigator.platform,
            language: navigator.language
        };
    },

    generateQRCode(text, size = 200) {
        // Simple QR code generation using a public API
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    },

    downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    localStorage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('LocalStorage set error:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('LocalStorage get error:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('LocalStorage remove error:', e);
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('LocalStorage clear error:', e);
                return false;
            }
        }
    }
};

// Make Utils available globally
window.Utils = Utils;
