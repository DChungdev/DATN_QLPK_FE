// Global variables
let patientData = [];
let doctorData = [];
let appointmentData = [];
let serviceData = [];

$(document).ready(function () {
    // Initialize feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Set current date
    setCurrentDate();
    
    // Initialize the admin greeting
    initGreeting();
    
    // Load all dashboard data
    loadDashboardData();
});

// Set current date in Vietnamese format
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    $("#currentDate").text(now.toLocaleDateString('vi-VN', options));
}

// Initialize the greeting with the admin's name
function initGreeting() {
    const adminName = localStorage.getItem('userName') || 'Admin';
    $("#greetingAdmin").text(adminName);
}

// Main function to load all dashboard data
function loadDashboardData() {
    Promise.all([
        getPatientData(),
        getDoctorData(),
        getAppointmentData(),
        getServiceData()
    ])
    .then(([patients, doctors, appointments, services]) => {
        patientData = patients;
        doctorData = doctors;
        appointmentData = appointments;
        serviceData = services;
        
        // Update counts and stats
        updateDashboardCounts();
        
        // Render all charts
        renderAppointmentsChart();
        renderPatientGenderChart();
        renderDepartmentChart();
        renderServiceChart();
        
        // Populate tables
        populateTopDoctors();
        populateRecentAppointments();
        
        // Re-initialize feather icons for dynamic content
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    })
    .catch(error => {
        console.error("Error loading dashboard data:", error);
        showErrorPopup("Không thể tải dữ liệu tổng quan");
    });
}

// Get patient data
function getPatientData() {
    return axiosJWT
        .get("/api/patients")
        .then(response => {
            return response.data || [];
        })
        .catch(error => {
            console.error("Error fetching patients:", error);
            return [];
        });
}

// Get doctor data
function getDoctorData() {
    return axiosJWT
        .get("/api/doctors")
        .then(response => {
            return response.data || [];
        })
        .catch(error => {
            console.error("Error fetching doctors:", error);
            return [];
        });
}

// Get appointment data
function getAppointmentData() {
    return axiosJWT
        .get("/api/appointments")
        .then(response => {
            return response.data || [];
        })
        .catch(error => {
            console.error("Error fetching appointments:", error);
            return [];
        });
}

// Get service data
function getServiceData() {
    return axiosJWT
        .get("/api/services")
        .then(response => {
            return response.data || [];
        })
        .catch(error => {
            console.error("Error fetching services:", error);
            return [];
        });
}

// Update dashboard counts and stats
function updateDashboardCounts() {
    try {
        // Update patient count
        const patientCount = patientData.length;
        $("#count_patient").text(patientCount);
        $("#patientGrowth").text("+5%"); // This would ideally be calculated based on historical data
        
        // Update doctor count
        const doctorCount = doctorData.length;
        $("#count_doctor").text(doctorCount);
        
        // Update appointment count
        const appointmentCount = appointmentData.length;
        $("#count_appointment").text(appointmentCount);
        
        // Calculate appointment growth (appointments this week vs last week)
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(today.getDate() - 14);
        
        const appointmentsThisWeek = appointmentData.filter(apt => 
            new Date(apt.appointmentDate) >= oneWeekAgo && 
            new Date(apt.appointmentDate) <= today
        ).length;
        
        const appointmentsLastWeek = appointmentData.filter(apt => 
            new Date(apt.appointmentDate) >= twoWeeksAgo && 
            new Date(apt.appointmentDate) < oneWeekAgo
        ).length;
        
        let appointmentGrowth = 0;
        if (appointmentsLastWeek > 0) {
            appointmentGrowth = Math.round((appointmentsThisWeek - appointmentsLastWeek) / appointmentsLastWeek * 100);
        } else if (appointmentsThisWeek > 0) {
            appointmentGrowth = 100;
        }
        
        $("#appointmentGrowth").text((appointmentGrowth >= 0 ? "+" : "") + appointmentGrowth + "%");
        if (appointmentGrowth >= 0) {
            $("#appointmentGrowth").removeClass("bg-danger").addClass("bg-success");
        } else {
            $("#appointmentGrowth").removeClass("bg-success").addClass("bg-danger");
        }
        
        // Update service count
        const serviceCount = serviceData.length;
        $("#count_service").text(serviceCount);
    } catch(error) {
        console.error("Error updating dashboard counts:", error);
    }
}

