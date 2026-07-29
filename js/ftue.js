// ftue.js - First Time User Experience

document.addEventListener('DOMContentLoaded', () => {
    const FTUE_KEY = 'bongshai_visited';
    const hasVisited = localStorage.getItem(FTUE_KEY);
    
    if (!hasVisited) {
        // Find the modal element
        const ftueModal = document.getElementById('ftue-modal');
        if (ftueModal) {
            // Show modal with a slight delay for better experience
            setTimeout(() => {
                ftueModal.classList.add('active');
            }, 1000);
            
            // Set flag so it never shows again
            localStorage.setItem(FTUE_KEY, 'true');
            
            // Close logic
            const closeBtn = ftueModal.querySelector('.ftue-close-btn');
            const ctaBtn = ftueModal.querySelector('.ftue-cta-btn');
            
            const closeModal = () => {
                ftueModal.classList.remove('active');
            };
            
            if(closeBtn) closeBtn.addEventListener('click', closeModal);
            if(ctaBtn) ctaBtn.addEventListener('click', closeModal);
            
            // Close on click outside
            ftueModal.addEventListener('click', (e) => {
                if (e.target === ftueModal) {
                    closeModal();
                }
            });
        }
    }
});
