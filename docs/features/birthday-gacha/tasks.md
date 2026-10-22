# Tasks: Máy Gacha Sinh Nhật cho em bé

- **Trạng thái:** DRAFT, chờ chủ dự án duyệt
- **Cập nhật:** 2026-10-22
- **Nguồn:** `spec.md` (APPROVED v2, 22/10/2026)
- **Giai đoạn:** Tasks (chưa có code)
- **Hạn cứng:** site chạy ổn trên production trước 00:00 ngày 27/10/2026 (+07:00). Khoá phát hành đề xuất: tối 26/10.

---

## 1. Cách đọc tài liệu này

- Mỗi task nhỏ, kiểm chứng được, có thứ tự và chạy độc lập khi đã đủ phụ thuộc. Không task nào sinh nội dung ngoài phạm vi spec.
- **Ưu tiên:** P0 bắt buộc để có sản phẩm; P1 nên có; P2 làm nếu còn thời gian.
- **Cỡ:** S dưới 1 giờ, M 1 đến 3 giờ, L 3 đến 6 giờ (ước lượng thô).
- **Cổng duyệt (G):** điểm dừng bắt buộc chờ chủ dự án duyệt trước khi đi tiếp (mục 5).
- Dự án mới nên không có code cũ để sửa, blast radius của mỗi task là các file mới trong phạm vi nêu. Nếu một task cần sửa file đã có từ task trước, dev phải `grep` tìm nơi tham chiếu và báo blast radius trước khi sửa (AGENTS.md).
- Task nào làm lộ ra chỗ spec chưa đủ hoặc mâu thuẫn: **dừng và hỏi**, không tự đổi spec.
- Nội dung cá nhân (thư, caption) và mọi nơi trong mã/tên file/mô tả triển khai **không được nhắc tới món quà thật** (BR-10).

## 2. Cấu trúc thư mục đích

```
sinhnhatembe/
  image/            nguồn ảnh gốc, KHÔNG phát hành (BR-11)
  docs/             spec, tasks, thư nháp, KHÔNG phát hành
  scripts/          công cụ build (xử lý media, kiểm tra trước phát hành)
  public/           robots.txt, favicon, phông chữ tự lưu
  src/
    content/        kiểu dữ liệu, file nội dung, bộ kiểm tra (FR-13)
    state/          máy trạng thái, lưu tiến trình
    lib/            thời gian, âm thanh, phát hiện thổi
    ui/             token thiết kế, linh vật, máy gacha, capsule, thẻ
    screens/        Countdown, Intro, Play, Finale, Album
    assets/media/   ảnh/video đã xử lý (Vite băm tên)
    assets/audio/   mp3 nhạc nền
  vercel.json
  .vercelignore     loại image/ và docs/ khỏi gói triển khai
```

## 3. Thư viện và công cụ sẽ dùng (duyệt cùng tasks này)

