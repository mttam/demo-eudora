// landing-page-water.js - Water Delivery Landing Page Functionality
class WaterDeliveryApp {
    constructor() {
        this.data = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderBenefits();
        this.renderWorkWithUs();
        this.renderProducts();
        this.renderFAQ();
        this.setupDeliveryZoneChecker();
        this.setupSmoothScrolling();
        this.setupMobileMenu();
        this.setupFormTracking();
    }

    async loadData() {
        try {
            const response = await fetch('./data-water.json');
            this.data = await response.json();
            
            // If data doesn't have the structure we need, add fallback sections
            if (!this.data.benefitsSection) {
                this.data.benefitsSection = this.getFallbackData().benefitsSection;
            }
            if (!this.data.googleForms) {
                this.data.googleForms = this.getFallbackData().googleForms;
            }
            if (!this.data.workWithUsSection) {
                this.data.workWithUsSection = this.getFallbackData().workWithUsSection;
            }
            if (!this.data.deliveryZones) {
                this.data.deliveryZones = this.getFallbackData().deliveryZones;
            }
            if (!this.data.faqs) {
                this.data.faqs = this.getFallbackData().faqs;
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback data if file doesn't exist
            this.data = this.getFallbackData();
        }
    }

    getFallbackData() {
        return {
            benefitsSection: {
                title: "I nostri servizi",
                subtitle: "Tutto quello che ti serve per la tua idratazione quotidiana",
                benefits: [
                    {
                        title: "Acqua di Qualità",
                        description: "Solo le migliori marche di acqua minerale italiana",
                        iconClass: "fas fa-tint",
                        iconColor: "text-blue-600",
                        bgColor: "bg-blue-100"
                    },
                    {
                        title: "Consegna Veloce",
                        description: "Consegna rapida e affidabile direttamente a casa tua",
                        iconClass: "fas fa-shipping-fast",
                        iconColor: "text-green-600",
                        bgColor: "bg-green-100"
                    },
                    {
                        title: "Prezzi Competitivi",
                        description: "I migliori prezzi del mercato per acqua di qualità",
                        iconClass: "fas fa-tag",
                        iconColor: "text-purple-600",
                        bgColor: "bg-purple-100"
                    }
                ]
            },
            googleForms: {
                mainOrder: "https://docs.google.com/forms/d/e/1FAIpQLSfKuCU98wOGXeUBkKjir0MkYulfVgjJhEaHZ1KseLhUEUjMrQ/viewform",
                riderApplication: "#",
                partnerApplication: "#",
                newsletter: "#"
            },
            deliveryZones: [
                {
                    city: "Roma",
                    areas: ["Centro", "Prati", "Trastevere"],
                    freeDeliveryMin: 25,
                    timeSlots: ["9:00-13:00", "14:00-18:00"]
                },
                {
                    city: "Milano",
                    areas: ["Centro", "Porta Romana", "Navigli"],
                    freeDeliveryMin: 25,
                    timeSlots: ["9:00-13:00", "14:00-18:00"]
                }
            ],
            faqs: [
                {
                    question: "Come funziona il servizio?",
                    answer: "Ordini online e consegniamo a casa tua."
                }
            ],
            workWithUsSection: {
                title: "Lavora con noi",
                subtitle: "Unisciti al nostro team",
                cards: [
                    {
                        title: "Diventa Rider",
                        description: "Consegna acqua e guadagna con flessibilità",
                        iconClass: "fas fa-motorcycle",
                        iconColor: "text-blue-600",
                        bgIconColor: "bg-blue-100",
                        titleColor: "text-blue-600",
                        borderColor: "border-blue-200",
                        buttonColor: "bg-blue-600",
                        buttonHover: "hover:bg-blue-700",
                        buttonText: "Candidati come Rider",
                        buttonUrl: "#"
                    }
                ]
            },
            products: []
        };
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });

