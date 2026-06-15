import { fmtDate } from '../../lib/utils.js'

/**
 * Visual version history for a knowledge node.
 * @param {{ versions: object[], selectedVersion: object|null, onSelect: (v: object) => void }} props
 */
export default function VersionTimeline({ versions = [], selectedVersion = null, onSelect }) {
  if (!versions.length) return <p className="text-xs text-gray-600">No version history available.</p>

  return (
    <ol className="relative ml-2 border-l border-gray-300 dark:border-gray-700 space-y-4 py-1">
      {versions.map((v) => {
        const isSelected = selectedVersion?.version === v.version
        return (
          <li
            key={v.version}
            data-testid="version-row"
            className={`ml-4 rounded-md px-2 py-1 transition-colors ${
              onSelect ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''
            } ${isSelected ? 'bg-gray-100 dark:bg-gray-800 ring-1 ring-inset ring-gray-300 dark:ring-gray-700' : ''}`}
            onClick={() => onSelect?.(isSelected ? null : v)}
          >
            <span
              className={`absolute left-0 mt-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${
                v.status === 'ACTIVE'     ? 'bg-green-500' :
                v.status === 'DRAFT'      ? 'bg-amber-500' :
                v.status === 'REJECTED'   ? 'bg-red-500'   : 'bg-gray-600'
              }`}
            />
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">v{v.version}</span>
                <span className={`text-[10px] font-medium uppercase ${
                  v.status === 'ACTIVE' ? 'text-green-400' :
                  v.status === 'DRAFT'  ? 'text-amber-400' : 'text-gray-500'
                }`}>{v.status}</span>
                <span className="text-[10px] text-gray-600">{fmtDate(v.created_at)}</span>
              </div>
              <p className="text-xs text-gray-500">
                by <span className="text-gray-500 dark:text-gray-400">{v.author}</span>
                {v.triggered_by && <span className="ml-1 text-gray-600">· {v.triggered_by.replace(/_/g, ' ')}</span>}
              </p>
              {v.supersedes_reason && (
                <p className="text-xs text-gray-600 italic">"{v.supersedes_reason}"</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
