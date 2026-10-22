# Spec: Máy Gacha Sinh Nhật cho em bé

- **Trạng thái:** APPROVED v2 (chủ dự án duyệt ngày 22/10/2026, kèm T-1 đến T-7 và các mặc định ở mục 15)
- **Cập nhật:** 2026-10-22
- **Giai đoạn:** Tasks (`tasks.md` bản nháp chờ duyệt; chưa có code)
- **Mốc ra mắt:** 00:00 ngày 27/10/2026, giờ Việt Nam (+07:00)

---

## 1. Goal

Một website chúc mừng sinh nhật lần thứ 22 cho **Trịnh Minh Thư** (người yêu của chủ dự án, thường được gọi là "em bé" hoặc "bae"). Trải nghiệm là một **máy gacha (bán capsule) phiên bản giới hạn**: Thư nạp xu, xoay núm, nhận capsule, mở ra từng mảnh kỷ niệm và lời hứa, rồi đến **capsule vàng** gồm thổi nến bằng mic, bánh kem, pháo giấy và bức thư.

Mục tiêu cảm xúc: Thư bật cười ở những chi tiết chỉ hai người hiểu, và xúc động ở bức thư cuối.

## 2. Business Context

- Đây là quà cá nhân, một người nhận (Thư), một người tặng (chủ dự án, xưng "anh"). Không có người dùng đại chúng.
- Thư mở link trên **iPhone**. Cách dùng chính là một phiên 3 đến 5 phút, nhưng cho phép dừng giữa chừng và quay lại.
- Hạn cứng: site phải sẵn sàng trước 00:00 ngày 27/10/2026. Hôm lập spec là 22/10/2026, còn 5 ngày.
  - Đề xuất mốc: chủ dự án cung cấp ảnh, video, nội dung thư, mp3 **trước 24/10**; có bản test trên iPhone **trước 25/10**.
- Chất liệu cá nhân (inside joke) đã thu thập:
  - Thư gọi chủ dự án là **"anh Thúi"**, hay nũng nịu nói **"anh Thúi của em bé"**.
  - Thư hay trễ khi anh đón lúc tan làm, anh phải chờ lâu, nhưng thấy Thư xuất hiện là hết giận, chỉ muốn thương.
  - Thức uống yêu thích là **matcha**; thích đeo **trang sức bạc**; **ghét ăn cá**; hay **ngủ trễ**.
  - Lần đầu gặp: Thư đi bưng mâm quả cho đám hỏi của chị họ chủ dự án, và lúc đó anh đã biết "phải là của mình".
  - Thư sinh năm 2004, năm nay 22 tuổi, sinh nhật 27/10.
  - Kỷ niệm 3 năm bên nhau (theo tên và ngày chụp của các ảnh `anhAnni3year*`, tháng 3/2026).
- Tư liệu đã có: 3 ảnh gốc (HEIC) trong thư mục `image/` (`anhEmbe1`, `anhAnni3year`, `anhAnni3year2`); chủ dự án sẽ bổ sung thêm. Chưa có voice note, chưa có file mp3.

## 3. User Stories

- **US-01** Là Thư, tôi muốn thấy một màn hình đếm ngược dễ thương khi mở link trước giờ sinh nhật để biết có bất ngờ đang chờ.
- **US-02** Là Thư, tôi muốn nạp xu, xoay núm và nhận capsule như chơi máy gacha thật để thấy vui và bất ngờ.
- **US-03** Là Thư, tôi muốn mỗi capsule mở ra một mảnh kỷ niệm, voucher hoặc lời hứa mang đúng chất của hai người.
- **US-04** Là Thư, tôi muốn thổi nến thật bằng miệng vào mic, rồi thấy bánh, pháo giấy và đọc bức thư.
- **US-05** Là Thư, tôi muốn thoát ra giữa chừng rồi quay lại vẫn còn nguyên những gì đã mở, và có album xem lại.
- **US-06** Là chủ dự án, tôi muốn sửa lời, ảnh, thứ tự, giờ mở khoá, mp3 mà không phải đụng vào logic của site.
- **US-07** Là chủ dự án, tôi muốn xem trước toàn bộ trải nghiệm trên iPhone trước ngày 27/10 mà không làm lộ bất ngờ.