// Render appointments chart showing monthly appointment counts
function renderAppointmentsChart() {
    try {
        if (!window.c3) {
            console.error("C3 library not loaded");
            $("#appointments-chart").html('<div class="text-center py-5">Không thể tải biểu đồ - thư viện C3 không khả dụng</div>');
            return;
        }
        
        if (appointmentData.length === 0) {
            $("#appointments-chart").html('<div class="text-center py-5">Không có dữ liệu lịch khám</div>');
            return;
        }
        
        // Get monthly appointment counts
        const monthlyCounts = getMonthlyAppointmentCounts();
        
        // Create chart
        c3.generate({
            bindto: '#appointments-chart',
            data: {
                x: 'x',
                columns: [
                    ['x', ...monthlyCounts.months],
                    ['Lịch khám', ...monthlyCounts.counts]
                ],
                types: {
                    'Lịch khám': 'area-spline'
                },
                colors: {
                    'Lịch khám': '#1e88e5'
                }
            },
            axis: {
                x: {
                    type: 'category',
                    tick: {
                        fit: true
                    }
                },
                y: {
                    tick: {
                        format: function(d) { return Math.floor(d); }
                    },
                    min: 0,
                    padding: {
                        bottom: 0
                    }
                }
            },
            point: {
                r: 4
            },
            grid: {
                y: {
                    show: true
                }
            },
            padding: {
                bottom: 0,
                left: 40
            }
        });
    } catch(error) {
        console.error("Error rendering appointments chart:", error);
        $("#appointments-chart").html('<div class="text-center py-5">Không thể tải biểu đồ</div>');
    }
}

// Get monthly appointment counts for the chart
function getMonthlyAppointmentCounts() {
    const months = [];
    const counts = [];
    
    // Create a map for the last 6 months
    const monthMap = {};
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
        const monthName = month.toLocaleDateString('vi-VN', { month: 'short' });
        
        monthMap[monthKey] = 0;
        months.push(monthName);
    }
    
    // Count appointments by month
    appointmentData.forEach(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate);
        const monthKey = `${appointmentDate.getFullYear()}-${appointmentDate.getMonth() + 1}`;
        
        if (monthMap.hasOwnProperty(monthKey)) {
            monthMap[monthKey]++;
        }
    });
    
    // Convert the map to counts array in the same order as months
    const today2 = new Date();
    for (let i = 5; i >= 0; i--) {
        const month = new Date(today2.getFullYear(), today2.getMonth() - i, 1);
        const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
        
        counts.push(monthMap[monthKey]);
    }
    
    return { months, counts };
}

// Render patient gender distribution chart
function renderPatientGenderChart() {
    try {
        if (!window.c3) {
            console.error("C3 library not loaded");
            $("#patient-gender-chart").html('<div class="text-center py-5">Không thể tải biểu đồ - thư viện C3 không khả dụng</div>');
            return;
        }
        
        if (patientData.length === 0) {
            $("#patient-gender-chart").html('<div class="text-center py-5">Không có dữ liệu bệnh nhân</div>');
            return;
        }
        
        // Count patients by gender
        const maleCount = patientData.filter(patient => patient.gender === 'Nam').length;
        const femaleCount = patientData.filter(patient => patient.gender === 'Nữ').length;
        const otherCount = patientData.filter(patient => patient.gender !== 'Nam' && patient.gender !== 'Nữ').length;
        
        // Create chart
        c3.generate({
            bindto: '#patient-gender-chart',
            data: {
                columns: [
                    ['Nam', maleCount],
                    ['Nữ', femaleCount],
                    ['Khác', otherCount]
                ],
                type: 'pie',
                colors: {
                    'Nam': '#1e88e5',
                    'Nữ': '#ff5252',
                    'Khác': '#ffba57'
                }
            },
            pie: {
                label: {
                    format: function(value, ratio, id) {
                        return Math.round(ratio * 100) + '%';
                    }
                }
            },
            legend: {
                position: 'bottom'
            },
            padding: {
                bottom: 20
            }
        });
    } catch(error) {
        console.error("Error rendering gender chart:", error);
        $("#patient-gender-chart").html('<div class="text-center py-5">Không thể tải biểu đồ</div>');
    }
}

