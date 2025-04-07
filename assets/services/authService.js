$(document).ready(function () {
    $('#loginForm').on('submit', async function (e) {
        e.preventDefault(); // Ngăn chặn form tự động submit

        // Lấy thông tin đăng nhập từ form
        const username = $("#username").val();
        const password = $("#password").val();

        try {
            // Gửi request đăng nhập
            const response = await axiosNoJWT.post("/api/auth/login", {
                username: username,
                password: password,
            });

            // Lưu accessToken và refreshToken vào localStorage
            const { accessToken, refreshToken } = response.data;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            // localStorage.setItem("userName", username);

            console.log(accessToken);
            console.log(refreshToken);
            console.log("Đăng nhập thành công, token đã được lưu");



            let token = accessToken;
            let userRole;

            if (token) {
                try {
                    let decodedToken = jwt_decode(token);
                    userRole = decodedToken.role[0].authority;
                    // localStorage.setItem('userName', username);
                    console.log(decodedToken); // In ra để kiểm tra thông tin token
                } catch (error) {
                    console.error('Token không hợp lệ:', error);
                }
            } else {
                console.error('Token rỗng hoặc không hợp lệ.');
            }

            console.log(userRole);
            // Kiểm tra role và chuyển hướng
            if (userRole === 'ROLE_admin') {
                localStorage.setItem("userName", username);
                window.location.href = '/Admin/MainAdmin.html'; // Chuyển hướng admin
                console.log(username);
                $("#displayUser").text(username);
            } else if (userRole === 'ROLE_user') {
                localStorage.setItem("userName", username);
                // Lấy User ID từ API sau khi đăng nhập thành công
                // const userId = await getUserId(username, "userId");  // Dùng await để đợi hàm getUserId
                // localStorage.setItem("userId", response.data);
                window.location.href = '/User/index.html'; // Chuyển hướng patient
            } else if (userRole === 'ROLE_doctor') {
                localStorage.setItem("doctorName", username);
                // Lấy User ID từ API sau khi đăng nhập thành công
                // const userId = await getUserId(username, "doctorId");  // Dùng await để đợi hàm getUserId
                
                window.location.href = '/Doctor/MainDoctor.html'; // Chuyển hướng doctor
            }
        } catch (error) {
            // Xử lý lỗi
            if (error.response) {
                if (error.response.status === 400) {
                    // Xử lý lỗi 400
                    console.error("Lỗi 400: Yêu cầu không hợp lệ", error.response.data);
                    showErrorPopup();
                }
            } else {
                console.error("Lỗi khi tạo yêu cầu:", error.message);
                alert("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
            }
        }
    });


    $('#registerForm').on('submit', function (e) {
        e.preventDefault();

        let email = $('#email').val();
        let username = $('#username').val();
        let password = $('#password').val();
        if (!kiemTraMatKhau(password)) {

        }

        if (!username || !email || !password) {
            alert("Hãy điền đầy đủ thông tin!");
            return;
        }
        // Gửi request đăng ký
        axiosNoJWT
            .post("/api/auth/register", {
                username: username,
                email: email,
                fullName: username,
                password: password
            })
            .then(function (response) {
                if (response.status === 200) {
                    console.log('Đăng ký thành công:', response);
                    showSuccessPopup();
                    setTimeout(() => {
                        window.location.href = "login.html";
                    }, 3000);

                }
                else {
                    console.log('Đăng ký thất bại:', response.message);
                }
            })
            .catch(function (error) {
                showErrorPopup();
                console.error("Lỗi khi đăng ký:", error);
            });
    });


    async function getUserId(username, Id) {
        // Giả sử có một API gọi đến backend để lấy ID người dùng
        try {
            const response = await axiosJWT.get(`/api/Auth/${username}`);
            localStorage.setItem(Id, response.data);
            return response.data.userId;  // Trả về userId sau khi nhận được từ API
        } catch (error) {
            console.error("Lỗi khi lấy UserId:", error);
            throw error;  // Ném lỗi để catch ở ngoài
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
});