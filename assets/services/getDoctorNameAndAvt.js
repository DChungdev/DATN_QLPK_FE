$(document).ready(function(){
    getAvata();
});

function getAvata() {
    var userId = localStorage.getItem("doctorId");
    console.log(userId);
    // $('#hotenHeader').text(localStorage.getItem(loggedInUsername));
    axiosJWT
      .get(`/api/Doctors/getbyuserid/${userId}`)
      .then(function (response) {
        let bn = response.data;
        if (bn.hinhAnh != null) {
          $("#avatar").attr("src", "http://localhost:37649" + bn.hinhAnh);
          $("#avatar").css({
            'width': '40px',
            'height': '40px'
        });
          $("#nameDoctor").text(bn.hoTen);
        }
      })
      .catch(function (error) {
        console.error("Lỗi không tìm được:", error);
      });
  }