// Render department patient distribution chart
function renderDepartmentChart() {
    try {
        if (!window.c3) {
            console.error("C3 library not loaded");
            $("#department-chart").html('<div class="text-center py-5">Không thể tải biểu đồ - thư viện C3 không khả dụng</div>');
            return;
        }
        
        // Sample department data (in a real scenario, this would come from the API)
        const departments = [
            { name: 'Nội khoa', count: 45 },
            { name: 'Ngoại khoa', count: 30 },
            { name: 'Nhi', count: 25 },
            { name: 'Sản', count: 20 },
            { name: 'Tim mạch', count: 15 }
        ];
        
        // Sort departments by count (descending)
        departments.sort((a, b) => b.count - a.count);
        
        // Create chart data
        const departmentNames = departments.map(dept => dept.name);
        const departmentCounts = departments.map(dept => dept.count);
        
        // Create chart
        c3.generate({
            bindto: '#department-chart',
            data: {
                x: 'x',
                columns: [
                    ['x', ...departmentNames],
                    ['Bệnh nhân', ...departmentCounts]
                ],
                type: 'bar',
                colors: {
                    'Bệnh nhân': '#6772e5'
                }
            },
            axis: {
                x: {
                    type: 'category',
                    tick: {
                        rotate: -30,
                        multiline: false
                    },
                    height: 50
                },
                y: {
                    tick: {
                        format: function(d) { return Math.floor(d); }
                    },
                    min: 0
                }
            },
            bar: {
                width: {
                    ratio: 0.6
                }
            },
            grid: {
                y: {
                    show: true
                }
            },
            padding: {
                bottom: 40,
                left: 40
            }
        });
    } catch(error) {
        console.error("Error rendering department chart:", error);
        $("#department-chart").html('<div class="text-center py-5">Không thể tải biểu đồ</div>');
    }
}

// Render popular services chart
function renderServiceChart() {
    try {
        if (!window.c3) {
            console.error("C3 library not loaded");
            $("#service-chart").html('<div class="text-center py-5">Không thể tải biểu đồ - thư viện C3 không khả dụng</div>');
            return;
        }
        
        if (serviceData.length === 0) {
            $("#service-chart").html('<div class="text-center py-5">Không có dữ liệu dịch vụ</div>');
            return;
        }
        
        // Create a copy and limit to top 5 services by default
        // In a real scenario, you would sort by the most frequently used or some other metric
        const topServices = [...serviceData].slice(0, 5);
        
        // Create chart data
        const serviceNames = topServices.map(service => service.name || 'Không tên');
        const servicePrices = topServices.map(service => service.price || 0);
        
        // Create chart
        c3.generate({
            bindto: '#service-chart',
            data: {
                x: 'x',
                columns: [
                    ['x', ...serviceNames],
                    ['Giá dịch vụ', ...servicePrices]
                ],
                type: 'bar',
                colors: {
                    'Giá dịch vụ': '#43cea2'
                }
            },
            axis: {
                x: {
                    type: 'category',
                    tick: {
                        rotate: -30,
                        multiline: false
                    },
                    height: 50
                },
                y: {
                    tick: {
                        format: function(d) { return d.toLocaleString('vi-VN') + ' ₫'; }
                    },
                    min: 0
                }
            },
            bar: {
                width: {
                    ratio: 0.6
                }
            },
            grid: {
                y: {
                    show: true
                }
            },
            padding: {
                bottom: 40,
                left: 65
            }
        });
    } catch(error) {
        console.error("Error rendering service chart:", error);
        $("#service-chart").html('<div class="text-center py-5">Không thể tải biểu đồ</div>');
    }
}

// Populate top doctors table
function populateTopDoctors() {
    try {
        const tbody = $("#top-doctors");
        if (!tbody.length) {
            console.error("Top doctors table not found");
            return;
        }
        
        tbody.empty();
        
        if (doctorData.length === 0) {
            tbody.html('<tr><td colspan="4" class="text-center">Không có dữ liệu bác sĩ</td></tr>');
            return;
        }
        
        // Get top 5 doctors (in a real scenario, you would sort by some metric like patient count)
        const topDoctors = [...doctorData].slice(0, 5);
        
        topDoctors.forEach(doctor => {
            // Create a row for each doctor
            const row = `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${doctor.image ? 'http://localhost:8080' + doctor.image : '../assets/img/default-avatar.png'}" 
                                alt="${doctor.fullName}" class="rounded-circle" width="30" style="width: 30px; aspect-ratio: 1 / 1; object-fit: cover;">
                            <div class="ms-3">
                                <h5 class="mb-0 font-14">${doctor.fullName}</h5>
                            </div>
                        </div>
                    </td>
                    <td>${doctor.degree || 'Chưa cập nhật'}</td>
                    <td>${Math.floor(Math.random() * 100)}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            ${getStarIcons(Math.random() * 2 + 3)}
                            <span class="font-12 ms-2">${(Math.random() * 2 + 3).toFixed(1)}</span>
                        </div>
                    </td>
                </tr>
            `;
            
            tbody.append(row);
        });
        
        // Re-initialize feather icons for the stars
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    } catch(error) {
        console.error("Error populating top doctors:", error);
    }
}

