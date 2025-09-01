// filepath: js/main.js
// Main application file - coordinates all modules

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Eudora Application...');
    console.log('📍 Current page:', window.location.pathname);
    
    // Initialize Database first
    if (typeof Database !== 'undefined') {
        Database.init();
        
        // Initialize sample data if database is empty
        const stats = Database.getStats();
        if (stats.users.total === 0) {
            console.log('📊 Database is empty, creating sample data...');
            SampleData.init();
        }
    }
    
    // Initialize Authentication module
    if (typeof Auth !== 'undefined') {
        Auth.init();
    }
    
    // Detect which page we're on
    const isLandingPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
    const isDashboardPage = window.location.pathname.includes('dashboard.html');
    
    console.log('📄 Landing page:', isLandingPage);
    console.log('📊 Dashboard page:', isDashboardPage);
    
    // Always initialize landing page functionality (for navbar, footer, etc.)
    if (typeof LandingPage !== 'undefined') {
        LandingPage.init();
    }
    
    // Only initialize dashboard modules if we're on dashboard page
    if (isDashboardPage) {
        console.log('🏥 Initializing dashboard modules...');
        if (typeof TestData !== 'undefined') TestData.init();
        if (typeof Dashboard !== 'undefined') Dashboard.init();
        if (typeof NotificationSystem !== 'undefined') NotificationSystem.init();
    }
    
    console.log('✅ Application initialized successfully');
    
    // Make Database available globally for debugging
    if (typeof Database !== 'undefined') {
        window.db = Database;
        console.log('💾 Database available as window.db for debugging');
    }
    
    // Make Customer available globally for debugging
    if (typeof Customer !== 'undefined') {
        window.customer = Customer;
        console.log('🛍️ Customer available as window.customer for debugging');
    }
});

// Global application state
window.EudoraApp = {
    currentUser: null,
    version: '2.0.0',
    debug: true
};

// Global testing functions for database
window.dbTest = {
    // Mostra statistiche database
    stats() {
        console.table(Database.getStats());
    },
    
    // Lista tutti gli utenti per ruolo
    users(role = null) {
        if (role) {
            console.table(Database.getUsersByRole(role));
        } else {
            console.log('All users:');
            console.table(Database.get(Database.keys.users));
        }
    },
    
    // Lista tutti i prodotti
    products(pharmacyId = null) {
        const products = Database.getProducts(pharmacyId ? { pharmacyId } : {});
        console.table(products);
    },
    
    // Lista tutti gli ordini
    orders(status = null) {
        if (status) {
            console.table(Database.getOrdersByStatus(status));
        } else {
            console.table(Database.get(Database.keys.orders));
        }
    },
    
    // Test completo carrello
    testCart() {
        const customer = Database.getUsersByRole('customer')[0];
        const products = Database.getProducts();
        
        if (!customer || products.length === 0) {
            console.error('No customer or products found');
            return;
        }
        
        console.log('Testing cart for:', customer.email);
        
        // Aggiungi prodotti al carrello
        Database.addToCart(customer.id, products[0].id, 2);
        Database.addToCart(customer.id, products[1].id, 1);
        
        const cart = Database.getCart(customer.id);
        console.log('Cart after adding items:', cart);
        
        // Rimuovi un prodotto
        Database.removeFromCart(customer.id, products[0].id);
        console.log('Cart after removing item:', Database.getCart(customer.id));
        
        // Svuota carrello
        Database.clearCart(customer.id);
        console.log('Cart after clearing:', Database.getCart(customer.id));
    },
    
    // Test completo ordine
    testOrder() {
        const customer = Database.getUsersByRole('customer')[0];
        const pharmacy = Database.getUsersByRole('pharmacy')[0];
        const products = Database.getProducts({ pharmacyId: pharmacy.id });
        
        if (!customer || !pharmacy || products.length === 0) {
            console.error('Missing data for order test');
            return;
        }
        
        // Crea ordine
        const order = Database.createOrder({
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            pharmacyId: pharmacy.id,
            pharmacyName: pharmacy.businessName,
            items: [
                {
                    productId: products[0].id,
                    name: products[0].name,
                    price: products[0].price,
                    quantity: 2
                }
            ],
            total: products[0].price * 2,
            deliveryAddress: customer.addresses[0]
        });
        
        console.log('Order created:', order);
        
        // Testa cambio status
        Database.updateOrderStatus(order.id, 'accepted');
        console.log('Order accepted:', Database.getOrderById(order.id));
        
        Database.updateOrderStatus(order.id, 'ready');
        console.log('Order ready:', Database.getOrderById(order.id));
        
        Database.updateOrderStatus(order.id, 'delivered');
        console.log('Order delivered:', Database.getOrderById(order.id));
    },
    
    // Reset database
    reset() {
        Database.reset();
        SampleData.init();
        console.log('Database reset and sample data recreated');
    },
    
    // Export data
    export() {
        const data = Database.export();
        console.log('Database export:');
        console.log(JSON.stringify(data, null, 2));
        return data;
    }
};
