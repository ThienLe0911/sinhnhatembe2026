# Tasks: Trang mời dự sinh nhật Minh Thư

- **Trạng thái:** v1 (T-I01 đến T-I07) APPROVED 24/10/2026 và **đã xong**, commit `d5d3075`. **v2 (T-I09 đến T-I13, mục 3B) APPROVED 24/10/2026 cùng spec v2, đang làm.** T-I08 (triển khai) chưa làm.
- **Cập nhật:** 2026-10-24
- **Nguồn:** `spec.md` (v1 APPROVED, v2 nháp), ADR-001 (Accepted)
- **Giai đoạn:** v1 Implementation xong; v2 Tasks

---

## 1. Cách đọc

- Mỗi task nhỏ, kiểm chứng được, có thứ tự. Ưu tiên: P0 bắt buộc, P1 nên có. Cỡ: S dưới 1 giờ, M 1 đến 3 giờ, L 3 đến 6 giờ.
- Chỉ bắt đầu khi **spec và ADR-001 được duyệt** và đã có **ngày diễn ra buổi tiệc** (câu hỏi 1 trong spec). Task nào cần ngày thì ghi rõ.
- Không thêm thư viện. Không sửa nội dung, kiểu hay màn hình của site quà (`src/content/`, `src/state/`, `src/screens/`); nếu cần phải dừng và hỏi.
- Trước khi sửa file đã có (`vite.config.ts`, `vercel.json`, `package.json`): `grep` nơi tham chiếu và báo blast radius.

## 2. Cấu trúc đích

```
moi/index.html            điểm vào thứ hai: meta noindex, viewport, tên và mô tả xem trước
src/invite/
  main.tsx                render trang mời (dùng token, MotionProvider, ErrorBoundary đã có)
  InvitePage.tsx          giao diện
  InvitePage.module.css
  content.ts              nội dung trang mời (FR-I10), kiểu và bộ kiểm tra
  calendar.ts             giờ "18h30", link bản đồ, link Google Calendar, nội dung .ics
  actions.ts              sao chép, chia sẻ, tải .ics, có phương án thay thế
scripts/check-invite-isolation.mjs   quét dist/moi/ (AC-I09)
```

## 3. Danh sách task

### T-I01: Điểm vào thứ hai và cấu hình build (P0, S)
- **Phụ thuộc:** ADR-001 được duyệt.
- **Phạm vi:** `moi/index.html`, `vite.config.ts` (khai báo hai điểm vào), `src/invite/main.tsx` (khung tối thiểu).
- **Hoàn thành khi:** `npm run build` tạo cả `dist/index.html` và `dist/moi/index.html`; trình phát triển phục vụ `/moi/`; trang gốc `/` không đổi; `npm run test` và `npm run lint` vẫn qua.
- **Spec:** FR-I01, I-1, AC-I12.

### T-I02: Nội dung và bộ kiểm tra (P0, S)
- **Phụ thuộc:** T-I01. Cần **ngày** để điền; trong lúc chờ để placeholder có ngoặc vuông.
- **Phạm vi:** `src/invite/content.ts` và test.
- **Việc:** kiểu dữ liệu và nội dung: tên sự kiện, tuổi, ngày, giờ bắt đầu và kết thúc, địa điểm (tên, địa chỉ), hai mốc lịch trình, lời kết, kênh liên hệ (tuỳ chọn). Chế độ nghiêm ngặt khi build phát hành: từ chối nếu còn `[ ]` hoặc thiếu ngày.
- **Hoàn thành khi:** test chứng minh các chuỗi nguyên văn khớp mục 2 của spec; thiếu ngày hoặc còn `[ ]` thì bị từ chối ở chế độ nghiêm ngặt.
- **Spec:** FR-I03, I04, I09, I10, BR-I01, AC-I02.

