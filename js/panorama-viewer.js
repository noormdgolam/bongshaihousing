
document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.faux-panorama-container');
    
    containers.forEach(container => {
        const track = container.querySelector('.faux-panorama-track');
        let isDown = false;
        let startX;
        let scrollLeft;
        let animationId;
        
        // Clone the children a few times to create infinite scroll effect
        const cloneAmount = 2; // Clone the set of images 2 times
        const originalChildren = Array.from(track.children);
        
        for (let i = 0; i < cloneAmount; i++) {
            originalChildren.forEach(child => {
                const clone = child.cloneNode(true);
                track.appendChild(clone);
            });
        }
        
        // Wait for images to load to calculate width
        window.addEventListener('load', () => {
            const singleSetWidth = originalChildren.reduce((acc, el) => acc + el.offsetWidth, 0);
            
            // Start in the middle
            container.scrollLeft = singleSetWidth;
            
            const checkScroll = () => {
                if (container.scrollLeft <= 0) {
                    container.scrollLeft = singleSetWidth;
                } else if (container.scrollLeft >= singleSetWidth * 2) {
                    container.scrollLeft = singleSetWidth;
                }
            };
            
            container.addEventListener('scroll', checkScroll);
        });

        // Mouse Events
        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.classList.add('active');
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            cancelAnimationFrame(animationId);
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.classList.remove('active');
        });

        container.addEventListener('mouseup', () => {
            isDown = false;
            container.classList.remove('active');
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 1.5; // Scroll speed
            container.scrollLeft = scrollLeft - walk;
        });

        // Touch Events
        container.addEventListener('touchstart', (e) => {
            isDown = true;
            startX = e.touches[0].pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            cancelAnimationFrame(animationId);
        });

        container.addEventListener('touchend', () => {
            isDown = false;
        });

        container.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            // No prevent default to allow vertical scroll if necessary, but we might want to block it
            // if dragging horizontally significantly.
            const x = e.touches[0].pageX - container.offsetLeft;
            const walk = (x - startX) * 1.5;
            container.scrollLeft = scrollLeft - walk;
        }, { passive: true });
        
    });
});
