let results = []; // Biến lưu trữ toàn bộ danh sách kết quả
var bsId;
var tenBN;

$(document).ready(async function () {

    await getDoctorId();


    loadResults(); // Tải danh sách kết quả khi trang được load



    // Sự kiện chỉnh sửa dịch vụ
    $(document).on('click', '.m-edit', function () {
        const resultId = $(this).data('resultId');
        const result = results.find(s => s.ketQuaKhamId === resultId);
        // const lichKhamId = result.lichKhamId;
        // console.log(lichKhamId)

        console.log('resultId:  ', resultId)

        if (!result) {
            showErrorPopup("Không tìm thấy kết quả để chỉnh sửa.");
            return;
        }

        // Đổ dữ liệu vào modal chỉnh sửa
        $('#dialog-edit input[type="text"]').eq(0).val(result.chanDoan);
        $('#dialog-edit input[type="text"]').eq(1).val(result.chiDinhThuoc);
        $('#dialog-edit input[type="text"]').eq(2).val(result.ghiChu);

        // Xử lý sự kiện sửa
        $('#btnEdit').off('click').on('click', function () {
            console.log("Đang xử lý sửa...");
            const chanDoan = $('#dialog-edit input[type="text"]').eq(0).val();
            const chiDinhThuoc = $('#dialog-edit input[type="text"]').eq(1).val();
            const ghiChu = $('#dialog-edit input[type="text"]').eq(2).val();

            // Kiểm tra các trường dữ liệu
            if (!chanDoan) {
                showErrorPopup("Sửa không thành công: Chẩn đoán không được để trống!");
                return;
            }

            

            const updatedResult = {
                ketQuaKhamId: resultId,
                lichKhamId: result.lichKhamId,
                chanDoan: chanDoan,
                chiDinhThuoc: chiDinhThuoc,
                ghiChu: ghiChu,
            };
            console.log(updatedResult)

            axiosJWT.put(`/api/Results/${resultId}`, updatedResult)
                .then((response) => {
                    console.log("Dữ liệu đã được cập nhật: ", response.data); // Lấy dữ liệu từ response
                    loadResults(); // Tải lại danh sách
                    $('#dialog-edit').modal('hide'); // Đóng modal
                    showSuccessPopup("Sửa kết quả thành công!"); // Thông báo thành công
                })
                .catch((error) => {
                    console.error('Lỗi khi chỉnh sửa kết quả:', error);
                    showErrorPopup("Sửa không thành công: Đã xảy ra lỗi từ server!");
                });

        });
    });




});


async function getDoctorId() {
    try {
        let userId = localStorage.getItem("doctorId");
        const response = await axiosJWT.get(`/api/Doctors/getbyuserid/${userId}`);
        bsId = response.data.bacSiId; // Lấy giá trị ID bác sĩ
    } catch (error) {
        console.error("Lỗi khi gọi API:", error);
    }
}

async function getTenBenhNhan(lichKhamId) {
    try {
        // Gọi API lấy tên bệnh nhân từ lichKhamId
        const response = await axiosJWT.get(`/api/Results/tenbenhnhan/${lichKhamId}`);
        return response.data; // Giả sử API trả về trực tiếp tên bệnh nhân
    } catch (error) {
        console.error("Lỗi khi lấy tên bệnh nhân:", error);
        return "Không có tên bệnh nhân"; // Trả về giá trị mặc định nếu có lỗi
    }
}


// Hàm tải danh sách dịch vụ
function loadResults() {
    axiosJWT.get(`/api/Results/doctor/${bsId}`)
        .then((response) => {
            results = response.data;
            displayResults(results); // Hiển thị danh sách kết quả
        })
        .catch((error) => {
            console.error('Lỗi khi tải danh sách kết quả:', error);
        });
}

// Hàm hiển thị danh sách kết quả
async function displayResults(results) {
    const resultTableBody = $('#tblData'); // Xác định phần tbody của bảng
    resultTableBody.empty(); // Xóa nội dung cũ trước khi thêm mới

    if (results.length === 0) {
        resultTableBody.append('<tr><td colspan="9">Không có kết quả khám nào.</td></tr>'); // Hiển thị thông báo nếu không có dữ liệu
        return;
    }

    // Lặp qua danh sách kết quả và tạo từng dòng
    // Lặp qua danh sách kết quả và tạo từng dòng
    for (const [index, result] of results.entries()) {
        let tenBenhNhan = "Đang tải..."; // Giá trị mặc định trong khi đợi API trả về

        try {
            tenBenhNhan = await getTenBenhNhan(result.lichKhamId); // Gọi API lấy tên bệnh nhân
        } catch (error) {
            console.error("Lỗi khi lấy tên bệnh nhân:", error);
        }

        const resultRow = `
            <tr>
                <td style="display: none">${result.ketQuaKhamId}</td>
                <td>${index + 1}</td>
                <td>${tenBenhNhan}</td> <!-- Thêm cột tên bệnh nhân -->
                <td>${formatDate(result.ngayTao)}</td>
                <td>${result.chanDoan || "Không có chẩn đoán"}</td>
                <td>${result.chiDinhThuoc || "Không có chỉ định thuốc"}</td>
                <td>${result.ghiChu || "Không có ghi chú"}</td>
                <td>${formatDate(result.ngayTao)}</td>
                <td>${formatDate(result.ngayCapNhat)}</td>
                <td>
                    <div class="m-table-tool">
                        <div class="m-edit m-tool-icon" data-result-id="${result.ketQuaKhamId}" data-bs-toggle="modal" data-bs-target="#dialog-edit">
                            <i class="fas fa-edit text-primary"></i>
                        </div>
                    </div>
                </td>
            </tr>
        `;
        resultTableBody.append(resultRow); // Thêm dòng vào bảng
    }
}

// Hàm formatDate (giả định rằng bạn có một hàm này để định dạng ngày tháng)
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN'); // Định dạng ngày theo kiểu Việt Nam (dd/mm/yyyy)
}


// Hàm định dạng ngày (nếu ngày không null)
function formatDate(dateString) {
    if (!dateString) return "Không có dữ liệu";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN'); // Định dạng theo ngày Việt Nam
}