## 4. Functional Requirements

### 4.1 Luồng tổng thể

Trạng thái: `COUNTDOWN` → `INTRO` (nạp xu) → `PLAY` (các capsule trước capsule vàng) → `FINALE` (capsule vàng) → `ALBUM`.

### 4.2 Đếm ngược (`COUNTDOWN`)

- **FR-01** Trước mốc 27/10/2026 00:00 (+07:00), site chỉ hiển thị màn đếm ngược (ngày, giờ, phút, giây) cùng linh vật. Không có đường vào nội dung nào khác.
- **FR-02** Lời trên màn đếm ngược theo hướng "đảo vai": anh Thúi đã đợi em bé nhiều rồi, lần này đến lượt em bé đợi anh Thúi. Lời chính xác nằm trong file nội dung (FR-13) và do chủ dự án duyệt.
- **FR-03** Khi đồng hồ chạm mốc lúc trang đang mở, màn hình chuyển sang `INTRO` mượt mà, kèm nút "Vào chơi". Không tự phát âm thanh trước khi có cú chạm của người dùng.
- **FR-04** Sau mốc, mở link đi thẳng vào `INTRO` (hoặc vào trạng thái đã lưu, xem FR-24).

### 4.3 Nạp xu (`INTRO`)

- **FR-05** Màn hình chính hiển thị máy gacha, tên máy, đồng xu hình trái tim (nhãn "Xu duy nhất hôm nay: 1 cái ôm"), linh vật chibi **ngồi trên đỉnh máy**.
- **FR-06** Thư kéo xu vào khe bằng cử chỉ kéo (spring physics). Phương án thay thế: chạm vào xu thì xu tự bay vào khe.
- **FR-07** Cú chạm đầu tiên trong `INTRO` khởi tạo âm thanh (nhạc nền, AudioContext) để vượt giới hạn autoplay của iOS.
- **FR-08** Có nút "i" mở **bảng tỉ lệ rơi hài hước** (nội dung đề xuất ở mục 6.3, cần duyệt).

### 4.4 Quay và mở capsule (`PLAY`)

- **FR-09** Thư xoay núm bằng cử chỉ xoay (kéo theo vòng tròn). Phương án thay thế: chạm giữ núm. Capsule lăn trong quả cầu kính, máy rung nhẹ (rung hình ảnh, kèm âm thanh).
- **FR-10** Mỗi lần quay rơi đúng capsule kế tiếp theo thứ tự cố định (BR-01). Màu capsule thể hiện hạng: Thường (pastel), Bạc (ánh kim bạc), Vàng (finale). Capsule rơi vào khay, nảy nhẹ; Thư chạm để mở: nắp tách ra, ánh sáng toả, hạt lấp lánh, **thẻ** bay ra.
- **FR-11** Mỗi thẻ có một trong các dạng: ảnh hoặc video kèm caption; voucher; lời hứa (có **slot voice note**: nếu có file âm thanh thì hiện trình phát, nếu chưa có thì hiện ảnh thay thế).
- **FR-12** Thẻ hạng Bạc có hiệu ứng hologram ánh kim theo **ngón tay kéo** (không dùng cảm biến nghiêng, để tránh hộp thoại xin quyền trên iPhone).
- **FR-14** Sau khi đóng thẻ, thẻ được thêm vào album; hiển thị tiến độ "đã sưu tập n/N" (N là tổng số capsule trong cấu hình) và dòng pity (ví dụ "Còn k lần quay nữa là chắc chắn có capsule vàng").
- **FR-15** Capsule vàng chỉ khả dụng sau khi đã mở hết các capsule trước nó (BR-02). Trước đó, máy hiển thị capsule vàng đang "chờ".