// Get star icons HTML based on rating value
function getStarIcons(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    
    let html = '';
    for (let i = 0; i < fullStars; i++) {
        html += '<i data-feather="star" class="text-warning" width="16" height="16"></i>';
    }
    
    if (halfStar) {
        html += '<i data-feather="star" class="text-warning" width="16" height="16"></i>';
    }
    
    return html;
}

// Populate recent appointments table
function populateRecentAppointments() {
    try {
        const tbody = $("#recent-appointments");
        if (!tbody.length) {
            console.error("Recent appointments table not found");
            return;
        }
        
        tbody.empty();
        
        if (appointmentData.length === 0) {
            tbody.html('<tr><td colspan="4" class="text-center">Không có dữ liệu lịch khám</td></tr>');
            return;
        }
        
        // Sort appointments by date (most recent first)
        const sortedAppointments = [...appointmentData].sort((a, b) => 
            new Date(b.appointmentDate) - new Date(a.appointmentDate)
        );
        
        // Get most recent 5 appointments
        const recentAppointments = sortedAppointments.slice(0, 5);
        
        // Populate table
        recentAppointments.forEach(appointment => {
            try {
                // Find associated patient and doctor
                const patient = patientData.find(p => p.patientId === appointment.patientId) || { fullName: 'Không xác định' };
                const doctor = doctorData.find(d => d.doctorId === appointment.doctorId) || { fullName: 'Không xác định' };
                
                // Format date
                const appointmentDate = new Date(appointment.appointmentDate);
                const formattedDate = appointmentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                
                // Format status
                let statusClass = '';
                let statusText = '';
                
                switch (appointment.status) {
                    case 'SCHEDULED':
                    case 'scheduled':
                    case 'confirmed':
                        statusClass = 'badge bg-warning';
                        statusText = 'Chờ khám';
                        break;
                    case 'COMPLETED':
                    case 'completed':
                        statusClass = 'badge bg-success';
                        statusText = 'Đã khám';
                        break;
                    case 'pending':
                        statusClass = 'badge bg-info';
                        statusText = 'Đang chờ';
                        break;
                    case 'CANCELLED':
                    case 'cancelled':
                        statusClass = 'badge bg-danger';
                        statusText = 'Đã hủy';
                        break;
                    default:
                        statusClass = 'badge bg-secondary';
                        statusText = 'Không xác định';
                }
                
                // Create row
                const row = `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="${patient.image ? 'http://localhost:8080' + patient.image : '../assets/img/default-avatar.png'}" 
                                    alt="${patient.fullName}" class="rounded-circle" width="30" style="width: 30px; aspect-ratio: 1 / 1; object-fit: cover;">
                                <div class="ms-3">
                                    <h5 class="mb-0 font-14">${patient.fullName}</h5>
                                </div>
                            </div>
                        </td>
                        <td>${doctor.fullName}</td>
                        <td>${formattedDate} ${appointment.appointmentTime || ''}</td>
                        <td><span class="${statusClass}">${statusText}</span></td>
                    </tr>
                `;
                
                tbody.append(row);
            } catch(rowError) {
                console.error("Error creating appointment row:", rowError);
            }
        });
    } catch(error) {
        console.error("Error populating recent appointments:", error);
    }
}

// Show error popup
function showErrorPopup(message) {
    try {
        const errorPopup = document.getElementById("error-popup");
        if (!errorPopup) {
            console.error("Error popup element not found");
            alert(message || "Đã xảy ra lỗi!");
            return;
        }
        
        const errorText = errorPopup.querySelector(".m-popup-text-error span");
        
        if (errorText) {
            errorText.textContent = message || "Đã xảy ra lỗi!";
        }
        
        errorPopup.style.visibility = "visible";

        // Hide popup after 3 seconds
        setTimeout(() => {
            errorPopup.style.visibility = "hidden";
        }, 3000);
    } catch(error) {
        console.error("Error showing popup:", error);
        alert(message || "Đã xảy ra lỗi!");
    }
}

// Handle close button for error popup
$(document).on("click", ".m-popup-close", function() {
    try {
        const popup = $(this).closest(".m-popup-block");
        popup.css("visibility", "hidden");
    } catch(error) {
        console.error("Error closing popup:", error);
    }
});
