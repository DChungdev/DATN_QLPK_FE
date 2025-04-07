const sidebar = document.querySelector("#sidebar"),
      toggle = document.querySelector(".toggle");

      toggle.addEventListener("click", () =>{
        sidebar.classList.toggle("close");
        toggle.classList.toggle("bi-arrow-left");
        toggle.classList.toggle("bi-arrow-right");
      })