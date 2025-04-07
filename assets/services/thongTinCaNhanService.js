var bn;
$(document).ready(function () {

    getData();

    $('#suaThongTin').on('submit', async function (e) {
        e.preventDefault();
        let imgUrl;  // Khai báo imgUrl ở bên ngoài để sử dụng trong toàn bộ hàm
        let fileInput = document.getElementById('fileInput');
        let file = fileInput.files[0];

        // Nếu có file, upload file trước khi gửi request cập nhật bệnh nhân
        if (file) {
            try {
                // Tạo đối tượng FormData và append file vào đó
                var formData = new FormData();
                formData.append("file", file);

                // Sử dụng Axios để gửi file và chờ đợi kết quả
                const response = await axiosJWT.post('/api/Files/upload', formData);

                // Thành công, nhận URL từ phản hồi
                console.log("File URL: ", response.data.fileUrl);
                imgUrl = response.data.fileUrl;

                // Hiển thị ảnh vừa upload (nếu cần)


            } catch (error) {
                console.error("Lỗi khi upload file:", error);
                return;  // Nếu upload file thất bại, không tiếp tục gửi yêu cầu cập nhật bệnh nhân
            }
        }

        // Sau khi upload file thành công (hoặc không có file),
        let ngaySinh;
        if ($("#ngaysinh").val() != "") {
            ngaySinh = $("#ngaysinh").val() + "T00:00:00";
        }
        let checkedRadio = $('input[name="gender"]:checked');
        let valueGT = checkedRadio.val();

        try {
            const updateResponse = await axiosJWT.put(`/api/Patients/${bn.benhNhanId}`, {
                benhNhanId: bn.benhNhanId,
                maBenhNhan: bn.maBenhNhan,
                hoTen: $("#hoten").val(),
                hinhAnh: imgUrl,  // imgUrl có thể là null nếu không có file
                ngaySinh: ngaySinh,
                loaiGioiTinh: parseInt(valueGT),
                soDienThoai: $("#sdt").val(),
                email: $("#email").val(),
                diaChi: $("#diachi").val(),
                tienSuBenhLy: $("#tiensubenhly").val()
            });

            console.log('Cập nhật thông tin thành công:', updateResponse);
            getData();

            showSuccessPopup();
        } catch (error) {
            showErrorPopup();
            console.error("Lỗi khi cập nhật thông tin bệnh nhân:", error);
        }
    });

    $("#savePasswordBtn").click(function () {
        let currentPassword = $("#currentPassword").val();
        let newPassword = $("#newPassword").val();
        let username = localStorage.getItem('userName');
        var change = {
            username: username,
            currentPassword: currentPassword,
            newPassword: newPassword
        }
        console.log(change);
        axiosJWT
            .post(`/api/Auth/change-password`, change)
            .then(function (response) {
                showSuccessPopup();
            })
            .catch(function (error) {
                showErrorPopup();
            });
    });

});
function checkConfirm() {
    let newPassword = $("#newPassword").val();
    let confirmPassword = $("#confirmPassword").val();
    if (newPassword != confirmPassword) {
        $("#msg").text("Mật khẩu xác nhận không giống!");
        $("#savePasswordBtn").prop("disabled", true);  // Disable button
    }
    else {
        $("#msg").text("");
        $("#savePasswordBtn").prop("disabled", false);  // Disable button

    }
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
    var username = localStorage.getItem("userName");
    $("#hotenHeader").text(bn.hoTen);
    $("#username").val(username);
    $("#hoten").val(bn.hoTen);
    $("#email").val(bn.email);
    $("#sdt").val(bn.soDienThoai);
    $("#diachi").val(bn.diaChi);
    $("#tiensubenhly").val(bn.tienSuBenhLy);
    if (bn.gioiTinh == "Nam")
        $('#male').prop('checked', true);
    else if (bn.gioiTinh == "Nữ")
        $('#female').prop('checked', true);
    else
        $('#other').prop('checked', true);
    // Lấy phần ngày bằng cách cắt chuỗi trước ký tự 'T'
    if (bn.ngaySinh != null) {
        let formattedDate = bn.ngaySinh.split('T')[0];
        $("#ngaysinh").val(formattedDate);
    }
    // document.getElementById('uploadedImage').src = "http://localhost:37649" + response.data.fileUrl;
    if (bn.hinhAnh != null) {
        $('#uploadedImage').attr('src', "http://localhost:37649" + bn.hinhAnh);
    }
}


// "benhNhanId": "23ae6817-b672-4630-a67c-cfecbbc065d0",
//         "maBenhNhan": "BN009",
//         "hoTen": "Nguyen Khac Canh",
//         "hinhAnh": "canh.jpg",
//         "ngaySinh": "1985-08-15T00:00:00",
//         "loaiGioiTinh": 0,
//         "gioiTinh": "Nam",
//         "soDienThoai": "0987654321",
//         "email": "lethib@example.com",
//         "diaChi": "456 Hai Ba Trung, Hanoi",
//         "tienSuBenhLy": "Tiền sử tiểu đường"
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
function showSuccessPopup() {
    // Hiển thị popup
    const popup = document.getElementById("success-popup");
    popup.style.visibility = "visible";  // Hoặc có thể dùng popup.classList.add('visible');

    // Tự động ẩn popup sau 3 giây (3000ms)
    setTimeout(() => {
        closePopup();
    }, 3000);
}

function closePopup() {
    const popup = document.getElementById("success-popup");
    popup.style.visibility = "hidden";  // Ẩn popup
}