### 4.5 Capsule vàng (`FINALE`)

- **FR-16** Màn thổi nến: hai **nến số "2" và "2"** (tuổi 22) trên bánh kem matcha. Nút "Thổi nến" xin quyền mic **chỉ sau khi Thư bấm nút**, không xin tự động.
- **FR-17** Phát hiện thổi qua mic (Web Audio API, đo cường độ). Ngọn lửa lung lay theo cường độ; thổi đủ mạnh và đủ lâu thì nến tắt (lần lượt hoặc cùng lúc). Không ghi âm, không lưu, không gửi đi (BR-06).
- **FR-18** Phương án thay thế bắt buộc: nút "Chạm để thổi" luôn hiện (ẩn sau vài giây hoặc hiện ngay nếu mic bị từ chối hay không có). Kết quả như thổi thật.
- **FR-19** Khi cả hai nến tắt: bánh kem hoàn chỉnh xuất hiện (animation), **pháo giấy** bay, linh vật ăn mừng.
- **FR-20** Sau đó là **bức thư gõ từng chữ** (typewriter). Có thể chạm để hiện nhanh toàn bộ. Cuối thư ký tên **"Anh Thúi của em bé"**. Nội dung thư do chủ dự án cung cấp (FR-13); bản nháp hiện tại nằm ở `letter-draft.md` cùng thư mục.
- **FR-21** Sau thư, linh vật thì thầm đúng một câu gợi ý về món quà thật: **"Coi chừng… anh ta còn giấu gì đó."** Không bật mí thêm (BR-10). Sau đó hiện nút "Xem album". Trạng thái hoàn thành được lưu.

### 4.6 Album

- **FR-22** Album hiển thị lưới thẻ, mỗi capsule một ô. Thẻ đã mở xem lại được toàn màn hình; thẻ chưa mở là bóng mờ.
- **FR-23** Album có nút "Xem lại màn thổi nến" và "Chơi lại từ đầu". "Chơi lại" phải hỏi xác nhận trước khi xoá tiến trình.

### 4.7 Lưu tiến trình, âm thanh, linh vật

- **FR-24 (Lưu tiến trình)** Lưu trên thiết bị bằng `localStorage` tại các điểm ổn định: đã nạp xu, capsule đã rơi vào khay (chưa mở), capsule đã mở, finale hoàn thành. Mở lại sẽ khôi phục đúng chỗ (capsule còn trong khay thì hiện lại trong khay).
- **FR-25 (Âm thanh)** Nhạc nền lặp lại từ file mp3 do chủ dự án cung cấp (tạm dùng file placeholder). Có nút bật/tắt, nhớ lựa chọn. Toàn bộ trải nghiệm vẫn trọn vẹn khi không có tiếng. Nhạc giảm âm lượng hoặc tạm dừng khi mic đang dùng ở finale.
- **FR-26 (Linh vật)** Linh vật chibi của Thư (xem mục 7) hiện diện ở mọi màn (ở màn chính ngồi trên đỉnh máy gacha), có các trạng thái: chờ (chống cằm, chớp mắt), vui, ngạc nhiên, ngủ gật (cho capsule "cú đêm"), ăn mừng (finale).
- **FR-27 (Màn tải)** Màn loading ngắn có câu đùa kiểu "Đang đợi em bé… 99%". Chỉ là hiệu ứng, **không được kéo dài thời gian tải thật** quá 1,5 giây.

### 4.8 Nội dung cấu hình (US-06)

- **FR-13** Toàn bộ nội dung (lời, thứ tự capsule, hạng, đường dẫn ảnh/video/âm thanh, giờ mở khoá, tuổi, danh sách tỉ lệ rơi, nội dung thư) nằm trong **một file cấu hình** tách khỏi mã giao diện, để chủ dự án sửa mà không đụng vào logic.

