// Global state
let currentUser = null;
let allServices = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadServices();
});

// Show notification
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification show' + (isError ? ' error' : '');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Section navigation
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');

    if (sectionName === 'profile' && currentUser) {
        loadUserServices();
    }
}

// Auth functions
function showAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });

    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
}

async function register(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Registration successful! Please login.');
            showAuthTab('login');
            document.getElementById('registerForm').reset();
        } else {
            showNotification(data.error || 'Registration failed', true);
        }
    } catch (error) {
        showNotification('Network error', true);
    }
}

async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            updateAuthUI();
            showNotification('Login successful!');
            showSection('home');
            document.getElementById('loginForm').reset();
        } else {
            showNotification(data.error || 'Login failed', true);
        }
    } catch (error) {
        showNotification('Network error', true);
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        updateAuthUI();
        showNotification('Logged out successfully');
        showSection('home');
    } catch (error) {
        showNotification('Logout error', true);
    }
}

function checkAuth() {
    fetch('/api/user')
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Not authenticated');
        })
        .then(data => {
            currentUser = data.user;
            updateAuthUI();
        })
        .catch(() => {
            currentUser = null;
            updateAuthUI();
        });
}

function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    const profileLink = document.getElementById('profileLink');
    const logoutLink = document.getElementById('logoutLink');

    if (currentUser) {
        authLink.style.display = 'none';
        profileLink.style.display = 'block';
        logoutLink.style.display = 'block';
        
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.innerHTML = `
                <div style="padding: 1rem; background: #f0f0f0; border-radius: 8px; margin-bottom: 1rem;">
                    <h3>Welcome, ${currentUser.username}!</h3>
                    <p>Email: ${currentUser.email}</p>
                </div>
            `;
        }
    } else {
        authLink.style.display = 'block';
        profileLink.style.display = 'none';
        logoutLink.style.display = 'none';
    }
}

// Services functions
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        const services = await response.json();
        allServices = services;
        displayServices(services, 'servicesList');
        displayServices(services, 'allServicesList');
    } catch (error) {
        showNotification('Failed to load services', true);
    }
}

function displayServices(services, containerId) {
    const container = document.getElementById(containerId);
    
    if (services.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No services found</p>';
        return;
    }

    container.innerHTML = services.map(service => `
        <div class="service-card" onclick="viewService('${service.id}')">
            <span class="service-category">${service.category}</span>
            <h4>${service.title}</h4>
            <p class="service-description">${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}</p>
            <p class="service-price">${service.price}</p>
            <div class="service-rating">
                <span>⭐ ${service.averageRating || '0.0'}</span>
                <span>(${service.reviewCount || 0} reviews)</span>
            </div>
            <p class="service-provider">By: ${service.username}</p>
        </div>
    `).join('');
}

