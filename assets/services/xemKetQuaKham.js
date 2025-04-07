let results = []; // Biến lưu trữ toàn bộ danh sách kết quả
var bnId;
var bn;
$(document).ready(async function () {
    await getBNId();
    console.error('bnId đã lấy được là ', bnId);

    loadResults(); // Tải danh sách kết quả khi trang được load
});


async function getBNId() {
    try {
        let userId = localStorage.getItem("userId");
        const response = await axiosJWT.get(`/api/Patients/getbyuserid/${userId}`);
        bnId = response.data.benhNhanId; // Lấy giá trị ID bác sĩ
        console.error('bnId đã lấy được là ', bnId);

    } catch (error) {
        console.error("Lỗi khi gọi API:", error);
    }
}

function loadResults() {
    axiosJWT.get(`api/Results/ketquakham/${bnId}`)
        .then((response) => {
            results = response.data;
            console.log('ket qua : ', results);
            displayResults(results); // Hiển thị danh sách kết quả
        })
        .catch((error) => {
            console.error('Lỗi khi tải danh sách kết quả:', error);
        });
}

function getData() {
    var userId = localStorage.getItem("userId");
    console.log(userId);
    // $('#hotenHeader').text(localStorage.getItem(loggedInUsername));
    axiosJWT
        .get(`/api/Patients/getbyuserid/${userId}`)
        .then(function (response) {
            bn = response.data;
            display();
            getAvata();
        })
        .catch(function (error) {
            showErrorPopup();
            console.error("Lỗi không tìm được:", error);
        });
}

function display() {
    console.log(bn);
    $("#hotenHeader").text(bn.hoTen);
    // document.getElementById('uploadedImage').src = "http://localhost:37649" + response.data.fileUrl;
    if (bn.hinhAnh != null) {
        $('#uploadedImage').attr('src', "http://localhost:37649" + bn.hinhAnh);
    }
}

// Hàm hiển thị danh sách kết quả
function displayResults(results) {
    const resultTableBody = $('#resultList'); // Xác định phần tbody của bảng
    resultTableBody.empty(); // Xóa nội dung cũ trước khi thêm mới

    if (results.length === 0) {
        resultTableBody.append('<tr><td colspan="9">Không có kết quả khám nào.</td></tr>'); // Hiển thị thông báo nếu không có dữ liệu
        return;
    }

    // Lặp qua danh sách kết quả và tạo từng dòng
    results.forEach((result, index) => {
        const resultRow = `
            <tr>
                <td>${formatDate(result.ngayTao)}</td>           
                <td>${result.chanDoan || "Không có chẩn đoán"}</td>
                <td>${result.chiDinhThuoc || "Không có chỉ định thuốc"}</td>
                <td>${result.ghiChu || "Không có ghi chú"}</td>

            </tr>
        `;
        resultTableBody.append(resultRow); // Thêm dòng vào bảng
        console.log("abc", result)
    });
}
// Hàm định dạng ngày (nếu ngày không null)
function formatDate(dateString) {
    if (!dateString) return "Không có dữ liệu";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN'); // Định dạng theo ngày Việt Nam
}

function showErrorPopup() {
    const errorPopup = document.getElementById("error-popup");
    errorPopup.style.visibility = "visible";

    // Ẩn popup sau 3 giây
    setTimeout(() => {
        hideErrorPopup();
    }, 3000);
}
function hideErrorPopup() {
    const errorPopup = document.getElementById("error-popup");
    errorPopup.style.visibility = "hidden";
}