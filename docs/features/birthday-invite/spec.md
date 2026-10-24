# Spec: Trang mời dự sinh nhật Minh Thư

- **Trạng thái:** v1 (trang mời) APPROVED ngày 24/10/2026 và đã làm xong. **v2 (hai trang dẫn, các mục đánh dấu [v2]) APPROVED ngày 24/10/2026**, giữ các mặc định ở câu hỏi 11 đến 15; tuổi của Thư là 22 (câu hỏi 10).
- **Cập nhật:** 2026-10-24 (v2: thêm hai trang dẫn; điền ngày 25/10/2026; xác nhận không phải bất ngờ; duyệt v2)
- **Giai đoạn:** v1 Implementation xong; v2 Implementation
- **Liên quan:** `docs/features/birthday-gacha/spec.md` (site quà sinh nhật), ADR-001 (Accepted)

---

## 1. Goal

Một trang web một màn hình dài, đẹp và nhẹ, ở **route mới `/moi/`** của cùng website, để chủ dự án gửi cho **bạn bè của Thư**. Trang cho bạn bè biết đủ thông tin buổi tiệc sinh nhật lần thứ 22 của **Trịnh Minh Thư** (địa điểm, giờ, lịch trình) và giúp họ thêm vào lịch, mở bản đồ, chia sẻ và xác nhận tham gia.

**[v2]** Trước trang mời, người mở link đi qua **hai trang dẫn truyện** ngắn và vui: (1) giới thiệu Thư bằng linh vật chibi và các bong bóng lời nói, (2) hé lộ "sự kiện trọng đại" bằng một icon bí mật, bấm vào thì hiện "Là sinh nhật của mình đó", bấm tiếp thì sang trang mời.

## 2. Business Context

- Người xem là **nhiều bạn bè** của Thư, dùng nhiều loại điện thoại (iPhone, Android) và thường mở link từ Zalo, Messenger hoặc Facebook, tức là trong **trình duyệt tích hợp** của các ứng dụng đó.
- Người gửi lời mời là chủ dự án.
- Nội dung do chủ dự án cung cấp (nguyên văn):
  - Địa điểm: **Sushi Cô Bông**, 186 Đ. Đặng Văn Ngữ, phường, Phú Nhuận, Hồ Chí Minh 70000, Việt Nam.
  - Thời gian: **18h30**.
  - Lịch trình:
    - 18h30 đến 20h: dùng bữa tại Sushi Cô Bông.
    - 20h đến 22h: cà phê hoặc board game tùy theo thời tiết và lựa chọn của mọi người.
  - Lời kết: "Hãy tham gia và cùng tạo kỉ niệm đáng nhớ với em bé Minh Thư nhé".
- **Ngày diễn ra buổi tiệc: 25/10/2026 (Chủ nhật)**, chủ dự án cung cấp ngày 24/10/2026.
- **Buổi tiệc không phải bất ngờ với Thư** (chủ dự án xác nhận 24/10/2026): trang không cần dòng nhắc giữ bí mật; dùng chung dự án Vercel như đã chọn.
- **Kênh xác nhận tham gia: chưa có** (chủ dự án để trống hai lần): nút "Mình sẽ tham dự" tiếp tục ẩn (FR-I08).
- **[v2]** Nội dung chủ dự án cung cấp cho hai trang dẫn:
  - Trang 1 (giới thiệu): lấy hình linh vật chibi của Thư làm trung tâm, xung quanh là các bong bóng giới thiệu: Thư "27 tuổi" (xem Open Question 10, đang mâu thuẫn với 22 tuổi), đẹp gái, công tác tại Shopee, thích cầu lông và thể thao, tính cách vui vẻ hoạt bát nhưng đôi khi hơi ngơ xíu hoy.
  - Trang 2 (hé lộ): "Và sắp tới sẽ là một sự kiện trọng đại" → bấm vào icon bí mật → hiện "Là sinh nhật của mình đó" → bấm tiếp thì sang màn mời sinh nhật hiện tại.
