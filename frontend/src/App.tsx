import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/auth'
import AppLayout from './components/Layout/AppLayout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import ExpenseList from './pages/expenses/ExpenseList'
import ExpenseForm from './pages/expenses/ExpenseForm'
import ExpenseDetail from './pages/expenses/ExpenseDetail'
import TravelList from './pages/travel/TravelList'
import TravelForm from './pages/travel/TravelForm'
import TravelDetail from './pages/travel/TravelDetail'
import PolicyPage from './pages/policy/PolicyPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import TeamDashboard from './pages/team/TeamDashboard'
import ReimbursementQueue from './pages/team/ReimbursementQueue'
import ExecutiveDashboard from './pages/team/ExecutiveDashboard'
import UserManagement from './pages/team/UserManagement'
import SettingsPage from './pages/settings/SettingsPage'
import ApprovalsPage from './pages/approvals/ApprovalsPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/team" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="team" element={<TeamDashboard />} />
            <Route path="team/reimbursement" element={<ReimbursementQueue />} />
            <Route path="team/executive" element={<ExecutiveDashboard />} />
            <Route path="team/users" element={<UserManagement />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="expenses" element={<ExpenseList />} />
            <Route path="expenses/new" element={<ExpenseForm />} />
            <Route path="expenses/:id" element={<ExpenseDetail />} />
            <Route path="travel" element={<TravelList />} />
            <Route path="travel/new" element={<TravelForm />} />
            <Route path="travel/:id" element={<TravelDetail />} />
            <Route path="policy" element={<PolicyPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/team" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
