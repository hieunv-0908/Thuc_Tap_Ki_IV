import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

/**
 * Reusable Table component per Design.md 6.7
 */
export default function Table({
  columns = [], // [{ key, header, render, className, headerClassName }]
  data = [],
  loading = false,
  error = null,
  onRetry = null,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription = 'Hiện tại danh sách đang trống.',
  emptyIcon = undefined,
  className = '',
}) {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-line bg-white shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-ink-muted border-b border-line">
              {columns.map((col, index) => (
                <th
                  key={col.key || index}
                  scope="col"
                  className={`px-4 py-3.5 whitespace-nowrap ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-sm text-ink">
            {loading ? (
              // 5 rows of skeleton per Design.md 6.7
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-3.5">
                      <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10">
                  <ErrorState
                    title="Không thể tải danh sách"
                    message={error}
                    onRetry={onRetry}
                  />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="transition-colors hover:bg-gray-50/80"
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      className={`px-4 py-3.5 ${col.className || ''}`}
                    >
                      {col.render ? col.render(row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
