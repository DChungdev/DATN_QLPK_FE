let services = []; // Biến lưu trữ toàn bộ danh sách dịch vụ
let khoas = []; 
$(document).ready(function () {
    loadServices(); // Tải danh sách dịch vụ khi trang được load
    loadKhoas(); // Gọi hàm để tải danh sách khoa
    $(".m-input-search").on("input", function () {
        const searchValue = removeAccents($(this).val().toLowerCase()); // Lấy giá trị nhập vào và chuẩn hóa
        filterServices(searchValue); // Gọi hàm lọc danh sách
    });
    
    // Gắn sự kiện cho nút hiển thị modal Thêm
    $("#btnThemMoi").click(function(){
        let maDVNext = getMaxDichVuCode(services);
        $('#dialog-add input[type="text"]').val(""); 
        $('#khoaSelect').val("");
        $('#dialog-add input[type="text"]').eq(1).val(maDVNext);
        loadKhoas('khoaSelect');

    })

    // Sự kiện thêm mới dịch vụ
    $('#btnAdd').on('click', function () {
        const khoaIdValue = $('#khoaSelect').val(); // Lấy giá trị khoa từ dropdown
        const tenDichVu = $('#dialog-add input[type="text"]').eq(0).val();
        const maDichVu = $('#dialog-add input[type="text"]').eq(1).val();
        const donGiaValue = $('#dialog-add input[type="text"]').eq(2).val();
        const moTaDichVu = $('#dialog-add input[type="text"]').eq(3).val();
        const ngayTao = $('#dialog-add input[type="date"]').val();
    
        // Kiểm tra các trường dữ liệu
        if (!tenDichVu || !donGiaValue) {
            showErrorPopup("Thêm không thành công: Tên dịch vụ và giá không được để trống!");
            return;
        }
    
        if (isNaN(parseFloat(donGiaValue)) || parseFloat(donGiaValue) <= 0) {
            showErrorPopup("Thêm không thành công: Giá phải là số hợp lệ!");
            return;
        }
    
        const newService = {
            maDichVu: maDichVu,
            tenDichVu: tenDichVu,
            donGia: parseFloat(donGiaValue),
            ngayTao: ngayTao,
            moTaDichVu: moTaDichVu,
            khoaId: khoaIdValue === "" ? null : khoaIdValue // Nếu không chọn thì để null
        };
    
        axiosJWT.post('/api/Services', newService)
            .then(() => {
                loadServices(); // Tải lại danh sách
                $('#dialog-add').modal('hide'); // Đóng modal
                showSuccessPopup("Thêm dịch vụ thành công!"); // Thông báo thành công
            })
            .catch((error) => {
                console.error('Lỗi khi thêm dịch vụ:', error);
                showErrorPopup("Thêm không thành công: Đã xảy ra lỗi từ server!");
            });
    });
    
    // Sự kiện chỉnh sửa dịch vụ
    $(document).on('click', '.m-edit', function () {
        const serviceId = $(this).data('serviceId');
        const service = services.find(s => s.dichVuId === serviceId);
    
        if (!service) {
            showErrorPopup("Không tìm thấy dịch vụ để chỉnh sửa.");
            return;
        }
    
        // Đổ dữ liệu vào modal chỉnh sửa
        $('#dialog-edit input[type="text"]').eq(0).val(service.tenDichVu);
        $('#dialog-edit input[type="text"]').eq(1).val(service.maDichVu);
        $('#dialog-edit input[type="text"]').eq(2).val(service.donGia);
        $('#dialog-edit input[type="date"]').eq(0).val(service.ngayTao.split('T')[0]);
        $('#dialog-edit input[type="text"]').eq(3).val(service.moTaDichVu);
        loadKhoas('editKhoaSelect', service.khoaId); // Hiển thị danh sách khoa với khoa hiện tại được chọn
    
        // Xử lý sự kiện sửa
        $('#btnEdit').off('click').on('click', function () {
            const khoaIdValue = $('#editKhoaSelect').val(); // Lấy giá trị từ dropdown
            const tenDichVu = $('#dialog-edit input[type="text"]').eq(0).val();
            const maDichVu = $('#dialog-edit input[type="text"]').eq(1).val();
            const donGiaValue = $('#dialog-edit input[type="text"]').eq(2).val();
            const moTaDichVu = $('#dialog-edit input[type="text"]').eq(3).val();
            const ngayCapNhat = $('#dialog-edit input[type="date"]').eq(1).val();
    
            // Kiểm tra các trường dữ liệu
            if (!tenDichVu || !donGiaValue) {
                showErrorPopup("Sửa không thành công: Tên dịch vụ và giá không được để trống!");
                return;
            }
    
            if (isNaN(parseFloat(donGiaValue)) || parseFloat(donGiaValue) <= 0) {
                showErrorPopup("Sửa không thành công: Giá phải là số hợp lệ!");
                return;
            }
    
            const updatedService = {
                dichVuId: serviceId,
                maDichVu: maDichVu,
                tenDichVu: tenDichVu,
                donGia: parseFloat(donGiaValue),
                ngayCapNhat: ngayCapNhat,
                moTaDichVu: moTaDichVu,
                khoaId: khoaIdValue === "" ? null : khoaIdValue // Nếu không chọn thì để null
            };
    
            axiosJWT.put(`/api/Services/${serviceId}`, updatedService)
                .then(() => {
                    loadServices(); // Tải lại danh sách
                    $('#dialog-edit').modal('hide'); // Đóng modal
                    showSuccessPopup("Sửa dịch vụ thành công!"); // Thông báo thành công
                })
                .catch((error) => {
                    console.error('Lỗi khi chỉnh sửa dịch vụ:', error);
                    showErrorPopup("Sửa không thành công: Đã xảy ra lỗi từ server!");
                });
        });
    });
    


    let selectedServiceId = null;
    // Sự kiện xóa dịch vụ
    $(document).on('click', '.m-delete', function () {
        selectedServiceId = $(this).data('service-id'); // Lấy ID dịch vụ từ nút
        const serviceName = $(this).closest('tr').find('td').eq(2).text(); // Tên dịch vụ từ cột thứ 4
        $('#dialog-confirm-delete .content').text(`Bạn có chắc chắn muốn xóa dịch vụ "${serviceName}"?`);
    });

    // Xử lý sự kiện khi xác nhận xóa trong modal
    $('#btnDelete').on('click', function () {
        if (!selectedServiceId) {
            showErrorPopup('Không tìm thấy ID dịch vụ để xóa!');
            return;
        }

        // Gọi API xóa dịch vụ
        axiosJWT
            .delete(`/api/Services/${selectedServiceId}`)
            .then(() => {
                loadServices(); // Tải lại danh sách dịch vụ
                showSuccessPopup("Xóa dịch vụ thành công!"); // Thông báo thành công
            })
            .catch((error) => {
                showErrorPopup();
                console.error('Lỗi khi xóa dịch vụ:', error);
            })
            .finally(() => {
                selectedServiceId = null; // Reset ID sau khi xóa
            });
    });
});

