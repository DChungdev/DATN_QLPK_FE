let services = []; // Biến lưu trữ toàn bộ danh sách dịch vụ
let khoas = []; 
$(document).ready(function () {
    loadServices(); // Tải danh sách dịch vụ khi trang được load
    // loadKhoas(); // Gọi hàm để tải danh sách khoa
    
    // Sự kiện tìm kiếm
    $(".search-input").on("input", function () {
        const searchValue = removeAccents($(this).val().toLowerCase());
        filterServices(searchValue);
    });
    
    // Gắn sự kiện cho nút hiển thị modal Thêm
    $("#btnThemMoi").click(function(){
        $('#dialog-add input[type="text"]').val("");
    });

    // Sự kiện thêm mới dịch vụ
    $('#btnAdd').on('click', function () {
        const tenDichVu = $('#dialog-add input[type="text"]').eq(0).val();
        const donGiaValue = $('#dialog-add input[type="text"]').eq(1).val();
        const moTaDichVu = $('#dialog-add input[type="text"]').eq(2).val();
    
        // Kiểm tra các trường dữ liệu
        if (!tenDichVu || !donGiaValue) {
            // showErrorPopup("Thêm không thành công: Tên dịch vụ và giá không được để trống!");
            notificationService.showError("Thêm không thành công: Tên dịch vụ và giá không được để trống!");
            return;
        }
    
        if (isNaN(parseFloat(donGiaValue)) || parseFloat(donGiaValue) <= 0) {
            // showErrorPopup("Thêm không thành công: Giá phải là số hợp lệ!");
            notificationService.showError("Thêm không thành công: Giá phải là số hợp lệ!");
            return;
        }
    
        const newService = {
            name: tenDichVu,
            price: parseFloat(donGiaValue),
            description: moTaDichVu || null
        };
    
        axiosJWT.post('/api/services', newService)
            .then(() => {
                loadServices();
                $('#dialog-add').modal('hide');
                // showSuccessPopup("Thêm dịch vụ thành công!");
                notificationService.showSuccess("Thêm dịch vụ thành công!");
            })
            .catch((error) => {
                console.error('Lỗi khi thêm dịch vụ:', error);
                // showErrorPopup("Thêm không thành công: Đã xảy ra lỗi từ server!");
                notificationService.showError("Thêm không thành công: Đã xảy ra lỗi từ server!");
            });
    });
    
    // Sự kiện chỉnh sửa dịch vụ
    $(document).on('click', '.m-edit', function () {
        const serviceId = $(this).data('serviceId');
        const service = services.find(s => s.id === serviceId);
    
        if (!service) {
            // showErrorPopup("Không tìm thấy dịch vụ để chỉnh sửa.");
            notificationService.showError("Không tìm thấy dịch vụ để chỉnh sửa.");
            return;
        }
    
        // Đổ dữ liệu vào modal chỉnh sửa
        $('#dialog-edit input[type="text"]').eq(0).val(service.name);
        $('#dialog-edit input[type="text"]').eq(1).val(service.price);
        $('#dialog-edit input[type="text"]').eq(2).val(service.description || '');
    
        // Xử lý sự kiện sửa
        $('#btnEdit').off('click').on('click', function () {
            const tenDichVu = $('#dialog-edit input[type="text"]').eq(0).val();
            const donGiaValue = $('#dialog-edit input[type="text"]').eq(1).val();
            const moTaDichVu = $('#dialog-edit input[type="text"]').eq(2).val();
    
            // Kiểm tra các trường dữ liệu
            if (!tenDichVu || !donGiaValue) {
                // showErrorPopup("Sửa không thành công: Tên dịch vụ và giá không được để trống!");
                notificationService.showError("Sửa không thành công: Tên dịch vụ và giá không được để trống!");
                return;
            }
    
            if (isNaN(parseFloat(donGiaValue)) || parseFloat(donGiaValue) <= 0) {
                // showErrorPopup("Sửa không thành công: Giá phải là số hợp lệ!");
                notificationService.showError("Sửa không thành công: Giá phải là số hợp lệ!");
                return;
            }
    
            const updatedService = {
                id: serviceId,
                name: tenDichVu,
                price: parseFloat(donGiaValue),
                description: moTaDichVu || null
            };
    
            axiosJWT.put(`/api/services/${serviceId}`, updatedService)
                .then(() => {
                    loadServices();
                    $('#dialog-edit').modal('hide');
                    // showSuccessPopup("Sửa dịch vụ thành công!");
                    notificationService.showSuccess("Sửa dịch vụ thành công!");
                })
                .catch((error) => {
                    console.error('Lỗi khi chỉnh sửa dịch vụ:', error);
                    // showErrorPopup("Sửa không thành công: Đã xảy ra lỗi từ server!");
                    notificationService.showError("Sửa không thành công: Đã xảy ra lỗi từ server!");
                });
        });
    });
    
    let selectedServiceId = null;
    // Sự kiện xóa dịch vụ
    $(document).on('click', '.m-delete', function () {
        const serviceId = $(this).data('serviceId');
        const service = services.find(s => s.id === serviceId);
        
        if (service) {
            $('#dialog-confirm-delete .content').text(`Bạn có chắc chắn muốn xóa dịch vụ "${service.name}"?`);
            $('#btnDelete').data('serviceId', serviceId);
        }
    });

    // Xử lý sự kiện khi xác nhận xóa trong modal
    $('#btnDelete').on('click', function () {
        const serviceId = $(this).data('serviceId');
        
        if (!serviceId) {
            // showErrorPopup('Không tìm thấy ID dịch vụ để xóa!');
            notificationService.showError('Không tìm thấy ID dịch vụ để xóa!');
            return;
        }

        axiosJWT.delete(`/api/services/${serviceId}`)
            .then(() => {
                loadServices();
                // showSuccessPopup("Xóa dịch vụ thành công!");
                notificationService.showSuccess("Xóa dịch vụ thành công!");
            })
            .catch((error) => {
                // showErrorPopup();
                notificationService.showError("Xóa dịch vụ thành công!");
                console.error('Lỗi khi xóa dịch vụ:', error);
            });
    });
});

