var bn;
$(document).ready(function () {
    console.log(localStorage.getItem("userId"));
    console.log(localStorage.getItem("userName"));
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
                const response = await axiosJWT.post('/api/upload/image', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                // Thành công, nhận URL từ phản hồi
                console.log("File URL: ", response.data);
                imgUrl = response.data;

            } catch (error) {
                console.error("Lỗi khi upload file:", error);
                showErrorPopup(error);
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
        const patient = {
            patientId: bn.patientId,
            fullName: $("#hoten").val(),
            image: imgUrl,
            dateOfBirth: ngaySinh,
            gender: valueGT, 
            phone: $("#sdt").val(),
            address: $("#diachi").val()
        };
        console.log('Patient data:', patient);

        try {
            const updateResponse = await axiosJWT.put(`/api/patients/${bn.patientId}`, {
                patientId: bn.patientId,
                fullName: $("#hoten").val(),
                image: imgUrl,  // imgUrl có thể là null nếu không có file
                dateOfBirth: ngaySinh,
                gender: valueGT,
                phone: $("#sdt").val(),
                address: $("#diachi").val()
            });

            console.log('Cập nhật thông tin thành công:', updateResponse);
            getData();
            showSuccessPopup();
        } catch (error) {
            showErrorPopup(error);
            console.error("Lỗi khi cập nhật thông tin bệnh nhân:", error);
        }
    });

    $("#savePasswordBtn").click(function () {
        let currentPassword = $("#currentPassword").val();
        let newPassword = $("#newPassword").val();
        let username = localStorage.getItem('userName');
        var change = {
            username: username,
            oldPassword: currentPassword,
            newPassword: newPassword
        }
        console.log(change);
        axiosJWT
            .post(`/api/auth/change-password`, change)
            .then(function (response) {
                showSuccessPopup();
            })
            .catch(function (error) {
                showErrorPopup(error);
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
    var userName = localStorage.getItem("userName");
    console.log(userName);
    axiosJWT
        .get(`/api/patients/findbyUsername/${userName}`)
        .then(function (response) {
            bn = response.data;
            console.log(bn);
            localStorage.setItem("userId", bn.patientId);
            display();
        })
        .catch(function (error) {
            showErrorPopup(error);
            console.error("Lỗi không tìm được:", error);
        });
}
function display() {
    console.log(bn);
    var username = localStorage.getItem("userName");
    $("#hotenHeader").text(bn.fullName);
    $("#username").val(username);
    $("#hoten").val(bn.fullName);
    $("#email").val(bn.email || '');
    $("#sdt").val(bn.phone || '');
    $("#diachi").val(bn.address || '');
    $("#tiensubenhly").val(bn.tienSuBenhLy || '');
    
    // Set gender radio buttons based on gender value
    if (bn.gender === "Nam") {
        $('#male').prop('checked', true);
    } else if (bn.gender === "Nữ") {
        $('#female').prop('checked', true);
    } else {
        $('#other').prop('checked', true);
    }

    // Set date of birth if available
    if (bn.dateOfBirth) {
        let formattedDate = bn.dateOfBirth.split('T')[0];
        $("#ngaysinh").val(formattedDate);
    } else {
        $("#ngaysinh").val('');
    }

    // Set image if available
    if (bn.image) {
        $('#uploadedImage').attr('src', "http://localhost:8080" + bn.image);
    } else {
        $('#uploadedImage').attr('src', "http://localhost:8080/uploads/no-img.jpg");
    }
}


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
function showErrorPopup(errorMessage = "Có lỗi xảy ra!") {
    const errorPopup = document.getElementById("error-popup");
    const errorText = errorPopup.querySelector(".m-popup-text-error span");
    
    // Xử lý errorMessage có thể là string hoặc object
    let displayMessage = errorMessage;
    if (typeof errorMessage === 'object') {
        // Nếu là response từ server
        if (errorMessage.response?.data) {
            displayMessage = errorMessage.response.data;
        } else if (errorMessage.message) {
            displayMessage = errorMessage.message;
        }
    }
    
    errorText.textContent = displayMessage;
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
    const successPopup = document.getElementById("success-popup");
    successPopup.style.visibility = "visible";

    // Ẩn popup sau 3 giây
    setTimeout(() => {
        successPopup.style.visibility = "hidden";
    }, 3000);
}