- Trang dùng chung phong cách (màu, phông, linh vật chibi của Thư) với site quà, nhưng là **một trang độc lập về nội dung**: không được kéo theo thư, ảnh hay bất kỳ nội dung nào của site quà (BR-I03).
- Cần chia sẻ sớm: hôm nay là 24/10, **buổi tiệc diễn ra ngày mai 25/10**, sinh nhật là 27/10.

## 3. User Stories

- **US-I01** Là bạn của Thư, tôi muốn mở link và thấy ngay giờ, địa điểm, lịch trình để biết mình cần có mặt lúc nào, ở đâu.
- **US-I02** Là bạn của Thư, tôi muốn mở bản đồ chỉ đường tới quán bằng một cú chạm.
- **US-I03** Là bạn của Thư, tôi muốn thêm buổi tiệc vào lịch điện thoại để không quên.
- **US-I04** Là bạn của Thư, tôi muốn báo mình sẽ tham dự mà không phải điền form phức tạp.
- **US-I05** Là bạn của Thư, tôi muốn chuyển lời mời cho người khác trong nhóm.
- **US-I06** Là chủ dự án, tôi muốn sửa ngày, giờ, địa điểm, lịch trình ở một chỗ mà không đụng vào giao diện.
- **US-I07** Là chủ dự án, tôi muốn chắc chắn trang mời không làm lộ nội dung riêng của site quà.
- **US-I08 [v2]** Là bạn của Thư, tôi muốn được giới thiệu vui về Thư rồi được "hé lộ" dần dần, để thấy lời mời có chuẩn bị chứ không chỉ là một tờ thông tin.
- **US-I09 [v2]** Là bạn đã xem rồi (hoặc đang vội), tôi muốn bỏ qua hai trang dẫn để tới thẳng thông tin buổi tiệc.

## 4. Functional Requirements

- **FR-I01** Route `/moi/` hiển thị trang mời, không cần đăng nhập. Gõ `/moi` (thiếu dấu gạch) vẫn tới được trang.
- **FR-I02** Phần đầu trang có linh vật chibi của Thư (trạng thái vui, vẫy tay hoặc ăn mừng), tiêu đề lời mời và dòng "Sinh nhật lần thứ N" (N theo BR-I09, mặc định 22). Chữ tiêu đề đã duyệt: "Mời bạn đến dự sinh nhật của em bé Minh Thư".
- **FR-I03** Khối thông tin chính: ngày **Chủ nhật, 25/10/2026**, giờ **18h30**, địa điểm gồm tên và địa chỉ đầy đủ.
- **FR-I04** Lịch trình dạng đường thời gian dọc, hai mốc đúng thứ tự: "18h30 đến 20h: dùng bữa tại Sushi Cô Bông" và "20h đến 22h: cà phê hoặc board game tùy theo thời tiết và lựa chọn của mọi người".
- **FR-I05** Khối địa điểm có nút "Mở bản đồ" (liên kết tìm kiếm Google Maps theo tên quán và địa chỉ, mở ứng dụng bản đồ trên điện thoại) và nút "Sao chép địa chỉ" (báo "Đã sao chép" khi xong).
- **FR-I06** Nút "Thêm vào lịch" cho hai cách: liên kết **Google Calendar** và **tải file `.ics`** (Apple Calendar và các lịch khác). Sự kiện kéo dài 18h30 đến 22h giờ Việt Nam, có địa điểm và phần mô tả là lịch trình.
- **FR-I07** Nút "Chia sẻ lời mời": dùng Web Share API nếu có; không có thì sao chép link và báo "Đã sao chép link".
- **FR-I08** Nút "Mình sẽ tham dự" (RSVP) mở kênh liên hệ của chủ dự án (Zalo, tin nhắn hoặc gọi điện, chờ thông tin). Chưa có thông tin liên hệ thì **ẩn nút**, không hiện nút chết.
- **FR-I09** Lời kết nguyên văn ở cuối trang (BR-I01).
- **FR-I10** Toàn bộ nội dung nằm trong **một file cấu hình riêng của trang mời** (US-I06), tách khỏi giao diện.
- **FR-I11** Mở được trong trình duyệt tích hợp của Zalo, Messenger, Facebook mà không vỡ bố cục. Việc không làm được trong trình duyệt tích hợp (tải `.ics`, chia sẻ hệ thống) phải có đường thay thế (Google Calendar, sao chép link).
- **FR-I12** Chuyển động nhẹ (vào trang, mốc lịch trình hiện dần), tôn trọng chế độ giảm chuyển động của hệ điều hành.
- **FR-I13** Có thẻ meta tên và mô tả ngắn (chỉ chữ) để xem trước link trong Zalo, Messenger không hiện tên miền trơ trụi.
- **FR-I14 [v2]** Luồng ba bước tuần tự trong cùng route `/moi/`: **Trang 1 (giới thiệu) → Trang 2 (hé lộ) → Trang mời** (toàn bộ v1, giữ nguyên). Mở `/moi/` luôn bắt đầu ở Trang 1. Không có URL riêng cho từng bước.
- **FR-I15 [v2] Trang 1, giới thiệu:** linh vật chibi của Thư (trạng thái vui) ở **trung tâm**, tiêu đề ngắn ở trên, **6 bong bóng lời nói** bao quanh với mũi nhọn chỉ về phía linh vật; các bong bóng hiện lần lượt (nảy nhẹ) rồi trôi lơ lửng rất khẽ. Cuối trang có nút "Tiếp theo". Nội dung bong bóng và tiêu đề là đề xuất, cần duyệt (BR-I01):
  - Tiêu đề: "Xin giới thiệu: em bé Minh Thư"
  - Bong bóng: "22 tuổi" (hoặc 27, xem Open Question 10) · "Đẹp gái" · "Công tác tại Shopee" · "Thích cầu lông và thể thao" · "Vui vẻ, hoạt bát" · "Đôi khi hơi ngơ xíu hoy"