### 4.9 Chế độ xem trước (đã duyệt ngày 22/10)

- **FR-28** Cho phép bỏ qua đếm ngược bằng một tham số trên địa chỉ (ví dụ `?preview`) để chủ dự án test trước ngày 27/10. Đây **không phải cơ chế bảo mật**. Đã được chủ dự án duyệt. Giờ mở khoá vẫn đọc từ đồng hồ máy (mặc định); việc đọc giờ từ máy chủ chưa được duyệt (xem mục 15).

## 5. Business Rules

- **BR-01** Thứ tự capsule **cố định theo cấu hình**, capsule vàng luôn ở cuối. Thứ tự hiện tại: Thường, Thường, Bạc, Thường, Thường, Bạc, Bạc, Vàng (8 capsule, xem 6.1). Số capsule lấy từ cấu hình nên thêm thẻ không cần sửa logic. Nhìn như ngẫu nhiên nhưng không bao giờ ngẫu nhiên thật, để Thư chắc chắn xem đủ và finale luôn ở cuối.
- **BR-02** Capsule vàng chỉ mở sau khi mở hết các capsule trước nó.
- **BR-03** Mốc mở khoá là một **thời điểm tuyệt đối** `2026-10-27T00:00:00+07:00`, đúng ở mọi múi giờ.
- **BR-04** Xưng hô: **anh – em bé (hoặc bae)**; ký tên "Anh Thúi của em bé". Giọng văn **trêu yêu, không trách móc**, đặc biệt với chuyện ra trễ và ngủ trễ.
- **BR-05** Nến: hai nến số "2" và "2". Tuổi lấy từ cấu hình (2026 − 2004 = 22).
- **BR-06** Mic chỉ dùng để đo cường độ thổi tại chỗ: không ghi âm, không lưu, không gửi đi. Luồng mic phải được **tắt ngay** khi nến tắt, khi Thư huỷ, hoặc khi rời màn finale.
- **BR-07** Ảnh chống cằm (`IMG_0649.HEIC`, cũng là `image/anhEmbe1.HEIC`) vừa là **tham chiếu để vẽ linh vật** vừa là **một thẻ kỷ niệm** (chủ dự án đã duyệt 22/10). Khi đưa lên site vẫn theo BR-08 và BR-11.
- **BR-08** Mọi ảnh/video đưa lên site phải được **xoá metadata EXIF (đặc biệt vị trí GPS)** và không chứa thông tin nhạy cảm (số điện thoại, địa chỉ nhà, biển số xe).
- **BR-09** Không có tương tác nào làm thay đổi hay xoá nội dung gốc; "Chơi lại" chỉ xoá tiến trình cục bộ.
- **BR-10** **Món quà thật không được bật mí.** Chỉ có đúng một câu gợi ý ở cuối thư (FR-21). Không nhắc tới quà ở bất kỳ nơi nào khác: nội dung site, mã nguồn, tên file, mô tả triển khai, spec hay tasks.
- **BR-11** Thư mục `image/` chứa ảnh gốc (HEIC, còn metadata) chỉ là nguồn. Bản build và bản triển khai chỉ chứa ảnh đã xử lý (T-7); không để file gốc trong thư mục được phát hành.

## 6. Nội dung đề xuất (chờ chủ dự án duyệt và cung cấp tư liệu)

### 6.1 Danh sách capsule

Tên và thứ tự là đề xuất; ảnh có sẵn quyết định tên thẻ. Capsule 1 và 5 chưa có ảnh. Số thẻ thay đổi được (BR-01).

