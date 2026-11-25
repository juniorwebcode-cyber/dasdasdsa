import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Ocorreu um erro inesperado na interface.'
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#18181B] flex items-center justify-center px-6">
          <div className="max-w-lg w-full bg-white border border-[#E6E2DA] rounded-2xl p-8 space-y-4">
            <p className="text-xs font-medium text-[#1E4D5C]">Aviso de estabilidade</p>
            <h2 className="font-display text-2xl font-semibold text-[#18181B]">
              Não foi possível carregar esta seção
            </h2>
            <p className="text-sm text-[#52525B] leading-relaxed">
              Caso tenha acabado de atualizar permissões ou dados, recarregue a página para continuar.
            </p>
            <p className="text-xs font-mono-tabular text-[#71717A] bg-[#F3F1EC] p-3 rounded-lg break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#1E4D5C] rounded-lg hover:bg-[#173c48] transition-colors cursor-pointer"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