async function viewService(serviceId) {
    try {
        const response = await fetch(`/api/services/${serviceId}`);
        const service = await response.json();

        const modal = document.getElementById('serviceModal');
        const detailDiv = document.getElementById('serviceDetail');

        let reviewsHTML = '';
        if (service.reviews && service.reviews.length > 0) {
            reviewsHTML = `
                <div class="reviews-section">
                    <h3>Reviews</h3>
                    ${service.reviews.map(review => `
                        <div class="review-item">
                            <div class="review-header">
                                <span class="review-author">
                                    ${review.username}
                                    ${review.verified ? '<span class="verified-badge">Verified</span>' : ''}
                                </span>
                                <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
                            </div>
                            <p class="review-comment">${review.comment}</p>
                            <small style="color: #999;">${new Date(review.createdAt).toLocaleDateString()}</small>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        let reviewFormHTML = '';
        if (currentUser) {
            reviewFormHTML = `
                <div class="review-form">
                    <h4>Leave a Review</h4>
                    <form onsubmit="submitReview(event, '${service.id}')">
                        <div class="rating-input">
                            <label>Rating:</label>
                            ${[1, 2, 3, 4, 5].map(n => `
                                <label>
                                    <input type="radio" name="rating" value="${n}" required>
                                    ${n}⭐
                                </label>
                            `).join('')}
                        </div>
                        <textarea name="comment" placeholder="Write your review (optional)" rows="3"></textarea>
                        <button type="submit">Submit Review</button>
                    </form>
                </div>
            `;
        }

        detailDiv.innerHTML = `
            <h2>${service.title}</h2>
            <span class="service-category">${service.category}</span>
            <p style="margin-top: 1rem;"><strong>Provider:</strong> ${service.username}</p>
            <p style="margin-top: 0.5rem;"><strong>Price:</strong> ${service.price}</p>
            <div class="service-rating" style="margin-top: 0.5rem;">
                <span>⭐ ${service.averageRating || '0.0'}</span>
                <span>(${service.reviewCount || 0} reviews)</span>
            </div>
            <div style="margin-top: 1.5rem;">
                <h3>Description</h3>
                <p>${service.description}</p>
            </div>
            ${reviewFormHTML}
            ${reviewsHTML}
        `;

        modal.classList.add('active');
    } catch (error) {
        showNotification('Failed to load service details', true);
    }
}

function closeModal() {
    document.getElementById('serviceModal').classList.remove('active');
}

async function addService(event) {
    event.preventDefault();

    if (!currentUser) {
        showNotification('Please login to add a service', true);
        return;
    }

    const title = document.getElementById('serviceTitle').value;
    const description = document.getElementById('serviceDescription').value;
    const category = document.getElementById('serviceCategory').value;
    const price = document.getElementById('servicePrice').value;

    try {
        const response = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, category, price })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Service added successfully!');
            document.getElementById('addServiceForm').reset();
            loadServices();
            loadUserServices();
        } else {
            showNotification(data.error || 'Failed to add service', true);
        }
    } catch (error) {
        showNotification('Network error', true);
    }
}

async function loadUserServices() {
    if (!currentUser) return;

    try {
        const response = await fetch('/api/services');
        const services = await response.json();
        const userServices = services.filter(s => s.userId === currentUser.id);
        
        const container = document.getElementById('myServicesList');
        if (userServices.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">You haven\'t added any services yet</p>';
            return;
        }

        container.innerHTML = userServices.map(service => `
            <div class="service-card">
                <span class="service-category">${service.category}</span>
                <h4>${service.title}</h4>
                <p class="service-description">${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}</p>
                <p class="service-price">${service.price}</p>
                <div class="service-rating">
                    <span>⭐ ${service.averageRating || '0.0'}</span>
                    <span>(${service.reviewCount || 0} reviews)</span>
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button onclick="viewService('${service.id}')" style="flex: 1; padding: 0.5rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">View</button>
                    <button onclick="deleteService('${service.id}')" style="flex: 1; padding: 0.5rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showNotification('Failed to load your services', true);
    }
}

async function deleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service?')) {
        return;
    }

    try {
        const response = await fetch(`/api/services/${serviceId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Service deleted successfully');
            loadServices();
            loadUserServices();
        } else {
            showNotification(data.error || 'Failed to delete service', true);
        }
    } catch (error) {
        showNotification('Network error', true);
    }
}

async function submitReview(event, serviceId) {
    event.preventDefault();

    if (!currentUser) {
        showNotification('Please login to submit a review', true);
        return;
    }

    const form = event.target;
    const rating = form.rating.value;
    const comment = form.comment.value;

    try {
        const response = await fetch(`/api/services/${serviceId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, comment })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Review submitted successfully!');
            closeModal();
            loadServices();
        } else {
            showNotification(data.error || 'Failed to submit review', true);
        }
    } catch (error) {
        showNotification('Network error', true);
    }
}

// Search and filter functions
function searchServices() {
    const query = document.getElementById('searchInput').value;
    
    if (!query.trim()) {
        displayServices(allServices, 'servicesList');
        return;
    }

    const filtered = allServices.filter(service => 
        service.title.toLowerCase().includes(query.toLowerCase()) ||
        service.description.toLowerCase().includes(query.toLowerCase())
    );

    displayServices(filtered, 'servicesList');
}

function filterByCategory(category) {
    showSection('services');
    document.getElementById('categoryFilter').value = category;
    filterServices();
}

function filterServices() {
    const category = document.getElementById('categoryFilter').value;
    
    if (!category) {
        displayServices(allServices, 'allServicesList');
        return;
    }

    const filtered = allServices.filter(service => service.category === category);
    displayServices(filtered, 'allServicesList');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('serviceModal');
    if (event.target === modal) {
        closeModal();
    }
}