- **FR-I16 [v2] Trang 2, hé lộ:** câu dẫn "Và sắp tới sẽ là một sự kiện trọng đại" cùng **một icon bí mật** là nút lớn, nhịp nhẹ để mời bấm, có dòng gợi ý "Chạm vào biểu tượng bí mật" (đề xuất). **Bấm lần 1:** icon "mở ra", hiện lời của Thư "Là sinh nhật của mình đó" kèm hiệu ứng ăn mừng nhẹ (linh vật chuyển sang trạng thái ăn mừng), kèm dòng gợi ý "Chạm để xem lời mời" (đề xuất). **Bấm lần 2** (chính nút đó): chuyển sang Trang mời.
- **FR-I17 [v2]** Chuyển cảnh giữa các bước mượt (mờ dần và trượt nhẹ). Bật giảm chuyển động thì đổi cảnh ngay, không trượt, không nảy, không lơ lửng, nhưng vẫn đi hết ba bước.
- **FR-I18 [v2]** Ở Trang 1 và Trang 2 có liên kết chữ nhỏ **"Bỏ qua"** dẫn thẳng tới Trang mời (US-I09). Đề xuất, cần duyệt.
- **FR-I19 [v2]** Khả năng truy cập: mọi thao tác (Tiếp theo, icon bí mật, Bỏ qua) là phần tử `button` hoặc liên kết có nhãn, dùng được bằng bàn phím (Enter, Space); mỗi lần đổi bước, tiêu đề của bước mới nhận focus; lời hé lộ "Là sinh nhật của mình đó" được đọc lên bằng vùng `role="status"`.
- **FR-I20 [v2]** Toàn bộ chữ của hai trang dẫn nằm trong file cấu hình của trang mời (mở rộng FR-I10), cùng bộ kiểm tra nghiêm ngặt.

## 5. Business Rules

