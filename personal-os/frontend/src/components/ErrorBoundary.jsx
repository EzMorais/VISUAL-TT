import { Component } from 'react';
import errorReporter from '../services/errorReporter';

// Wraps a single panel so a crash there doesn't take the whole dashboard
// down with it — the rest of the app keeps working, and the error is
// reported to the backend for Claude to diagnose (shows up in the Terminal).
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    errorReporter.report({
      source: 'frontend',
      message: error.message,
      stack: error.stack || info?.componentStack,
      context: this.props.name ? `painel: ${this.props.name}` : undefined,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">⚠️ {this.props.name || 'Painel'}</span>
        </div>
        <div className="panel-body">
          <div className="empty-state">
            Esse painel travou, mas o resto do app continua funcionando.<br />
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => this.setState({ hasError: false })}>
              Tentar de novo
            </button>
          </div>
        </div>
      </div>
    );
  }
}