| # | Hạng | Tên thẻ (đề xuất) | Dạng | Gợi ý nội dung |
| --- | --- | --- | --- | --- |
| 1 | Thường | Lần đầu mình gặp nhau | Ảnh/chữ | Ngày Thư bưng mâm quả cho đám hỏi chị họ; lúc đó anh biết "phải là của mình". Lời do chủ dự án viết. |
| 2 | Thường | Dáng chống cằm | Ảnh | `image/anhEmbe1.HEIC` (đã có), cũng là ảnh tham chiếu của linh vật. Caption do chủ dự án viết. |
| 3 | Bạc | **Thẻ Miễn La** | Voucher | "Dùng khi em bé ra trễ lúc anh đón. Hiệu lực vô thời hạn, vì anh chưa bao giờ la được." |
| 4 | Thường | Kỷ niệm 3 năm | 2 ảnh (lật qua lại) | `image/anhAnni3year.HEIC` và `image/anhAnni3year2.HEIC` (đã có): hai ảnh chụp qua màn hình điện thoại có hình hai nhân vật hoạt hình (cáo và thỏ). Caption do chủ dự án viết. |
| 5 | Thường | Cú đêm | Ảnh/video (chưa có) | Thư hay ngủ trễ; linh vật ngủ gật; giọng trêu yêu. |
| 6 | Bạc | Voucher matcha | Voucher | "1 ly matcha anh Thúi bao, không cần hỏi uống gì." |
| 7 | Bạc | Lời hứa của anh Thúi | Lời hứa (+ slot voice note) | Ví dụ "anh ăn cá giúp em bé" cùng các lời hứa thật của chủ dự án. Chưa có voice note thì thay bằng ảnh. |
| 8 | Vàng | Capsule vàng | Finale | Thổi nến, bánh matcha, pháo giấy, thư. |

### 6.2 Bánh và nến

Bánh kem **vị matcha**, hai nến số "2" "2". Bản nháp thư v1 (22/10) nằm ở `letter-draft.md`; chủ dự án sẽ đổi nội dung sau. Món quà thật không được bật mí (BR-10).

### 6.3 Bảng tỉ lệ rơi (hài hước, chỉ để cười)

Ví dụ: Matcha 40%, Anh Thúi 40%, Ảnh em bé ngủ gật 19,9%, **Cá 0%**. Chủ dự án duyệt lời cuối.

## 7. Hướng thiết kế

- **Phong cách:** tối giản, hiện đại, claymorphism mềm kết hợp glass nhẹ; bo tròn lớn, đổ bóng mềm, grain nhẹ.
- **Bảng màu pastel:** hồng đào, kem bơ, lavender; thêm **xanh matcha pastel**; ánh kim **bạc** cho hạng Bạc, **vàng** cho capsule vàng.
- **Linh vật chibi** vẽ theo ảnh tham chiếu: tóc dài gợn sóng (đen, ngả nâu đỏ ở ngọn), **kính tròn gọng mảnh**, nụ cười mím, **dáng chống cằm bằng nắm tay** (dáng chờ), áo đen, váy nâu, **vòng bạc** ở cổ tay (lấp lánh khi có capsule Bạc). Vẽ bằng SVG ở mức minh hoạ đơn giản, **cần chủ dự án duyệt bản vẽ** trước khi ghép vào site. Có thể thay bằng tranh của hoạ sĩ qua cùng một slot ảnh.
- **Animation:** spring physics, 60fps mục tiêu, chỉ animate `transform` và `opacity`; tôn trọng `prefers-reduced-motion` (giảm chuyển động, không bỏ mất nội dung).
- **Thiết kế cho iPhone dọc:** dùng `dvh`, `safe-area-inset`, vùng chạm tối thiểu 44px. Chế độ ngang vẫn hiển thị được, không cam kết tối ưu.

## 8. Permissions

- Không có tài khoản, vai trò hay đăng nhập. Một người xem chính (Thư); ai có link đều xem được (không mật khẩu, theo quyết định của chủ dự án).
- **Quyền trình duyệt:** chỉ xin quyền **micro**, khi Thư bấm "Thổi nến". Không xin vị trí, camera, thông báo hay cảm biến chuyển động.
- Chủ dự án chỉnh nội dung bằng cách sửa file cấu hình và triển khai lại; không có giao diện quản trị.