- **BR-I01** Mọi dòng chữ do chủ dự án cung cấp được dùng **nguyên văn** (kể cả "kỉ niệm"). Chữ do agent đề xuất phải được duyệt trước khi phát hành.
- **BR-I02** Giờ hiển thị theo giờ Việt Nam, dạng "18h30", "20h", "22h".
- **BR-I03** Gói tải về của trang mời **không chứa** bất kỳ nội dung nào của site quà: thư, caption, ảnh, tên file ảnh, âm thanh, khoá lưu tiến trình, mã màn hình của game.
- **BR-I04** Trang không thu thập dữ liệu của người xem, không phân tích, không cookie, không gọi dịch vụ bên thứ ba khi tải trang.
- **BR-I05** Trang `noindex` (cùng cơ chế với site chính).
- **BR-I06** Trang không nhắc tới món quà hay bất ngờ nào dành cho Thư.
- **BR-I07** Thông tin cá nhân chỉ gồm tên Thư, **[v2] tuổi, nơi làm việc (Shopee), sở thích và tính cách do chủ dự án cung cấp** và địa điểm công khai của quán; không đưa số điện thoại, địa chỉ nhà hay ảnh của ai vào trang (trừ kênh liên hệ ở FR-I08 do chủ dự án chọn). Lưu ý: link có thể được bạn bè chuyển tiếp, ai có link đều thấy.
- **BR-I08 [v2]** Thứ tự ba bước cố định; Trang mời (v1) giữ nguyên nội dung và hành vi đã duyệt. Không lưu bước đã xem: tải lại trang thì bắt đầu lại từ Trang 1 (chia sẻ link cũng dẫn người nhận về Trang 1).
- **BR-I09 [v2]** Tuổi chỉ có **một nguồn** trong file cấu hình và phải khớp ở mọi nơi: bong bóng Trang 1, dòng "Sinh nhật lần thứ N", tên sự kiện trong lịch, đoạn chia sẻ và thẻ meta xem trước. Mặc định N = 22 (Thư sinh năm 2004, thống nhất với site quà); chờ chủ dự án xác nhận (Open Question 10).
- **BR-I10 [v2]** Icon bí mật **không là hộp quà** và chữ của hai trang dẫn không chứa "quà", "bất ngờ" (giữ BR-I06; bài kiểm tra quét thêm nội dung mới). Mặc định icon: **bóng bay có dấu "?"**.

## 6. Permissions

- Không có tài khoản hay vai trò. Ai có link đều xem được; link chỉ chia sẻ cho bạn bè.
- Không xin quyền trình duyệt nào (không micro, vị trí, thông báo).
- Chủ dự án sửa nội dung bằng cách sửa file cấu hình rồi triển khai lại.

## 7. Integrations

- **Google Maps:** chỉ liên kết ra ngoài, không nhúng bản đồ (nhúng sẽ gọi bên thứ ba và nặng thêm).
- **Google Calendar:** liên kết tạo sự kiện. **File `.ics`:** tự sinh ngay trong trình duyệt.
- **Web Share API:** dùng khi trình duyệt hỗ trợ.
- **Kênh liên hệ RSVP:** Zalo, tin nhắn hoặc điện thoại (chờ thông tin).
- **Vercel:** lưu trữ tĩnh, header `noindex` đã áp dụng cho mọi đường dẫn.

## 8. Non Functional Requirements

- **Tương thích:** Safari iOS 16 trở lên, Chrome Android bản gần nhất, và trình duyệt tích hợp của Zalo, Messenger, Facebook. Không dựa vào tính năng chỉ có ở iOS 17.
- **Hiệu năng:** gói JS riêng của trang mời nhỏ hơn nhiều so với site quà (đề xuất v1 ≤ 120 KB gzip; đo được 122,3 KB; **[v2] đề xuất nâng ngưỡng lên ≤ 130 KB gzip**, xem I-7), tải đầu ≤ 2,5 giây trên 4G, không phông hay ảnh bên ngoài. **[v2]** Chuyển cảnh và bong bóng giữ ≥ 50 fps trên iPhone; không dùng ảnh bitmap mới.
- **[v2] Bố cục hai trang dẫn:** Trang 1 vừa một màn hình ở 390×844 và 430×932; ở 360×667 cho phép cuộn dọc nhưng không cuộn ngang. Bong bóng không chồng lên nhau hay che linh vật, chữ bong bóng ≥ 16px, tương phản AA; icon bí mật có vùng chạm ≥ 64px.
- **Khả năng truy cập:** chữ chính ≥ 16px, độ tương phản đạt AA (dùng lại token đã kiểm), vùng chạm ≥ 44px, nút có nhãn cho trình đọc màn hình, giảm chuyển động.
- **Độ tin cậy:** nút không dùng được ở một trình duyệt thì có đường thay thế hoặc tự ẩn, không báo lỗi.
- **Bảo trì:** nội dung tách khỏi giao diện (FR-I10); thư viện tạo `.ics`, link bản đồ và link lịch là hàm thuần có test.

