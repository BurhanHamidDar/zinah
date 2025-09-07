// Standalone Hero Slideshow Script
// This restores the slideshow functionality if the main app.js is having issues

document.addEventListener('DOMContentLoaded', function() {
    initializeSlideshow();
});

function initializeSlideshow() {
    console.log('🎬 Initializing standalone slideshow...');
    
    const slideshow = {
        currentSlide: 0,
        slides: null,
        indicators: null,
        autoPlayInterval: null,
        autoPlayDelay: 4000
    };

    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
        setupSlideshow();
    }, 100);

    function setupSlideshow() {
        slideshow.slides = document.querySelectorAll('#hero-slideshow .slide');
        slideshow.indicators = document.querySelectorAll('#hero-slideshow .indicator');
        
        if (!slideshow.slides || slideshow.slides.length === 0) {
            console.log('❌ No slideshow slides found');
            return;
        }
        
        console.log('✅ Found', slideshow.slides.length, 'slides');
        
        // Initialize first slide as active
        slideshow.slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === 0);
        });
        
        slideshow.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === 0);
        });
        
        // Setup controls
        setupControls();
        
        // Start auto-play
        setTimeout(() => {
            startAutoPlay();
            console.log('✅ Slideshow auto-play started');
        }, 1000);
    }

    function setupControls() {
        // Navigation buttons
        const prevBtn = document.getElementById('prev-slide');
        const nextBtn = document.getElementById('next-slide');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                goToPreviousSlide();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                goToNextSlide();
            });
        }
        
        // Indicator clicks
        slideshow.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                goToSlide(index);
            });
        });
        
        // Hover pause/resume
        const slideshowContainer = document.getElementById('hero-slideshow');
        if (slideshowContainer) {
            slideshowContainer.addEventListener('mouseenter', () => {
                pauseAutoPlay();
            });
            
            slideshowContainer.addEventListener('mouseleave', () => {
                startAutoPlay();
            });
        }
    }

    function goToSlide(slideIndex) {
        if (!slideshow.slides || slideshow.slides.length === 0) {
            return;
        }
        
        console.log('🎢 Going to slide', slideIndex + 1);
        
        // Remove active from current
        slideshow.slides[slideshow.currentSlide]?.classList.remove('active');
        slideshow.indicators[slideshow.currentSlide]?.classList.remove('active');
        
        // Update current slide
        slideshow.currentSlide = slideIndex;
        
        // Add active to new
        slideshow.slides[slideshow.currentSlide]?.classList.add('active');
        slideshow.indicators[slideshow.currentSlide]?.classList.add('active');
    }

    function goToNextSlide() {
        const nextIndex = (slideshow.currentSlide + 1) % slideshow.slides.length;
        goToSlide(nextIndex);
    }

    function goToPreviousSlide() {
        const prevIndex = (slideshow.currentSlide - 1 + slideshow.slides.length) % slideshow.slides.length;
        goToSlide(prevIndex);
    }

    function startAutoPlay() {
        if (!slideshow.slides || slideshow.slides.length === 0) {
            return;
        }
        
        pauseAutoPlay(); // Clear any existing interval
        
        slideshow.autoPlayInterval = setInterval(() => {
            console.log('⏰ Auto-advancing slideshow...');
            goToNextSlide();
        }, slideshow.autoPlayDelay);
    }

    function pauseAutoPlay() {
        if (slideshow.autoPlayInterval) {
            clearInterval(slideshow.autoPlayInterval);
            slideshow.autoPlayInterval = null;
        }
    }
}