## 9. Integrations

- **Vercel**: lưu trữ tĩnh và triển khai (đề xuất, chờ duyệt công nghệ).
- **Web Audio API / getUserMedia** của trình duyệt cho mic; **HTMLAudio** cho nhạc nền.
- Không có backend, không có API bên ngoài, không analytics, không CDN hay phông chữ bên thứ ba (phông tự lưu cùng site).
- **Đầu vào do chủ dự án cung cấp:** ảnh, video, file mp3, nội dung thư, lời cho capsule.

## 10. Non Functional Requirements

- **Tương thích:** chuẩn chính là **iPhone 15 Pro Max** (màn 430×932 pt, Dynamic Island) chạy iOS Safari **17 trở lên** (máy xuất xưởng với iOS 17). Chrome desktop để chủ dự án xem trước. Không cam kết Android.
- **Hiệu năng:** tải lần đầu nhanh trên 4G (đề xuất LCP ≤ 2,5s); ảnh/video tải lười (lazy load) và nén nhẹ; mục tiêu 60fps khi quay và mở capsule trên iPhone. Nếu hiệu ứng nặng gây tụt khung, ưu tiên giảm chi tiết, không bỏ trải nghiệm.
- **Độ tin cậy:** không crash khi `localStorage` bị chặn hoặc xoá (bắt đầu lại từ đầu, không báo lỗi); không phụ thuộc mạng sau khi đã tải xong (trừ lần tải đầu).
- **Riêng tư và bảo mật:**
  - `noindex` bằng thẻ meta, header `X-Robots-Tag`, và `robots.txt`; không analytics.
  - Mic không ghi âm, không gửi đi (BR-06). EXIF được xoá (BR-08).
  - Lưu ý chấp nhận: `noindex` chỉ giấu khỏi công cụ tìm kiếm; ai có đường dẫn trực tiếp tới file ảnh vẫn xem được. Chỉ gửi link cho Thư.
- **Khả năng truy cập:** độ tương phản chữ đủ đọc, cỡ chữ không nhỏ hơn 16px cho nội dung chính, mọi thao tác kéo/xoay đều có phương án chạm thay thế.
- **Bảo trì:** nội dung tách khỏi giao diện (FR-13); mã nguồn gọn, đặt tên rõ.
- **Bản quyền:** chủ dự án chịu trách nhiệm về bản quyền mp3 cung cấp (dùng riêng tư, một người nhận).

## 11. Quyết định kỹ thuật (đã duyệt ngày 22/10/2026, giữ nguyên T-1 đến T-7)

Chỉ ảnh hưởng feature này nên ghi tại spec, duyệt cùng spec.

| Mã | Đề xuất | Lý do chính | Phương án thay thế |
| --- | --- | --- | --- |
| T-1 | Site tĩnh: **Vite + React + TypeScript** | Máy trạng thái rõ ràng, build nhanh, triển khai tĩnh lên Vercel | Vite + TypeScript thuần (nhẹ hơn, tự quản state nhiều hơn) |
| T-2 | Animation và cử chỉ kéo/xoay bằng **Motion (Framer Motion)** | Spring physics và gesture tốt, mượt trên iPhone | GSAP (mạnh về timeline, API riêng) |
| T-3 | Pháo giấy bằng **canvas-confetti** | Nhỏ, đẹp, sẵn dùng | Tự viết canvas |
| T-4 | Phát hiện thổi bằng **Web Audio API** (không thêm thư viện) | Đủ cho đo cường độ, ít phụ thuộc | — |
| T-5 | Capsule lăn trong quả cầu: **animation dựng sẵn** (choreography) | Nhẹ, dễ kiểm soát trên iPhone | matter.js (vật lý thật, nặng hơn; chỉ dùng nếu mượt) |
| T-6 | Triển khai **Vercel**; `vercel.json` đặt header `X-Robots-Tag: noindex` | Chủ dự án đã chọn Vercel | — |
| T-7 | Quy trình media: HEIC → WebP/JPEG, MOV → MP4 (H.264), **xoá EXIF**, nén nhẹ | iPhone gốc nặng và không phát được mọi nơi; bảo vệ vị trí | — |

