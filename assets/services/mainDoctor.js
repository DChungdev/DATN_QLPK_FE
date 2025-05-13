var dsBN = []; // Danh sách bệnh nhân
var dsLK = []; // Danh sách lịch khám
var dsKQ = []; // Danh sách kết quả khám
var bsId = ""; // ID bác sĩ
var doctorInfo = {}; // Thông tin bác sĩ

$(document).ready(async function () {
    // Set current date
    setCurrentDate();
    
    // Initialize feather icons
    feather.replace();
    
    await getDoctorId(); // Lấy ID bác sĩ
    // await getDoctorInfo(); // Lấy thông tin bác sĩ
    await getDoctorPatients(); // Lấy danh sách bệnh nhân theo bác sĩ
    await getDoctorAppointments(); // Lấy danh sách lịch khám theo bác sĩ
    await getDoctorResults(); // Lấy danh sách kết quả khám

    // Hiển thị thông tin tên bác sĩ
    displayDoctorInfo();
    
    // Hiển thị số lượng
    displayStats();
    
    // Hiển thị biểu đồ
    renderAppointmentChart();
    renderPatientDistribution();
    
    // Hiển thị lịch khám hôm nay
    displayTodayAppointments();
    
    // Hiển thị bệnh nhân gần đây
    displayRecentPatients();
});

// Hàm thiết lập ngày hiện tại
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    $("#currentDate").text(now.toLocaleDateString('vi-VN', options));
}

// Hàm lấy ID bác sĩ từ API
async function getDoctorId() {
    try {
        bsId = localStorage.getItem("doctorId");
        if (!bsId) {
            const userId = localStorage.getItem("userId");
            const response = await axiosJWT.get(`/api/doctors/getbyuserid/${userId}`);
            bsId = response.data.doctorId;
            localStorage.setItem("doctorId", bsId);
        }
    } catch (error) {
        console.error("Lỗi khi lấy ID bác sĩ:", error);
        showErrorPopup("Không thể tải ID bác sĩ.");
    }
}

// Hàm lấy thông tin bác sĩ
// async function getDoctorInfo() {
//     try {
//         const userName = localStorage.getItem("userName");
//         const response = await axiosJWT.get(`/api/doctors/findbyUsername/${userName}`);
//         doctorInfo = response.data;
//     } catch (error) {
//         console.error("Lỗi khi lấy thông tin bác sĩ:", error);
//         showErrorPopup("Không thể tải thông tin bác sĩ.");
//     }
// }

// Hiển thị thông tin bác sĩ
function displayDoctorInfo() {
    $("#greetingDoctor").text(doctorInfo.fullName || "Bác sĩ");
}

// Hàm lấy danh sách bệnh nhân theo ID bác sĩ
async function getDoctorPatients() {
    try {
        const response = await axiosJWT.get(`/api/patients/getbydoctorid/${bsId}`);
        dsBN = response.data; // Lưu danh sách bệnh nhân từ API
    } catch (error) {
        console.error("Lỗi khi lấy danh sách bệnh nhân:", error);
        showErrorPopup("Không thể tải danh sách bệnh nhân.");
    }
}

// Hàm lấy danh sách lịch khám theo ID bác sĩ
async function getDoctorAppointments() {
    try {
        const response = await axiosJWT.get(`/api/appointments/doctor/${bsId}`);
        dsLK = response.data; // Lưu danh sách lịch khám từ API
    } catch (error) {
        console.error("Lỗi khi lấy danh sách lịch khám:", error);
        showErrorPopup("Không thể tải danh sách lịch khám.");
    }
}

// Hàm lấy danh sách kết quả khám theo ID bác sĩ
async function getDoctorResults() {
    try {
        const response = await axiosJWT.get(`/api/medical-results/doctor/${bsId}`);
        dsKQ = response.data; // Lưu danh sách kết quả khám từ API
    } catch (error) {
        console.error("Lỗi khi lấy danh sách kết quả khám:", error);
        showErrorPopup("Không thể tải danh sách kết quả khám.");
    }
}