### T-I03: Thư viện lịch và bản đồ (P0, M)
- **Phụ thuộc:** T-I02 (kiểu dữ liệu). Làm song song được với T-I04 khi kiểu đã có.
- **Phạm vi:** `src/invite/calendar.ts` và test.
- **Việc:** hàm thuần: định dạng giờ "18h30", "20h", "22h"; link tìm kiếm Google Maps (mã hoá tên và địa chỉ); link Google Calendar (`dates=` theo UTC); nội dung `.ics` theo RFC 5545 (UTC, thoát `, ; \` và xuống dòng, gập dòng ở 75 octet, `CRLF`).
- **Hoàn thành khi:** test với ngày cố định cho đúng `DTSTART` 11h30 UTC và `DTEND` 15h00 UTC (tương ứng 18h30 và 22h giờ Việt Nam), dòng không dài quá 75 octet kể cả khi có tiếng Việt có dấu, ký tự đặc biệt được thoát, link bản đồ đúng.
- **Spec:** FR-I05, I06, BR-I02, AC-I03, I04, I05.

### T-I04: Giao diện trang mời (P0, L)
- **Phụ thuộc:** T-I01, T-I02.
- **Phạm vi:** `src/invite/InvitePage.tsx`, `InvitePage.module.css`.
- **Việc:** phần đầu (linh vật, tiêu đề, "Sinh nhật lần thứ 22", ngày và giờ), thẻ địa điểm, đường thời gian dọc hai mốc, lời kết. Dùng lại token, `Stage`, `Button`, `Mascot`. Chuyển động nhẹ, tôn trọng giảm chuyển động (hook dùng chung có sẵn).
- **Hoàn thành khi:** xem ở 360×780 và 430×932: không cuộn ngang, chữ chính ≥ 16px, nút ≥ 44px, đúng thứ tự mốc; giảm chuyển động thì chuyển động lớn bị bỏ.
- **Spec:** FR-I02, I03, I04, I09, I12, AC-I01, I10, I11.

### T-I05: Các nút hành động (P0, M)
- **Phụ thuộc:** T-I03, T-I04. Nút RSVP cần **kênh liên hệ** (câu hỏi 2); chưa có thì ẩn.
- **Phạm vi:** `src/invite/actions.ts`, phần nút trong `InvitePage.tsx`.
- **Việc:** "Mở bản đồ", "Sao chép địa chỉ", "Thêm vào lịch" (Google Calendar, tải `.ics`), "Chia sẻ lời mời" (Web Share, không có thì sao chép link), "Mình sẽ tham dự". Mỗi nút có phương án thay thế khi trình duyệt tích hợp của Zalo, Messenger không hỗ trợ; báo "Đã sao chép" ngắn gọn.
- **Hoàn thành khi:** test cho logic thuần (chọn Web Share hay sao chép, chọn tải `.ics` hay chỉ Google Calendar); thử tay từng nút ở Chrome và ở Safari.
- **Spec:** FR-I05 đến I08, I11, AC-I03, I06, I07, I13.

### T-I06: Xem trước link và khả năng truy cập (P1, S)
- **Phụ thuộc:** T-I04.
- **Phạm vi:** `moi/index.html` (meta og:title, og:description, theme-color), kiểm tra tương phản.
- **Hoàn thành khi:** thẻ meta chỉ chữ (không ảnh) có đủ; nhãn cho trình đọc màn hình đầy đủ; tương phản đạt AA bằng test token hiện có.
- **Spec:** FR-I13, NFR khả năng truy cập.

### T-I07: Kiểm tra cách ly gói (P0, S)
- **Phụ thuộc:** T-I01, T-I04.
- **Phạm vi:** `scripts/check-invite-isolation.mjs`; thêm script `check:invite` trong `package.json` (sửa file có sẵn, báo blast radius).
- **Việc:** sau `npm run build`, quét `dist/moi/**` và mọi JS/CSS mà `dist/moi/index.html` tải: không được chứa đoạn thư, caption, tên file ảnh `*.webp`, `gacha:progress`, tên màn hình của game; thoát với mã khác 0 nếu có.
- **Hoàn thành khi:** script qua trên bản build thật; thử cố ý import nội dung site quà vào trang mời thì script báo lỗi (xác nhận bằng một lần thử rồi hoàn tác).
- **Spec:** BR-I03, AC-I09, ADR-001.

### T-I08: Triển khai và thử thật (P0, S)
- **Phụ thuộc:** T-I01 đến T-I07 xong, chủ dự án cho phép triển khai.
- **Việc:** `npm run build`, chạy `check:invite`, triển khai production bằng Vercel CLI (dự án đã có), kiểm tra `/moi/` và `/moi`: HTTP 200, header `noindex`, quét tay `dist/moi`; chủ dự án gửi link vào một nhóm Zalo hoặc Messenger thử, mở bằng trình duyệt tích hợp trên iPhone và Android nếu có.
- **Hoàn thành khi:** AC-I08, I12, I13 đạt trên địa chỉ thật; chủ dự án xác nhận trước khi gửi cho bạn bè.
- **Spec:** AC-I08, AC-I12, AC-I13.

## 3B. Task v2 — hai trang dẫn (APPROVED 24/10/2026)

Phạm vi sửa: chỉ `src/invite/`, `moi/index.html` (thẻ meta) và test. Không thêm thư viện, không đụng `src/content/`, `src/state/`, `src/screens/`, `vite.config.ts`, `vercel.json`. Mọi thay đổi trên symbol có sẵn (`inviteContent`, `InvitePage`, `main.tsx`) phải `grep` nơi tham chiếu và báo blast radius trước khi sửa.

### T-I09: Nội dung hai trang dẫn và nguồn tuổi duy nhất (P0, S)
- **Phụ thuộc:** spec v2 được duyệt; Open Question 10 (tuổi) đã trả lời.
- **Phạm vi:** `src/invite/content.ts`, `validate.ts` và test.
- **Việc:** thêm vào `InviteContent`: `age`, khối `intro` (tiêu đề, 6 bong bóng, nhãn nút), khối `reveal` (câu dẫn, gợi ý, lời hé lộ, nhãn). `subtitle`, tên sự kiện lịch và đoạn chia sẻ lấy từ `age` (BR-I09). Bộ kiểm tra nghiêm ngặt phủ cả nội dung mới. Test quét chữ mới: không chứa "quà", "bất ngờ", số điện thoại; tuổi khớp ở mọi nơi kể cả thẻ meta trong `moi/index.html`.
- **Blast radius đã biết (trước khi làm):** `InvitePage.tsx` (đọc `title`, `subtitle`, `date`…), `calendar.ts` và `validate.ts` (đọc nội dung), `content.test.ts`, `calendar.test.ts`, `invite-page.test.tsx`; chuỗi "lần thứ 22" còn ở `moi/index.html`.
- **Hoàn thành khi:** test qua; nội dung hiện tại cho ra đúng các chuỗi cũ (không hồi quy v1).
- **Spec:** FR-I15, I16, I20, BR-I09, BR-I10, AC-I22, I23.

### T-I10: Trang 1, giới thiệu (P0, M)
- **Phụ thuộc:** T-I09.
- **Phạm vi:** `src/invite/IntroPage.tsx`, `IntroPage.module.css` (file mới).
- **Việc:** linh vật `Mascot` (trạng thái vui) ở giữa, 6 bong bóng bao quanh có mũi nhọn chỉ về linh vật, hiện lần lượt rồi lơ lửng khẽ, nút "Tiếp theo" và liên kết "Bỏ qua". Chữ là văn bản thật. Bố cục xếp so le hai bên linh vật để vừa ở 360 đến 430 px.
- **Hoàn thành khi:** AC-I14, AC-I21 (xem ở 360×667, 390×844, 430×932), AC-I19 cho riêng trang này.
- **Spec:** FR-I15, I17, I18, AC-I14, I19, I21.

### T-I11: Trang 2, hé lộ (P0, M)
- **Phụ thuộc:** T-I09. Làm song song được với T-I10 (khác file) nhưng tôi tự làm tuần tự, xem mục 4.
- **Phạm vi:** `src/invite/RevealPage.tsx`, `RevealPage.module.css` (file mới), thêm icon bóng bay "?" vào `icons.tsx`.
- **Việc:** câu dẫn, icon bí mật là nút lớn (≥ 64px) nhịp nhẹ; bấm lần 1: icon mở ra, hiện "Là sinh nhật của mình đó" trong bong bóng của linh vật, linh vật ăn mừng, hiệu ứng lấp lánh bằng SVG/CSS (I-6); bấm lần 2: chuyển bước. Lời hé lộ nằm trong vùng `role="status"`.
- **Hoàn thành khi:** AC-I15, I16, I20, I19 cho riêng trang này.
- **Spec:** FR-I16, I17, I19, BR-I10, AC-I15, I16, I19, I20.

### T-I12: Luồng ba bước, chuyển cảnh, focus (P0, M)
- **Phụ thuộc:** T-I10, T-I11.
- **Phạm vi:** `src/invite/flow.ts` (hàm thuần: bước hiện tại, "tiếp", "bỏ qua") và test; `src/invite/InviteFlow.tsx` (ghép ba bước bằng `AnimatePresence`); `src/invite/main.tsx` (render `InviteFlow` thay cho `InvitePage`; `InvitePage` giữ nguyên).
- **Việc:** bắt đầu ở Trang 1, không lưu bước (BR-I08); chuyển cảnh mờ và trượt nhẹ, bật giảm chuyển động thì đổi ngay; focus vào tiêu đề của bước mới; liên kết "Bỏ qua" nhảy thẳng tới Trang mời.
- **Hoàn thành khi:** AC-I14 đến I17 (kiểm tay trong trình duyệt và test hàm `flow`), AC-I18 (toàn bộ test v1 vẫn qua), AC-I19, AC-I20.
- **Spec:** FR-I14, I17, I18, I19, BR-I08, AC-I14 đến I20.

### T-I13: Kiểm chứng v2 (P0, S)
- **Phụ thuộc:** T-I12.
- **Việc:** `npm run test` (cả `TZ=America/Los_Angeles`), `lint`, `prettier`, `npm run build`, `npm run check:invite` (cách ly, AC-I22), đo gói JS trang mời gzip (AC-I24 ≤ 130 KB), xem ba bước ở 360×667, 390×844, 430×932, thử `?reduce`, thử bàn phím. Cập nhật `moi/index.html` (tuổi, mô tả) nếu cần.
- **Hoàn thành khi:** báo cáo kèm số liệu thật; mọi AC-I14 đến I24 đạt hoặc ghi rõ cái nào chưa kiểm được.
- **Spec:** AC-I14 đến I24.

## 4. Thứ tự và thời gian

| Bước | Việc | Thời gian ước lượng |
| --- | --- | --- |
| 1 | T-I01, T-I02 | khoảng 1 giờ |
| 2 | T-I03 song song T-I04 | khoảng 3 đến 4 giờ |
| 3 | T-I05, T-I06, T-I07 | khoảng 2 giờ |
| 4 | T-I08 (có thử thật cùng bạn) | khoảng 1 giờ |

Có thể xong trong một buổi nếu có ngày và kênh liên hệ ngay từ đầu.

**Thứ tự v2 (nháp):**

| Bước | Việc | Ước lượng |
| --- | --- | --- |
| 5 | T-I09 | khoảng 30 phút |
| 6 | T-I10, T-I11 | khoảng 2 giờ |
| 7 | T-I12, T-I13 | khoảng 1,5 giờ |
| 8 | T-I08 (triển khai, sau cổng G-I3) | khoảng 30 phút |

**Không dùng subagent:** T-I10 và T-I11 độc lập về file nhưng nhỏ, cùng dùng chung kiểu dữ liệu và phong cách; dựng worktree rồi gộp lại tốn hơn tự làm tuần tự. Nếu bạn muốn song song hoá, hãy nói rõ.

## 5. Cổng duyệt

| Cổng | Khi nào | Bạn duyệt gì |
| --- | --- | --- |
| G-I1 | Trước T-I01 | Spec, ADR-001, tasks này, và trả lời các câu hỏi chặn (ngày, kênh liên hệ, có bất ngờ hay không) |
| G-I2 | Sau T-I04 | Giao diện và chữ tiêu đề |
| G-I3 | Trước T-I08 | Cho phép triển khai và gửi link cho bạn bè |
| G-I4 **[v2]** | Trước T-I09 | Duyệt spec v2, tasks v2 và trả lời câu hỏi 10 (tuổi) |
| G-I5 **[v2]** | Sau T-I12 | Duyệt giao diện ba bước và chữ của hai trang dẫn, rồi mới tới G-I3 |

## 6. Truy vết

| Mục spec | Task |
| --- | --- |
| FR-I01 | T-I01 |
| FR-I02, I03, I04, I09, I12 | T-I02, T-I04 |
| FR-I05, I06 | T-I03, T-I05 |
| FR-I07, I08, I11 | T-I05 |
| FR-I10, BR-I01 | T-I02 |
| FR-I13 | T-I06 |
| BR-I03, AC-I09 | T-I07 |
| BR-I04, BR-I05, AC-I08 | T-I01, T-I08 |
| AC-I01, I02, I10, I11 | T-I02, T-I04 |
| AC-I03 đến I07 | T-I03, T-I05 |
| AC-I12, I13 | T-I01, T-I08 |
| FR-I14, I17, I18, I19, BR-I08 **[v2]** | T-I12 |
| FR-I15, AC-I14, I21 **[v2]** | T-I09, T-I10 |
| FR-I16, BR-I10, AC-I15, I16, I20 **[v2]** | T-I09, T-I11 |
| FR-I20, BR-I09, AC-I22, I23 **[v2]** | T-I09 |
| AC-I18, I19, I24 **[v2]** | T-I12, T-I13 |
