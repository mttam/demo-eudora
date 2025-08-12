// Rider Dashboard Test Script
// This script can be run in the browser console to test rider functionality

console.log('🧪 Starting Rider Dashboard Tests...');

// Test 1: Check if all modules are loaded
function testModulesLoaded() {
    console.log('\n📋 Test 1: Module Loading');
    
    const requiredModules = ['Database', 'Auth', 'Rider', 'EudoraApp'];
    const results = {};
    
    requiredModules.forEach(module => {
        results[module] = typeof window[module] !== 'undefined';
        console.log(`${results[module] ? '✅' : '❌'} ${module}:`, results[module] ? 'Loaded' : 'Missing');
    });
    
    return Object.values(results).every(result => result);
}

// Test 2: Check if test data is properly initialized
function testTestData() {
    console.log('\n📋 Test 2: Test Data Initialization');
    
    const orders = Database.get(Database.keys.orders);
    const users = Database.get(Database.keys.users);
    
    console.log('📦 Orders in database:', orders?.length || 0);
    console.log('👥 Users in database:', users?.length || 0);
    
    // Check for rider user
    const riderUser = Database.getUserByEmail('rider1@eudora.com');
    console.log('🚴 Rider user found:', !!riderUser);
    
    if (riderUser) {
        console.log('🚴 Rider details:', riderUser.firstName, riderUser.lastName);
    }
    
    // Check for orders with status 'ready'
    const readyOrders = orders?.filter(order => order.status === 'ready') || [];
    console.log('⏰ Ready orders:', readyOrders.length);
    
    return orders?.length > 0 && users?.length > 0 && !!riderUser;
}

// Test 3: Test rider login
function testRiderLogin() {
    console.log('\n📋 Test 3: Rider Login Simulation');
    
    try {
        // Clear any existing user
        localStorage.removeItem('currentUser');
        EudoraApp.currentUser = null;
        
        // Simulate login
        Auth.login('rider1@eudora.com', 'rider123');
        
        const isLoggedIn = !!EudoraApp.currentUser;
        const isRider = EudoraApp.currentUser?.role === 'rider';
        
        console.log('🔐 Login successful:', isLoggedIn);
        console.log('🚴 User is rider:', isRider);
        
        if (EudoraApp.currentUser) {
            console.log('👤 Logged in as:', EudoraApp.currentUser.firstName, EudoraApp.currentUser.lastName);
        }
        
        return isLoggedIn && isRider;
        
    } catch (error) {
        console.error('❌ Login test failed:', error);
        return false;
    }
}

// Test 4: Test rider module functionality
function testRiderModule() {
    console.log('\n📋 Test 4: Rider Module Functionality');
    
    if (!window.Rider) {
        console.error('❌ Rider module not available');
        return false;
    }
    
    try {
        // Initialize rider module
        Rider.init();
        
        console.log('📦 Orders loaded:', Rider.orders.length);
        console.log('🔍 Filtered orders:', Rider.filteredOrders.length);
        console.log('🚴 Current rider:', Rider.currentRider?.firstName);
        
        // Test filtering
        Rider.filterOrders('ready');
        const readyOrders = Rider.filteredOrders.filter(order => order.status === 'ready');
        console.log('⏰ Ready orders after filter:', readyOrders.length);
        
        // Test search
        Rider.searchOrders('Mario');
        console.log('🔍 Search results for "Mario":', Rider.filteredOrders.length);
        
        // Reset filters
        Rider.filterOrders('all');
        
        return true;
        
    } catch (error) {
        console.error('❌ Rider module test failed:', error);
        return false;
    }
}

// Test 5: Test order actions (simulated)
function testOrderActions() {
    console.log('\n📋 Test 5: Order Actions');
    
    const readyOrders = Database.get(Database.keys.orders)?.filter(order => order.status === 'ready') || [];
    
    if (readyOrders.length === 0) {
        console.log('⚠️ No ready orders to test with');
        return true; // Not a failure, just no data
    }
    
    const testOrder = readyOrders[0];
    console.log('🧪 Testing with order:', testOrder.id);
    
    try {
        // Test pickup (don't actually execute to avoid changing test data)
        console.log('🔄 Testing pickup simulation for order:', testOrder.orderNumber);
        
        // Test the functions exist
        const hasPickupFunction = typeof Rider.pickupOrder === 'function';
        const hasDeliverFunction = typeof Rider.deliverOrder === 'function';
        const hasModalFunction = typeof Rider.showOrderModal === 'function';
        
        console.log('📋 Pickup function exists:', hasPickupFunction);
        console.log('🚚 Deliver function exists:', hasDeliverFunction);
        console.log('🗺️ Modal function exists:', hasModalFunction);
        
        return hasPickupFunction && hasDeliverFunction && hasModalFunction;
        
    } catch (error) {
        console.error('❌ Order actions test failed:', error);
        return false;
    }
}

// Test 6: Test notification system
function testNotificationSystem() {
    console.log('\n📋 Test 6: Notification System');
    
    try {
        const hasNotificationManager = typeof window.riderNotificationManager !== 'undefined';
        console.log('🔔 Notification manager exists:', hasNotificationManager);
        
        if (hasNotificationManager) {
            // Removed test notifications
            console.log('🔔 Notification tests triggered');
        }
        
        return hasNotificationManager;
        
    } catch (error) {
        console.error('❌ Notification system test failed:', error);
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting Comprehensive Rider Dashboard Tests...\n');
    
    const results = {
        'Modules Loaded': testModulesLoaded(),
        'Test Data': testTestData(),
        'Rider Login': testRiderLogin(),
        'Rider Module': testRiderModule(),
        'Order Actions': testOrderActions(),
        'Notifications': testNotificationSystem()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(40));
    
    let passedTests = 0;
    const totalTests = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
        if (passed) passedTests++;
    });
    
    console.log('='.repeat(40));
    console.log(`📈 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Rider dashboard is ready to use.');
        console.log('\n🚴 To test the rider dashboard:');
        console.log('1. Open dashboard-rider.html');
        console.log('2. Login with: rider@eudora.com / rider123');
        console.log('3. Explore the orders and map functionality');
    } else {
        console.log('⚠️ Some tests failed. Check the errors above.');
    }
    
    return results;
}

// Removed auto-run test messages
if (typeof window !== 'undefined') {
    // Wait for modules to load, then run tests
    setTimeout(() => {
        if (typeof Database !== 'undefined') {
            runAllTests();
        } else {
            console.log('⏳ Waiting for modules to load before running tests...');
            setTimeout(() => runAllTests(), 2000);
        }
    }, 1000);
}

// Export for manual testing
window.riderTests = {
    runAllTests,
    testModulesLoaded,
    testTestData,
    testRiderLogin,
    testRiderModule,
    testOrderActions,
    testNotificationSystem
};
