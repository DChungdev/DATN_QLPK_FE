// Khởi tạo biến toàn cục
window.dsBN = [];
window.filteredData = []; // Thêm biến để lưu dữ liệu đã lọc
window.currentPage = 1;
const recordsPerPage = 10;
var bnID = "";

$(document).ready(function () {
    refreshUI();
    getData();
    
    // Xử lý upload ảnh cho modal thêm
    $("#image-upload-add").change(function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $("#preview-image-add").attr("src", e.target.result);
            }
            reader.readAsDataURL(file);
        }
    });

    // Xử lý upload ảnh cho modal sửa
    $("#image-upload-edit").change(function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $("#preview-image-edit").attr("src", e.target.result);
            }
            reader.readAsDataURL(file);
        }
    });

    // Xử lý tìm kiếm
    const searchInput = document.querySelector(".m-input-search");
    searchInput.addEventListener("input", function () {
        const value = this.value.toLowerCase();
        window.filteredData = window.dsBN.filter(item => {
            return (
                item.fullName.toLowerCase().includes(value) ||
                (item.phone && item.phone.includes(value)) ||
                (item.address && item.address.toLowerCase().includes(value)) ||
                (item.gender && item.gender.toLowerCase().includes(value))
            );
        });
        window.currentPage = 1; // Reset về trang đầu tiên khi tìm kiếm
        refreshUI();
    });

    // Xử lý làm mới dữ liệu
    $("#refresh-data").click(function () {
        window.currentPage = 1;
        window.filteredData = []; // Reset dữ liệu đã lọc
        getData();
    });

    // Sự kiện khi nhập vào ô tìm kiếm
    // $(".m-input-search").on("keyup", function () {
    //     var value = $(this).val().toLowerCase();
    //     $("#tblBenhNhan tbody tr").filter(function () {
    //         $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    //     });
    // });

    $("#refresh-data").click(function () {
        getData();
        refreshUI();
    });
    // Gắn sự kiện cho nút hiển thị modal sửa
    $(document).on("click", ".m-edit", function () {
        // const benhNhanId = $(this).data("id"); // Lấy id từ thuộc tính data-id
        const patientId = $(this).closest("tr").attr("bn-id");
        console.log(patientId);
        bnID = patientId;
        const benhNhan = dsBN.find((bn) => bn.patientId == patientId); // Tìm bệnh nhân trong danh sách
        console.log(benhNhan);
        if (benhNhan) {
            fillEditModal(benhNhan); // Hiển thị thông tin lên modal
        } else {
            console.error("Không tìm thấy thông tin bệnh nhân!");
        }
    });

        // Gắn sự kiện cho nút hiển thị modal Thêm
        $("#btnOpenModalAdd").click(function () {
            // let maBNNext = getMaxBenhNhanCode(dsBN);
            // $("#mabn-add").val(maBNNext);
        })
        // Gắn sự kiện cho nút Thêm
        $("#btnAdd").click(function () {
            const genderValue = $("#gender-add").val();
            const imageFile = $("#image-upload-add")[0].files[0];
            
            // Tạo đối tượng bệnh nhân mới
            const newPatient = {
                fullName: $("#hoten-add").val(),
                phone: $("#sdt-add").val() || null,
                gender: genderValue,
                dateOfBirth: $("#ngaysinh-add").val() ? $("#ngaysinh-add").val() : null,
                address: $("#diachi-add").val() || null
            };

            // Nếu có ảnh, upload ảnh trước
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);

                axiosJWT
                    .post('/api/upload/image', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    })
                    .then(function (response) {
                        // Thêm đường dẫn ảnh vào đối tượng bệnh nhân
                        newPatient.image = response.data;
                        // Gửi request thêm bệnh nhân
                        return axiosJWT.post(`/api/patients`, newPatient);
                    })
                    .then(function (response) {
                        console.log("Thêm thành công:", response.data);
                        getData();
                        refreshUI();
                    })
                    .catch(function (error) {
                        showErrorPopup();
                        console.error("Lỗi khi thêm:", error);
                    });
            } else {
                // Nếu không có ảnh, gửi request thêm bệnh nhân ngay
                axiosJWT
                    .post(`/api/patients`, newPatient)
                    .then(function (response) {
                        console.log("Thêm thành công:", response.data);
                        getData();
                        refreshUI();
                    })
                    .catch(function (error) {
                        showErrorPopup();
                        console.error("Lỗi khi thêm:", error);
                    });
            }
        });

        // Gắn sự kiện cho nút Sửa
        $("#btnEdit").click(function () {
            const genderValue = $("#gender-edit").val();
            const imageFile = $("#image-upload-edit")[0].files[0];
            
            // Tạo đối tượng bệnh nhân cập nhật
            const updatedPatient = {
                fullName: $("#hoten").val(),
                email: $("#email").val(),
                phone: $("#sdt").val() || null,
                gender: genderValue,
                dateOfBirth: $("#ngaysinh").val() ? $("#ngaysinh").val() : null,
                address: $("#diachi").val() || null
            };

            // Nếu có ảnh mới, upload ảnh trước
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);

                axiosJWT
                    .post('/api/upload/image', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    })
                    .then(function (response) {
                        // Thêm đường dẫn ảnh vào đối tượng bệnh nhân
                        updatedPatient.image = response.data;
                        console.log(response.data)  
                        console.log(updatedPatient)
                        // Gửi request cập nhật bệnh nhân
                        return axiosJWT.put(`/api/patients/${bnID}`, updatedPatient);
                    })
                    .then(function (response) {
                        console.log("Cập nhật thành công:", response.data);
                        getData();
                        refreshUI();
                        showSuccessPopup();
                    })
                    .catch(function (error) {
                        showErrorPopup();
                        console.error("Lỗi khi cập nhật:", error);
                    });
            } else {
                // Nếu không có ảnh mới, gửi request cập nhật ngay
                axiosJWT
                    .put(`/api/patients/${bnID}`, updatedPatient)
                    .then(function (response) {
                        console.log("Cập nhật thành công:", response.data);
                        getData();
                        refreshUI();
                        showSuccessPopup();
                    })
                    .catch(function (error) {
                        showErrorPopup();
                        console.error("Lỗi khi cập nhật:", error);
                    });
            }
        });

        //Mở modal xác nhận xóa
        $(document).on("click", ".m-delete", function () {
            const patientId = $(this).closest("tr").attr("bn-id");
            bnID = patientId;
            console.log(bnID);
            const benhNhan = dsBN.find((bn) => bn.patientId === patientId); // Tìm bệnh nhân trong danh sách
        });


        $("#btnDelete").click(function () {
            axiosJWT
                .delete(`/api/patients/${bnID}`)
                .then(function (response) {
                    console.log("Xóa thành công:", response.data);
                    getData(); // Tải lại dữ liệu sau khi cập nhật
                })
                .catch(function (error) {
                    showErrorPopup();
                    console.error("Lỗi khi xóa:", error);
                });
        });
        // //Xử lý sự kiện khi nhấn nút Export
        // $(".m-toolbar-export").click(function () {
        //     exportToExcelPatient();
        // });
    // });
    // // Hàm xử lý khi ấn nút xuất file Excel
    // function exportToExcelPatient() {
    //     // Lấy dữ liệu từ bảng
    //     const table = document.querySelector("#tblBenhNhan");
    //     const rows = table.querySelectorAll("tbody tr");

    //     // Tạo mảng chứa dữ liệu
    //     const data = [];

    //     // Lấy tiêu đề cột (tùy chọn)
    //     const headers = [];
    //     table.querySelectorAll("thead th").forEach((th, index) => {
    //       const headerText = th.textContent.trim();
    //       if (headerText && index !== 0) {  // Loại bỏ cột STT trong tiêu đề
    //         headers.push(headerText);
    //       }
    //     });
    //     data.push(headers); // Thêm tiêu đề vào mảng dữ liệu

    //     // Lặp qua các dòng của bảng để lấy dữ liệu
    //     rows.forEach((row, index) => {
    //       const rowData = [];
    //       // Thêm số thứ tự vào cột đầu tiên
    //       rowData.push(index + 1); // STT (số thứ tự bắt đầu từ 1)

    //       row.querySelectorAll("td").forEach((td, cellIndex) => {
    //         const cellData = td.textContent.trim();
    //         // Thêm dữ liệu vào dòng (bỏ qua cột STT ở vị trí đầu tiên)
    //         if (cellIndex !== 0) { // Loại bỏ cột STT (cột đầu tiên)
    //           rowData.push(cellData || ""); // Nếu không có dữ liệu, thêm chuỗi trống
    //         }
    //       });

    //       data.push(rowData); // Thêm dòng dữ liệu vào mảng
    //     });

    //     // Tạo workbook từ dữ liệu
    //     const ws = XLSX.utils.aoa_to_sheet(data);

    //     // Tạo workbook và thêm sheet
    //     const wb = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(wb, ws, "Bệnh Nhân");

    //     // Xuất file Excel
    //     XLSX.writeFile(wb, "danh_sach_benh_nhan.xlsx");
    //   }

});

