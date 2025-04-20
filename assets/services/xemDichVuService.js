var services = []; // Store the entire list of services

$(document).ready(function () {
    loadServices();

    // Set up search functionality
    $("#searchService").on("keyup", function() {
        const searchText = removeAccents($(this).val().toLowerCase());
        filterServices(searchText);
    });
});

// Function to fetch services from API
function loadServices() {
    axiosJWT
        .get(`/api/services`)
        .then(function (response) {
            services = response.data; // Store data from API
            displayServices(services); // Display all services
        })
        .catch(function (error) {
            console.error("Error fetching services:", error);
            $("#serviceList").html('<div class="col-12 text-center"><p class="text-danger">Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.</p></div>');
        });
}

// Function to display the list of services
function displayServices(data) {
    const serviceList = $("#serviceList"); // Container for service list
    serviceList.empty(); // Clear old services

    if (!data || data.length === 0) {
        serviceList.html('<div class="col-12 text-center"><p>Không tìm thấy dịch vụ nào.</p></div>');
        return;
    }

    // Loop through services and create HTML for each service
    data.forEach((service) => {
        const serviceHTML = `
            <div class="col-md-4 mb-4 service-item">
                <div class="card h-100 service-card">
                    <div class="card-body d-flex flex-column">
                        <div class="service-icon mb-3">
                            <i class="fas fa-stethoscope"></i>
                        </div>
                        <h5 class="card-title">${service.name}</h5>
                        <div class="service-price mb-3">
                            ${formatCurrency(service.price)}
                        </div>
                        <p class="card-text flex-grow-1">${service.description || "Không có mô tả"}</p>
                        <button class="btn btn-primary mt-3" onclick="bookService(${service.id}, '${service.name}')">
                            Đặt lịch
                        </button>
                    </div>
                </div>
            </div>
        `;
        serviceList.append(serviceHTML); // Add service to container
    });
}

// Function to filter services based on search value
function filterServices(searchText) {
    if (!searchText) {
        displayServices(services);
        return;
    }
    
    const filteredServices = services.filter((service) => {
        return removeAccents(service.name.toLowerCase()).includes(searchText);
    });
    
    displayServices(filteredServices);
}

// Function to format currency in Vietnamese format
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND'
    }).format(amount);
}

// Function to remove accents for better search
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Function to navigate to appointment booking page with selected service
function bookService(serviceId, serviceName) {
    localStorage.setItem("selectedServiceId", serviceId);
    localStorage.setItem("selectedServiceName", serviceName);
    window.location.href = "index.html#appointment";
}

// Add CSS for service cards
$(document).ready(function() {
    const style = `
        <style>
            .service-card {
                transition: transform 0.3s, box-shadow 0.3s;
                border-radius: 12px;
                overflow: hidden;
                border: none;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            
            .service-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            }
            
            .service-card .card-body {
                padding: 25px;
                text-align: center;
            }
            
            .service-icon {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: #166ab530;
                color: #166ab5;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto;
                font-size: 24px;
            }
            
            .service-card .card-title {
                color: #166ab5;
                font-weight: 600;
                font-size: 20px;
                margin: 15px 0;
            }
            
            .service-price {
                font-size: 18px;
                font-weight: 700;
                color: #28a745;
            }
            
            .service-card .card-text {
                color: #555;
                font-size: 15px;
                line-height: 1.6;
            }
            
            .service-card .btn-primary {
                background-color: #166ab5;
                border-color: #166ab5;
                border-radius: 50px;
                padding: 8px 25px;
                transition: all 0.3s;
            }
            
            .service-card .btn-primary:hover {
                background-color: #0e5a9e;
                border-color: #0e5a9e;
                transform: scale(1.05);
            }
        </style>
    `;
    
    $('head').append(style);
});
