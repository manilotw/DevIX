// ==================== PARTICLES SYSTEM ====================
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');

let particles = [];
let animationId;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // Draw connections
    particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 120)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        });
    });

    animationId = requestAnimationFrame(animateParticles);
}

// Initialize particles
window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
});

resizeCanvas();
initParticles();
animateParticles();

// ==================== SCROLL ANIMATIONS ====================
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
};

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.fade-in, .advanced-mockup');
    fadeElements.forEach(el => fadeObserver.observe(el));
});

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ==================== STICKY HEADER SCROLL EFFECT ====================
const header = document.querySelector('.sticky-header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.background = 'rgba(0, 0, 0, 0.95)';
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
        header.style.background = 'rgba(0, 0, 0, 0.8)';
        header.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// ==================== PARALLAX GLOW EFFECT ====================
const purpleGlows = document.querySelectorAll('.purple-glow');

document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    purpleGlows.forEach((glow, index) => {
        const speed = (index + 1) * 0.015;
        const x = (mouseX - window.innerWidth / 2) * speed;
        const y = (mouseY - window.innerHeight / 2) * speed;

        glow.style.transform = `translate(${x}px, ${y}px)`;
    });
});

// ==================== HERO PARALLAX ====================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');

    if (heroContent && scrolled < window.innerHeight) {
        const translateY = scrolled * 0.3;
        const opacity = 1 - (scrolled / window.innerHeight * 0.8);

        heroContent.style.transform = `translateY(${translateY}px)`;
        heroContent.style.opacity = opacity;
    }
});

// ==================== 3D GRID PERSPECTIVE ====================
const perspectiveGrid = document.querySelector('.perspective-grid');

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const rotation = Math.min(60 + (scrolled * 0.01), 70);

    if (perspectiveGrid) {
        perspectiveGrid.style.transform = `perspective(500px) rotateX(${rotation}deg)`;
    }
});

// ==================== FAQ ACCORDION ====================
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all items
            faqItems.forEach(i => i.classList.remove('active'));

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
});

// ==================== FLOATING ANIMATION TRIGGER ====================
const floatingElements = document.querySelectorAll('.float-animation');

floatingElements.forEach((el, index) => {
    el.style.animationDelay = `${index * 0.2}s`;
});

// ==================== MOCKUP TAB INTERACTION ====================
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.mockup-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
});

// ==================== INTERACTIVE HOVER EFFECTS ====================
const metricCards = document.querySelectorAll('.metric-card-advanced');

metricCards.forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateX(8px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
        this.style.transform = 'translateX(0) scale(1)';
    });
});

// ==================== TABLE ROW HIGHLIGHT ====================
const tableRows = document.querySelectorAll('.table-row');

tableRows.forEach(row => {
    row.addEventListener('click', function () {
        tableRows.forEach(r => r.style.background = 'transparent');
        this.style.background = 'rgba(255, 255, 255, 0.05)';
    });
});

// ==================== BACKLINK ITEM INTERACTION ====================
const backlinkItems = document.querySelectorAll('.backlink-item');

backlinkItems.forEach(item => {
    item.addEventListener('click', function () {
        const domain = this.querySelector('.domain-name').textContent;
        console.log(`Clicked on backlink from: ${domain}`);
        // Could trigger a modal or expand details here
    });
});

// ==================== PERFORMANCE OPTIMIZATION ====================
let scrollTimeout;
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            // Perform scroll-based calculations here
            ticking = false;
        });

        ticking = true;
    }
}, { passive: true });

// ==================== CONSOLE BRANDING ====================
console.log('%c AmirzhanFree ', 'background: linear-gradient(135deg, #ffffff, #a3a3a3); color: #000; font-size: 24px; padding: 12px; font-weight: bold; border-radius: 8px;');
console.log('%c New Era of Digital Research 🚀', 'color: #ffffff; font-size: 16px; font-weight: 600;');
console.log('%c Powered by AI • Built for Performance', 'color: #666; font-size: 12px;');

// ==================== EASTER EGG ====================
let konami = [];
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konami.push(e.key);
    konami = konami.slice(-konamiCode.length);

    if (konami.join('') === konamiCode.join('')) {
        document.body.style.animation = 'rainbow 2s infinite';
        setTimeout(() => {
            document.body.style.animation = '';
            alert('🎉 You found the secret! AmirzhanFree Developer Mode Activated!');
        }, 2000);
    }
});

// ==================== PAGE LOAD ANALYTICS (MOCK) ====================
window.addEventListener('load', () => {
    console.log('📊 Page loaded in:', performance.now().toFixed(2), 'ms');
    console.log('🎨 Particles initialized:', particles.length);
    console.log('✨ All animations ready!');
});
