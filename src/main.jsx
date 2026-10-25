import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { RealtimeProvider } from './context/RealtimeContext'
import storageService from './services/storageService'
import ErrorBoundary from './components/common/ErrorBoundary'
import RouteScrollManager from './components/common/RouteScrollManager'
import './index.css'
import App from './App.jsx'

storageService.init()

// Tắt can thiệp cuộn tự động mặc định của trình duyệt để hỗ trợ khôi phục chính xác vị trí bài viết
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {import.meta.env.DEV && (
      <div
        role="status"
        aria-label="Môi trường phát triển"
        style={{
          position: 'fixed',
          right: '12px',
          bottom: '12px',
          zIndex: 99999,
          padding: '6px 10px',
          borderRadius: '999px',
          background: '#7f1d1d',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.04em',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
          pointerEvents: 'none',
        }}
      >
        DEV · DỮ LIỆU SQLITE LOCAL
      </div>
    )}
    <ErrorBoundary>
      <BrowserRouter>
        <RouteScrollManager />
        <AuthProvider>
          <RealtimeProvider>
            <Toaster position="top-center" richColors visibleToasts={1} toastOptions={{ duration: 2200 }} />
            <App />
          </RealtimeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
