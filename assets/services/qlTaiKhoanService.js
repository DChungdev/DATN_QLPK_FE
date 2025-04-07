var dsTK;
var accountId;
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
      email: $("#email-add").val() || null,
      password: $("#password-add").val()
    };
    console.log("Dữ liệu thêm:", newAccount);

    const role = $("#role-add").val();
    let link;
    if (role == 0) {
      link = `/api/Auth/register-admin`;
    }
    else if (role == 1) {
      link = `/api/Auth/register-doctor`;
    }
    else {
      link = `/api/Auth/register`;
    }
    console.log(link);
    console.log(role);
    // Gửi yêu cầu add tới API
    axiosJWT
      .post(link, newAccount)
      .then(function (response) {
        console.log("Thêm thành công:", response.data);
        getData(); // Tải lại dữ liệu sau khi cập nhật
      })
      .catch(function (error) {
        showErrorPopup();
        console.error("Lỗi khi thêm:", error);
      });
  });

  $(document).on("click", ".m-edit", function () {

    accountId = $(this).closest("tr").attr("bn-id");

  });
  $(document).on("click", ".m-delete", function () {

    accountId = $(this).closest("tr").attr("bn-id");

  });

  $("#btnReset").click(function () {
      axiosJWT
        .post(`/api/Auth/reset-password`, accountId, {
          headers: {
            "Content-Type": "application/json", // Định dạng dữ liệu là JSON
          },
        })
        .then(function (response) {
          showSuccessPopup();
        })
        .catch(function (error) {
          showErrorPopup();
          console.error("Lỗi không tìm được:", error);
        });
  })

  $("#btnDelete").click(function(){
    axiosJWT
      .delete(`/api/Auth/${accountId}`)
      .then(function (response) {
        showSuccessPopup();
        getData();
      })
      .catch(function (error) {
        showErrorPopup();
        console.error("Lỗi không tìm được:", error);
      });
  });

});

function getData() {
  // var userId = localStorage.getItem("userId");
  // $('#hotenHeader').text(localStorage.getItem(loggedInUsername));
  axiosJWT
    .get(`/api/Auth`)
    .then(function (response) {
      dsTK = response.data;
      console.log(dsTK);
      display(dsTK);
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
}
function display(data) {
  const tableBody = document.querySelector('#tblTaiKhoan tbody');
  tableBody.innerHTML = ''; // Xóa nội dung cũ nếu có

  data.forEach((item, index) => {
    const row = `
      <tr bn-id="${item.id}">
        <td class="text-center">${index + 1}</td>
        <td class="text-center">${item.userName}</td>
        <td class="text-center">${item.email}</td>
        <td class="text-center">${item.roles.join(", ")}</td>
        <td>
                  <div class="m-table-tool">
                    <div class="m-edit m-tool-icon" data-bs-toggle="modal" data-bs-target="#dialog-confirm-reset" data-id="${item.benhNhanId}">
                      <i class="fas fa-edit text-primary"></i>
                    </div>
                    <div class="m-delete m-tool-icon" data-bs-toggle="modal" data-bs-target="#dialog-confirm-delete">
                      <i class="fas fa-trash-alt text-danger"></i>
                    </div>
                  </div>
                </td>
      </tr>
    `;
    tableBody.innerHTML += row; // Thêm hàng vào bảng
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
