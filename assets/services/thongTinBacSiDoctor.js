var bs;
$(document).ready(function () {
    getDataDoctorsInfo();
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

        try {
            const bangCapValue = parseInt($("#bangCap").val());
            const updatedDoctorData  = await axiosJWT.put(`/api/Doctors/${bs.bacSiId}`, {
                bacSiId: bs.bacSiId,
                maBacSi: bs.maBacSi, 
                hoTen: $("#hoten").val(),
                hinhAnh: imgUrl,  // imgUrl có thể là null nếu không có file
                // ngaySinh: ngaySinh,
                // loaiGioiTinh: parseInt(valueGT),
                bangCap: bangCapValue,
                soDienThoai: $("#sdt").val(),
                email: $("#email").val(),
                diaChi: $("#diaChi").val(),
                soNamKinhNghiem: $("#namKinhNghiem").val()
            });
            // Gửi yêu cầu PUT tới API
            // const updateResponse = await axiosJWT.put(`/api/Doctors/${bs.bacSiId}`, updatedDoctorData);

            console.log('Cập nhật thông tin thành công:', updatedDoctorData);
            getDataDoctorsInfo();

            showSuccessPopup();
        } catch (error) {
            showErrorPopup();
            console.error("Lỗi khi cập nhật thông tin bác sĩ:", error);
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

function getDataDoctorsInfo() {
    var userId = localStorage.getItem("doctorId");
    console.log(userId);
    // $('#hotenHeader').text(localStorage.getItem(loggedInUsername));
    axiosJWT
        .get(`/api/Doctors/getbyuserid/${userId}`)
        .then(function (response) {
            bs = response.data;
            displayDoctorsInfo();
            getAvata();
        })
        .catch(function (error) {
            showErrorPopup();
            console.error("Lỗi không tìm được:", error);
        });
}

function displayDoctorsInfo() {
    console.log(bs);
    var username = localStorage.getItem("doctorName");
    $("#hotenHeader").text(bs.hoTen);
    $("#username").val(username);
    $("#hoten").val(bs.hoTen);
    // Dùng một mapping giữa tên bằng cấp và giá trị của option
    var bangCapMapping = {
        "Giáo sư Y khoa": "0",
        "Phó Giáo sư Y khoa": "1",
        "Tiến sĩ Y khoa": "2",
        "Bác sĩ Chuyên khoa 2": "3",
        "Thạc sĩ Y khoa": "4",
        "Bác sĩ Chuyên khoa 1": "5",
        "Bác sĩ Đa khoa": "6"
    };

    // Gán giá trị của option phù hợp với tên bằng cấp
    var bangCapValue = bangCapMapping[bs.tenBangCap];
    if (bangCapValue !== undefined) {
        $("#bangCap").val(bangCapValue);
    } else {
        console.warn("Không tìm thấy bằng cấp phù hợp với tên: " + bs.tenBangCap);
    }
    $("#email").val(bs.email);
    $("#sdt").val(bs.soDienThoai);
    $("#diaChi").val(bs.diaChi);
    $("#namKinhNghiem").val(bs.soNamKinhNghiem);

    // document.getElementById('uploadedImage').src = "http://localhost:37649" + response.data.fileUrl;
    if (bs.hinhAnh != null) {
        $('#uploadedImage').attr('src', "http://localhost:37649" + bs.hinhAnh);
    }
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