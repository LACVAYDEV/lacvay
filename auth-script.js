// ========================================
// AUTH PAGE SCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Tab Switching
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form-container');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Update active form
            forms.forEach(form => form.classList.remove('active'));
            document.getElementById(`${tabName}-form`).classList.add('active');
        });
    });

    // Check URL parameter for initial tab
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');
    if (initialTab === 'signup') {
        const signupTab = document.querySelector('[data-tab="signup"]');
        if (signupTab) {
            signupTab.click();
        }
    }

    // Switch Tab Links (inside forms)
    const switchTabLinks = document.querySelectorAll('.switch-tab');
    switchTabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetTab = this.dataset.tab;

            // Find and click the corresponding tab button
            tabs.forEach(tab => {
                if (tab.dataset.tab === targetTab) {
                    tab.click();
                }
            });

            // Scroll to top of form
            document.querySelector('.auth-right-panel').scrollTop = 0;
        });
    });

    // Password Visibility Toggle
    const passwordToggles = document.querySelectorAll('.toggle-password');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            
            if (input.type === 'password') {
                input.type = 'text';
                this.textContent = '🙈';
            } else {
                input.type = 'password';
                this.textContent = '👁️';
            }
        });
    });

    // Form Submission - Login
    const loginForm = document.getElementById('login-form-element');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="text"]').value;
            const password = this.querySelector('input[type="password"]').value;

            if (email && password) {
                alert(`Welcome back! Logging in with ${email}`);
                
                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = 'design/index.html';
                }, 500);
            } else {
                alert('Please fill in all fields');
            }
        });
    }

    // Form Submission - Signup
    const signupForm = document.getElementById('signup-form-element');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const inputs = this.querySelectorAll('input[type="text"], input[type="password"]');
            const termsCheckbox = this.querySelector('input[type="checkbox"]');

            const name = inputs[0].value;
            const email = inputs[1].value;
            const password = inputs[2].value;
            const confirmPassword = inputs[3].value;

            // Validation
            if (!name || !email || !password || !confirmPassword) {
                alert('Please fill in all fields');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            if (!termsCheckbox.checked) {
                alert('Please agree to the Terms & Conditions');
                return;
            }

            alert(`Welcome ${name}! Your account has been created. Redirecting to dashboard...`);

            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'design/index.html';
            }, 500);
        });
    }

    // Social Login Buttons (Placeholder)
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const provider = this.classList.contains('google-btn') ? 'Google' : 'Facebook';
            alert(`${provider} login would redirect to OAuth provider`);
        });
    });

    // Forgot Password Link
    const forgotLink = document.querySelector('.forgot-password');
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Password reset functionality would be implemented here');
        });
    }
});
