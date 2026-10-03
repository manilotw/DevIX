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
// On phones the viewport height changes every time the address bar hides, so the
// particles are rebuilt only when the width changes; otherwise they would jump on scroll.
let particlesWidth = window.innerWidth;

window.addEventListener('resize', () => {
    const widthChanged = window.innerWidth !== particlesWidth;
    particlesWidth = window.innerWidth;
    resizeCanvas();
    if (widthChanged) {
        initParticles();
    }
});

resizeCanvas();
initParticles();

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // a still frame instead of the animation
    particles.forEach(particle => particle.draw());
} else {
    animateParticles();
}

// ==================== MOBILE MENU ====================
document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const burger = document.getElementById('burger');
    const menu = document.getElementById('headerMenu');

    if (!header || !burger || !menu) return;

    const compact = window.matchMedia('(max-width: 1199px)');

    function setOpen(open) {
        header.classList.toggle('is-open', open);
        document.body.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    burger.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!header.classList.contains('is-open'));
    });

    // "Услуги" opens as an accordion in the mobile menu
    menu.querySelectorAll('.nav__toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            if (compact.matches) {
                toggle.parentElement.classList.toggle('is-open');
            }
        });
    });

    // Close menu when clicking on links
    header.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setOpen(false));
    });

    // Close menu when clicking outside, on Escape and when the layout becomes desktop
    document.addEventListener('click', (e) => {
        if (!header.contains(e.target)) {
            setOpen(false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setOpen(false);
        }
    });

    compact.addEventListener('change', () => setOpen(false));
});

// ==================== ACTIVE NAV LINK ====================
function highlightActiveLink() {
    const currentPath = window.location.pathname.replace(/^\/(ru|en)(?=\/|$)/, '').replace(/\/$/, '');

    document.querySelectorAll('.nav > a').forEach(link => {
        const href = (link.getAttribute('href') || '').replace(/^\/(ru|en)(?=\/|$)/, '').replace(/\/$/, '');
        link.classList.toggle('active', href !== '' && !href.includes('#') && href === currentPath);
    });
}

document.addEventListener('DOMContentLoaded', highlightActiveLink);
window.addEventListener('pageshow', highlightActiveLink);

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
