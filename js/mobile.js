"use strict";

export const MobileHandler = {
    isMobile: false,
    sidebarOpen: false,
    touchStartX: 0,
    touchStartY: 0,
    backdrop: null,
    backdropClickHandler: null,
    
    init() {
        this.checkMobile();
        this.createBackdrop();
        this.setupSidebarToggle();
        this.setupTouchGestures();
        this.setupClickOutside();
        this.setupResizeHandler();
        this.setupKeyboardHandling();
        this.setupFloatingButtons();
    },

    checkMobile() {
        this.isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile', this.isMobile);
    },

    createBackdrop() {
        try {
            // Create backdrop element
            this.backdrop = document.createElement('div');
            this.backdrop.className = 'sidebar-backdrop';
            document.body.appendChild(this.backdrop);
            
            // Remove existing handler if any
            if (this.backdropClickHandler) {
                this.backdrop.removeEventListener('click', this.backdropClickHandler);
            }
            
            // Add click handler to backdrop
            this.backdropClickHandler = () => {
                this.closeSidebar();
            };
            
            this.backdrop.addEventListener('click', this.backdropClickHandler);
        } catch (error) {
            console.error("Error creating backdrop:", error);
        }
    },

    setupSidebarToggle() {
        try {
            const toggleBtn = document.getElementById("mobile-sidebar-toggle");
            const sidebar = document.querySelector(".sidebar");
            
            if (!toggleBtn || !sidebar) return;

            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSidebar();
            });
        } catch (error) {
            console.error("Error setting up sidebar toggle:", error);
        }
    },

    toggleSidebar() {
        try {
            const sidebar = document.querySelector(".sidebar");
            const mainContent = document.querySelector(".main-content");
            const floatingActions = document.getElementById("floating-actions");
            if (!sidebar || !mainContent) return;

            this.sidebarOpen = !this.sidebarOpen;
            
            // Force a reflow to ensure the animation triggers
            if (this.sidebarOpen) {
                sidebar.style.display = 'flex';
                // Force reflow
                sidebar.offsetHeight;
                sidebar.classList.add("open");
            } else {
                sidebar.classList.remove("open");
            }
            
            // Toggle backdrop and blur with slight delay for smooth animation
            if (this.backdrop) {
                if (this.sidebarOpen) {
                    this.backdrop.classList.add("active");
                } else {
                    this.backdrop.classList.remove("active");
                }
            }
            
            mainContent.classList.toggle("blurred", this.sidebarOpen);
            
            // Hide/show floating buttons
            if (floatingActions) {
                floatingActions.classList.toggle("sidebar-open", this.sidebarOpen);
            }
            
            // Update toggle button appearance
            const toggleBtn = document.getElementById("mobile-sidebar-toggle");
            if (toggleBtn) {
                toggleBtn.classList.toggle("active", this.sidebarOpen);
            }

            // Prevent body scroll when sidebar is open
            document.body.style.overflow = this.sidebarOpen ? 'hidden' : '';
        } catch (error) {
            console.error("Error toggling sidebar:", error);
        }
    },

    closeSidebar() {
        try {
            const sidebar = document.querySelector(".sidebar");
            const mainContent = document.querySelector(".main-content");
            const floatingActions = document.getElementById("floating-actions");
            if (!sidebar || !this.sidebarOpen) return;

            this.sidebarOpen = false;
            sidebar.classList.remove("open");
            
            // Remove backdrop and blur
            if (this.backdrop) {
                this.backdrop.classList.remove("active");
            }
            if (mainContent) {
                mainContent.classList.remove("blurred");
            }
            
            // Show floating buttons
            if (floatingActions) {
                floatingActions.classList.remove("sidebar-open");
            }
            
            document.body.style.overflow = '';
            
            const toggleBtn = document.getElementById("mobile-sidebar-toggle");
            if (toggleBtn) {
                toggleBtn.classList.remove("active");
            }
            
            // Hide sidebar after animation completes
            setTimeout(() => {
                if (!this.sidebarOpen) {
                    sidebar.style.display = '';
                }
            }, 400); // Match animation duration
        } catch (error) {
            console.error("Error closing sidebar:", error);
        }
    },

    setupTouchGestures() {
        if (!this.isMobile) return;

        try {
            // Swipe to open/close sidebar
            document.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            }, { passive: true });

            document.addEventListener('touchmove', (e) => {
                if (!this.sidebarOpen) return;
                
                const touchX = e.touches[0].clientX;
                const diffX = this.touchStartX - touchX;
                
                // Close sidebar on swipe left
                if (diffX > 50 && Math.abs(e.touches[0].clientY - this.touchStartY) < 100) {
                    this.closeSidebar();
                }
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const diffX = touchEndX - this.touchStartX;
                
                // Open sidebar on swipe right from left edge
                if (!this.sidebarOpen && this.touchStartX < 50 && diffX > 100) {
                    this.toggleSidebar();
                }
            }, { passive: true });
        } catch (error) {
            console.error("Error setting up touch gestures:", error);
        }
    },

    setupClickOutside() {
        try {
            document.addEventListener('click', (e) => {
                if (!this.isMobile || !this.sidebarOpen) return;

                const sidebar = document.querySelector(".sidebar");
                const toggleBtn = document.getElementById("mobile-sidebar-toggle");
                
                if (!sidebar || !toggleBtn) return;

                // Close sidebar if clicking on backdrop or outside
                if (e.target === this.backdrop || 
                    (!sidebar.contains(e.target) && 
                    !toggleBtn.contains(e.target) && 
                    !e.target.closest(".menu-btn"))) {
                    this.closeSidebar();
                }
            });
        } catch (error) {
            console.error("Error setting up click outside handler:", error);
        }
    },

    setupResizeHandler() {
        try {
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    const wasMobile = this.isMobile;
                    this.checkMobile();
                    
                    // Close sidebar when switching from mobile to desktop
                    if (wasMobile && !this.isMobile && this.sidebarOpen) {
                        this.closeSidebar();
                    }
                }, 150);
            });
        } catch (error) {
            console.error("Error setting up resize handler:", error);
        }
    },

    setupKeyboardHandling() {
        try {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.sidebarOpen) {
                    this.closeSidebar();
                }
            });
        } catch (error) {
            console.error("Error setting up keyboard handling:", error);
        }
    },

    setupFloatingButtons() {
        try {
            const mobileCopyBtn = document.getElementById("mobile-copy-btn");
            const mobileExportBtn = document.getElementById("mobile-export-btn");
            
            if (mobileCopyBtn) {
                mobileCopyBtn.addEventListener('click', () => {
                    try {
                        if (typeof copyTranslation === 'function') {
                            copyTranslation();
                            this.showFloatingButtonFeedback(mobileCopyBtn, 'success');
                        }
                    } catch (error) {
                        console.error("Error copying translation:", error);
                    }
                });
            }
            
            if (mobileExportBtn) {
                mobileExportBtn.addEventListener('click', () => {
                    try {
                        if (typeof exportDocumentToPDF === 'function') {
                            exportDocumentToPDF();
                        }
                    } catch (error) {
                        console.error("Error exporting PDF:", error);
                    }
                });
            }
        } catch (error) {
            console.error("Error setting up floating buttons:", error);
        }
    },

    showFloatingButtonFeedback(button, type) {
        try {
            const originalClass = button.className;
            button.classList.add(type);
            
            setTimeout(() => {
                button.className = originalClass;
            }, 2000);
        } catch (error) {
            console.error("Error showing button feedback:", error);
        }
    },

    // Public methods for other modules to use
    isSidebarOpen() {
        return this.sidebarOpen;
    },

    isMobileDevice() {
        return this.isMobile;
    },

    // Handle orientation changes
    handleOrientationChange() {
        try {
            setTimeout(() => {
                this.checkMobile();
                if (this.sidebarOpen && !this.isMobile) {
                    this.closeSidebar();
                }
            }, 100);
        } catch (error) {
            console.error("Error handling orientation change:", error);
        }
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileHandler.init());
} else {
    MobileHandler.init();
}

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    MobileHandler.handleOrientationChange();
});

// Export for use in other modules
window.MobileHandler = MobileHandler;