## 9. Quyết định kỹ thuật đề xuất (PROPOSED, chờ chủ dự án duyệt)

| Mã | Đề xuất | Lý do chính | Phương án thay thế |
| --- | --- | --- | --- |
| I-1 | **Nhiều điểm vào (multi-page)** trong Vite: thêm `moi/index.html` làm điểm vào thứ hai, không thêm router | Gói của trang mời tách biệt hẳn, không mang theo nội dung bí mật (BR-I03); không thêm thư viện; URL tĩnh `/moi/` | SPA đọc đường dẫn kèm `rewrites` (chung gói), thêm router (thêm thư viện), dự án Vercel riêng (cô lập nhất, thêm một địa chỉ phải quản lý). Xem ADR-001 |
| I-2 | Dùng lại token, `Stage`, `Button`, `Mascot`, `motion`; **không** import `content/`, `state/`, `screens/` của site quà | Cùng phong cách, tải nhanh, đúng BR-I03 | Viết lại giao diện riêng (tốn thời gian, lệch phong cách) |
| I-3 | `.ics` tự sinh bằng hàm thuần (giờ UTC, thoát ký tự, gập dòng theo RFC 5545); Google Calendar bằng URL | Không cần thư viện, chạy offline | Thư viện tạo lịch (thêm phụ thuộc) |
| I-4 | Không thêm thư viện nào | Không phải duyệt thêm | — |
| I-5 **[v2]** | Ba bước là **trạng thái React** trong cùng điểm vào `moi/`: không router, không thư viện mới, không đổi URL, không thêm điểm vào build | Chỉ ảnh hưởng một feature nên không cần ADR; giữ gói và cấu hình build nguyên | Mỗi bước một đường dẫn (`/moi/gioi-thieu`, ...): thêm điểm vào, thêm HTML, nút Back hoạt động nhưng phức tạp hơn nhiều |
| I-6 **[v2]** | Hiệu ứng ăn mừng viết nhẹ bằng SVG/CSS và `motion` có sẵn, **không dùng `canvas-confetti`** ở trang mời | Giữ gói nhỏ | Dùng `canvas-confetti` (thêm khoảng vài KB vào gói trang mời) |
| I-7 **[v2]** | Nâng ngưỡng gói JS trang mời lên **≤ 130 KB gzip**, chưa tối ưu thư viện chuyển động | Tiệc là ngày mai; ≈130 KB vẫn tải dưới 1 giây trên 4G | Giữ 120 KB bằng cách chuyển sang `LazyMotion` (mất thêm công, nên làm sau) |

Ngày tiệc đã có (25/10/2026); mọi quyết định ở trên không phụ thuộc ngày.

## 10. Acceptance Criteria

