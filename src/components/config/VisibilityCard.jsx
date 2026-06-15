import { Globe2, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import ConfirmDialog from '../knowledge/ConfirmDialog.jsx'

/**
 * Project visibility control for the Config page.
 *
 * @param {object} props
 * @param {boolean} props.isPublic - Current project visibility.
 * @param {(isPublic: boolean) => Promise<void>} props.onChange - Persists a visibility change.
 * @param {boolean} props.canManageVisibility - Whether the current user may change visibility.
 * @param {boolean} props.isSaving - Whether a config save is in progress.
 * @param {{ ok: boolean, text: string } | null} props.message - Inline mutation feedback.
 * @returns {JSX.Element}
 */
export default function VisibilityCard({
  isPublic,
  onChange,
  canManageVisibility,
  isSaving,
  message,
}) {
  /** Whether the destructive public-to-private confirmation is visible. */
  const [confirmPrivate, setConfirmPrivate] = useState(false)
  /** Icon representing the currently persisted visibility. */
  const CurrentIcon = isPublic ? Globe2 : LockKeyhole

  /**
   * Applies the requested visibility, confirming the restrictive transition.
   *
   * @param {boolean} nextIsPublic
   * @returns {Promise<void>}
   */
  async function requestChange(nextIsPublic) {
    if (nextIsPublic === isPublic || isSaving) return
    if (!nextIsPublic) {
      setConfirmPrivate(true)
      return
    }
    await onChange(true)
  }

  /**
   * Persists the private state after explicit confirmation.
   *
   * @returns {Promise<void>}
   */
  async function confirmPrivateChange() {
    await onChange(false)
    setConfirmPrivate(false)
  }

  return (
    <>
      <section
        data-testid="project-visibility-card"
        className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`mt-0.5 rounded-lg p-2 ${
              isPublic
                ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              <CurrentIcon aria-hidden="true" size={18} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Project visibility
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                {isPublic ? 'Public' : 'Private'}
              </p>
              <p className="mt-0.5 max-w-xl text-xs leading-5 text-gray-500 dark:text-gray-400">
                {isPublic
                  ? 'Authenticated non-members can read this project. Writes still require membership.'
                  : 'Only project members can access this project.'}
              </p>
            </div>
          </div>

          {canManageVisibility ? (
            <div
              aria-label="Project visibility"
              className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-950"
              role="group"
            >
              <button
                type="button"
                data-testid="visibility-private-option"
                aria-pressed={!isPublic}
                disabled={isSaving}
                onClick={() => requestChange(false)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
                  !isPublic
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-white dark:ring-gray-700'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <LockKeyhole aria-hidden="true" size={14} />
                Private
              </button>
              <button
                type="button"
                data-testid="visibility-public-option"
                aria-pressed={isPublic}
                disabled={isSaving}
                onClick={() => requestChange(true)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
                  isPublic
                    ? 'bg-white text-sky-700 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-sky-300 dark:ring-gray-700'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Globe2 aria-hidden="true" size={14} />
                Public
              </button>
            </div>
          ) : (
            <p
              data-testid="visibility-read-only"
              className="max-w-xs shrink-0 rounded-md bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-500 dark:bg-gray-950 dark:text-gray-400"
            >
              Only principal architects and platform admins can change this setting.
            </p>
          )}
        </div>

        {message && (
          <div
            data-testid={message.ok ? 'visibility-success' : 'visibility-error'}
            role={message.ok ? 'status' : 'alert'}
            className={`border-t px-4 py-2.5 text-xs ${
              message.ok
                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmPrivate}
        title="Make project private?"
        body="This will immediately revoke read access for all non-members. Members are unaffected."
        confirmLabel="Make Private"
        destructive
        isSubmitting={isSaving}
        onCancel={() => setConfirmPrivate(false)}
        onConfirm={confirmPrivateChange}
      />
    </>
  )
}