// Hiển thị thống kê
function displayStats() {
    // Hiển thị số lượng bệnh nhân
    const patientCount = dsBN.length;
    $("#patientCountDisplay").text(patientCount);
    $("#patientChangeText").text(`Tổng số: ${patientCount} bệnh nhân`);
    
    // Hiển thị số lượng lịch khám
    const appointmentCount = dsLK.length;
    $("#appointmentCountDisplay").text(appointmentCount);
    
    // Đếm số lịch khám hôm nay
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = dsLK.filter(lk => lk.appointmentDate.includes(today));
    $("#appointmentChangeText").text(`${todayAppointments.length} lịch khám hôm nay`);
    
    // Hiển thị số lượng kết quả khám
    const resultCount = dsKQ.length;
    $("#resultCountDisplay").text(resultCount);
    $("#resultChangeText").text(`Tổng số: ${resultCount} kết quả khám`);
}

// Biểu đồ thống kê lịch khám
function renderAppointmentChart() {
    if (dsLK.length === 0) {
        $("#appointment-chart").html("<div class='text-center py-5'>Không có dữ liệu lịch khám</div>");
        return;
    }
    
    // Lấy 7 ngày gần nhất
    const last7Days = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        const formattedDate = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        
        last7Days.push(formattedDate);
        
        // Đếm số lịch khám cho ngày này
        const dayCount = dsLK.filter(lk => lk.appointmentDate.includes(dateString)).length;
        counts.push(dayCount);
    }
    
    // Tạo biểu đồ
    c3.generate({
        bindto: '#appointment-chart',
        data: {
            columns: [
                ['Lịch khám', ...counts]
            ],
            type: 'bar',
            colors: {
                'Lịch khám': '#1e88e5'
            }
        },
        axis: {
            x: {
                type: 'category',
                categories: last7Days,
                tick: {
                    rotate: 0,
                    multiline: false
                }
            },
            y: {
                tick: {
                    count: 5,
                    format: function(d) { return Math.floor(d); }
                },
                min: 0
            }
        },
        bar: {
            width: 25
        },
        grid: {
            y: {
                show: true
            }
        },
        padding: {
            bottom: 0,
            top: 0
        }
    });
}

// Biểu đồ phân bố bệnh nhân theo giới tính
function renderPatientDistribution() {
    if (dsBN.length === 0) {
        $("#patient-distribution").html("<div class='text-center py-5'>Không có dữ liệu bệnh nhân</div>");
        return;
    }
    
    // Đếm số bệnh nhân theo giới tính
    const maleCount = dsBN.filter(bn => bn.gender === 'Nam').length;
    const femaleCount = dsBN.filter(bn => bn.gender === 'Nữ').length;
    const otherCount = dsBN.filter(bn => bn.gender !== 'Nam' && bn.gender !== 'Nữ').length;
    
    // Tạo biểu đồ
    c3.generate({
        bindto: '#patient-distribution',
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
                format: function (value, ratio, id) {
                    return value;
                }
            }
        }
    });
}