Quyết định đã có từ chủ dự án: host trên Vercel; không backend; không analytics.

## 12. Acceptance Criteria

- **AC-01** Cho trước mốc, khi mở link thì chỉ thấy màn đếm ngược với số ngày/giờ/phút/giây đúng theo giờ +07:00; không thể vào `INTRO` nếu không dùng chế độ xem trước (FR-28). Với tham số xem trước, bỏ qua đếm ngược và vào thẳng `INTRO`.
- **AC-02** Cho đang ở màn đếm ngược lúc đồng hồ chạm mốc, trang chuyển sang `INTRO` mượt mà và không phát âm thanh trước khi có cú chạm.
- **AC-03** Cho `INTRO`, khi Thư kéo xu vào khe (hoặc chạm xu), máy bắt đầu chu trình quay; nhạc nền bắt đầu sau cú chạm đầu tiên.
- **AC-04** Cho `PLAY`, mỗi lần quay rơi đúng capsule kế tiếp theo BR-01; màu capsule đúng hạng.
- **AC-05** Khi mở capsule, thẻ hiển thị đúng nội dung cấu hình; thẻ hạng Bạc phản ứng với ngón tay kéo.
- **AC-06** Capsule vàng không thể quay trước khi chưa mở hết các capsule trước nó (BR-02).
- **AC-07** Ở finale, trình duyệt chỉ xin quyền mic sau khi Thư bấm "Thổi nến"; thổi vào mic làm ngọn lửa lung lay và tắt khi đủ mạnh, đủ lâu.
- **AC-08** Khi mic bị từ chối hoặc không có, nút "Chạm để thổi" vẫn đưa tới kết quả giống thổi thật.
- **AC-09** Khi hai nến tắt: bánh kem hoàn chỉnh xuất hiện, pháo giấy bay, rồi bức thư gõ từng chữ và có thể hiện nhanh bằng một cú chạm; thư kết thúc bằng chữ ký "Anh Thúi của em bé". Sau thư, linh vật thì thầm đúng câu "Coi chừng… anh ta còn giấu gì đó." rồi mới hiện nút "Xem album".
- **AC-10** Sau khi xong finale, luồng mic đã được tắt (không còn biểu tượng đang dùng mic trên iPhone).
- **AC-11** Thoát hẳn và mở lại: khôi phục đúng vị trí (kể cả capsule còn trong khay); với `localStorage` bị chặn thì bắt đầu từ đầu, không lỗi.
- **AC-12** "Chơi lại từ đầu" chỉ xoá tiến trình sau khi Thư xác nhận.
- **AC-13** Tắt nhạc rồi tải lại trang vẫn giữ trạng thái tắt; trải nghiệm vẫn đầy đủ khi không có tiếng.
- **AC-14** Bật "Giảm chuyển động" của iOS: các animation lớn được thay bằng chuyển cảnh nhẹ, nội dung vẫn đầy đủ.
- **AC-15** Kiểm tra mã nguồn và build: không có analytics hay yêu cầu mạng tới bên thứ ba; ảnh/video không còn EXIF GPS; phản hồi HTTP của site có header `X-Robots-Tag: noindex`; bản triển khai không chứa file nào của thư mục nguồn `image/` (BR-11).
- **AC-16** Chạy thử trên iPhone thật (iPhone 15 Pro Max, iOS ≥ 17): luồng từ đồng xu tới thư hoàn tất, hiệu ứng không giật rõ rệt.

