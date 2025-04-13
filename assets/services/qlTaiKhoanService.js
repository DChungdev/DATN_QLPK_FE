var dsTK;
var accountId;
var selectedUsername;
$(document).ready(function () {
  $("#refresh-data").click(function(){
    getData();
  });

  getData();
  // {
  //   "username": "string",
  //   "email": "user@example.com",
  //   "password": "string"
  // }
  // Gắn sự kiện cho nút Thêm
  $("#btnAddAccount").click(function () {
    const newAccount = {
      username: $("#username-add").val(),
      password: $("#password-add").val(),
      email: $("#email-add").val(),
      phone: $("#phone-add").val(),
      role: $("#role-add").val()
    };
    console.log("Dữ liệu thêm:", newAccount);

    let link = `/api/auth/register`;
    
    // Gửi yêu cầu add tới API
    axiosJWT
      .post(link, newAccount)
      .then(function (response) {
        console.log("Thêm thành công:", response.data);
        showSuccessPopup();
        getData(); // Tải lại dữ liệu sau khi cập nhật
        // Reset form
        $("#username-add").val('');
        $("#password-add").val('');
        $("#email-add").val('');
        $("#phone-add").val('');
        $("#role-add").val('admin');
      })
      .catch(function (error) {
        showErrorPopup();
        console.error("Lỗi khi thêm:", error);
      });
  });

  $(document).on("click", ".btn-edit", function () {
    const row = $(this).closest("tr");
    accountId = row.attr("data-id");
    selectedUsername = row.find("td:eq(2)").text(); // Lấy username từ cột thứ 3
  });

  $(document).on("click", ".btn-delete", function () {
    const row = $(this).closest("tr");
    selectedUsername = row.find("td:eq(2)").text(); // Lấy username từ cột thứ 3
  });

  $("#btnReset").click(function () {
    const newPassword = $("#new-password-reset").val();
    const resetData = {
      username: selectedUsername,
      newPassword: newPassword
    };

    axiosJWT
      .post(`/api/auth/reset-password`, resetData, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(function (response) {
        showSuccessPopup();
        getData();
        // Đóng modal reset password
        $('#dialog-confirm-reset').modal('hide');
        // Reset form
        $("#new-password-reset").val('');
      })
      .catch(function (error) {
        showErrorPopup();
        console.error("Lỗi không tìm được:", error);
      });
  });

  $("#btnDelete").click(function(){
    axiosJWT
      .delete(`/api/auth/delete/${selectedUsername}`)
      .then(function (response) {
        showSuccessPopup();
        getData();
      })
      .catch(function (error) {
        showErrorPopup();
        console.error("Lỗi không tìm được:", error);
      });
  });

  // Xử lý tìm kiếm
  $(".m-input-search").on("input", function() {
    const searchText = $(this).val().toLowerCase();
    const filteredData = dsTK.filter(item => 
      item.username.toLowerCase().includes(searchText) ||
      item.email.toLowerCase().includes(searchText) ||
      item.fullName.toLowerCase().includes(searchText)
    );
    display(filteredData);
  });
});

function getData() {
  // var userId = localStorage.getItem("userId");
  // $('#hotenHeader').text(localStorage.getItem(loggedInUsername));
  axiosJWT
    .get(`/api/auth`)
    .then(function (response) {
      dsTK = response.data;
      console.log(dsTK);
      display(dsTK);
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
      showErrorPopup();
    });
}

function display(data) {
  const tableBody = document.querySelector('#tblTaiKhoan tbody');
  tableBody.innerHTML = ''; // Xóa nội dung cũ nếu có

  if (data.length === 0) {
    const row = `
      <tr>
        <td colspan="6" class="text-center">Không có dữ liệu</td>
      </tr>
    `;
    tableBody.innerHTML = row;
    return;
  }

  data.forEach((item, index) => {
    const row = `
      <tr data-id="${item.accountId}">
        <td style="display: none">${item.accountId}</td>
        <td>${index + 1}</td>
        <td>${item.username}</td>
        <td>${item.email || '-'}</td>
        <td>${item.phone || '-'}</td>
        <td>${item.role || '-'}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-info btn-edit" data-bs-toggle="modal" data-bs-target="#dialog-confirm-reset">
              <i class="fas fa-key"></i>
            </button>
            <button class="btn btn-sm btn-danger btn-delete" data-bs-toggle="modal" data-bs-target="#dialog-confirm-delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
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
// email
// :
// "admin@gmail.com"
// id
// :
// "cc5752e8-f7af-432e-a76d-ce128c8c49b0"
// roles
// :
// ['Admin']
// userName
// :
// "admin"