- **AC-I01** Mở `/moi/` (và `/moi`), đi hết hai trang dẫn hoặc bấm "Bỏ qua", ở Trang mời thấy tiêu đề lời mời, **Chủ nhật, 25/10/2026**, giờ 18h30, tên quán và địa chỉ, lịch trình hai mốc đúng thứ tự, lời kết nguyên văn.
- **AC-I02** Hai mốc lịch trình hiển thị đúng chữ trong mục 2 (kiểm tra bằng so khớp chuỗi từ file cấu hình).
- **AC-I03** Nút "Mở bản đồ" tạo liên kết `https://www.google.com/maps/search/?api=1&query=…` chứa tên quán và địa chỉ đã mã hoá; nút "Sao chép địa chỉ" đưa đúng địa chỉ vào bộ nhớ tạm.
- **AC-I04** File `.ics` tạo ra hợp lệ theo RFC 5545: có `BEGIN:VCALENDAR`/`VEVENT`, `DTSTART` đúng 18h30 giờ Việt Nam (11h30 UTC), `DTEND` đúng 22h, `LOCATION`, `SUMMARY`, các dòng không dài hơn 75 octet, ký tự đặc biệt được thoát.
- **AC-I05** Liên kết Google Calendar có `dates=` đúng khoảng 18h30 đến 22h giờ Việt Nam.
- **AC-I06** Nút "Chia sẻ lời mời" gọi Web Share API khi có; khi không có thì sao chép link và hiện "Đã sao chép link".
- **AC-I07** Nút "Mình sẽ tham dự" chỉ hiện khi cấu hình có kênh liên hệ, và mở đúng liên kết đó.
- **AC-I08** Phản hồi HTTP của `/moi/` có header `X-Robots-Tag: noindex` và HTML có thẻ meta `noindex`.
- **AC-I09** **Cách ly:** quét toàn bộ file trong `dist/moi/` và các tệp JS/CSS mà nó tải **không** chứa đoạn thư, caption, tên file ảnh (`*.webp`), `gacha:progress`, hay tên các màn hình của game.
- **AC-I10** Ở khung 360×780 và 430×932 không cuộn ngang, chữ chính ≥ 16px, nút ≥ 44px.
- **AC-I11** Bật giảm chuyển động thì chuyển động lớn bị bỏ, nội dung vẫn đủ.
- **AC-I12** Site quà ở `/` vẫn chạy y nguyên (test và build hiện có vẫn qua).
- **AC-I13** Mở trong trình duyệt tích hợp của Zalo hoặc Messenger không vỡ bố cục; tải `.ics` hoặc chia sẻ hệ thống không dùng được thì còn Google Calendar và sao chép link.

### Tiêu chí chấp nhận cho v2 (hai trang dẫn)

- **AC-I14 [v2]** Mở `/moi/` thấy **Trang 1**: linh vật ở giữa, tiêu đề giới thiệu, đủ 6 bong bóng đúng chữ trong file cấu hình, nút "Tiếp theo".
- **AC-I15 [v2]** Bấm "Tiếp theo" sang **Trang 2**: thấy câu dẫn "Và sắp tới sẽ là một sự kiện trọng đại" và icon bí mật; **chưa** thấy "Là sinh nhật của mình đó".
- **AC-I16 [v2]** Bấm icon bí mật hiện "Là sinh nhật của mình đó"; bấm tiếp thì hiện Trang mời (tiêu đề lời mời).
- **AC-I17 [v2]** "Bỏ qua" ở Trang 1 và Trang 2 đều tới thẳng Trang mời.
- **AC-I18 [v2]** Ở bước cuối, AC-I01 đến AC-I13 của v1 vẫn đạt (không hồi quy).
- **AC-I19 [v2]** Bật giảm chuyển động: không trượt, nảy, lơ lửng, nhưng vẫn đi hết ba bước.
- **AC-I20 [v2]** Icon bí mật, "Tiếp theo", "Bỏ qua" dùng được bằng bàn phím; đổi bước thì focus nằm ở tiêu đề mới; lời hé lộ nằm trong vùng `role="status"`.
- **AC-I21 [v2]** Ở 360×667, 390×844 và 430×932: bong bóng không chồng nhau, không che linh vật, không cuộn ngang, chữ ≥ 16px, vùng chạm icon ≥ 64px, các nút ≥ 44px.
- **AC-I22 [v2]** Cách ly: AC-I09 vẫn đạt; chữ hai trang dẫn không chứa "quà", "bất ngờ" (BR-I10).
- **AC-I23 [v2]** Tuổi khớp ở mọi nơi theo BR-I09 (kiểm tra bằng test, kể cả thẻ meta trong `moi/index.html`).
- **AC-I24 [v2]** Gói JS của trang mời ≤ 130 KB gzip (I-7).

## 11. Out Of Scope

