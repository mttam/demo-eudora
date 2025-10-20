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
                    }
                ]
            },
            googleForms: {
                mainOrder: "#",
                riderApplication: "#",
                partnerApplication: "#"
            },
            deliveryZones: [],
            faqs: [],
            products: { categories: [] }
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
        if (!container || !this.data.products?.categories) return;

        const categoriesHTML = this.data.products.categories.map(category => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div class="bg-gradient-to-r from-${category.color}-500 to-${category.color}-600 p-6 text-white">
                    <div class="flex items-center">
                        <i class="${category.icon} text-2xl mr-3"></i>
                        <div>
                            <h3 class="text-xl font-bold">${category.name}</h3>
                            <p class="text-${category.color}-100 mt-1">${category.description}</p>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    ${category.products.map(product => `
                        <div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                            <div class="flex-1">
                                <h4 class="font-semibold text-gray-900">${product.name}</h4>
                                <p class="text-sm text-gray-600 mt-1">${product.description}</p>
                            </div>
                            <div class="text-right ml-4">
                                <span class="text-xl font-bold text-${category.color}-600">€${product.price.toFixed(2)}</span>
                            </div>
                        </div>
                    `).join('')}
                    <button onclick="this.orderProduct('${category.id}')" 
                            class="w-full mt-4 bg-${category.color}-600 hover:bg-${category.color}-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300">
                        <i class="fas fa-shopping-cart mr-2"></i>
                        Ordina ${category.name}
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = categoriesHTML;
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
        const orderUrl = this.data.googleForms.mainOrder + `&entry.category=${categoryId}`;
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
window.orderProduct = (categoryId) => app.orderProduct(categoryId);
window.scrollToTop = WaterDeliveryApp.scrollToTop;