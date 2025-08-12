// filepath: js/sample-data.js
// Dati di esempio per popolare il database

const SampleData = {
    init() {
        console.log('🎭 Initializing Sample Data...');
        this.createSampleUsers();
        this.createSampleProducts();
        this.createSampleOrders();
        console.log('✅ Sample Data initialized');
    },

    createSampleUsers() {
        console.log('👥 Creating sample users...');

        // Admin
        try {
            Database.createUser({
                email: 'admin@eudora.com',
                password: 'admin123',
                role: 'admin',
                firstName: 'Amministratore',
                lastName: 'Sistema',
                phone: '+39 350 0000000'
            });
        } catch (e) { /* User already exists */ }

        // Clienti
        const customers = [
            {
                email: 'mario.rossi@email.com',
                password: 'password123',
                role: 'customer',
                firstName: 'Mario',
                lastName: 'Rossi',
                phone: '+39 333 1234567',
                dateOfBirth: '1985-03-15',
                addresses: [
                    {
                        id: Database.generateId(),
                        label: 'Casa',
                        street: 'Via Roma 123',
                        city: 'Milano',
                        zipCode: '20100',
                        isDefault: true
                    },
                    {
                        id: Database.generateId(),
                        label: 'Ufficio',
                        street: 'Via del Lavoro 45',
                        city: 'Milano',
                        zipCode: '20121',
                        isDefault: false
                    }
                ],
                paymentMethods: [
                    {
                        id: Database.generateId(),
                        type: 'card',
                        label: 'Carta di Credito Principale',
                        description: 'Visa **** 1234',
                        cardNumber: '**** **** **** 1234',
                        expiryDate: '12/25',
                        cardHolder: 'Mario Rossi',
                        cardType: 'visa',
                        isDefault: true
                    },
                    {
                        id: Database.generateId(),
                        type: 'paypal',
                        label: 'PayPal',
                        description: 'mario.rossi@email.com',
                        email: 'mario.rossi@email.com',
                        isDefault: false
                    },
                    {
                        id: Database.generateId(),
                        type: 'cash',
                        label: 'Contrassegno',
                        description: 'Pagamento alla consegna',
                        isDefault: false
                    }
                ]
            },
            {
                email: 'lucia.verdi@email.com',
                password: 'password123',
                role: 'customer',
                firstName: 'Lucia',
                lastName: 'Verdi',
                phone: '+39 334 2345678',
                dateOfBirth: '1990-07-22',
                addresses: [
                    {
                        id: Database.generateId(),
                        label: 'Casa',
                        street: 'Via Torino 67',
                        city: 'Roma',
                        zipCode: '00100',
                        isDefault: true
                    }
                ],
                paymentMethods: [
                    {
                        id: Database.generateId(),
                        type: 'card',
                        label: 'Mastercard Personale',
                        description: 'Mastercard **** 5678',
                        cardNumber: '**** **** **** 5678',
                        expiryDate: '06/26',
                        cardHolder: 'Lucia Verdi',
                        cardType: 'mastercard',
                        isDefault: true
                    },
                    {
                        id: Database.generateId(),
                        type: 'bank_transfer',
                        label: 'Bonifico Bancario',
                        description: 'Banca Intesa - IT60 X054 2811 1010 0000 0123 456',
                        iban: 'IT60 X054 2811 1010 0000 0123 456',
                        bankName: 'Banca Intesa',
                        isDefault: false
                    }
                ]
            },
            {
                email: 'giorgio.bianchi@email.com',
                password: 'password123',
                role: 'customer',
                firstName: 'Giorgio',
                lastName: 'Bianchi',
                phone: '+39 335 3456789',
                dateOfBirth: '1978-11-08',
                addresses: [
                    {
                        id: Database.generateId(),
                        label: 'Casa',
                        street: 'Via Napoli 89',
                        city: 'Napoli',
                        zipCode: '80100',
                        isDefault: true
                    }
                ],
                paymentMethods: [
                    {
                        id: Database.generateId(),
                        type: 'cash',
                        label: 'Contrassegno',
                        description: 'Pagamento in contanti alla consegna',
                        isDefault: true
                    },
                    {
                        id: Database.generateId(),
                        type: 'card',
                        label: 'Carta Prepagata',
                        description: 'Postepay **** 9012',
                        cardNumber: '**** **** **** 9012',
                        expiryDate: '03/27',
                        cardHolder: 'Giorgio Bianchi',
                        cardType: 'postepay',
                        isDefault: false
                    }
                ]
            }
        ];

        customers.forEach(customer => {
            try {
                Database.createUser(customer);
            } catch (e) { /* User already exists */ }
        });

        // Farmacie
        const pharmacies = [
            {
                email: 'farmacia.centrale@email.com',
                password: 'farmacia123',
                role: 'pharmacy',
                firstName: 'Farmacia',
                lastName: 'Centrale',
                phone: '+39 02 1234567',
                businessName: 'Farmacia Centrale Milano',
                licenseNumber: 'FM001234',
                address: 'Piazza Duomo 1, Milano',
                workingHours: {
                    monday: '08:00-20:00',
                    tuesday: '08:00-20:00',
                    wednesday: '08:00-20:00',
                    thursday: '08:00-20:00',
                    friday: '08:00-20:00',
                    saturday: '09:00-19:00',
                    sunday: '10:00-18:00'
                },
                deliveryZones: ['20100', '20121', '20122', '20123', '20124']
            },
            {
                email: 'farmacia.roma@email.com',
                password: 'farmacia123',
                role: 'pharmacy',
                firstName: 'Farmacia',
                lastName: 'Roma Centro',
                phone: '+39 06 2345678',
                businessName: 'Farmacia Roma Centro',
                licenseNumber: 'FR002345',
                address: 'Via del Corso 100, Roma',
                workingHours: {
                    monday: '08:30-19:30',
                    tuesday: '08:30-19:30',
                    wednesday: '08:30-19:30',
                    thursday: '08:30-19:30',
                    friday: '08:30-19:30',
                    saturday: '09:00-18:00',
                    sunday: 'Chiuso'
                },
                deliveryZones: ['00100', '00101', '00102', '00118']
            },
            {
                email: 'farmacia.napoli@email.com',
                password: 'farmacia123',
                role: 'pharmacy',
                firstName: 'Farmacia',
                lastName: 'Napoli Sud',
                phone: '+39 081 3456789',
                businessName: 'Farmacia Napoli Sud',
                licenseNumber: 'FN003456',
                address: 'Via Toledo 200, Napoli',
                workingHours: {
                    monday: '08:00-20:00',
                    tuesday: '08:00-20:00',
                    wednesday: '08:00-20:00',
                    thursday: '08:00-20:00',
                    friday: '08:00-20:00',
                    saturday: '08:30-19:00',
                    sunday: '09:00-18:00'
                },
                deliveryZones: ['80100', '80121', '80122', '80133']
            }
        ];

        pharmacies.forEach(pharmacy => {
            try {
                Database.createUser(pharmacy);
            } catch (e) { /* User already exists */ }
        });

        // Riders
        const riders = [
            {
                email: 'rider1@eudora.com',
                password: 'rider123',
                role: 'rider',
                firstName: 'Marco',
                lastName: 'Delivery',
                phone: '+39 340 1111111',
                address: 'Via Milano 123, 20100 Milano (MI)',
                vehicleType: 'scooter',
                vehicle: 'Scooter Yamaha',
                vehiclePlate: 'AB123CD',
                workingZones: ['20100', '20121', '20122'],
                zone: 'Centro Milano',
                isAvailable: true,
                isActive: true,
                rating: 4.8,
                licenseNumber: 'DL123456789',
                workingHours: {
                    start: '09:00',
                    end: '18:00'
                },
                emergencyContact: {
                    name: 'Maria Delivery',
                    phone: '+39 340 9999999'
                }
            },
            {
                email: 'rider2@eudora.com',
                password: 'rider123',
                role: 'rider',
                firstName: 'Anna',
                lastName: 'Express',
                phone: '+39 341 2222222',
                address: 'Via Roma 45, 00100 Roma (RM)',
                vehicleType: 'bike',
                vehicle: 'Bicicletta Elettrica',
                vehiclePlate: 'BK001',
                workingZones: ['00100', '00101', '00102'],
                zone: 'Centro Roma',
                isAvailable: true,
                isActive: true,
                rating: 4.9,
                licenseNumber: 'DL987654321',
                workingHours: {
                    start: '08:00',
                    end: '17:00'
                },
                emergencyContact: {
                    name: 'Giuseppe Express',
                    phone: '+39 341 8888888'
                }
            },
            {
                email: 'rider3@eudora.com',
                password: 'rider123',
                role: 'rider',
                firstName: 'Luca',
                lastName: 'Fast',
                phone: '+39 342 3333333',
                address: 'Via Napoli 78, 80100 Napoli (NA)',
                vehicleType: 'car',
                vehicle: 'Auto Volkswagen',
                vehiclePlate: 'EF456GH',
                workingZones: ['80100', '80121', '80122'],
                zone: 'Centro Napoli',
                isAvailable: false,
                isActive: true,
                rating: 4.7,
                licenseNumber: 'DL456789123',
                workingHours: {
                    start: '10:00',
                    end: '19:00'
                },
                emergencyContact: {
                    name: 'Francesca Fast',
                    phone: '+39 342 7777777'
                }
            }
        ];

        riders.forEach(rider => {
            try {
                Database.createUser(rider);
            } catch (e) { /* User already exists */ }
        });

        console.log('👥 Sample users created');
    },

    createSampleProducts() {
        console.log('💊 Creating sample products...');

        const pharmacies = Database.getUsersByRole('pharmacy');
        
        if (pharmacies.length === 0) {
            console.warn('⚠️ No pharmacies found, skipping product creation');
            return;
        }

        const productCategories = [
            {
                category: 'analgesici',
                name: 'Analgesici e Antinfiammatori',
                products: [
                    {
                        name: 'Paracetamolo 500mg',
                        description: 'Analgesico e antipiretico',
                        price: 4.50,
                        requiresPrescription: false,
                        stock: 50,
                        imageUrl: '/images/paracetamolo.jpg'
                    },
                    {
                        name: 'Ibuprofene 400mg',
                        description: 'Antinfiammatorio non steroideo',
                        price: 6.80,
                        requiresPrescription: false,
                        stock: 35,
                        imageUrl: '/images/ibuprofene.jpg'
                    },
                    {
                        name: 'Aspirina 500mg',
                        description: 'Acido acetilsalicilico',
                        price: 3.90,
                        requiresPrescription: false,
                        stock: 42,
                        imageUrl: '/images/aspirina.jpg'
                    }
                ]
            },
            {
                category: 'antibiotici',
                name: 'Antibiotici',
                products: [
                    {
                        name: 'Amoxicillina 875mg',
                        description: 'Antibiotico penicillinico',
                        price: 12.50,
                        requiresPrescription: true,
                        stock: 20,
                        imageUrl: '/images/amoxicillina.jpg'
                    },
                    {
                        name: 'Azitromicina 500mg',
                        description: 'Antibiotico macrolide',
                        price: 15.30,
                        requiresPrescription: true,
                        stock: 15,
                        imageUrl: '/images/azitromicina.jpg'
                    }
                ]
            },
            {
                category: 'vitamine',
                name: 'Vitamine e Integratori',
                products: [
                    {
                        name: 'Vitamina C 1000mg',
                        description: 'Integratore di acido ascorbico',
                        price: 8.90,
                        requiresPrescription: false,
                        stock: 60,
                        imageUrl: '/images/vitamina-c.jpg'
                    },
                    {
                        name: 'Vitamina D3 2000UI',
                        description: 'Integratore di colecalciferolo',
                        price: 12.40,
                        requiresPrescription: false,
                        stock: 40,
                        imageUrl: '/images/vitamina-d3.jpg'
                    },
                    {
                        name: 'Multivitaminico Completo',
                        description: 'Complesso multivitaminico e minerale',
                        price: 18.50,
                        requiresPrescription: false,
                        stock: 25,
                        imageUrl: '/images/multivitaminico.jpg'
                    }
                ]
            },
            {
                category: 'cosmetica',
                name: 'Cosmetica e Igiene',
                products: [
                    {
                        name: 'Crema Idratante Viso',
                        description: 'Crema idratante per tutti i tipi di pelle',
                        price: 15.90,
                        requiresPrescription: false,
                        stock: 30,
                        imageUrl: '/images/crema-viso.jpg'
                    },
                    {
                        name: 'Detergente Intimo Delicato',
                        description: 'pH fisiologico con estratti naturali',
                        price: 7.50,
                        requiresPrescription: false,
                        stock: 45,
                        imageUrl: '/images/detergente-intimo.jpg'
                    },
                    {
                        name: 'Protezione Solare SPF 50+',
                        description: 'Crema solare ad alta protezione',
                        price: 22.90,
                        requiresPrescription: false,
                        stock: 20,
                        imageUrl: '/images/protezione-solare.jpg'
                    }
                ]
            },
            {
                category: 'medicazioni',
                name: 'Medicazioni e Dispositivi',
                products: [
                    {
                        name: 'Cerotti Assortiti',
                        description: 'Confezione cerotti varie misure',
                        price: 3.20,
                        requiresPrescription: false,
                        stock: 80,
                        imageUrl: '/images/cerotti.jpg'
                    },
                    {
                        name: 'Termometro Digitale',
                        description: 'Termometro digitale veloce e preciso',
                        price: 12.90,
                        requiresPrescription: false,
                        stock: 15,
                        imageUrl: '/images/termometro.jpg'
                    },
                    {
                        name: 'Bende Elastiche',
                        description: 'Bende elastiche autoadesive',
                        price: 5.60,
                        requiresPrescription: false,
                        stock: 25,
                        imageUrl: '/images/bende.jpg'
                    }
                ]
            }
        ];

        // Crea prodotti per ogni farmacia
        pharmacies.forEach(pharmacy => {
            productCategories.forEach(category => {
                category.products.forEach(productData => {
                    try {
                        Database.createProduct({
                            ...productData,
                            category: category.category,
                            categoryName: category.name,
                            pharmacyId: pharmacy.id,
                            pharmacyName: pharmacy.businessName,
                            sku: this.generateSku(category.category, productData.name),
                            manufacturer: this.getRandomManufacturer(),
                            expiryDate: this.getRandomExpiryDate(),
                            batchNumber: this.generateBatchNumber()
                        });
                    } catch (e) {
                        console.warn('Product already exists:', productData.name);
                    }
                });
            });
        });

        console.log('💊 Sample products created');
    },

    createSampleOrders() {
        console.log('📦 Creating sample orders...');

        const customers = Database.getUsersByRole('customer');
        const pharmacies = Database.getUsersByRole('pharmacy');
        const riders = Database.getUsersByRole('rider');

        if (customers.length === 0 || pharmacies.length === 0) {
            console.warn('⚠️ No customers or pharmacies found, skipping order creation');
            return;
        }

        const orderStatuses = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
        
        // Crea 15 ordini di esempio
        for (let i = 0; i < 15; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const pharmacy = pharmacies[Math.floor(Math.random() * pharmacies.length)];
            const products = Database.getProducts({ pharmacyId: pharmacy.id });
            
            if (products.length === 0) continue;

            // Seleziona 1-4 prodotti casuali
            const orderItems = [];
            const numItems = Math.floor(Math.random() * 4) + 1;
            
            for (let j = 0; j < numItems; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 3) + 1;
                
                if (!orderItems.find(item => item.productId === product.id)) {
                    orderItems.push({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: quantity,
                        requiresPrescription: product.requiresPrescription
                    });
                }
            }

            const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const deliveryFee = 2.50;
            const grandTotal = total + deliveryFee;

            // Status casuale ma realistico (più ordini recenti)
            let status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
            if (Math.random() < 0.4) status = 'pending'; // 40% pending
            if (Math.random() < 0.3) status = 'delivered'; // 30% delivered

            const orderDate = new Date();
            orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30)); // Ultimi 30 giorni

            try {
                const order = Database.createOrder({
                    customerId: customer.id,
                    customerName: `${customer.firstName} ${customer.lastName}`,
                    customerPhone: customer.phone,
                    pharmacyId: pharmacy.id,
                    pharmacyName: pharmacy.businessName,
                    items: orderItems,
                    subtotal: total,
                    deliveryFee: deliveryFee,
                    total: grandTotal,
                    status: status,
                    deliveryAddress: customer.addresses?.[0] || {
                        street: 'Via di Prova 123',
                        city: 'Milano',
                        zipCode: '20100'
                    },
                    paymentMethod: customer.paymentMethods?.[0] || { type: 'cash' },
                    notes: i % 3 === 0 ? 'Suonare al citofono' : '',
                    riderId: status === 'picked_up' || status === 'delivered' ? 
                        riders[Math.floor(Math.random() * riders.length)]?.id : null,
                    createdAt: orderDate.toISOString()
                });

                // Aggiungi timestamps per ordini con status avanzato
                if (status !== 'pending') {
                    const updates = {};
                    if (status === 'accepted' || status === 'preparing' || status === 'ready' || 
                        status === 'picked_up' || status === 'delivered') {
                        updates.acceptedAt = new Date(orderDate.getTime() + 5 * 60000).toISOString();
                    }
                    if (status === 'preparing' || status === 'ready' || 
                        status === 'picked_up' || status === 'delivered') {
                        updates.preparingAt = new Date(orderDate.getTime() + 15 * 60000).toISOString();
                    }
                    if (status === 'ready' || status === 'picked_up' || status === 'delivered') {
                        updates.readyAt = new Date(orderDate.getTime() + 45 * 60000).toISOString();
                    }
                    if (status === 'picked_up' || status === 'delivered') {
                        updates.pickedUpAt = new Date(orderDate.getTime() + 60 * 60000).toISOString();
                    }
                    if (status === 'delivered') {
                        updates.deliveredAt = new Date(orderDate.getTime() + 90 * 60000).toISOString();
                    }
                    
                    if (Object.keys(updates).length > 0) {
                        Database.updateOrder(order.id, updates);
                    }
                }

            } catch (e) {
                console.error('Error creating sample order:', e);
            }
        }

        console.log('📦 Sample orders created');
    },

    // Utility functions
    generateSku(category, productName) {
        const categoryCode = category.substr(0, 3).toUpperCase();
        const nameCode = productName.replace(/\s+/g, '').substr(0, 5).toUpperCase();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${categoryCode}${nameCode}${random}`;
    },

    getRandomManufacturer() {
        const manufacturers = [
            'Pfizer', 'Johnson & Johnson', 'Roche', 'Novartis', 'Merck',
            'Sanofi', 'AbbVie', 'Gilead', 'Amgen', 'Bristol Myers'
        ];
        return manufacturers[Math.floor(Math.random() * manufacturers.length)];
    },

    getRandomExpiryDate() {
        const date = new Date();
        date.setMonth(date.getMonth() + Math.floor(Math.random() * 24) + 6); // 6-30 mesi
        return date.toISOString().split('T')[0];
    },

    generateBatchNumber() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let batch = '';
        
        // 2 lettere + 4 numeri
        for (let i = 0; i < 2; i++) {
            batch += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 4; i++) {
            batch += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        
        return batch;
    }
};

// Esponi SampleData globalmente
window.SampleData = SampleData;

console.log('🎭 Sample Data module loaded');