## 13. Out Of Scope

- Gửi lời nhắn ngược lại cho chủ dự án, form, backend, cơ sở dữ liệu.
- Mật khẩu, tài khoản, phân quyền.
- Analytics, đo lường, thu thập dữ liệu người dùng.
- Đa ngôn ngữ (chỉ tiếng Việt).
- Voice note thật (có chuẩn bị slot, bổ sung sau).
- Rung haptic và cảm biến nghiêng/gyroscope.
- Giao diện quản trị nội dung.
- Tối ưu cho Android, tablet và máy tính (chạy được nhưng không cam kết).
- PWA, offline đầy đủ, thông báo đẩy.
- Vẽ lại nhân vật hoạt hình có bản quyền; chỉ dùng ảnh gốc do chủ dự án cung cấp.

## 14. Điều chỉnh so với bản brainstorm ban đầu

- Bỏ **rung haptic** (`vibrate` không có trên iPhone); thay bằng rung hình ảnh và âm thanh.
- Hologram theo **ngón tay kéo** thay cho nghiêng điện thoại (tránh hộp thoại xin quyền cảm biến).
- Hạng hiếm được đặt tên **Bạc** (hợp sở thích trang sức bạc); **Vàng** dành cho finale.
- Capsule "pity" chỉ là dòng đếm cho vui, vì thứ tự vốn cố định.
- Số capsule theo cấu hình (hiện 8), không còn cố định 7.
- Bỏ capsule "Matcha của em bé", thay bằng "Dáng chống cằm" và "Kỷ niệm 3 năm" theo ảnh có sẵn; matcha vẫn có ở voucher, bánh và bức thư.

## 15. Quyết định đã có và Open Questions

**Đã quyết (22/10/2026):** ảnh chống cằm là một thẻ kỷ niệm (BR-07); linh vật ngồi trên đỉnh máy (FR-05, FR-26); quà thật giữ bí mật, chỉ một câu gợi ý (FR-21, BR-10); thư nháp trước, đổi nội dung sau (`letter-draft.md`); thiết bị chuẩn iPhone 15 Pro Max (mục 10); duyệt chế độ xem trước (FR-28); nhạc nền do chủ dự án tự tìm mp3.

**Còn mở (không chặn spec):**

1. **Cáo và thỏ**: hai ảnh kỷ niệm 3 năm chụp qua màn hình có hình một con cáo và một con thỏ. Đây có phải biểu tượng riêng của hai bạn không? Nếu có, có thể dùng làm điểm nhấn trong lời và caption, nhưng **không vẽ lại** nhân vật hoạt hình có bản quyền.
2. **Thẻ bổ sung**: ảnh/video cho capsule 1 (lần đầu gặp) và 5 (cú đêm), cùng các thẻ khác bạn sẽ thêm; caption cho capsule 2 và 4. Số capsule có thể tăng (BR-01).
3. **Tên máy** (đề xuất: "Em Bé Gacha, phiên bản giới hạn 22") và lời trên màn đếm ngược.
4. **Nội dung thư**: bản nháp v1 ở `letter-draft.md`, chờ bạn sửa; các chỗ trong ngoặc vuông cần bạn điền hoặc xác nhận.
5. **Bài nhạc nền**: đề xuất "A Thousand Years" (Christina Perri), tốt nhất là bản piano hoặc không lời; chủ dự án tìm file mp3 (xem FR-25).
6. **Đọc giờ mở khoá từ máy chủ** thay vì đồng hồ máy (chống đổi giờ máy): có muốn không? Mặc định hiện tại là đồng hồ máy.
7. **Bản vẽ linh vật** (SVG): chủ dự án duyệt bản nháp đầu tiên ở bước implement trước khi ghép vào site.
8. **Hạn bổ sung tư liệu**: ảnh, video, mp3 còn thiếu cần có trước 24/10 để kịp test trên iPhone.
