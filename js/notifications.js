// filepath: js/notifications.js
// Notification system - cross-dashboard notifications, badge management

const NotificationSystem = {
    init() {
        console.log('🔔 Initializing Notification System...');
        
        // Clear old notifications on startup
        localStorage.removeItem('crossNotifications');
        
        // Check for notifications every 2 seconds
        setInterval(() => this.checkForNotifications(), 2000);
        
        // Check for cart updates every 1 second for better responsiveness
        setInterval(() => this.updateCartBadge(), 1000);
        
        console.log('✅ Notification system initialized');
    },

    checkForNotifications() {
        if (!EudoraApp.currentUser) return;
        
        const notifications = JSON.parse(localStorage.getItem('crossNotifications') || '[]');
        const userNotifications = notifications.filter(n => 
            n.targetUserId === EudoraApp.currentUser.id && !n.read
        );
        
        console.log(`🔍 Checking notifications for user ${EudoraApp.currentUser.id}: found ${userNotifications.length} unread`);
        
        // Update notification badge
        this.updateBadge(userNotifications.length);
        
        userNotifications.forEach(notification => {
            console.log('📩 Showing notification:', notification);
            this.showToast(notification);
            // Mark as read
            notification.read = true;
        });
        
        if (userNotifications.length > 0) {
            localStorage.setItem('crossNotifications', JSON.stringify(notifications));
            
            // Update order lists if needed
            if (EudoraApp.currentUser.type === 'customer') {
                Customer.loadOrderHistory();
            } else if (EudoraApp.currentUser.type === 'pharmacy') {
                Pharmacy.updateOrdersDisplay();
            }
        }
    },

    updateBadge(count) {
        const badge = document.getElementById('notification-badge');
        console.log(`🔔 Updating notification badge: ${count}`, badge);
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
                console.log(`✅ Badge updated: showing ${badge.textContent}`);
            } else {
                badge.classList.add('hidden');
                console.log('✅ Badge hidden (no notifications)');
            }
        } else {
            console.log('❌ Notification badge element not found!');
        }
    },

    updateCartBadge() {
        if (!EudoraApp.currentUser) return;
        
        try {
            // Get cart count from Customer module if available
            let cartCount = 0;
            
            if (window.Customer && Customer.cart) {
                cartCount = Customer.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
            } else {
                // Fallback: get cart from database directly
                const userId = EudoraApp.currentUser.id;
                const cart = Database.getCart(userId);
                if (cart && cart.items) {
                    cartCount = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                }
            }
            
            console.log(`🛒 Updating cart badge: ${cartCount}`);
            
            const cartBadge = document.getElementById('cart-tab-count');
            if (cartBadge) {
                if (cartCount > 0) {
                    cartBadge.textContent = cartCount > 99 ? '99+' : cartCount;
                    cartBadge.classList.remove('hidden');
                    console.log(`✅ Cart badge updated: showing ${cartBadge.textContent}`);
                } else {
                    cartBadge.classList.add('hidden');
                    console.log('✅ Cart badge hidden (empty cart)');
                }
            } else {
                console.log('❌ Cart badge element not found!');
            }
            
            // Also update other cart count elements
            const cartCount2 = document.getElementById('cart-count');
            if (cartCount2) {
                cartCount2.textContent = cartCount;
            }
            
        } catch (error) {
            console.error('❌ Error updating cart badge:', error);
        }
    },

    // Function to manually trigger cart badge update
    refreshCartBadge() {
        console.log('🔄 Manually refreshing cart badge...');
        this.updateCartBadge();
    },

    createNotification(targetUserId, type, title, message, orderId) {
        console.log(`📤 Creating notification for user ${targetUserId}:`, { type, title, message, orderId });
        
        const notifications = JSON.parse(localStorage.getItem('crossNotifications') || '[]');
        
        const notification = {
            id: Date.now(),
            targetUserId: targetUserId,
            type: type, // 'order_cancelled', 'order_rejected', etc.
            title: title,
            message: message,
            orderId: orderId,
            createdAt: new Date().toISOString(),
            read: false,
            senderType: EudoraApp.currentUser?.type || 'system',
            senderId: EudoraApp.currentUser?.id || null,
            senderName: EudoraApp.currentUser?.firstName && EudoraApp.currentUser?.lastName ? 
                       `${EudoraApp.currentUser.firstName} ${EudoraApp.currentUser.lastName}` : 
                       EudoraApp.currentUser?.name || 'Sistema'
        };
        
        notifications.push(notification);
        localStorage.setItem('crossNotifications', JSON.stringify(notifications));
        
        console.log('✅ Cross-notification created successfully:', notification);
        console.log('📦 Total notifications in storage:', notifications.length);
    },

    showToast(notification) {
        // Create a more prominent notification for cross-dashboard messages
        const toast = document.createElement('div');
        
        const iconMap = {
            'order_cancelled': 'fas fa-times-circle',
            'order_rejected': 'fas fa-exclamation-triangle',
            'order_accepted': 'fas fa-check-circle',
            'order_completed': 'fas fa-box',
            'order_ready': 'fas fa-box-open'
        };
        
        const colorMap = {
            'order_cancelled': 'bg-red-500 border-red-700',
            'order_rejected': 'bg-orange-500 border-orange-700',
            'order_accepted': 'bg-green-500 border-green-700',
            'order_completed': 'bg-blue-500 border-blue-700',
            'order_ready': 'bg-purple-500 border-purple-700'
        };
        
        toast.className = `fixed top-4 right-4 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm border-l-4 ${colorMap[notification.type] || 'bg-gray-500 border-gray-700'}`;
        
        toast.innerHTML = `
            <div class="flex items-start">
                <i class="${iconMap[notification.type] || 'fas fa-bell'} mt-1 mr-3 text-lg"></i>
                <div class="flex-1">
                    <div class="font-bold text-sm">${notification.title}</div>
                    <div class="text-sm opacity-90 mt-1">${notification.message}</div>
                    ${notification.orderId ? `<div class="text-xs opacity-75 mt-2">Ordine #${notification.orderId}</div>` : ''}
                    <div class="text-xs opacity-75 mt-1">
                        ${new Date(notification.createdAt).toLocaleString('it-IT')}
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200 text-lg">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 8000);
        
        // Add sound notification (optional)
        this.playNotificationSound();
    },

    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAcBz+U2fLCcCQEK4TQ8teJOQgZarvu4p1NEA1Zr+Pw');
            audio.volume = 0.3;
            audio.play().catch(() => {}); // Ignore errors if audio fails
        } catch (e) {}
    },

    showCenter() {
        if (!EudoraApp.currentUser) return;
        
        const notifications = JSON.parse(localStorage.getItem('crossNotifications') || '[]');
        const userNotifications = notifications
            .filter(n => n.targetUserId === EudoraApp.currentUser.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10); // Show last 10 notifications
        
        const modal = Utils.createModal('🔔 Centro Notifiche', `
            <div class="max-h-96 overflow-y-auto">
                ${userNotifications.length > 0 ? `
                    <div class="space-y-3">
                        ${userNotifications.map(notification => `
                            <div class="p-3 rounded-lg border ${notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}">
                                <div class="flex items-start">
                                    <i class="${this.getNotificationIcon(notification.type)} text-lg mr-3 mt-1 ${this.getNotificationColor(notification.type)}"></i>
                                    <div class="flex-1">
                                        <div class="font-medium text-sm">${notification.title}</div>
                                        <div class="text-sm text-gray-600 mt-1">${notification.message}</div>
                                        ${notification.orderId ? `<div class="text-xs text-blue-600 mt-1">Ordine #${notification.orderId}</div>` : ''}
                                        <div class="text-xs text-gray-500 mt-2">
                                            ${new Date(notification.createdAt).toLocaleString('it-IT')}
                                        </div>
                                    </div>
                                    ${!notification.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></div>' : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-4 text-center">
                        <button onclick="NotificationSystem.markAllRead(); Utils.closeModal();" class="text-blue-600 hover:text-blue-800 text-sm">
                            Segna tutte come lette
                        </button>
                    </div>
                ` : `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-bell-slash text-4xl mb-3"></i>
                        <p>Nessuna notifica</p>
                    </div>
                `}
            </div>
        `);
        
        // Mark notifications as read when opening the center
        if (userNotifications.some(n => !n.read)) {
            this.markAllRead();
        }
    },

    getNotificationIcon(type) {
        const iconMap = {
            'order_cancelled': 'fas fa-times-circle',
            'order_rejected': 'fas fa-exclamation-triangle',
            'order_accepted': 'fas fa-check-circle',
            'order_completed': 'fas fa-box',
            'order_ready': 'fas fa-box-open'
        };
        return iconMap[type] || 'fas fa-bell';
    },

    getNotificationColor(type) {
        const colorMap = {
            'order_cancelled': 'text-red-500',
            'order_rejected': 'text-orange-500',
            'order_accepted': 'text-green-500',
            'order_completed': 'text-blue-500',
            'order_ready': 'text-purple-500'
        };
        return colorMap[type] || 'text-gray-500';
    },

    markAllRead() {
        if (!EudoraApp.currentUser) return;
        
        const notifications = JSON.parse(localStorage.getItem('crossNotifications') || '[]');
        notifications.forEach(notification => {
            if (notification.targetUserId === EudoraApp.currentUser.id) {
                notification.read = true;
            }
        });
        
        localStorage.setItem('crossNotifications', JSON.stringify(notifications));
        this.updateBadge(0);
    },

    // Debug functions for testing
    test() {
        if (!EudoraApp.currentUser) {
            console.log('❌ Devi essere loggato per testare le notifiche');
            return;
        }
        
        console.log('🧪 Testing notification system...');
        console.log('Current user:', EudoraApp.currentUser);
        
        // Create a test notification
        this.createNotification(
            EudoraApp.currentUser.id, 
            'order_cancelled', 
            '🧪 Test Notifica', 
            'Questa è una notifica di test per verificare il funzionamento del sistema.', 
            12345
        );
        
        console.log('✅ Test notification created. It should appear in 2 seconds.');
        
        // Also test with a different user type
        const allUsers = JSON.parse(localStorage.getItem('sampleUsers') || '[]');
        const otherUser = allUsers.find(u => u.id !== EudoraApp.currentUser.id && u.type === 'pharmacy');
        
        if (otherUser) {
            this.createNotification(
                otherUser.id, 
                'order_accepted', 
                '🧪 Test per Farmacia', 
                'Test di notifica cross-dashboard per farmacia.', 
                67890
            );
            console.log(`✅ Created test notification for pharmacy user: ${otherUser.firstName} ${otherUser.lastName}`);
        }
    },

    showAll() {
        const notifications = JSON.parse(localStorage.getItem('crossNotifications') || '[]');
        console.log('📋 All notifications in storage:', notifications);
        return notifications;
    },

    clearAll() {
        localStorage.removeItem('crossNotifications');
        this.updateBadge(0);
        console.log('🗑️ All notifications cleared');
    },

    simulatePharmacy() {
        if (!EudoraApp.currentUser) {
            console.log('❌ Devi essere loggato');
            return;
        }
        
        this.createNotification(
            EudoraApp.currentUser.id,
            'order_accepted',
            '✅ Ordine Accettato',
            'La farmacia ha accettato il tuo ordine e sta preparando i medicinali.',
            Math.floor(Math.random() * 10000)
        );
        console.log('✅ Simulated pharmacy notification created');
    }
};

// Make functions available globally for HTML onclick handlers
window.showNotificationCenter = () => NotificationSystem.showCenter();
window.NotificationSystem = NotificationSystem;

// Global function to update cart badge - called from dashboard
window.updateCartBadge = () => {
    if (NotificationSystem && NotificationSystem.refreshCartBadge) {
        NotificationSystem.refreshCartBadge();
    }
};

// Global function to force cart badge to show with count
window.forceShowCartBadge = (count) => {
    console.log(`🛒 Force showing cart badge with count: ${count}`);
    const cartTabCount = document.getElementById('cart-tab-count');
    if (cartTabCount) {
        if (count > 0) {
            cartTabCount.textContent = count > 99 ? '99+' : count;
            cartTabCount.classList.remove('hidden');
            console.log(`✅ Cart badge forced visible: ${cartTabCount.textContent}`);
        } else {
            cartTabCount.classList.add('hidden');
            console.log('✅ Cart badge hidden (count is 0)');
        }
    }
};

// Debug functions for console testing
window.testNotificationSystem = () => NotificationSystem.test();
window.showAllNotifications = () => NotificationSystem.showAll();
window.clearAllNotifications = () => NotificationSystem.clearAll();
window.simulatePharmacyNotification = () => NotificationSystem.simulatePharmacy();