// Hàm tải danh sách dịch vụ
function loadServices() {
    axiosJWT.get('/api/services')
        .then((response) => {
            services = response.data;
            displayServices(services);
        })
        .catch((error) => {
            // console.error('Lỗi khi tải danh sách dịch vụ:', error);
            notificationService.showError("Lỗi khi tải danh sách dịch vụ!");
        });
}

// function loadKhoas(selectId, selectedKhoaId = null) {
//     axiosJWT
//         .get(`/api/v1/Departments`)
//         .then(function (response) {
//             khoas = response.data;
//             const khoaSelect = $(`#${selectId}`); // Lấy thẻ <select> từ HTML
//             // Xóa danh sách cũ nếu có
//             khoaSelect.empty();

//             khoaSelect.append(`<option value="">Chọn khoa</option>`);
//             khoas.forEach(khoa => {
//                 const isSelected = selectedKhoaId === khoa.khoaId ? 'selected' : '';
//                 const option = `<option value="${khoa.khoaId}" ${isSelected}>${khoa.tenKhoa}</option>`;
//                 khoaSelect.append(option); // Thêm từng khoa vào <select>
//             });
//         })
//         .catch(function (error) {
//             console.error("Lỗi khi lấy danh sách khoa:", error);
//         });
// }

// Hàm hiển thị danh sách dịch vụ dưới dạng card
function displayServices(data) {
    const servicesContainer = $('#servicesContainer');
    servicesContainer.empty();

    if (data.length === 0) {
        servicesContainer.append('<div class="text-center">Không có dịch vụ nào.</div>');
        return;
    }

    data.forEach((service) => {
        const serviceCard = `
            <div class="service-card">
                <div class="service-name">${service.name}</div>
                <div class="service-price">${service.price.toLocaleString()}đ</div>
                <div class="service-description">${service.description || 'Không có mô tả'}</div>
                <div class="service-actions">
                    <div class="m-edit m-tool-icon" data-service-id="${service.id}" data-bs-toggle="modal" data-bs-target="#dialog-edit">
                        <i class="fas fa-edit text-primary"></i>
                    </div>
                    <div class="m-delete m-tool-icon" data-service-id="${service.id}" data-bs-toggle="modal" data-bs-target="#dialog-confirm-delete">
                        <i class="fas fa-trash-alt text-danger"></i>
                    </div>
                </div>
            </div>
        `;
        servicesContainer.append(serviceCard);
    });
}

// Hàm lọc danh sách dịch vụ theo từ khóa tìm kiếm
function filterServices(searchValue) {
    const filteredServices = services.filter(service =>
        removeAccents(service.name.toLowerCase()).includes(searchValue)
    );
    displayServices(filteredServices);
}

// Hàm loại bỏ dấu tiếng Việt và chuyển thành chữ thường
function removeAccents(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function showErrorPopup(errorMessage) {
    const errorPopup = document.getElementById("error-popup");
    const errorText = errorPopup.querySelector(".m-popup-text-error span");
    errorText.textContent = errorMessage || "Có lỗi xảy ra!";
    errorPopup.style.visibility = "visible";
    setTimeout(() => {
        hideErrorPopup();
    }, 3000);
}

function showSuccessPopup(message) {
    const successPopup = document.getElementById("success-popup");
    const successText = successPopup.querySelector(".m-popup-text-success span");
    successText.textContent = message || "Thành công!";
    successPopup.style.visibility = "visible";
    setTimeout(() => {
        successPopup.style.visibility = "hidden";
    }, 3000);
}

function hideErrorPopup() {
    const errorPopup = document.getElementById("error-popup");
    errorPopup.style.visibility = "hidden";
}