function getData() {
    axiosJWT
        .get(`/api/patients`)
        .then(function (response) {
            window.dsBN = response.data;
            window.filteredData = window.dsBN; // Khởi tạo filteredData với toàn bộ dữ liệu
            console.log(window.dsBN);
            refreshUI();
        })
        .catch(function (error) {
            console.error("Lỗi không tìm được:", error);
            window.dsBN = [];
            window.filteredData = [];
            refreshUI();
        });
}

function displayData(page) {
    const tbody = document.querySelector("#tblBenhNhan tbody");
    tbody.innerHTML = "";

    const dataToDisplay = window.filteredData.length > 0 ? window.filteredData : window.dsBN;

    if (!dataToDisplay || dataToDisplay.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Không có dữ liệu</td></tr>';
        return;
    }

    const startIndex = (page - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, dataToDisplay.length);

    for (let i = startIndex; i < endIndex; i++) {
        const item = dataToDisplay[i];

        const row = document.createElement("tr");
        row.setAttribute("bn-id", item.patientId);

        // Tạo URL ảnh từ API hoặc sử dụng ảnh mặc định
        const imageUrl = item.image ? `http://localhost:8080${item.image}` : 'http://localhost:8080/uploads/no-img.jpg';

        row.innerHTML = `
            <td style="display: none">${item.patientId}</td>
            <td>${i + 1}</td>
            <td>
                <div class="image-preview" style="width: 50px; height: 50px; cursor: pointer;">
                    <img src="${imageUrl}" alt="Patient Image" class="img-thumbnail" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            </td>
            <td>${item.fullName}</td>
            <td>${item.gender}</td>
            <td>${formatDate(item.dateOfBirth) || 'Không có'}</td>
            <td>${item.phone || 'Không có'}</td>
            <td>${item.address || 'Không có'}</td>
            <td>
                <div class="m-table-tool">
                    <div class="m-edit m-tool-icon" data-bs-toggle="modal" data-bs-target="#edit-patient" data-id="${item.patientId}">
                      <i class="fas fa-edit text-primary"></i>
                    </div>
                    <div class="m-delete m-tool-icon" data-bs-toggle="modal" data-bs-target="#confirm-delete">
                      <i class="fas fa-trash-alt text-danger"></i>
                    </div>
                  </div>
            </td>
        `;

        // Thêm sự kiện click cho ảnh
        const imageElement = row.querySelector('.image-preview img');
        imageElement.addEventListener('click', function() {
            const enlargedImage = document.getElementById('enlargedImage');
            enlargedImage.src = this.src;
            const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
            imageModal.show();
        });

        tbody.appendChild(row);
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

// Hàm lấy mã bệnh nhân lớn nhất
// function getMaxBenhNhanCode(dsBN) {
//     let maxCode = 0;
//     dsBN.forEach(item => {
//         const code = parseInt(item.maBenhNhan.replace('BN', '')); // Loại bỏ 'BN' và chuyển thành số
//         if (code > maxCode) {
//             maxCode = code;
//         }
//     });
//     const nextCode = maxCode + 1;
//     return 'BN' + nextCode.toString().padStart(3, '0');
// }

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

function updatePagination() {
    const paginationContainer = document.querySelector(".pagination");
    paginationContainer.innerHTML = "";

    const dataToDisplay = window.filteredData.length > 0 ? window.filteredData : window.dsBN;

    if (!dataToDisplay || dataToDisplay.length === 0) {
        return;
    }

    const totalPages = Math.ceil(dataToDisplay.length / recordsPerPage);

    // Nút Trước
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${window.currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" tabindex="-1" ${window.currentPage === 1 ? 'aria-disabled="true"' : ''}>Trước</a>`;
    prevLi.addEventListener("click", function (e) {
        e.preventDefault();
        if (window.currentPage > 1) {
            window.currentPage--;
            refreshUI();
        }
    });
    paginationContainer.appendChild(prevLi);

    // Các nút số trang
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement("li");
        pageLi.className = `page-item ${i === window.currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.addEventListener("click", function (e) {
            e.preventDefault();
            window.currentPage = i;
            refreshUI();
        });
        paginationContainer.appendChild(pageLi);
    }

    // Nút Sau
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${window.currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" ${window.currentPage === totalPages ? 'aria-disabled="true"' : ''}>Sau</a>`;
    nextLi.addEventListener("click", function (e) {
        e.preventDefault();
        if (window.currentPage < totalPages) {
            window.currentPage++;
            refreshUI();
        }
    });
    paginationContainer.appendChild(nextLi);
}

function refreshUI() {
    displayData(window.currentPage);
    updatePagination();
}    



function fillEditModal(benhNhan) {
    // Gán dữ liệu vào các trường input của modal
    $("#hoten").val(benhNhan.fullName); // Họ tên
    $("#email").val(benhNhan.email || ""); // Email
    $("#sdt").val(benhNhan.phone); // Số điện thoại
    // Gán giới tính
    const genderValue = benhNhan.gender === "Nam" ? 'Nam' : benhNhan.gender === "Nữ" ? 'Nữ' : 'Khác';
    $("#gender-edit").val(genderValue);

    // Gán ngày sinh
    const formattedDate = benhNhan.dateOfBirth
        ? new Date(benhNhan.dateOfBirth).toLocaleDateString('en-CA')
        : "";
    $("#ngaysinh").val(formattedDate);

    // Gán địa chỉ
    $("#diachi").val(benhNhan.address || "");

    // Gán ảnh đại diện nếu có
    if (benhNhan.imageUrl) {
        $("#preview-image-edit").attr("src", benhNhan.imageUrl);
    } else {
        $("#preview-image-edit").attr("src", "../assets/img/default-avatar.png");
    }
}