

function updatePagination() {
    const paginationContainer = document.querySelector(".pagination");
    paginationContainer.innerHTML = "";
    
    // Nút Trước
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" tabindex="-1" ${currentPage === 1 ? 'aria-disabled="true"' : ''}>Trước</a>`;
    prevLi.addEventListener("click", function(e) {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        refreshUI();
      }
    });
    paginationContainer.appendChild(prevLi);
    
    // Các nút số trang
    for (let i = 1; i <= totalPages; i++) {
      const pageLi = document.createElement("li");
      pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
      pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      pageLi.addEventListener("click", function(e) {
        e.preventDefault();
        currentPage = i;
        refreshUI();
      });
      paginationContainer.appendChild(pageLi);
    }
    
    // Nút Sau
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" ${currentPage === totalPages ? 'aria-disabled="true"' : ''}>Sau</a>`;
    nextLi.addEventListener("click", function(e) {
      e.preventDefault();
      if (currentPage < totalPages) {
        currentPage++;
        refreshUI();
      }
    });
    paginationContainer.appendChild(nextLi);
  }