// Hàm tải danh sách dịch vụ
function loadServices() {
    axiosJWT.get('/api/Services')
        .then((response) => {
            services = response.data;
            displayServices(services); // Hiển thị danh sách dịch vụ
        })
        .catch((error) => {
            console.error('Lỗi khi tải danh sách dịch vụ:', error);
        });
}

function loadKhoas(selectId, selectedKhoaId = null) {
    axiosJWT
        .get(`/api/v1/Departments`)
        .then(function (response) {
            khoas = response.data;
            const khoaSelect = $(`#${selectId}`); // Lấy thẻ <select> từ HTML
            // Xóa danh sách cũ nếu có
            khoaSelect.empty();

            khoaSelect.append(`<option value="">Chọn khoa</option>`);
            khoas.forEach(khoa => {
                const isSelected = selectedKhoaId === khoa.khoaId ? 'selected' : '';
                const option = `<option value="${khoa.khoaId}" ${isSelected}>${khoa.tenKhoa}</option>`;
                khoaSelect.append(option); // Thêm từng khoa vào <select>
            });
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy danh sách khoa:", error);
        });
}


// Hàm hiển thị danh sách dịch vụ
function displayServices(data) {
    const serviceTableBody = $('#tblData'); // Xác định phần tbody
    serviceTableBody.empty(); // Xóa nội dung cũ trước khi thêm mới

    if (data.length === 0) {
        serviceTableBody.append('<tr><td colspan="9">Không có dịch vụ nào.</td></tr>'); // Hiển thị thông báo nếu không có dữ liệu
        return;
    }

    // Lặp qua danh sách dịch vụ và tạo từng dòng
    data.forEach((service, index) => {
        const khoa = khoas.find(k => k.khoaId === service.khoaId);
        const khoaName = khoa ? khoa.tenKhoa : "Chưa phân khoa";
        const serviceRow = `
            <tr>
                <td empIdCell style="display: none">${service.dichVuId}</td>
                <td>${index + 1}</td>
                <td>${service.tenDichVu}</td>
                <td>${service.donGia.toLocaleString()}đ</td>
                <td>${khoaName}</td> <!-- Hiển thị tên khoa -->
                <td>${service.moTaDichVu || "Không có mô tả"}</td>
                <td>${formatDate(service.ngayTao)}</td>
                <td>${formatDate(service.ngayCapNhat)}</td>
                <td>
                  <div class="m-table-tool">
                    <div class="m-edit m-tool-icon" data-service-id="${service.dichVuId}" data-bs-toggle="modal" data-bs-target="#dialog-edit">
                      <i class="fas fa-edit text-primary"></i>
                    </div>
                    <div class="m-delete m-tool-icon" data-service-id="${service.dichVuId}" data-bs-toggle="modal" data-bs-target="#dialog-confirm-delete">
                      <i class="fas fa-trash-alt text-danger"></i>
                    </div>
                  </div>
                </td>
            </tr>
        `;
        serviceTableBody.append(serviceRow); // Thêm dòng vào bảng
    });
}