        // CTA button tracking
        document.querySelectorAll('[data-action="order"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.trackEvent('order_button_clicked', { section: btn.closest('section')?.id || 'unknown' });
            });
        });

        // WhatsApp button tracking
        document.querySelectorAll('[data-action="whatsapp"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.trackEvent('whatsapp_clicked', { section: btn.closest('section')?.id || 'unknown' });
            });
        });
    }

    renderBenefits() {
        const container = document.getElementById('benefits-container');
        if (!container || !this.data.benefitsSection) return;

        const benefitsHTML = this.data.benefitsSection.benefits.map(benefit => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 ${benefit.bgColor} rounded-lg flex items-center justify-center">
                        <i class="${benefit.iconClass} text-xl ${benefit.iconColor}"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 ml-4">${benefit.title}</h3>
                </div>
                <p class="text-gray-600 leading-relaxed">${benefit.description}</p>
            </div>
        `).join('');

        container.innerHTML = benefitsHTML;
    }

    renderWorkWithUs() {
        const container = document.getElementById('work-with-us-container');
        if (!container || !this.data.workWithUsSection) return;

        const cardsHTML = this.data.workWithUsSection.cards.map(card => `
            <div class="bg-white rounded-xl shadow-sm border ${card.borderColor} p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div class="text-center">
                    <div class="w-16 h-16 ${card.bgIconColor} rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="${card.iconClass} text-2xl ${card.iconColor}"></i>
                    </div>
                    <h3 class="text-xl font-bold ${card.titleColor} mb-4">${card.title}</h3>
                    <p class="text-gray-600 mb-6 leading-relaxed">${card.description}</p>
                    <button onclick="window.open('${card.buttonUrl}', '_blank')" 
                            class="w-full ${card.buttonColor} ${card.buttonHover} text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300">
                        ${card.buttonText}
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = cardsHTML;
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        if (!container || !this.data.products) return;

        // Get products array and create cards
        const products = Array.isArray(this.data.products) ? this.data.products : [];
        
        if (products.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-600">Nessun prodotto disponibile</p>';
            return;
        }

        const productsHTML = products.map(product => {
            // Determine color scheme based on water type
            let colorScheme = {
                bg: 'bg-blue-100',
                text: 'text-blue-600',
                button: 'bg-blue-600',
                buttonHover: 'hover:bg-blue-700',
                icon: 'fas fa-tint'
            };

            if (product.type === 'effervescente' || product.type === 'gassata') {
                colorScheme = {
                    bg: 'bg-green-100',
                    text: 'text-green-600',
                    button: 'bg-green-600',
                    buttonHover: 'hover:bg-green-700',
                    icon: 'fas fa-wine-bottle'
                };
            }

            // Format type label
            const typeLabel = product.type.charAt(0).toUpperCase() + product.type.slice(1);

            // Build image path
            const imagePath = product.filename ? `./public/img_water/${product.filename}` : '';
            const imageHTML = imagePath ? 
                `<img src="${imagePath}" alt="${product.brand}" class="w-32 h-32 object-contain mx-auto mb-4" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div class="${colorScheme.bg} w-20 h-20 rounded-full items-center justify-center mx-auto mb-6" style="display: none;">
                    <i class="${colorScheme.icon} ${colorScheme.text} text-3xl"></i>
                 </div>` :
                `<div class="${colorScheme.bg} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="${colorScheme.icon} ${colorScheme.text} text-3xl"></i>
                 </div>`;

            return `
                <div class="product-card bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <div class="text-center">
                        ${imageHTML}
                        <h3 class="text-xl font-bold mb-2">${product.brand}</h3>
                        <p class="text-gray-600 mb-1 font-semibold">${product.size_label} - ${typeLabel}</p>
                        <p class="text-sm text-gray-500 mb-4">${product.pack_description}</p>
                        <div class="text-2xl font-bold ${colorScheme.text} mb-6">${product.price_text}</div>
                        <button onclick="openOrderForm('${product.id}')" 
                                class="w-full ${colorScheme.button} text-white py-3 rounded-lg font-medium ${colorScheme.buttonHover} transition">
                            Ordina Ora
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = productsHTML;
    }

    renderFAQ() {
        const container = document.getElementById('faq-container');
        if (!container || !this.data.faqs) return;

        const faqHTML = this.data.faqs.map((faq, index) => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button class="w-full text-left p-6 hover:bg-gray-50 transition-colors duration-300 faq-toggle" 
                        data-target="faq-answer-${index}">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-900 pr-4">${faq.question}</h3>
                        <i class="fas fa-chevron-down text-gray-400 transform transition-transform duration-300"></i>
                    </div>
                </button>
                <div id="faq-answer-${index}" class="hidden border-t border-gray-100">
                    <div class="p-6 bg-gray-50">
                        <p class="text-gray-700 leading-relaxed">${faq.answer}</p>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = faqHTML;

        // Setup FAQ toggles
        document.querySelectorAll('.faq-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const target = document.getElementById(toggle.dataset.target);
                const icon = toggle.querySelector('i');
                
                if (target.classList.contains('hidden')) {
                    target.classList.remove('hidden');
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    target.classList.add('hidden');
                    icon.style.transform = 'rotate(0deg)';
                }
            });
        });
    }

    setupDeliveryZoneChecker() {
        const input = document.getElementById('address-input');
        const button = document.getElementById('check-delivery-btn');
        const result = document.getElementById('delivery-result');

        if (!input || !button || !result) return;

        button.addEventListener('click', () => {
            const address = input.value.trim();
            if (!address) {
                this.showDeliveryResult('Inserisci un indirizzo per verificare la copertura', 'error');
                return;
            }

            this.checkDeliveryZone(address);
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                button.click();
            }
        });
    }

    checkDeliveryZone(address) {
        const result = document.getElementById('delivery-result');
        
        // Simulate checking delivery zones
        const addressLower = address.toLowerCase();
        const availableZone = this.data.deliveryZones.find(zone => 
            zone.city.toLowerCase() === addressLower || 
            zone.areas.some(area => addressLower.includes(area.toLowerCase()))
        );

        if (availableZone) {
            const freeDelivery = availableZone.freeDeliveryMin ? 
                `Consegna gratuita per ordini superiori a €${availableZone.freeDeliveryMin.toFixed(2)}` :
                'Consegna gratuita';
            
            this.showDeliveryResult(
                `✅ Consegniamo nella tua zona! ${freeDelivery}. Orari disponibili: ${availableZone.timeSlots.join(', ')}`,
                'success'
            );
        } else {
            this.showDeliveryResult(
                '❌ Al momento non consegniamo nella tua zona. Contattaci per verificare la disponibilità futura!',
                'warning'
            );
        }
    }

    showDeliveryResult(message, type) {
        const result = document.getElementById('delivery-result');
        const bgColor = {
            'success': 'bg-green-50 border-green-200 text-green-800',
            'error': 'bg-red-50 border-red-200 text-red-800',
            'warning': 'bg-yellow-50 border-yellow-200 text-yellow-800'
        };

        result.innerHTML = `
            <div class="p-4 rounded-lg border ${bgColor[type]} mt-4">
                ${message}
            </div>
        `;
    }

    orderProduct(categoryId) {
        const orderUrl = this.data.googleForms.mainOrder + (categoryId ? `?entry.product=${categoryId}` : '');
        window.open(orderUrl, '_blank');
        this.trackEvent('product_order_clicked', { category: categoryId });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupMobileMenu() {
        // Hamburger menu animation
        const menuButton = document.getElementById('mobile-menu-button');
        if (menuButton) {
            menuButton.addEventListener('click', function() {
                const spans = this.querySelectorAll('span');
                spans.forEach(span => span.classList.toggle('rotate-45'));
            });
        }
    }

    setupFormTracking() {
        // Track Google Forms opens
        document.querySelectorAll('a[href*="docs.google.com/forms"]').forEach(link => {
            link.addEventListener('click', () => {
                this.trackEvent('google_form_opened', { 
                    form_type: this.getFormType(link.href),
                    href: link.href 
                });
            });
        });
    }

    getFormType(url) {
        if (url.includes('MainOrder')) return 'main_order';
        if (url.includes('Rider')) return 'rider_application';
        if (url.includes('Partner')) return 'partner_application';
        if (url.includes('Support')) return 'customer_service';
        if (url.includes('Newsletter')) return 'newsletter';
        return 'unknown';
    }

    trackEvent(eventName, eventData = {}) {
        // Google Analytics tracking (if available)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        
        // Facebook Pixel tracking (if available)
        if (typeof fbq !== 'undefined') {
            fbq('track', eventName, eventData);
        }
        
        // Console log for development
        console.log('Event tracked:', eventName, eventData);
    }

    // Utility functions
    static formatPrice(price) {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    }

    static formatPhoneNumber(phone) {
        return phone.replace(/(\d{3})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
    }

    static scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Newsletter subscription
function subscribeNewsletter() {
    const email = document.getElementById('newsletter-email')?.value;
    if (!email) {
        alert('Inserisci un indirizzo email valido');
        return;
    }
    
    const newsletterUrl = app.data.googleForms.newsletter + `&entry.email=${encodeURIComponent(email)}`;
    window.open(newsletterUrl, '_blank');
    
    document.getElementById('newsletter-email').value = '';
    alert('Grazie! Ti abbiamo reindirizzato al modulo di iscrizione.');
}

// WhatsApp integration
function openWhatsApp(message = '') {
    const phone = '393500378569';
    const defaultMessage = 'Ciao! Sono interessato al vostro servizio di consegna acqua.';
    const finalMessage = message || defaultMessage;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(finalMessage)}`;
    window.open(url, '_blank');
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new WaterDeliveryApp();
    
    // Show scroll to top button after scrolling
    window.addEventListener('scroll', () => {
        const scrollBtn = document.getElementById('scroll-to-top');
        if (scrollBtn) {
            if (window.pageYOffset > 300) {
                scrollBtn.classList.remove('hidden');
            } else {
                scrollBtn.classList.add('hidden');
            }
        }
    });
});

// Global functions for inline event handlers
window.subscribeNewsletter = subscribeNewsletter;
window.openWhatsApp = openWhatsApp;
window.orderProduct = (categoryId) => {
    if (app && app.data && app.data.googleForms) {
        app.orderProduct(categoryId);
    } else {
        openOrderForm(categoryId);
    }
};
window.scrollToTop = WaterDeliveryApp.scrollToTop;
window.openOrderForm = (productId = '') => {
    let formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfKuCU98wOGXeUBkKjir0MkYulfVgjJhEaHZ1KseLhUEUjMrQ/viewform';
    
    if (productId) {
        formUrl += `?entry.product=${encodeURIComponent(productId)}`;
    }
    
    window.open(formUrl, '_blank');
};