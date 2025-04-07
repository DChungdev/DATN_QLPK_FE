let patients = [];
var dsBN;
var bsId = "";
var patientId;
$(document).ready(async function () {
    await getDoctorId();
    getData();
});



function getData() {
    console.log(bsId);
    axiosJWT
        .get(`/api/Patients/getbydoctorid/${bsId}`)
        .then(function (response) {
            dsBN = response.data;
            console.log(dsBN);
            display(dsBN);
        })
        .catch(function (error) {
            console.error("Lỗi không tìm được:", error);
        });
}

function display(data) {
    const tableBody = document.querySelector('#tblBenhNhan tbody');
    tableBody.innerHTML = ''; // Xóa nội dung cũ nếu có

    data.forEach((item, index) => {
        const row = `
      <tr bn-id="${item.benhNhanId}">
        <td class="chk">
          <input type="checkbox" />
        </td>
        <td class="m-data-left">${index + 1}</td>
        <td class="m-data-left">${item.maBenhNhan}</td>
        <td class="m-data-left">${item.hoTen}</td>
        <td class="m-data-left">${item.gioiTinh || "Không xác định"}</td>
        <td class="m-data-left">${formatDate(item.ngaySinh)}</td>
        <td class="m-data-left">${item.email || "Chưa có email"}</td>
        <td class="m-data-left">${item.diaChi || "Chưa có địa chỉ"}</td>
        <td>
            <div class="m-table-tool">
                <div class="m-edit m-tool-icon" data-patient-id="${item.benhNhanId}" data-bs-toggle="modal" data-bs-target="#dialog-edit">
                    <i class="fas fa-eye text-primary"></i>
                </div>
            </div>
        </td>
    `;
        tableBody.innerHTML += row; // Thêm hàng vào bảng
    });
}

// Sự kiện xem kết quả khám
$(document).on('click', '.m-edit', function () {
    patientId = $(this).data('patientId');
    console.log('patientId:  ', patientId);
    loadResults(patientId);

});

function loadResults(patientId) {
    axiosJWT.get(`/api/Results/ketquakham/${patientId}`)
        .then((response) => {
            const results = response.data;
            if (!results || results.length === 0) {
                console.log("Không có kết quả khám nào.");
                return;
            }
            console.log("Kết quả: ", results);
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
                <td>${formatDate(result.ngayTao)}</td>
                <td>${result.chanDoan || "Không có chẩn đoán"}</td>
                <td>${result.chiDinhThuoc || "Không có chỉ định thuốc"}</td>
                <td>${result.ghiChu || "Không có ghi chú"}</td>
            </tr>
        `;
        resultTableBody.append(resultRow); // Thêm dòng vào bảng
    }
}

function formatDate(dateString) {
    if (!dateString) return "Không xác định";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

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
