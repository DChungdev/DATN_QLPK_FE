var services = []; // Lưu danh sách dịch vụ toàn bộ
let khoas = []; 

$(document).ready(function () {
    loadServices();
    loadKhoas();
    // Xử lý sự kiện tìm kiếm
  
});

// Hàm lấy danh sách dịch vụ từ API
function loadServices() {
    axiosJWT
        .get(`/api/Services`)
        .then(function (response) {
            services = response.data; // Lưu dữ liệu từ API
            displayServices(services); // Hiển thị toàn bộ dịch vụ
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy danh sách dịch vụ:", error);
        });
}

function loadKhoas() {
    axiosJWT
        .get(`/api/v1/Departments`)
        .then(function (response) {
            khoas = response.data;
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy danh sách khoa:", error);
        });
}

// Hàm hiển thị danh sách dịch vụ
function displayServices(data) {
    const serviceList = $("#serviceList"); // Vùng chứa danh sách dịch vụ
    serviceList.empty(); // Xóa các dịch vụ cũ

    if (data.length === 0) {
        serviceList.append(`<p>Không tìm thấy dịch vụ nào.</p>`);
        return;
    }

    // Lấy 6 dịch vụ đầu tiên
    const displayedServices = data.slice(0, 6);

    // Lặp qua 6 dịch vụ đầu tiên và tạo HTML cho từng dịch vụ
    displayedServices.forEach((service) => {
        const khoa = khoas.find(k => k.khoaId === service.khoaId);
        const khoaName = khoa ? khoa.tenKhoa : "Tất cả";
        const serviceHTML = `
            <div class="col-md-4 mb-3 service-item">
                <div style="
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background-color: #f9f9f9;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    text-align: center;">
                    <h5 style="
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;">${service.tenDichVu}</h5>
                    <p style="
                        font-size: 16px;
                        color: #28a745;
                        margin-bottom: 8px;">Giá: ${service.donGia.toLocaleString()}đ</p>
                    <p style="
                        font-size: 14px;
                        color: #666;">${khoaName}</p>
                    <p style="
                        font-size: 14px;
                        color: #666;">Mô tả: ${service.moTaDichVu || "Không có mô tả"}</p>
                </div>
            </div>
        `;
        serviceList.append(serviceHTML); // Thêm dịch vụ vào vùng chứa
    });
    
    
    
}



