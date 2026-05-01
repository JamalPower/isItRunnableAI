// Plexus Background Animation
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('geometricBackground');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let animationFrameId;
    
    // Configuration
    const maxDistance = 150;
    
    // Mouse interaction
    let mouse = {
        x: null,
        y: null,
        radius: 200
    };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });
    
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Debounce Resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
            initParticles();
        }, 200);
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            // Velocity
            this.vx = (Math.random() - 0.5) * 1.2;
            this.vy = (Math.random() - 0.5) * 1.2;
            this.radius = Math.random() * 2 + 1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
            ctx.fill();
        }

        update() {
            // Screen boundaries
            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

            this.x += this.vx;
            this.y += this.vy;

            // Mathematical processing to calculate vectors for mouse interaction
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    // Force gets stronger closer to the mouse
                    const force = (mouse.radius - distance) / mouse.radius;
                    const directionX = forceDirectionX * force * 1.5;
                    const directionY = forceDirectionY * force * 1.5;
                    
                    this.x -= directionX;
                    this.y -= directionY;
                }
            }
        }
    }

    // Initialize particles based on screen size
    function initParticles() {
        particles = [];
        // Ensure efficient system resource consumption
        const numParticles = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 12000), 120);
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    }

    // Dynamic grid-linking algorithm
    function connect() {
        let opacityValue = 1;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    opacityValue = 1 - (distance / maxDistance);
                    ctx.strokeStyle = `rgba(59, 130, 246, ${opacityValue * 0.4})`; // Matches design accent
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        // Clear frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        connect();
        
        // requestAnimationFrame for optimized performance
        animationFrameId = requestAnimationFrame(animate);
    }

    // Setup
    resizeCanvas();
    initParticles();
    animate();
});
