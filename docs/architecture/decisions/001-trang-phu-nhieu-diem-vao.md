# ADR 001: Trang phụ dùng nhiều điểm vào (multi-page) thay cho router

- Status: Accepted <!-- chủ dự án duyệt trong chat ngày 2026-10-24 cùng spec và tasks trang mời -->
- Date: 2026-10-24
- Người đề xuất: agent (PM điều phối)

## Context

Dự án hiện là một trang đơn (SPA) bằng Vite + React, không có router, phục vụ site quà sinh nhật ở `/`. Cần thêm trang mời bạn bè ở route `/moi/` (`docs/features/birthday-invite/spec.md`).

Ràng buộc:
- Gói tải về của trang mời **không được chứa** nội dung bí mật của site quà (thư, ảnh, lời hứa); bạn bè của Thư là người xem.
- Không muốn thêm thư viện nếu không cần (mọi thư viện mới cần chủ dự án duyệt).
- Triển khai tĩnh trên Vercel; đã có header `noindex` cho mọi đường dẫn.
- Có thể còn trang phụ khác về sau, nên cần một quy ước chung.

## Options

1. **Nhiều điểm vào của Vite (multi-page).** Thêm `moi/index.html` làm điểm vào thứ hai và khai báo trong cấu hình build. Ưu: gói tách hẳn nên không mang nội dung bí mật; không thêm thư viện; URL tĩnh. Nhược: cấu hình build phức tạp hơn một chút; chia sẻ mã bằng import (phải kiểm soát để không kéo nội dung site quà theo).
2. **SPA đọc đường dẫn + `rewrites` trong `vercel.json`.** Ưu: ít thay đổi nhất. Nhược: chung một gói, nên trang mời tải luôn thư và ảnh của site quà (vi phạm ràng buộc); phải thêm rewrite.
3. **Thêm thư viện router.** Ưu: chuẩn, mở rộng dễ. Nhược: thêm phụ thuộc (cần duyệt), vẫn chung gói nếu không tách bằng code-splitting, quá nặng cho hai trang.
4. **Dự án Vercel riêng cho trang mời.** Ưu: cô lập nhất (địa chỉ gốc khác hẳn). Nhược: thêm một dự án và một địa chỉ cần quản lý; vẫn cần cách build ra hai bản.

## Decision

Phương án 1 (nhiều điểm vào của Vite), cùng một dự án Vercel, theo mặc định chủ dự án giữ ở mục Open Questions của spec. Gói của trang mời tách hẳn khỏi gói của site quà và có bước kiểm tra tự động sau khi build. Nếu về sau chủ dự án muốn cô lập tuyệt đối thì kết hợp thêm phương án 4 (dự án Vercel riêng) mà không phải đổi mã.

## Consequences

- Quy ước chung: mỗi trang phụ là một thư mục điểm vào ở gốc (ví dụ `moi/`) cùng thư mục mã riêng trong `src/` (ví dụ `src/invite/`), chỉ được import phần dùng chung (`src/ui/`, `src/lib/` an toàn) và **không** import `src/content/`, `src/state/`, `src/screens/`.
- Cần một bước kiểm tra tự động sau khi build để chắc chắn gói của trang phụ không chứa nội dung bí mật (AC-I09).
- Cấu hình Vite có hai điểm vào; script build và test hiện có giữ nguyên.
- Không ảnh hưởng xác thực, cơ sở dữ liệu, API hay nhật ký (không có các thành phần đó).