// Hiển thị lịch khám ngày hôm nay
function displayTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = dsLK.filter(lk => lk.appointmentDate.includes(today));
    
    const tbody = $("#todayAppointmentsTable");
    tbody.empty();
    
    if (todayAppointments.length === 0) {
        tbody.html("<tr><td colspan='5' class='text-center'>Không có lịch khám nào hôm nay</td></tr>");
        return;
    }
    
    // Sắp xếp theo thời gian
    todayAppointments.sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
    
    // Hiển thị tối đa 5 lịch khám
    const displayLimit = Math.min(todayAppointments.length, 5);
    
    for (let i = 0; i < displayLimit; i++) {
        const appointment = todayAppointments[i];
        
        // Tìm thông tin bệnh nhân
        const patient = dsBN.find(bn => bn.patientId === appointment.patientId) || { fullName: "Không xác định" };
        
        // Định dạng thời gian
        const time = formatTime(appointment.appointmentTime);
        
        // Trạng thái
        let statusClass = '';
        let statusText = '';
        
        switch (appointment.status) {
            case 'SCHEDULED':
                statusClass = 'badge bg-warning';
                statusText = 'Chờ khám';
                break;
            case 'COMPLETED':
                statusClass = 'badge bg-success';
                statusText = 'Đã khám';
                break;
            case 'CANCELED':
                statusClass = 'badge bg-danger';
                statusText = 'Đã hủy';
                break;
            default:
                statusClass = 'badge bg-secondary';
                statusText = 'Không xác định';
        }
        
        // Tạo row
        const row = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${patient.image ? 'http://localhost:8080' + patient.image : '../assets/img/default-avatar.png'}" alt="Patient" class="rounded-circle" width="40">
                        <div class="ms-3">
                            <h5 class="mb-0 font-weight-normal">${patient.fullName}</h5>
                            <small class="text-muted">${appointment.patientId}</small>
                        </div>
                    </div>
                </td>
                <td>${time}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${appointment.reason || 'Không có'}</td>
                <td class="text-end">
                    <a href="QLKhamBenh.html" class="btn btn-outline-primary btn-sm">Xem chi tiết</a>
                </td>
            </tr>
        `;
        
        tbody.append(row);
    }
}

// Hiển thị bệnh nhân gần đây
function displayRecentPatients() {
    const tbody = $("#recentPatientsTable");
    tbody.empty();
    
    if (dsBN.length === 0) {
        tbody.html("<tr><td colspan='5' class='text-center'>Không có bệnh nhân nào</td></tr>");
        return;
    }
    
    // Sắp xếp theo thời gian cập nhật gần nhất
    const sortedPatients = [...dsBN].sort((a, b) => 
        new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    );
    
    // Hiển thị tối đa 5 bệnh nhân gần đây
    const displayLimit = Math.min(sortedPatients.length, 5);
    
    for (let i = 0; i < displayLimit; i++) {
        const patient = sortedPatients[i];
        
        // Định dạng ngày sinh
        const dob = formatDate(patient.dateOfBirth);
        
        // Tạo row
        const row = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${patient.image ? 'http://localhost:8080' + patient.image : '../assets/img/default-avatar.png'}" alt="Patient" class="rounded-circle"style="width: 40px; aspect-ratio: 1 / 1; object-fit: cover;">
                        <div class="ms-3">
                            <h5 class="mb-0 font-weight-normal">${patient.fullName}</h5>
                            <small class="text-muted">${patient.patientId}</small>
                        </div>
                    </div>
                </td>
                <td>${patient.gender || 'Không xác định'}</td>
                <td>${dob || 'Không xác định'}</td>
                <td>${patient.phone || 'Không xác định'}</td>
                <td class="text-end">
                    <a href="XemBenhNhan.html" class="btn btn-outline-primary btn-sm">Xem chi tiết</a>
                </td>
            </tr>
        `;
        
        tbody.append(row);
    }
}

// Hàm định dạng ngày
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Hàm định dạng thời gian
function formatTime(timeString) {
    if (!timeString) return '';
    return timeString;
}

// Hàm hiển thị thông báo lỗi
function showErrorPopup(message) {
    const errorPopup = document.getElementById("error-popup");
    const errorText = errorPopup.querySelector(".m-popup-text-error span");
    
    if (errorText) {
        errorText.textContent = message || "Đã xảy ra lỗi!";
    }
    
    errorPopup.style.visibility = "visible";

    // Ẩn popup sau 3 giây
    setTimeout(() => {
        errorPopup.style.visibility = "hidden";
    }, 3000);
}

// Xử lý nút đóng popup lỗi
$(document).on("click", ".m-popup-close", function() {
    const popup = $(this).closest(".m-popup-block");
    popup.css("visibility", "hidden");
});
