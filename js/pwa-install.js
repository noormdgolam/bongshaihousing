let deferredPrompt;

// Catch the event as early as possible
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome from automatically showing the default infobar
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show your custom install popup/banner if it's already in the DOM
  const installBanner = document.getElementById('custom-install-banner');
  if (installBanner) {
    installBanner.style.display = 'block';
  }
});

// Inject the install banner into the DOM when ready
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('custom-install-banner')) {
    const banner = document.createElement('div');
    banner.id = 'custom-install-banner';
    banner.innerHTML = `
      <div class="install-banner-content">
        <div class="install-banner-text">
          <strong>Install Bongshai Housing App</strong>
          <span>Get quick access to our properties and prefab housing!</span>
        </div>
        <button id="install-pwa-btn" class="btn btn-primary" style="padding: 8px 16px; font-size: 0.9rem;">Install</button>
        <button id="close-pwa-btn" aria-label="Close" style="background:none; border:none; color:inherit; cursor:pointer; padding: 5px; margin-left: 10px; font-size: 1.2rem;">&times;</button>
      </div>
    `;
    document.body.appendChild(banner);
    
    document.getElementById('close-pwa-btn').addEventListener('click', () => {
      document.getElementById('custom-install-banner').style.display = 'none';
    });
  }

  const installBanner = document.getElementById('custom-install-banner');
  const installButton = document.getElementById('install-pwa-btn');

  // If the event already fired before DOMContentLoaded, show the banner now
  if (deferredPrompt && installBanner) {
    installBanner.style.display = 'block';
  }

  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      // Clear the saved prompt
      deferredPrompt = null;
      installBanner.style.display = 'none';
    });
  }
});
