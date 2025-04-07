// Tạo instance axios
const axiosJWT = axios.create({
    baseURL: "http://localhost:8080",
    timeout: 10000,
});

// Tạo instance axios không cần xử lý JWT
const axiosNoJWT = axios.create({
    baseURL: "http://localhost:8080",
    timeout: 10000,
});

let isRefreshing = false;
let refreshSubscribers = [];

// Hàm thêm các subscriber để đợi khi refreshToken hoàn thành
function subscribeTokenRefresh(callback) {
    refreshSubscribers.push(callback);
}

// Hàm gọi lại các request bị treo khi refreshToken hoàn thành
function onRefreshed(token) {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
}

// Thêm JWT vào các request
axiosJWT.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Xử lý lỗi từ response
axiosJWT.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;

        // Kiểm tra nếu là lỗi 401 và không phải request refresh token
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {
            if (!isRefreshing) {
                isRefreshing = true;
                originalRequest._retry = true;

                const refreshToken = localStorage.getItem("refreshToken");

                // Gọi API để làm mới token
                return axiosNoJWT
                    .post("http://localhost:8080/api/auth/refresh", {
                        refreshToken: localStorage.getItem("refreshToken"),  // Gửi refreshToken hiện tại
                        
                    })
                    .then((res) => {
                        if (res.status === 200) {
                            const newAccessToken = res.data.data.accessToken;
                            const newRefreshToken = res.data.data.refreshToken;

                            // Lưu lại accessToken mới
                            localStorage.setItem("accessToken", newAccessToken);
                            localStorage.setItem("refreshToken", newRefreshToken);
                            // Cập nhật các header của axios với accessToken mới
                            axiosJWT.defaults.headers.common[
                                "Authorization"
                            ] = `Bearer ${newAccessToken}`;

                            // Thông báo tất cả các request đang đợi rằng việc refresh đã xong
                            onRefreshed(newAccessToken);

                            // Reset trạng thái refresh
                            isRefreshing = false;

                            // Tiếp tục request ban đầu với accessToken mới
                            return axiosJWT(originalRequest);
                        }
                    })
                    .catch((refreshError) => {
                        console.error("Refresh token failed:", refreshError);
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        window.location.href = "/login.html";
                        return Promise.reject(refreshError);
                    });
            }

            // Nếu đang làm mới token, thêm các request vào hàng đợi
            return new Promise((resolve) => {
                subscribeTokenRefresh((token) => {
                    originalRequest.headers[
                        "Authorization"
                    ] = `Bearer ${token}`;
                    resolve(axiosJWT(originalRequest));
                });
            });
        }

        return Promise.reject(error);
    }
);

