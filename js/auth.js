// filepath: js/auth.js
// Authentication module - login, signup, logout, user management

const Auth = {
    init() {
        console.log('🔐 Initializing Authentication...');
        this.checkSavedUser();
    },

    checkSavedUser() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                
                // Check if userData has required properties and valid id
                if (!userData || !userData.id || typeof userData.id !== 'string') {
                    console.log('👤 Invalid saved user data, removing...');
                    localStorage.removeItem('currentUser');
                    return;
                }
                
                // Verifica che l'utente esista ancora nel database e ottieni i dati completi
                const dbUser = Database.getUserById(userData.id);
                if (dbUser && dbUser.isActive) {
                    EudoraApp.currentUser = dbUser; // Use full user data from database
                    // Only redirect if we're not already on the correct page
                    const currentPage = window.location.pathname;
                    const expectedPage = this.getDashboardPageForUserType(dbUser.role || dbUser.userType);
                    if (!currentPage.includes(expectedPage)) {
                        this.redirectToDashboard(dbUser.userType || dbUser.role);
                    }
                    console.log('👤 User auto-logged in:', EudoraApp.currentUser.email);
                } else if (userData.id && (userData.id.startsWith('demo_') || userData.id.includes('demo') || userData.id.startsWith('rider_demo'))) {
                    // For demo users, use the saved essential data
                    EudoraApp.currentUser = userData;
                    console.log('👤 Demo user logged in:', userData.email);
                } else {
                    // Utente non più valido, rimuovi dal localStorage
                    localStorage.removeItem('currentUser');
                    console.log('👤 Saved user no longer valid');
                }
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem('currentUser');
            }
        } else {
            // Check if we're on a dashboard page and set up demo mode
            const currentPage = window.location.pathname;
            if (currentPage.includes('dashboard-rider.html')) {
                console.log('👤 No saved user found on rider dashboard, demo mode will be set up');
                // Don't show any error - let the dashboard initialization handle this
                return;
            }
        }
    },

    login(email, password) {
        if (!email || !password) {
            this.showError('Campi Obbligatori', 'Per favore inserisci email e password');
            return;
        }
        
        // Assicurati che il database sia inizializzato
        if (!Database.indexes || !Database.indexes.usersByEmail) {
            console.log('Database not initialized, initializing now...');
            Database.init();
        }
        
        // Usa il database per l'autenticazione
        const user = Database.getUserByEmail(email);
        
        if (user && user.password === password && user.isActive) {
            EudoraApp.currentUser = user;
            
            // Store only essential user data in localStorage to avoid quota issues
            const essentialUserData = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userType: user.userType || user.role,
                role: user.role || user.userType,
                isActive: user.isActive,
                loginTime: new Date().toISOString()
            };
            
            try {
                localStorage.setItem('currentUser', JSON.stringify(essentialUserData));
            } catch (error) {
                console.warn('Failed to save user to localStorage:', error);
                // Try to clear some space and retry
                if (error.name === 'QuotaExceededError') {
                    this.clearLocalStorageQuota();
                    try {
                        localStorage.setItem('currentUser', JSON.stringify(essentialUserData));
                        console.log('Successfully saved user after clearing quota');
                    } catch (retryError) {
                        console.error('Failed to save user even after clearing quota:', retryError);
                    }
                }
            }
            
            // Only redirect if we're not already on the correct page
            const currentPage = window.location.pathname;
            const expectedPage = this.getDashboardPageForUserType(user.role || user.userType);
            if (!currentPage.includes(expectedPage)) {
                this.redirectToDashboard(user.role || user.userType);
            }
            
            this.showSuccess('Accesso Effettuato', `Benvenuto/a ${user.firstName}!`);
            
            // Crea notifica di login
            try {
                Database.createNotification({
                    userId: user.id,
                    type: 'system',
                    title: 'Accesso effettuato',
                    message: `Benvenuto/a ${user.firstName}!`
                });
            } catch (error) {
                console.warn('Failed to create login notification:', error);
            }
            
            console.log('👤 User logged in:', user.email, user.userType);
        } else {
            // Fallback to demo accounts for compatibility (excluding riders - they should use database)
            const demoAccounts = {
                'mario.rossi@email.com': { 
                    id: 1, userType: 'customer', role: 'customer', name: 'Mario Rossi', 
                    firstName: 'Mario', lastName: 'Rossi',
                    email: 'mario.rossi@email.com', password: 'password123', isActive: true 
                },
                'farmacia.centrale@email.com': { 
                    id: 3, userType: 'pharmacy', role: 'pharmacy', name: 'Farmacia Centrale', 
                    firstName: 'Farmacia', lastName: 'Centrale',
                    email: 'farmacia.centrale@email.com', password: 'password123', isActive: true 
                },
                'admin@eudora.com': { 
                    id: 2, userType: 'admin', role: 'admin', name: 'Admin Eudora', 
                    firstName: 'Admin', lastName: 'Eudora',
                    email: 'admin@eudora.com', password: 'password123', isActive: true 
                }
            };
            
            // Check if it's a rider email from database but password doesn't match
            if (email.includes('rider') && email.includes('@eudora.com')) {
                this.showError('Password Errata', 'La password inserita non è corretta per questo account rider.');
                return;
            }
            
            if (demoAccounts[email] && demoAccounts[email].password === password) {
                EudoraApp.currentUser = demoAccounts[email];
                
                // Store only essential data for demo accounts too
                const essentialDemoData = {
                    id: demoAccounts[email].id,
                    email: demoAccounts[email].email,
                    firstName: demoAccounts[email].firstName,
                    lastName: demoAccounts[email].lastName,
                    userType: demoAccounts[email].userType,
                    role: demoAccounts[email].role,
                    isActive: demoAccounts[email].isActive,
                    loginTime: new Date().toISOString()
                };
                
                try {
                    localStorage.setItem('currentUser', JSON.stringify(essentialDemoData));
                } catch (error) {
                    console.warn('Failed to save demo user to localStorage:', error);
                    // Try to clear some space and retry
                    if (error.name === 'QuotaExceededError') {
                        this.clearLocalStorageQuota();
                        try {
                            localStorage.setItem('currentUser', JSON.stringify(essentialDemoData));
                            console.log('Successfully saved demo user after clearing quota');
                        } catch (retryError) {
                            console.error('Failed to save demo user even after clearing quota:', retryError);
                        }
                    }
                }
                
                // Only redirect if we're not already on the correct page
                const currentPage = window.location.pathname;
                const expectedPage = this.getDashboardPageForUserType(demoAccounts[email].role || demoAccounts[email].userType);
                if (!currentPage.includes(expectedPage)) {
                    this.redirectToDashboard(demoAccounts[email].role || demoAccounts[email].userType);
                }
                
                this.showSuccess('Accesso Effettuato', `Benvenuto/a ${demoAccounts[email].firstName}!`);
            } else {
                this.showError('Credenziali Non Valide', 'Email o password non corretti. Verifica i dati inseriti.');
            }
        }
    },

    redirectToDashboard(userType) {
        switch(userType) {
            case 'customer':
                window.location.href = 'dashboard-cliente.html';
                break;
            case 'rider':
                window.location.href = 'dashboard-rider.html';
                break;
            case 'pharmacy':
                window.location.href = 'dashboard-farmacia.html';
                break;
            case 'admin':
                window.location.href = 'dashboard-admin.html';
                break;
            default:
                console.error('Unknown user type:', userType);
                window.location.href = 'login.html';
        }
    },

    getDashboardPageForUserType(userType) {
        switch(userType) {
            case 'customer':
                return 'dashboard-cliente.html';
            case 'rider':
                return 'dashboard-rider.html';
            case 'pharmacy':
                return 'dashboard-farmacia.html';
            case 'admin':
                return 'dashboard-admin.html';
            default:
                return 'login.html';
        }
    },

    signup() {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-password-confirm').value;
        
        if (!name || !email || !password || !confirmPassword) {
            this.showError('Compila tutti i campi');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('Le password non corrispondono');
            return;
        }
        
        // Verifica se l'email esiste già
        if (Database.getUserByEmail(email)) {
            this.showError('Email già registrata');
            return;
        }
        
        try {
            // Crea nuovo utente nel database
            const [firstName, ...lastNameParts] = name.split(' ');
            const lastName = lastNameParts.join(' ') || '';
            
            const userData = {
                email: email,
                password: password, // In produzione usare hash
                role: 'customer',
                firstName: firstName,
                lastName: lastName,
                phone: '', // Da completare nel profilo
                addresses: [],
                paymentMethods: []
            };
            
            const newUser = Database.createUser(userData);
            
            // Auto-login
            EudoraApp.currentUser = newUser;
            localStorage.setItem('currentUser', JSON.stringify(EudoraApp.currentUser));
            Dashboard.show();
            this.showNotification('Account creato con successo');
            
            // Crea notifica di benvenuto
            Database.createNotification({
                userId: newUser.id,
                type: 'system',
                title: 'Benvenuto in Eudora!',
                message: 'Il tuo account è stato creato con successo. Completa il tuo profilo per iniziare.'
            });
            
            console.log('👤 New user created:', newUser.email);
            
        } catch (error) {
            console.error('Error creating user:', error);
            this.showError('Errore nella creazione dell\'account: ' + error.message);
        }
    },

    logout() {
        if (EudoraApp.currentUser) {
            // Crea notifica di logout
            Database.createNotification({
                userId: EudoraApp.currentUser.id,
                type: 'system',
                title: 'Logout effettuato',
                message: 'Ci vediamo presto!'
            });
        }
        
        EudoraApp.currentUser = null;
        localStorage.removeItem('currentUser');
        Customer.clearCart();
        this.showLogin();
        this.showNotification('Logout effettuato con successo');
    },

    showLogin() {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('signup-form').classList.add('hidden');
        document.getElementById('dashboard-container').classList.add('hidden');
    },

    showSignup() {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
        document.getElementById('dashboard-container').classList.add('hidden');
    },

    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const icon = input.nextElementSibling.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    },

    quickLogin(userType) {
        const quickAccounts = {
            'customer': {
                email: 'mario.rossi@email.com',
                password: 'password123'
            },
            'rider': {
                email: 'rider1@eudora.com', 
                password: 'rider123'
            },
            'pharmacy': {
                email: 'farmacia.centrale@email.com',
                password: 'farmacia123'
            },
            'admin': {
                email: 'admin@eudora.com',
                password: 'admin123'
            }
        };

        if (quickAccounts[userType]) {
            document.getElementById('login-email').value = quickAccounts[userType].email;
            document.getElementById('login-password').value = quickAccounts[userType].password;
            this.login();
        }
    },

    getCurrentUser() {
        if (EudoraApp.currentUser) {
            return EudoraApp.currentUser;
        }
        
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                return JSON.parse(savedUser);
            } catch (error) {
                console.error('Error parsing saved user:', error);
            }
        }
        
        return null;
    },

    logout() {
        EudoraApp.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
        console.log('👤 User logged out');
    },

    showError(title, message) {
        // Se esiste il notification manager, usalo
        if (typeof notificationManager !== 'undefined') {
            notificationManager.error(title, message);
        } else if (typeof dashboardNotificationManager !== 'undefined') {
            dashboardNotificationManager.error(title, message);
        } else if (typeof riderNotificationManager !== 'undefined') {
            riderNotificationManager.error(title, message);
        } else {
            // Fallback per quando il notification manager non è disponibile
            alert(title + ': ' + message);
        }
    },

    showSuccess(title, message) {
        // Se esiste il notification manager, usalo
        if (typeof notificationManager !== 'undefined') {
            notificationManager.success(title, message);
        } else if (typeof dashboardNotificationManager !== 'undefined') {
            dashboardNotificationManager.success(title, message);
        } else if (typeof riderNotificationManager !== 'undefined') {
            riderNotificationManager.success(title, message);
        } else {
            // Fallback per quando il notification manager non è disponibile
            this.showNotification(message);
        }
    },

    showWarning(title, message) {
        // Se esiste il notification manager, usalo
        if (typeof notificationManager !== 'undefined') {
            notificationManager.warning(title, message);
        } else if (typeof dashboardNotificationManager !== 'undefined') {
            dashboardNotificationManager.warning(title, message);
        } else if (typeof riderNotificationManager !== 'undefined') {
            riderNotificationManager.warning(title, message);
        } else {
            // Fallback per quando il notification manager non è disponibile
            alert(title + ': ' + message);
        }
    },

    showInfo(title, message) {
        // Se esiste il notification manager, usalo
        if (typeof notificationManager !== 'undefined') {
            notificationManager.info(title, message);
        } else if (typeof dashboardNotificationManager !== 'undefined') {
            dashboardNotificationManager.info(title, message);
        } else if (typeof riderNotificationManager !== 'undefined') {
            riderNotificationManager.info(title, message);
        } else {
            // Fallback per quando il notification manager non è disponibile
            alert(title + ': ' + message);
        }
    },

    showNotification(message) {
        // Create toast notification (legacy method for backwards compatibility)
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    },

    // Helper function to get the current user with full data
    getCurrentUser() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                if (userData && userData.id) {
                    // Try to get full user data from database
                    const dbUser = Database.getUserById(userData.id);
                    return dbUser || userData; // Return full data if available, otherwise essential data
                }
            } catch (error) {
                console.error('Error parsing saved user:', error);
            }
        }
        return EudoraApp.currentUser || null;
    },

    // Helper function to clear localStorage data if quota is exceeded
    clearLocalStorageQuota() {
        try {
            // Clear non-essential data first
            const nonEssentialKeys = ['userSearchHistory', 'pharmacyProducts', 'sampleUsers'];
            nonEssentialKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`Cleared ${key} from localStorage`);
                }
            });
        } catch (error) {
            console.warn('Error clearing localStorage:', error);
        }
    }
};

// Make functions available globally for HTML onclick handlers
window.login = () => Auth.login();
window.signup = () => Auth.signup();
window.logout = () => Auth.logout();
window.showLogin = () => Auth.showLogin();
window.showSignup = () => Auth.showSignup();
window.togglePasswordVisibility = (inputId) => Auth.togglePasswordVisibility(inputId);
