import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-card p-6 text-center border border-burgundy-100">
            <div className="w-16 h-16 bg-burgundy-50 text-burgundy-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-text-dark mb-2">Đã xảy ra lỗi không mong muốn</h1>
            <p className="text-sm text-warm-gray-500 mb-6">
              Chúng tôi rất xin lỗi vì sự bất tiện này. Vui lòng tải lại trang để thử lại.
            </p>
            <div className="text-left bg-warm-gray-50 p-3 rounded-lg text-xs font-mono text-warm-gray-600 overflow-auto max-h-32 mb-6">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-burgundy-600 text-white font-medium py-2.5 rounded-xl hover:bg-burgundy-700 transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
