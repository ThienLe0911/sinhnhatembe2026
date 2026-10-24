# Spec: Trang mời dự sinh nhật Minh Thư

- **Trạng thái:** APPROVED (chủ dự án duyệt ngày 24/10/2026, giữ các mặc định ở mục Open Questions; ngày tiệc, kênh liên hệ và việc có bất ngờ hay không vẫn chờ trả lời)
- **Cập nhật:** 2026-10-24
- **Giai đoạn:** Implementation
- **Liên quan:** `docs/features/birthday-gacha/spec.md` (site quà sinh nhật), ADR-001 (Accepted)

---

## 1. Goal

Một trang web một màn hình dài, đẹp và nhẹ, ở **route mới `/moi/`** của cùng website, để chủ dự án gửi cho **bạn bè của Thư**. Trang cho bạn bè biết đủ thông tin buổi tiệc sinh nhật lần thứ 22 của **Trịnh Minh Thư** (địa điểm, giờ, lịch trình) và giúp họ thêm vào lịch, mở bản đồ, chia sẻ và xác nhận tham gia.

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
- **Chưa có ngày diễn ra buổi tiệc** (xem Open Questions).
- Trang dùng chung phong cách (màu, phông, linh vật chibi của Thư) với site quà, nhưng là **một trang độc lập về nội dung**: không được kéo theo thư, ảnh hay bất kỳ nội dung nào của site quà (BR-I03).
- Cần chia sẻ sớm: hôm nay là 24/10, sinh nhật 27/10.

## 3. User Stories

- **US-I01** Là bạn của Thư, tôi muốn mở link và thấy ngay giờ, địa điểm, lịch trình để biết mình cần có mặt lúc nào, ở đâu.
- **US-I02** Là bạn của Thư, tôi muốn mở bản đồ chỉ đường tới quán bằng một cú chạm.
- **US-I03** Là bạn của Thư, tôi muốn thêm buổi tiệc vào lịch điện thoại để không quên.
- **US-I04** Là bạn của Thư, tôi muốn báo mình sẽ tham dự mà không phải điền form phức tạp.
- **US-I05** Là bạn của Thư, tôi muốn chuyển lời mời cho người khác trong nhóm.
- **US-I06** Là chủ dự án, tôi muốn sửa ngày, giờ, địa điểm, lịch trình ở một chỗ mà không đụng vào giao diện.
- **US-I07** Là chủ dự án, tôi muốn chắc chắn trang mời không làm lộ nội dung riêng của site quà.

## 4. Functional Requirements

- **FR-I01** Route `/moi/` hiển thị trang mời, không cần đăng nhập. Gõ `/moi` (thiếu dấu gạch) vẫn tới được trang.
- **FR-I02** Phần đầu trang có linh vật chibi của Thư (trạng thái vui, vẫy tay hoặc ăn mừng), tiêu đề lời mời và dòng "Sinh nhật lần thứ 22". Chữ tiêu đề là đề xuất, cần duyệt: "Mời bạn đến dự sinh nhật của em bé Minh Thư".
- **FR-I03** Khối thông tin chính: ngày (chờ), giờ **18h30**, địa điểm gồm tên và địa chỉ đầy đủ.
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

## 5. Business Rules

- **BR-I01** Mọi dòng chữ do chủ dự án cung cấp được dùng **nguyên văn** (kể cả "kỉ niệm"). Chữ do agent đề xuất phải được duyệt trước khi phát hành.
- **BR-I02** Giờ hiển thị theo giờ Việt Nam, dạng "18h30", "20h", "22h".
- **BR-I03** Gói tải về của trang mời **không chứa** bất kỳ nội dung nào của site quà: thư, caption, ảnh, tên file ảnh, âm thanh, khoá lưu tiến trình, mã màn hình của game.
- **BR-I04** Trang không thu thập dữ liệu của người xem, không phân tích, không cookie, không gọi dịch vụ bên thứ ba khi tải trang.
- **BR-I05** Trang `noindex` (cùng cơ chế với site chính).
- **BR-I06** Trang không nhắc tới món quà hay bất ngờ nào dành cho Thư.
- **BR-I07** Thông tin cá nhân chỉ gồm tên Thư và địa điểm công khai của quán; không đưa số điện thoại, địa chỉ nhà hay ảnh của ai vào trang (trừ kênh liên hệ ở FR-I08 do chủ dự án chọn).

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
- **Hiệu năng:** gói JS riêng của trang mời nhỏ hơn nhiều so với site quà (đề xuất ≤ 120 KB gzip), tải đầu ≤ 2,5 giây trên 4G, không phông hay ảnh bên ngoài.
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

Chưa có ngày: mọi quyết định ở trên không phụ thuộc ngày.

## 10. Acceptance Criteria

- **AC-I01** Mở `/moi/` (và `/moi`) thấy tiêu đề lời mời, giờ 18h30, tên quán và địa chỉ, lịch trình hai mốc đúng thứ tự, lời kết nguyên văn.
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

## 11. Out Of Scope

- Form xác nhận tham dự, đếm số người, danh sách khách, backend, cơ sở dữ liệu.
- Bình chọn "cà phê hay board game" (cần backend; hiện chỉ ghi rõ là tuỳ thời tiết và lựa chọn của mọi người).
- Nhúng bản đồ, ảnh chụp quán, ảnh bạn bè, thư viện ảnh.
- Nhiều sự kiện, nhiều ngôn ngữ, mật khẩu, tài khoản, phân tích truy cập.
- Gửi thông báo hoặc nhắc lịch từ máy chủ.

## 12. Open Questions

**Cần bạn trả lời (chặn việc hoàn thiện):**
1. **Ngày diễn ra buổi tiệc** là ngày nào? Trang mời bắt buộc có ngày; chưa có thì không phát hành được và file lịch không tạo được.
2. **Cách bạn bè xác nhận tham gia?** Đưa tôi một đường liên kết (Zalo, Messenger) hoặc số điện thoại bạn muốn dùng; chưa có thì tôi ẩn nút (FR-I08).
3. **Buổi tiệc có phải bất ngờ với Thư không?** Nếu có, trang cần dòng nhắc "giữ bí mật" và nên tách thành địa chỉ riêng (xem mục dưới).

**Có mặc định, bạn đổi nếu muốn:**
4. Đường dẫn **`/moi/`** (ngắn, dễ gõ).
5. **Cùng dự án Vercel, gói riêng** (đề xuất I-1). Rủi ro còn lại: ai biết địa chỉ gốc của site quà vẫn tải được nội dung quà từ file JS của nó. Nếu bạn lo bạn bè mò tới đó, chọn **dự án Vercel riêng** cho trang mời.
6. Chữ tiêu đề: "Mời bạn đến dự sinh nhật của em bé Minh Thư" (đề xuất).
7. Địa chỉ có đoạn "phường," bị trống (có vẻ sao chép từ Google Maps). Mặc định: bỏ đoạn đó, hiển thị "186 Đ. Đặng Văn Ngữ, Phú Nhuận, Hồ Chí Minh 70000". Bạn cho tên phường nếu muốn ghi.
8. Phần xem trước link: chỉ chữ (tên và mô tả), chưa có ảnh xem trước. Muốn có ảnh thì cần bạn cung cấp hoặc đồng ý để tôi vẽ ảnh lời mời.
9. Người nhận lời mời có cần ghi tên "người mời" (tên bạn) trên trang không? Mặc định: không.