- Form xác nhận tham dự, đếm số người, danh sách khách, backend, cơ sở dữ liệu.
- Bình chọn "cà phê hay board game" (cần backend; hiện chỉ ghi rõ là tuỳ thời tiết và lựa chọn của mọi người).
- Nhúng bản đồ, ảnh chụp quán, ảnh bạn bè, thư viện ảnh.
- Nhiều sự kiện, nhiều ngôn ngữ, mật khẩu, tài khoản, phân tích truy cập.
- Gửi thông báo hoặc nhắc lịch từ máy chủ.
- **[v2]** Lưu bước đã xem, URL riêng cho từng bước, hỗ trợ nút Back của trình duyệt để lùi giữa các bước (Back sẽ rời trang), nhạc hoặc âm thanh, ảnh thật của Thư, bong bóng do bạn bè nhập, tương tác khác ngoài chạm.

## 12. Open Questions

**Đã trả lời (24/10/2026):**
1. ~~Ngày diễn ra buổi tiệc~~ → **25/10/2026 (Chủ nhật)**.
3. ~~Có phải bất ngờ với Thư không~~ → **Không**: không có dòng giữ bí mật, giữ chung dự án Vercel.

**Còn mở, chưa chặn phát hành (để trống lần thứ hai):**
2. **Cách bạn bè xác nhận tham gia?** Đưa tôi một đường liên kết (Zalo, Messenger) hoặc số điện thoại bạn muốn dùng; chưa có thì nút "Mình sẽ tham dự" ẩn (FR-I08) và bạn nhận phản hồi ngoài trang.

**[v2] Đã trả lời (24/10/2026): tuổi của Thư là 22; giữ các mặc định ở câu 11 đến 15.**
10. ~~Tuổi của Thư: 22 hay 27?~~ → **22.** Câu hỏi gốc: Bạn viết "27 tuổi" ở Trang 1, nhưng trước đó bạn cho biết Thư sinh năm 2004, tức **22 tuổi** năm 2026; trang mời, lịch, đoạn chia sẻ và site quà đều ghi 22 (27 có thể là nhầm với ngày 27/10). Mặc định: **22**. Nếu bạn cố ý ghi 27 (đùa), tôi cần biết để sửa các chỗ còn lại cho khớp (BR-I09).

**[v2] Có mặc định, bạn đổi nếu muốn:**
11. Icon bí mật: **bóng bay có dấu "?"** (không dùng hộp quà, BR-I10). Phương án khác: phong bì niêm phong, cây nến.
12. Chữ đề xuất của hai trang dẫn (FR-I15, FR-I16), gồm tiêu đề "Xin giới thiệu: em bé Minh Thư" và các dòng gợi ý.
13. Có liên kết **"Bỏ qua"** ở hai trang dẫn (FR-I18). Mặc định: có.
14. Nâng ngưỡng gói JS lên **≤ 130 KB gzip** (I-7). Mặc định: đồng ý.
15. **Nơi làm việc (Shopee)** sẽ nằm trên một link mà bất kỳ ai nhận được cũng mở được nếu bạn bè chuyển tiếp (BR-I07). Mặc định: giữ, miễn bạn và Thư ổn với điều đó.

**Có mặc định, bạn đổi nếu muốn (v1, đã duyệt):**
4. Đường dẫn **`/moi/`** (ngắn, dễ gõ).
5. **Cùng dự án Vercel, gói riêng** (đề xuất I-1). Rủi ro còn lại: ai biết địa chỉ gốc của site quà vẫn tải được nội dung quà từ file JS của nó. Nếu bạn lo bạn bè mò tới đó, chọn **dự án Vercel riêng** cho trang mời.
6. Chữ tiêu đề: "Mời bạn đến dự sinh nhật của em bé Minh Thư" (đề xuất).
7. Địa chỉ có đoạn "phường," bị trống (có vẻ sao chép từ Google Maps). Mặc định: bỏ đoạn đó, hiển thị "186 Đ. Đặng Văn Ngữ, Phú Nhuận, Hồ Chí Minh 70000". Bạn cho tên phường nếu muốn ghi.
8. Phần xem trước link: chỉ chữ (tên và mô tả), chưa có ảnh xem trước. Muốn có ảnh thì cần bạn cung cấp hoặc đồng ý để tôi vẽ ảnh lời mời.
9. Người nhận lời mời có cần ghi tên "người mời" (tên bạn) trên trang không? Mặc định: không.
