/**
 * Tiện ích hỗ trợ tải file blob từ response API xuống trình duyệt
 * Đảm bảo tương thích định dạng nhị phân / UTF-8 text cho CSV và file xuất khẩu
 *
 * @param {Blob|ArrayBuffer|string} data Nội dung file
 * @param {string} filename Tên file cần lưu khi tải về
 */
export function downloadBlob(data, filename) {
  if (!data) return;

  const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = downloadUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  // Dọn dẹp DOM và giải phóng bộ nhớ URL blob
  if (link.parentNode) {
    link.parentNode.removeChild(link);
  }
  window.URL.revokeObjectURL(downloadUrl);
}