/*
### Flow hoạt động chi tiết:

1. **Tạo instance `axiosJWT` và `axiosNoJWT`:**
   - `axiosJWT`: Chứa `baseURL` là URL của API và có `timeout` là 10 giây. Dùng để gửi các request cần có JWT.
   - `axiosNoJWT`: Giống `axiosJWT` nhưng không xử lý JWT, dùng cho các request không cần JWT như đăng nhập hoặc refresh token.

2. **Khai báo các biến kiểm soát việc refresh token:**
   - `isRefreshing`: Biến boolean để xác định xem việc refresh token đang diễn ra hay không. Mục đích là ngăn việc gọi nhiều request refresh token đồng thời.
   - `refreshSubscribers`: Mảng lưu trữ các callback, mỗi callback tương ứng với một request đang chờ đợi việc refresh token hoàn thành.

3. **Hàm `subscribeTokenRefresh(callback)`:**
   - Thêm một callback vào mảng `refreshSubscribers`. Mỗi callback là một request đang chờ đợi token mới.

4. **Hàm `onRefreshed(token)`:**
   - Sau khi việc refresh token thành công, hàm này sẽ được gọi để thực hiện tất cả các callback trong `refreshSubscribers`. Các request trong hàng đợi sẽ được tiếp tục với token mới.
   - Sau khi gọi xong các callback, `refreshSubscribers` được reset thành mảng trống.

5. **Interceptor `request` của `axiosJWT`:**
   - Trước khi gửi mỗi request, interceptor này sẽ kiểm tra xem có `accessToken` trong `localStorage` hay không.
   - Nếu có, nó sẽ thêm `Authorization` header với giá trị `Bearer <accessToken>` vào request để gửi kèm token trong request header.
   - Nếu không có token, request vẫn tiếp tục nhưng sẽ không có header `Authorization`.

6. **Interceptor `response` của `axiosJWT`:**
   - Interceptor này sẽ xử lý các lỗi từ response, đặc biệt là lỗi 401 (Unauthorized).
   - Nếu response trả về lỗi 401 và request đó chưa được thử lại (`_retry` chưa được gán giá trị `true`), thì:
     - Kiểm tra xem `isRefreshing` có đang là `false` hay không:
       - **Nếu `isRefreshing` là `false`**: Có nghĩa là hiện không có request nào đang thực hiện việc refresh token, nên:
         - Đặt `isRefreshing = true` để chặn các request khác cùng lúc gửi request refresh token.
         - Đánh dấu request hiện tại là đã được thử lại bằng cách gán `originalRequest._retry = true`.
         - Lấy `refreshToken` từ `localStorage` để gửi request refresh token đến API.
         - Nếu request refresh token thành công:
           - Lưu `newAccessToken` (token mới) vào `localStorage`.
           - Cập nhật header `Authorization` của `axiosJWT` với `newAccessToken` mới.
           - Gọi hàm `onRefreshed(newAccessToken)` để thông báo các request đang đợi rằng việc refresh đã xong.
           - Đặt lại `isRefreshing = false`.
           - Thực hiện lại request ban đầu (`originalRequest`) với `newAccessToken`.
         - Nếu request refresh token thất bại:
           - Xóa `accessToken` và `refreshToken` khỏi `localStorage`.
           - Chuyển hướng người dùng đến trang đăng nhập.
           - Trả về một Promise bị từ chối với lỗi refresh token.
       - **Nếu `isRefreshing` là `true`**: Có nghĩa là đang có một request refresh token khác đang được thực hiện, nên:
         - Tạo một Promise mới và thêm nó vào `refreshSubscribers` thông qua `subscribeTokenRefresh`.
         - Khi việc refresh token hoàn thành, callback này sẽ được gọi với token mới, và request ban đầu (`originalRequest`) sẽ được thực hiện lại với token mới.

7. **Request treo và retry khi refresh token thành công:**
   - Khi có nhiều request được gửi trong khi token hết hạn, chỉ có một request thực hiện việc refresh token (nhờ `isRefreshing`).
   - Các request còn lại sẽ bị đưa vào hàng đợi (`refreshSubscribers`).
   - Sau khi việc refresh thành công, các request trong hàng đợi sẽ được thực hiện lại với token mới nhờ hàm `onRefreshed`.

### Tóm tắt quá trình refresh token:

- Khi `axiosJWT` gửi request và nhận lỗi 401:
  - Kiểm tra xem đã có request nào đang làm mới token chưa (`isRefreshing`):
    - Nếu chưa có (`isRefreshing = false`): Thực hiện request refresh token.
    - Nếu đã có (`isRefreshing = true`): Các request khác sẽ chờ đến khi việc refresh hoàn thành.
  - Nếu refresh thành công, lưu `accessToken` mới và thực hiện lại các request đang đợi.
  - Nếu refresh thất bại, người dùng bị chuyển đến trang đăng nhập.

Flow này đảm bảo rằng chỉ có một request refresh token được thực hiện tại một thời điểm, các request khác chờ đợi để sử dụng token mới sau khi việc refresh hoàn tất, và tự động xử lý việc hết hạn token mà không cần người dùng can thiệp.
*/