// Hàm định dạng ngày (nếu ngày không null)
function formatDate(dateString) {
    if (!dateString) return "Không có dữ liệu";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN'); // Định dạng theo ngày Việt Nam
}

function showErrorPopup(errorMessage) {
    const errorPopup = document.getElementById("error-popup");
    const errorText = errorPopup.querySelector(".m-popup-text-error span");

    // Hiển thị thông báo lỗi tùy chỉnh
    errorText.textContent = errorMessage || "Có lỗi xảy ra!";
    errorPopup.style.visibility = "visible";

    // Ẩn popup sau 3 giây
    setTimeout(() => {
        hideErrorPopup();
    }, 3000);
}

function showSuccessPopup(message) {
    const successPopup = document.getElementById("success-popup");
    const successText = successPopup.querySelector(".m-popup-text-success span");

    successText.textContent = message || "Thành công!";
    successPopup.style.visibility = "visible";

    // Ẩn popup sau 3 giây
    setTimeout(() => {
        successPopup.style.visibility = "hidden";
    }, 3000);
}


function hideErrorPopup() {
    const errorPopup = document.getElementById("error-popup");
    errorPopup.style.visibility = "hidden";
}

function getMaxDichVuCode(service) {
    let maxCode = 0;
    service.forEach(item => {
        const code = parseInt(item.maDichVu.replace('DV', '')); // Loại bỏ 'BN' và chuyển thành số
        if (code > maxCode) {
            maxCode = code;
        }
    });
    const nextCode = maxCode + 1;
    return 'DV' + nextCode.toString().padStart(3, '0');
}

// Hàm lọc danh sách dịch vụ theo từ khóa tìm kiếm
function filterServices(searchValue) {
    const filteredServices = services.filter(service =>
        removeAccents(service.tenDichVu.toLowerCase()).includes(searchValue)
    );
    displayServices(filteredServices); // Hiển thị danh sách sau khi lọc
}

// Hàm loại bỏ dấu tiếng Việt và chuyển thành chữ thường
function removeAccents(str) {
    return str
        .normalize("NFD") // Chuẩn hóa chuỗi Unicode
        .replace(/[\u0300-\u036f]/g, "") // Loại bỏ các dấu tiếng Việt
        .toLowerCase(); // Chuyển thành chữ thường
}