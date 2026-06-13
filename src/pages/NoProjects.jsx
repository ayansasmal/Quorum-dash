import { BookOpen, LogOut, Terminal } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Welcome page for authenticated users who do not belong to a Quorum project.
 * It deliberately renders outside the project-scoped dashboard layout.
 *
 * @returns {React.ReactElement}
 */
export default function NoProjects() {
  const { logout, user } = useAuth()

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-950">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center">
        <section className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/20">
          <div className="border-b border-gray-200 bg-gradient-to-br from-violet-600 to-blue-700 px-8 py-10 text-white dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-100">
              Quorum onboarding
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Your account is ready.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
              Signed in as <span className="font-semibold text-white">{user?.sub}</span>.
              Create a project from your repository to start sharing durable engineering context.
            </p>
          </div>

          <div className="space-y-6 px-8 py-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <InstructionCard
                icon={Terminal}
                title="Install the MCP server"
                description="Connect your coding agent to Quorum."
                command="npm install -g @as-quorum/mcp"
              />
              <InstructionCard
                icon={BookOpen}
                title="Upload your project config"
                description="Run the onboarding tool from your MCP client."
                command="quorum config_upload"
              />
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              After setup uploads the project configuration, sign in again to open the dashboard
              with the new project selected.
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-5 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No administrator invitation is required to create the first project.
              </p>
              <button
                type="button"
                onClick={logout}
                className="inline-flex shrink-0 items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

/**
 * Render one onboarding action with a copyable command.
 *
 * @param {{
 *   icon: React.ComponentType<{ className?: string, 'aria-hidden'?: boolean }>,
 *   title: string,
 *   description: string,
 *   command: string
 * }} props
 * @returns {React.ReactElement}
 */
function InstructionCard({ icon: Icon, title, description, command }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950/60">
      <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
      <h2 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{description}</p>
      <code className="mt-4 block overflow-x-auto rounded-md bg-gray-900 px-3 py-2 text-xs text-gray-100 dark:bg-black">
        {command}
      </code>
    </article>
  )
}
