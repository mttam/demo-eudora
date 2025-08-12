// filepath: js/dashboard.js
// Dashboard controller - manages different user dashboards and navigation

const Dashboard = {
    init() {
        console.log('📊 Initializing Dashboard...');
        this.initializeState();
        // Auth is initialized separately in main.js, so we just need to check for saved user
        this.checkAutoLogin();
    },

    checkAutoLogin() {
        // Check if user should be auto-logged in (this helps with page refreshes)
        if (typeof Auth !== 'undefined' && EudoraApp.currentUser) {
            console.log('👤 Auto-showing dashboard for logged-in user:', EudoraApp.currentUser.email);
            
            // Check if we're on a dedicated customer dashboard page
            const isCustomerDashboardPage = window.location.pathname.includes('dashboard-cliente');
            
            if (isCustomerDashboardPage) {
                // On customer dashboard page, don't call show() since the elements don't exist
                console.log('📱 On dedicated customer dashboard page, skipping Dashboard.show()');
                return;
            }
            
            // Small delay to ensure DOM is ready
            setTimeout(() => this.show(), 100);
        }
    },

    initializeState() {
        // Initialize dashboard state only if we have Database
        if (typeof Database !== 'undefined') {
            this.loadSampleProducts();
        }
        this.updateCartDisplay();
    },

    show() {
        // Check if we're on a multi-dashboard page or a dedicated page
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const dashboardContainer = document.getElementById('dashboard-container');
        
        // Only manipulate these elements if they exist (multi-dashboard page)
        if (loginForm) {
            loginForm.classList.add('hidden');
        }
        if (signupForm) {
            signupForm.classList.add('hidden');
        }
        if (dashboardContainer) {
            dashboardContainer.classList.remove('hidden');
        }
        
        // Show appropriate dashboard based on user role
        this.hideAllDashboards();
        
        switch(EudoraApp.currentUser.role) {
            case 'customer':
                this.showCustomerDashboard();
                break;
            case 'pharmacy':
                this.showPharmacyDashboard();
                break;
            case 'rider':
                this.showRiderDashboard();
                break;
            case 'admin':
                this.showAdminDashboard();
                break;
        }
        
        // Update user info in header
        this.updateUserHeader();
        
        // Initialize notification badge check (only if NotificationSystem exists)
        if (typeof NotificationSystem !== 'undefined') {
            setTimeout(() => {
                console.log('🔄 Initial notification check after login...');
                NotificationSystem.checkForNotifications();
            }, 1000);
        }
    },

    hideAllDashboards() {
        const dashboards = [
            'user-dashboard',
            'pharmacy-dashboard', 
            'rider-dashboard',
            'admin-dashboard'
        ];
        
        dashboards.forEach(dashboardId => {
            const dashboard = document.getElementById(dashboardId);
            if (dashboard) {
                dashboard.classList.add('hidden');
            }
        });
    },

    showCustomerDashboard() {
        const userDashboard = document.getElementById('user-dashboard');
        if (userDashboard) {
            userDashboard.classList.remove('hidden');
        }
        
        // Initialize Customer module if available
        if (typeof Customer !== 'undefined') {
            Customer.init();
        }
        
        // Show customer section if the method exists
        if (this.showCustomerSection) {
            this.showCustomerSection('profile');
        }
    },

    showPharmacyDashboard() {
        const pharmacyDashboard = document.getElementById('pharmacy-dashboard');
        if (pharmacyDashboard) {
            pharmacyDashboard.classList.remove('hidden');
        }
        
        // Initialize Pharmacy module if available
        if (typeof Pharmacy !== 'undefined') {
            Pharmacy.init();
        }
        
        // Show pharmacy section if the method exists
        if (this.showPharmacySection) {
            this.showPharmacySection('orders');
        }
    },

    showRiderDashboard() {
        const riderDashboard = document.getElementById('rider-dashboard');
        if (riderDashboard) {
            riderDashboard.classList.remove('hidden');
        }
        console.log('🚴‍♂️ Rider dashboard shown - module not yet implemented');
        // TODO: Implement Rider module when ready
        // if (typeof Rider !== 'undefined') Rider.init();
    },

    showAdminDashboard() {
        const adminDashboard = document.getElementById('admin-dashboard');
        if (adminDashboard) {
            adminDashboard.classList.remove('hidden');
        }
        console.log('👑 Admin dashboard shown - module not yet implemented');
        // TODO: Implement Admin module when ready
        // if (typeof Admin !== 'undefined') Admin.init();
    },

    updateUserHeader() {
        const userName = document.getElementById('user-name');
        const userRoleBadge = document.getElementById('user-role-badge');
        
        if (userName && EudoraApp.currentUser) {
            userName.textContent = EudoraApp.currentUser.name || 
                                  `${EudoraApp.currentUser.firstName} ${EudoraApp.currentUser.lastName}` || 
                                  EudoraApp.currentUser.email;
        }
        
        if (userRoleBadge && EudoraApp.currentUser) {
            const roleInfo = this.getRoleInfo(EudoraApp.currentUser.role);
            userRoleBadge.textContent = roleInfo.label;
            userRoleBadge.className = `px-2 py-1 text-xs rounded-full ${roleInfo.classes}`;
        }
    },

    getRoleInfo(userRole) {
        const roles = {
            'customer': {
                label: 'Cliente',
                classes: 'bg-blue-100 text-blue-800'
            },
            'pharmacy': {
                label: 'Farmacia',
                classes: 'bg-green-100 text-green-800'
            },
            'rider': {
                label: 'Rider',
                classes: 'bg-purple-100 text-purple-800'
            },
            'admin': {
                label: 'Admin',
                classes: 'bg-red-100 text-red-800'
            }
        };
        return roles[userRole] || { label: 'Utente', classes: 'bg-gray-100 text-gray-800' };
    },

    // Customer Dashboard Navigation
    showCustomerSection(section) {
        console.log('🔄 Showing customer section:', section);
        
        // Hide all sections
        document.querySelectorAll('.customer-section').forEach(el => {
            el.classList.add('hidden');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.customer-tab').forEach(tab => {
            tab.classList.remove('bg-blue-600', 'text-white');
            tab.classList.add('bg-blue-600', 'hover:text-gray-800');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`customer-${section}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Add active class to selected tab
        const activeTab = document.getElementById(`tab-${section}`);
        if (activeTab) {
            activeTab.classList.add('bg-blue-600', 'text-white');
            activeTab.classList.remove('text-gray-600', 'hover:text-gray-800');
        }
        
        // Special handling for sections
        if (section === 'profile') {
            Customer.loadProfile();
        } else if (section === 'orders') {
            Customer.loadOrders();
        } else if (section === 'cart') {
            Customer.updateCartDisplay();
        } else if (section === 'shop') {
            // Load products in the shop section using Dashboard.loadProducts
            console.log('🛍️ Loading products for shop section...');
            this.loadProducts('all', '');
            
            // Initialize filter buttons and log their state changes
            setTimeout(() => {
                console.log('🎨 Setting up filter button colors...');
                const filterButtons = document.querySelectorAll('.category-filter');
                console.log(`🔍 Found ${filterButtons.length} filter buttons to style`);
                
                filterButtons.forEach((btn, index) => {
                    console.log(`  Button ${index}: "${btn.textContent?.trim()}" - current classes: ${btn.className}`);
                    btn.classList.remove('active', 'bg-blue-100', 'text-blue-700');
                    btn.classList.add('bg-gray-100', 'text-gray-700');
                    console.log(`  Button ${index}: after reset - classes: ${btn.className}`);
                });
                
                // Activate the "All" button
                const allButton = document.querySelector('.category-filter[onclick*="filterProducts(\'all\')"]');
                if (allButton) {
                    console.log('🎯 Activating "All" filter button...');
                    console.log('  Before activation - classes:', allButton.className);
                    allButton.classList.add('active', 'bg-blue-100', 'text-blue-700');
                    allButton.classList.remove('bg-gray-100', 'text-gray-700');
                    console.log('  After activation - classes:', allButton.className);
                    console.log('✅ "All" button activated:', allButton.textContent?.trim());
                } else {
                    console.warn('⚠️ Could not find "All" filter button');
                }
            }, 100);
        }
    },

    // Pharmacy Dashboard Navigation
    showPharmacySection(section) {
        console.log('🔄 Showing pharmacy section:', section);
        
        // Hide all sections
        document.querySelectorAll('.pharmacy-section').forEach(el => {
            el.classList.add('hidden');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.pharmacy-tab').forEach(tab => {
            tab.classList.remove('bg-green-600', 'text-white');
            tab.classList.add('text-gray-600', 'hover:text-gray-800');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`pharmacy-${section}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Add active class to selected tab
        const activeTab = document.getElementById(`pharmacy-tab-${section}`);
        if (activeTab) {
            activeTab.classList.add('bg-green-600', 'text-white');
            activeTab.classList.remove('text-gray-600', 'hover:text-gray-800');
        }
        
        // Special handling for sections
        if (section === 'orders') {
            Pharmacy.updateOrdersDisplay();
        } else if (section === 'products') {
            Pharmacy.updateProductsDisplay();
        }
    },

    // Admin Dashboard Navigation
    showAdminSection(section) {
        console.log('🔄 Showing admin section:', section);
        
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(el => {
            el.classList.add('hidden');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('bg-blue-600', 'text-white');
            tab.classList.add('text-gray-600', 'hover:text-gray-800');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`admin-${section}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Add active class to selected tab
        const activeTab = document.getElementById(`admin-tab-${section}`);
        if (activeTab) {
            activeTab.classList.add('bg-blue-600', 'text-white');
            activeTab.classList.remove('text-gray-600', 'hover:text-gray-800');
        }
        
        // Special handling for sections - Admin module not yet implemented
        console.log(`👑 Admin section '${section}' shown - Admin module not yet implemented`);
    },

    loadSampleProducts() {
        // Check if we need to initialize sample products in the Database
        if (typeof Database !== 'undefined') {
            const existingProducts = Database.getProducts();
            if (existingProducts.length === 0) {
                console.log('📦 No products found, sample products will be created by SampleData module');
            } else {
                console.log(`📦 Found ${existingProducts.length} products in database`);
            }
        } else {
            // Fallback to localStorage for legacy compatibility
            const sampleProducts = [
                {
                    id: 1,
                    name: 'Tachipirina 1000mg',
                    price: 8.50,
                    category: 'farmaci',
                    description: 'Antidolorifico e antipiretico',
                    prescription: false,
                    stock: 25
                },
                {
                    id: 2,
                    name: 'Amoxicillina 500mg',
                    price: 12.30,
                    category: 'farmaci',
                    description: 'Antibiotico a largo spettro',
                    prescription: true,
                    stock: 15
                },
                {
                    id: 3,
                    name: 'Aspirina 100mg',
                    price: 6.20,
                    category: 'farmaci',
                    description: 'Antiaggregante piastrinico',
                    prescription: false,
                    stock: 30
                },
                {
                    id: 4,
                    name: 'Vitamina C 1000mg',
                    price: 15.90,
                    category: 'integratori',
                    description: 'Integratore di vitamina C',
                    prescription: false,
                    stock: 40
                },
                {
                    id: 5,
                    name: 'Crema Solare SPF 50',
                    price: 18.50,
                    category: 'cosmetica',
                    description: 'Protezione solare ad alto fattore',
                    prescription: false,
                    stock: 20
                }
            ];
            
            if (!localStorage.getItem('sampleProducts')) {
                localStorage.setItem('sampleProducts', JSON.stringify(sampleProducts));
            }
        }
    },

    // Load and display products in the shop section
    loadProducts(category = 'all', searchTerm = '') {
        console.log('🛍️ Loading products for shop section...', { category, searchTerm });
        
        if (typeof Database === 'undefined') {
            console.error('❌ Database module not available');
            return;
        }

        try {
            // Get all products from database
            let products = Database.getAllProducts();
            console.log(`📦 Found ${products.length} total products in database`);

            // Map frontend categories to database categories
            const categoryMap = {
                'farmaci': ['analgesici', 'antibiotici'],
                'salute': ['vitamine', 'medicazioni'],
                'bambini': ['bambini'],
                'bellezza': ['cosmetica']
            };

            // Apply category filter
            if (category && category !== 'all') {
                const dbCategories = categoryMap[category] || [category];
                products = products.filter(product => 
                    product.category && dbCategories.includes(product.category.toLowerCase())
                );
                console.log(`🔍 Filtered to ${products.length} products for category: ${category} (mapped to: ${dbCategories.join(', ')})`);
            }

            // Apply search filter
            if (searchTerm && searchTerm.trim() !== '') {
                const searchLower = searchTerm.toLowerCase().trim();
                products = products.filter(product => 
                    (product.name && product.name.toLowerCase().includes(searchLower)) ||
                    (product.description && product.description.toLowerCase().includes(searchLower))
                );
                console.log(`🔍 Search filtered to ${products.length} products for term: ${searchTerm}`);
            }

            // Render products
            this.renderProducts(products);
            
        } catch (error) {
            console.error('❌ Error loading products:', error);
            this.renderProductsError();
        }
    },

    // Render products in the product grid
    renderProducts(products) {
        const productGrid = document.getElementById('product-grid');
        if (!productGrid) {
            console.error('❌ Product grid container not found');
            return;
        }

        if (!products || products.length === 0) {
            productGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-search text-gray-300 text-6xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-600 mb-2">Nessun prodotto trovato</h3>
                    <p class="text-gray-500">Prova a modificare i filtri di ricerca</p>
                </div>
            `;
            return;
        }

        const productsHTML = products.map(product => this.renderProductCard(product)).join('');
        productGrid.innerHTML = productsHTML;
        
        console.log(`✅ Rendered ${products.length} products in shop`);
    },

    // Render a single product card
    renderProductCard(product) {
        const isOutOfStock = !product.stock || product.stock <= 0;
        const needsPrescription = product.requiresPrescription || product.prescription || false;
        
        return `
            <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div class="p-4">
                    <!-- Product Icon/Image -->
                    <div class="flex justify-center mb-3">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-pills text-blue-600 text-2xl"></i>
                        </div>
                    </div>
                    
                    <!-- Product Info -->
                    <h4 class="font-semibold text-gray-800 mb-2 text-center">${product.name || 'Prodotto'}</h4>
                    <p class="text-sm text-gray-600 mb-3 text-center">${product.description || 'Descrizione non disponibile'}</p>
                    
                    <!-- Price and Stock -->
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-lg font-bold text-green-600">€${(product.price || 0).toFixed(2)}</span>
                        <span class="text-sm text-gray-500">
                            ${isOutOfStock ? 
                                '<span class="text-red-500">Esaurito</span>' : 
                                `Stock: ${product.stock}`
                            }
                        </span>
                    </div>
                    
                    <!-- Category Badge -->
                    <div class="mb-3">
                        <span class="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            ${this.getCategoryLabel(product.category)}
                        </span>
                        ${needsPrescription ? 
                            '<span class="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full ml-1">Ricetta</span>' : 
                            ''
                        }
                    </div>
                    
                    <!-- Pharmacy Info -->
                    ${product.pharmacyName ? `
                        <div class="mb-3 flex items-center text-xs text-gray-600">
                            <i class="fas fa-clinic-medical mr-1 text-blue-500"></i>
                            <span>${product.pharmacyName}</span>
                        </div>
                    ` : ''}
                    
                    <!-- Add to Cart Button -->
                    <button 
                        onclick="addToCart('${product.id}', '${(product.name || '').replace(/'/g, "\\'")}', ${product.price || 0})"
                        class="w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                            isOutOfStock ? 
                                'bg-gray-300 text-gray-500 cursor-not-allowed' :
                                'bg-blue-600 text-white hover:bg-blue-700'
                        }"
                        ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 
                            '<i class="fas fa-times mr-2"></i>Non Disponibile' :
                            '<i class="fas fa-plus mr-2"></i>Aggiungi al Carrello'
                        }
                    </button>
                </div>
            </div>
        `;
    },

    // Get human-readable category label
    getCategoryLabel(category) {
        const categoryLabels = {
            'analgesici': 'Analgesici',
            'antibiotici': 'Antibiotici',
            'vitamine': 'Vitamine',
            'cosmetica': 'Cosmetica',
            'medicazioni': 'Medicazioni',
            'farmaci': 'Farmaci',
            'salute': 'Salute e Benessere',
            'bambini': 'Bambini',
            'bellezza': 'Bellezza e Cura',
            'integratori': 'Integratori',
            'igiene': 'Igiene Personale',
            'veterinaria': 'Veterinaria'
        };
        return categoryLabels[category] || 'Altro';
    },

    // Render error state for products
    renderProductsError() {
        const productGrid = document.getElementById('product-grid');
        if (productGrid) {
            productGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-exclamation-triangle text-red-300 text-6xl mb-4"></i>
                    <h3 class="text-lg font-medium text-red-600 mb-2">Errore nel caricamento</h3>
                    <p class="text-gray-500">Non è stato possibile caricare i prodotti</p>
                    <button onclick="Dashboard.loadProducts()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        Riprova
                    </button>
                </div>
            `;
        }
    },

    updateCartDisplay() {
        // This will be handled by Customer module
        if (EudoraApp.currentUser && EudoraApp.currentUser.role === 'customer') {
            if (typeof Customer !== 'undefined') {
                Customer.updateCartDisplay();
            }
        }
    },

    // Method to handle logout from dashboard
    logout() {
        if (typeof Auth !== 'undefined') {
            Auth.logout();
        }
    },

    // Method to refresh dashboard data
    refresh() {
        console.log('🔄 Refreshing dashboard data...');
        if (!EudoraApp.currentUser) return;

        switch(EudoraApp.currentUser.role) {
            case 'customer':
                if (typeof Customer !== 'undefined') {
                    Customer.loadData();
                }
                break;
            case 'pharmacy':
                if (typeof Pharmacy !== 'undefined') {
                    Pharmacy.loadData();
                }
                break;
        }
    },

    // Method to get current dashboard type
    getCurrentDashboardType() {
        if (!EudoraApp.currentUser) return null;
        return EudoraApp.currentUser.role;
    },

    // Method to check if user can access dashboard
    canAccessDashboard() {
        return !!(EudoraApp.currentUser && EudoraApp.currentUser.isActive);
    },

    // Debug method to help troubleshoot dashboard issues
    debug() {
        console.log('🔍 Dashboard Debug Information:');
        console.log('- Current User:', EudoraApp.currentUser);
        console.log('- Can Access Dashboard:', this.canAccessDashboard());
        console.log('- Current Dashboard Type:', this.getCurrentDashboardType());
        console.log('- Available Modules:', {
            Auth: typeof Auth !== 'undefined',
            Customer: typeof Customer !== 'undefined',
            Pharmacy: typeof Pharmacy !== 'undefined',
            Database: typeof Database !== 'undefined',
            NotificationSystem: typeof NotificationSystem !== 'undefined'
        });
        
        if (EudoraApp.currentUser) {
            const visibleDashboard = document.querySelector('[id$="-dashboard"]:not(.hidden)');
            console.log('- Visible Dashboard:', visibleDashboard ? visibleDashboard.id : 'none');
        }
    }
};

// Make functions available globally for HTML onclick handlers
window.showCustomerSection = (section) => Dashboard.showCustomerSection(section);
window.showPharmacySection = (section) => Dashboard.showPharmacySection(section);
window.showAdminSection = (section) => Dashboard.showAdminSection(section);
window.Dashboard = Dashboard;

// Additional global functions for better integration
window.dashboardLogout = () => Dashboard.logout();
window.refreshDashboard = () => Dashboard.refresh();
window.debugDashboard = () => Dashboard.debug();