- **Chạy thật (vào bản build):** `react`, `react-dom`, `motion` (T-2), `canvas-confetti` (T-3).
- **Chỉ lúc phát triển/build:** `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `eslint` + `typescript-eslint`, `prettier`, `sharp` (xử lý ảnh, T-7). Việc xử lý media chạy **trên máy của bạn** (dùng thêm `sips` có sẵn trên macOS để đọc HEIC; video dùng `ffmpeg` nếu đã có, nếu chưa có thì dev báo để bạn quyết cài hay không). Đầu ra WebP/MP4 nằm trong `src/assets/media/`, Vercel chỉ build từ đầu ra này.
- **Phông chữ:** tự lưu cùng site, hỗ trợ đủ dấu tiếng Việt, giấy phép tự do (đề xuất Nunito cho nội dung, Baloo 2 cho tiêu đề; chốt ở G1).
- **Âm thanh hiệu ứng:** tổng hợp bằng Web Audio (không dùng file, không vướng bản quyền).
- Kiểm thử logic bằng `vitest`; kiểm tra giao diện bằng trình duyệt ở khung 430×932 và iPhone thật. Kiểm thử đầu cuối (Playwright) thuộc giai đoạn `/validate`.

## 4. Danh sách task

### Giai đoạn A: Nền tảng (22 đến 23/10)

#### T01: Khởi tạo dự án (P0, S)
- **Phụ thuộc:** không. Làm đầu tiên.
- **Phạm vi:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, cấu hình lint/format/test, thư mục theo mục 2.
- **Việc:** dựng Vite + React + TypeScript (strict), cài thư viện mục 3, thêm script `dev`, `build`, `test`, `lint`, một test mẫu.
- **Hoàn thành khi:** `npm run build` thành công; `npm run test` chạy và qua; `npm run dev` hiện trang tạm; `dist/` không chứa `image/` hay `docs/`.
- **Spec:** T-1, T-2, T-3.

#### T02: Cấu hình Vercel, noindex và triển khai khung (P0, M)
- **Phụ thuộc:** T01. **Song song với:** T03 đến T08.
- **Phạm vi:** `vercel.json`, `.vercelignore`, `public/robots.txt`, thẻ meta trong `index.html`.
- **Việc:** header `X-Robots-Tag: noindex` cho mọi đường dẫn; `robots.txt` chặn toàn bộ; thẻ meta `noindex`; `.vercelignore` loại `image/` và `docs/`. Triển khai **trang khung chưa có nội dung cá nhân** lên Vercel với tên dự án khó đoán (thêm hậu tố ngẫu nhiên). Việc đăng nhập Vercel và lệnh triển khai do chủ dự án thực hiện hoặc cho phép từng lần (đây là hành động đưa nội dung ra ngoài).
- **Hoàn thành khi:** `curl -I` tới URL thấy `X-Robots-Tag: noindex`; `/robots.txt` đúng; mở được trên iPhone bằng HTTPS; log upload của lần triển khai không liệt kê `image/` và `docs/`.
- **Spec:** T-6, BR-11, NFR riêng tư, AC-15. Triển khai sớm vì micro chỉ chạy trên HTTPS nên cần URL thật để thử trên iPhone.

#### T03: Quy trình xử lý media (P0, M)
- **Phụ thuộc:** T01. **Song song với:** T02, T04 đến T08.
- **Phạm vi:** `scripts/process-media.*`, `src/assets/media/` (đầu ra).
- **Việc:** đọc `image/` và đường dẫn do bạn chỉ; ảnh HEIC/JPEG sang WebP, xoay đúng chiều, cạnh dài tối đa 1440px (màn 430pt × 3), chất lượng vừa đủ; xoá toàn bộ EXIF; video MOV sang MP4 H.264 ngắn, tắt tiếng, kèm ảnh poster, có `playsinline`. **Không sửa hay di chuyển file gốc.** Chạy lặp lại cho cùng kết quả.
- **Hoàn thành khi:** chạy trên 3 ảnh hiện có ra 3 WebP, mỗi file ≤ 300KB; kiểm tra metadata xác nhận không còn EXIF/GPS; checksum file gốc trong `image/` không đổi.
- **Spec:** T-7, BR-08, BR-11.

#### T04: Lược đồ nội dung và file nội dung (P0, M)
- **Phụ thuộc:** T01. **Song song với:** T02, T03, T06 đến T08.
- **Phạm vi:** `src/content/types.ts`, `src/content/content.ts`, `src/content/validate.ts`, test.
- **Việc:** kiểu dữ liệu cho capsule (hạng, dạng thẻ, media, caption, slot voice note), cấu hình chung (mốc mở khoá, năm sinh và tuổi, tên máy, lời đếm ngược, bảng tỉ lệ rơi, thư, câu thì thầm, nhạc). Điền nội dung hiện có: 8 capsule đúng thứ tự Thường, Thường, Bạc, Thường, Thường, Bạc, Bạc, Vàng; thư lấy từ `letter-draft.md`. Bộ kiểm tra có chế độ **nghiêm ngặt** dùng khi build phát hành.
- **Hoàn thành khi:** test chứng minh bộ kiểm tra từ chối cấu hình có: không đúng một capsule vàng hoặc vàng không ở cuối; id trùng; (chỉ ở chế độ nghiêm ngặt) đường dẫn media không tồn tại, còn ký hiệu `[` `]` trong thư hoặc caption, hoặc thiếu mp3. Cấu hình hiện tại qua chế độ thường (nên T04 không phụ thuộc T03).
- **Spec:** FR-13, BR-01, BR-02, BR-05.

#### T05: Máy trạng thái và lưu tiến trình (P0, M)
- **Phụ thuộc:** T04. **Song song với:** T06 đến T08.
- **Phạm vi:** `src/state/*`, test.
- **Việc:** trạng thái `COUNTDOWN` → `INTRO` → `PLAY` → `FINALE` → `ALBUM`; chuyển trạng thái; lưu tại các điểm ổn định (đã nạp xu, capsule đã rơi vào khay, capsule đã mở, finale xong) bằng `localStorage` bọc try/catch; khôi phục khi mở lại; xoá tiến trình ("chơi lại").
- **Hoàn thành khi:** test với kho lưu giả chứng minh: mở lại giữa chừng trả đúng chỗ, kể cả capsule còn trong khay; `localStorage` ném lỗi thì bắt đầu từ đầu và không crash; capsule vàng bị khoá đến khi mở hết các capsule trước; xoá tiến trình đưa về `INTRO`.
- **Spec:** FR-24, BR-01, BR-02, AC-11.

#### T06: Đếm ngược và xem trước (P0, S)
- **Phụ thuộc:** T01. **Song song với:** T02 đến T05, T07, T08.
- **Phạm vi:** `src/lib/time.*`, test.
- **Việc:** hằng mốc `2026-10-27T00:00:00+07:00`; hàm tính ngày/giờ/phút/giây còn lại từ đồng hồ có thể thay thế được khi test; cờ đã mở khoá; nhận tham số xem trước `?preview` trên địa chỉ để bỏ qua đếm ngược; phát sự kiện mở khoá đúng một lần.
- **Hoàn thành khi:** test với đồng hồ giả: trước mốc, đúng mốc, sau mốc; kết quả như nhau khi múi giờ máy là `Asia/Ho_Chi_Minh` và `America/Los_Angeles`; có `?preview` thì coi như đã mở khoá.
- **Spec:** FR-01, FR-03, FR-04, FR-28, BR-03.

#### T07: Quản lý âm thanh (P1, M)
- **Phụ thuộc:** T01. **Song song với:** T02 đến T06, T08.
- **Phạm vi:** `src/lib/audio.*`, `src/assets/audio/` (chưa có mp3), test.
- **Việc:** nhạc nền lặp, mở khoá âm thanh ở cú chạm đầu tiên, bật/tắt và nhớ lựa chọn, hạ âm lượng hoặc tạm dừng theo yêu cầu (cho lúc dùng mic), hiệu ứng tổng hợp bằng Web Audio: xu rơi, núm quay, capsule rơi, bật nắp, lấp lánh, pháo giấy.
- **Hoàn thành khi:** không có file mp3 vẫn không lỗi và không hiện báo lỗi; tắt tiếng thì mọi hiệu ứng im; tải lại trang giữ trạng thái tắt; AudioContext bị tạm dừng không làm văng lỗi.
- **Spec:** FR-07, FR-25, AC-13.

#### T08: Phát hiện thổi bằng micro (P0, M)
- **Phụ thuộc:** T01. **Song song với:** T02 đến T07.
- **Phạm vi:** `src/lib/blow.*`, test.
- **Việc:** xin quyền micro chỉ khi gọi hàm bắt đầu; đo mức âm bằng Web Audio, tự hiệu chuẩn tiếng ồn nền vài trăm mili giây đầu; coi là "thổi" khi năng lượng thấp tần vượt ngưỡng đủ lâu; xuất mức cường độ 0 đến 1 cho ngọn lửa; trạng thái `unavailable` khi bị từ chối hay không có micro; hàm dừng phải tắt mọi track và đóng context ngay.
- **Hoàn thành khi:** test thuần logic với dãy mẫu giả: im lặng không kích hoạt, tiếng động ngắn không kích hoạt, tiếng thổi kéo dài kích hoạt, nền ồn không gây kích hoạt sai; từ chối quyền trả đúng trạng thái; sau khi dừng không còn track nào hoạt động. Việc thử với micro thật làm ở T23.
- **Spec:** FR-16, FR-17, FR-18, BR-06, AC-07, AC-08, AC-10.

### Giai đoạn B: Thiết kế hình (23/10)

#### T09: Token thiết kế, phông chữ và khung giao diện (P0, M)
- **Phụ thuộc:** T01.
- **Phạm vi:** `src/ui/tokens.*`, `src/ui/Stage.*`, CSS toàn cục, `public/fonts/`.
- **Việc:** biến màu (hồng đào, kem bơ, lavender, xanh matcha pastel, ánh kim bạc, vàng), cỡ chữ, bo góc, đổ bóng, grain nhẹ; phông tự lưu; khung `Stage` dọc dùng `dvh` và `safe-area-inset`, vùng chạm ≥ 44px; nền tảng `prefers-reduced-motion`; **trang mẫu phong cách** (style tile) để duyệt.
- **Hoàn thành khi:** ở khung 430×932 không có cuộn ngang; chữ nội dung ≥ 16px và tương phản ≥ 4.5:1; chữ có dấu tiếng Việt hiển thị đúng (ví dụ "Ắ ế ữ ộ ự"); **qua cổng G1**.
- **Spec:** mục 7, NFR khả năng truy cập.

#### T10: Linh vật chibi bằng SVG (P1, L)
- **Phụ thuộc:** T09. **Song song với:** T11.
- **Phạm vi:** `src/ui/Mascot.*`, trang xem linh vật chỉ dùng khi phát triển (không vào bản build).
- **Việc:** vẽ tay bằng SVG theo đặc điểm nhận diện đã ghi ở spec (tóc dài gợn sóng, kính tròn, nụ cười mím, dáng chống cằm, áo đen, váy nâu, vòng bạc); component nhận trạng thái chờ, vui, ngạc nhiên, ngủ gật, ăn mừng; chuyển động chớp mắt và thở nhẹ. **Không nhúng ảnh thật** và không vẽ nhân vật hoạt hình có bản quyền.
- **Hoàn thành khi:** 5 trạng thái hiển thị đúng; kích thước ≤ 30KB; tôn trọng giảm chuyển động; **qua cổng G1**.
- **Spec:** FR-26, BR-07, mục 7.

#### T11: Máy gacha, capsule và khay bằng SVG/CSS (P0, L)
- **Phụ thuộc:** T09. **Song song với:** T10.
- **Phạm vi:** `src/ui/GachaMachine.*`, `src/ui/Capsule.*`, trang xem máy chỉ dùng khi phát triển.
- **Việc:** máy có quả cầu kính chứa các capsule, khe xu, núm xoay (nhận góc xoay), khay; vị trí cho linh vật trên đỉnh (tạm dùng khung giữ chỗ nếu T10 chưa xong); capsule ba hạng (pastel, bạc ánh kim, vàng) và hoạt hình bật nắp.
- **Hoàn thành khi:** hiển thị đủ ba hạng; góc núm điều khiển được từ ngoài; không xô lệch bố cục khi hoạt hình chạy; chỉ animate `transform` và `opacity`; **qua cổng G1**.
- **Spec:** FR-05, FR-09, FR-10, T-5.

### Giai đoạn C: Màn hình (23 đến 25/10)

#### T12: Màn đếm ngược (P0, M)
- **Phụ thuộc:** T06, T09; T10 nếu đã có (không thì giữ chỗ).
- **Việc:** màn `COUNTDOWN` hiển thị đồng hồ, lời "đảo vai" lấy từ nội dung, linh vật; khi chạm mốc chuyển mượt sang `INTRO` kèm nút "Vào chơi", không phát âm thanh trước khi có cú chạm.
- **Hoàn thành khi:** với đồng hồ giả trước mốc chỉ thấy đếm ngược và không có đường vào nội dung; qua mốc tự chuyển sang `INTRO`; có `?preview` vào thẳng `INTRO`.
- **Spec:** FR-01 đến FR-03, AC-01, AC-02.

#### T13: Màn nạp xu (P0, M)
- **Phụ thuộc:** T05, T11; T07 nếu đã có.
- **Việc:** màn `INTRO` với máy, tên máy, xu hình trái tim kéo vào khe bằng spring (phương án chạm: xu tự bay vào), cú chạm đầu tiên mở khoá âm thanh, nút "i" mở bảng tỉ lệ rơi.
- **Hoàn thành khi:** kéo hoặc chạm xu đều dẫn tới chu trình quay; nhạc nền bắt đầu sau cú chạm đầu tiên (khi đã có mp3); bảng tỉ lệ rơi mở và đóng được, có dòng "Cá 0%".
- **Spec:** FR-05 đến FR-08, AC-03.

#### T14: Quay và capsule rơi (P0, L)
- **Phụ thuộc:** T05, T11; T07 nếu đã có.
- **Việc:** xoay núm bằng cử chỉ xoay (phương án chạm giữ), capsule lăn trong quả cầu theo hoạt hình dựng sẵn, máy rung hình ảnh, capsule kế tiếp theo thứ tự rơi vào khay và nảy; ghi điểm lưu "capsule trong khay".
- **Hoàn thành khi:** mỗi lần quay rơi đúng capsule kế tiếp, màu đúng hạng; thoát và mở lại khi capsule còn trong khay thì khay vẫn còn capsule; thao tác chạm thay thế hoạt động đủ.
- **Spec:** FR-09, FR-10, FR-24, BR-01, AC-04.

#### T15: Mở capsule và thẻ kỷ niệm (P0, L)
- **Phụ thuộc:** T04, T05, T14.
- **Việc:** chạm khay để bật nắp, thẻ bay ra; các dạng thẻ (ảnh/video kèm caption, hai ảnh lật qua lại, voucher, lời hứa có slot voice note, hiện ảnh thay khi chưa có âm thanh); hologram ánh kim cho hạng Bạc theo ngón tay kéo (P1); đóng thẻ thì thêm vào album, cập nhật "n/N" và dòng pity; capsule vàng hiện trạng thái "đang chờ" đến khi mở hết capsule trước.
- **Hoàn thành khi:** mỗi dạng thẻ trong cấu hình hiển thị đúng; thẻ Bạc phản ứng với ngón tay kéo; không quay được capsule vàng khi chưa mở hết các capsule trước; bộ đếm đúng.
- **Spec:** FR-10 đến FR-12, FR-14, FR-15, BR-02, AC-05, AC-06.

#### T16: Finale phần 1: thổi nến, bánh, pháo giấy (P0, L)
- **Phụ thuộc:** T08, T11; T10 nếu đã có; T07 nếu đã có.
- **Việc:** màn nến với hai nến số "2" "2" trên bánh matcha; nút "Thổi nến" xin quyền micro **chỉ sau khi bấm**; ngọn lửa lung lay theo mức thổi, tắt khi đủ; nút "Chạm để thổi" thay thế luôn có; nhạc nền hạ hoặc tạm dừng trong lúc dùng micro; khi nến tắt thì bánh hoàn chỉnh xuất hiện, pháo giấy bay, linh vật ăn mừng; dừng micro ngay.
- **Hoàn thành khi:** trình duyệt không xin micro trước khi bấm nút; từ chối quyền vẫn đi hết được nhờ phương án chạm; sau khi xong không còn track micro hoạt động; hoạt hình bánh và pháo giấy chạy mượt ở khung iPhone.
- **Spec:** FR-16 đến FR-19, BR-05, BR-06, AC-07, AC-08, AC-10.

#### T17: Finale phần 2: thư và câu thì thầm (P0, M)
- **Phụ thuộc:** T04, T16.
- **Việc:** thư gõ từng chữ từ nội dung, chạm để hiện nhanh, cuộn mượt, ký tên "Anh Thúi của em bé"; sau thư linh vật thì thầm đúng một câu gợi ý lấy từ nội dung; sau đó mới hiện nút "Xem album"; lưu trạng thái hoàn thành.
- **Hoàn thành khi:** thư hiển thị đủ từng chữ rồi mới đến chữ ký; chạm hiện nhanh toàn bộ; câu thì thầm xuất hiện sau thư và trước nút album; tải lại thì khôi phục đúng ở `ALBUM`.
- **Spec:** FR-20, FR-21, BR-10, AC-09.

#### T18: Album (P1, M)
- **Phụ thuộc:** T05, T15.
- **Việc:** lưới thẻ (thẻ chưa mở là bóng mờ), xem lại thẻ toàn màn hình, "Xem lại màn thổi nến", "Chơi lại từ đầu" có hộp xác nhận chỉ xoá tiến trình cục bộ.
- **Hoàn thành khi:** thẻ đã mở xem lại được; "Chơi lại" chỉ xoá sau khi xác nhận và đưa về `INTRO`; không thay đổi nội dung gốc.
- **Spec:** FR-22, FR-23, BR-09, AC-12.

#### T19: Lắp ráp, chuyển cảnh và xử lý lỗi (P0, M)
- **Phụ thuộc:** T12 đến T18.
- **Việc:** nối các màn theo máy trạng thái, chuyển cảnh mượt, biến thể giảm chuyển động, màn dự phòng khi gặp lỗi bất ngờ (không để màn trắng), tải trước media đầu tiên.
- **Hoàn thành khi:** đi trọn luồng từ đếm ngược (qua `?preview`) tới thư và album không lỗi; bật "Giảm chuyển động" thì các hoạt hình lớn đổi sang chuyển cảnh nhẹ và nội dung vẫn đủ; lỗi giả lập ở một màn không làm trắng cả trang.
- **Spec:** FR-28, NFR độ tin cậy, AC-14.

#### T20: Màn tải có câu đùa "đang đợi em bé" (P2, S)
- **Phụ thuộc:** T09.
- **Việc:** màn tải ngắn kèm câu đùa "Đang đợi em bé… 99%".
- **Hoàn thành khi:** hiệu ứng không kéo dài thời gian tải thật quá 1,5 giây (kiểm tra bằng đo thời gian).
- **Spec:** FR-27.

### Giai đoạn D: Nội dung, kiểm thử, phát hành (24 đến 26/10)

#### T21: Tư liệu cuối từ chủ dự án (P0, việc của bạn)
- **Hạn:** trước **24/10**. Thiếu gì thì dùng nội dung tạm và đánh dấu bằng `[ ]`.
- **Cần có:** ảnh/video cho capsule 1 (lần đầu gặp) và 5 (cú đêm) cùng các thẻ khác muốn thêm; caption cho capsule 1, 2, 4, 5; chốt thư (điền hoặc xoá các chỗ `[ ]`); file mp3; tên máy; xác nhận ý nghĩa cáo và thỏ.
- **Hoàn thành khi:** bạn bàn giao đủ và xác nhận.

#### T22: Tích hợp nội dung cuối (P0, M)
- **Phụ thuộc:** T03, T04, T19, T21.
- **Việc:** chạy quy trình media trên tư liệu mới, cập nhật file nội dung, đặt mp3 vào `src/assets/audio/`; rà giọng văn trêu yêu không trách móc (BR-04); rà không nhắc quà thật ở bất kỳ file nào (BR-10).
- **Hoàn thành khi:** bộ kiểm tra nghiêm ngặt của T04 qua; không còn `[ ]` trong nội dung; mp3 ≤ 5MB; tìm trong toàn dự án không thấy chỗ nào mô tả quà thật. **Qua cổng G2** (bạn đọc lại thư và caption lần cuối).
- **Spec:** BR-04, BR-10.

#### T23: Thử trên iPhone thật, vòng 1 (P0, M)
- **Phụ thuộc:** T19, T02 (URL HTTPS). Cần bạn cầm iPhone, tôi cung cấp danh sách kiểm tra.
- **Việc:** chạy trọn luồng bằng `?preview` trên iPhone 15 Pro Max: cấp và từ chối quyền micro, thổi thật, phương án chạm, mở khoá âm thanh, công tắc im lặng, Dynamic Island và safe area, thoát hẳn rồi mở lại, "Giảm chuyển động", cảm giác 60fps. Ghi lỗi theo mức nghiêm trọng.
- **Hoàn thành khi:** danh sách kiểm tra điền đủ; mọi lỗi nghiêm trọng đã được ghi để xử lý ở T24.
- **Spec:** AC-16, AC-07, AC-08.

#### T24: Sửa lỗi và tối ưu hiệu năng (P0, M đến L)
- **Phụ thuộc:** T23.
- **Việc:** sửa lỗi từ T23; đo hiệu năng và tối ưu (tải lười ảnh/video, nén, tách mã); thử lại các mục bị ảnh hưởng.
- **Hoàn thành khi:** Lighthouse di động (giả lập 4G) đạt LCP ≤ 2,5s trên trang đầu; không còn lỗi nghiêm trọng mở; luồng đầy đủ chạy mượt trên iPhone.
- **Spec:** NFR hiệu năng.

#### T25: Phát hành (P0, S)
- **Phụ thuộc:** T22, T24. **Cần bạn xác nhận trước khi triển khai production** (đây là hành động đưa nội dung cá nhân ra ngoài).
- **Việc:** chạy bộ kiểm tra nghiêm ngặt; kiểm tra bản build không chứa file gốc `image/` và không còn EXIF; xác nhận header `X-Robots-Tag: noindex` trên URL production; mạng chỉ gọi về chính site (không bên thứ ba, không analytics); `?preview` còn hoạt động và URL thường hiện đếm ngược; triển khai production; đưa URL cho bạn.
- **Hoàn thành khi:** mọi mục trên đạt và bạn xác nhận **qua cổng G3**. Sau đó **đóng băng** đến hết 27/10 (không triển khai thêm trừ lỗi nghiêm trọng).
- **Spec:** AC-01, AC-15, BR-10, BR-11.

## 5. Cổng duyệt của chủ dự án

| Cổng | Khi nào | Bạn duyệt gì |
| --- | --- | --- |
| G1 | Sau T09, T10, T11 (dự kiến 23/10) | Phong cách, phông chữ, bản vẽ linh vật, hình dáng máy |
| G2 | Sau T22 (dự kiến 25/10) | Thư, caption, voucher, tên máy ở dạng cuối |
| G3 | Trước T25 (dự kiến 26/10) | Cho phép triển khai production và gửi link |

## 6. Thứ tự và lịch đề xuất

| Ngày | Việc chính |
| --- | --- |
| 22/10 (tối) đến 23/10 | T01, rồi T02 đến T08 (độc lập nhau), T09 đến T11, qua G1 |
| 24/10 | T12 đến T17; bạn bàn giao tư liệu (T21) |
| 25/10 | T18 đến T20, T22 (qua G2), T23 |
| 26/10 | T24, T25 (qua G3), đóng băng |
| 27/10 00:00 | Mở khoá |

**Đường găng:** T01 → T09 → T11 → T14 → T15 → T16 → T17 → T19 → T23 → T24 → T25.

**Nếu trễ, cắt theo thứ tự này (từ cái đầu tiên):** T20 (màn tải) → hologram trong T15 → "Xem lại màn thổi nến" trong T18 → các trạng thái linh vật ngoài chờ và ăn mừng → bảng tỉ lệ rơi. Không cắt: đếm ngược, quay và mở thẻ, thổi nến cùng phương án chạm, thư, lưu tiến trình, noindex, kiểm tra EXIF.

## 7. Cách thực thi đề xuất

- Mặc định **tôi làm tuần tự** trong phiên chính, không dùng subagent.
- Sau T01, các task T03, T04, T06, T07, T08 (khác file) và sau T09 là T10, T11 có thể chạy song song để kịp hạn. Theo quy ước, mỗi `dev` song song phải chạy trong một git worktree riêng, mà thư mục này **chưa phải kho git**. Muốn song song thì bạn cần đồng ý chạy `git init` (tôi sẽ hỏi lại lúc `/implement`).
- Mỗi task xong tôi báo: file đã sửa, cách kiểm chứng, vấn đề tồn đọng, lệch gì so với spec.

## 8. Truy vết spec sang task

| Mục spec | Task |
| --- | --- |
| FR-01 đến FR-04, FR-28 | T06, T12, T19 |
| FR-05 đến FR-08 | T11, T13 |
| FR-09, FR-10 | T11, T14 |
| FR-11, FR-12, FR-14, FR-15 | T15 |
| FR-13 | T04 |
| FR-16 đến FR-19 | T08, T16 |
| FR-20, FR-21 | T17 |
| FR-22, FR-23 | T18 |
| FR-24 | T05, T14 |
| FR-25 | T07 |
| FR-26 | T10 |
| FR-27 | T20 |
| BR-01, BR-02, BR-05 | T04, T05, T14, T15, T16 |
| BR-03 | T06 |
| BR-04, BR-10 | T21, T22, T25 |
| BR-06 | T08, T16 |
| BR-07, BR-08 | T03, T10 |
| BR-09 | T18 |
| BR-11 | T02, T03, T25 |
| AC-01, AC-02 | T06, T12 |
| AC-03 | T13 |
| AC-04 | T14 |
| AC-05, AC-06 | T15 |
| AC-07, AC-08, AC-10 | T08, T16 |
| AC-09 | T17 |
| AC-11 | T05 |
| AC-12 | T18 |
| AC-13 | T07 |
| AC-14 | T19 |
| AC-15 | T02, T25 |
| AC-16 | T23 |
