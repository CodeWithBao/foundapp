import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import storageService from './services/storageService'
import ErrorBoundary from './components/common/ErrorBoundary'
import './index.css'
import App from './App.jsx'

storageService.init()

// Tắt can thiệp cuộn tự động mặc định của trình duyệt để hỗ trợ khôi phục chính xác vị trí bài viết
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-center" richColors visibleToasts={1} toastOptions={{ duration: 2200 }} />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
